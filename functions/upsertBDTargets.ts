import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { targets, campaign } = await req.json();

    if (!targets || !Array.isArray(targets) || targets.length === 0) {
      return Response.json({ error: 'No targets provided' }, { status: 400 });
    }

    // Fetch all existing targets once
    const existingTargets = await base44.asServiceRole.entities.BDTarget.list('-created_date', 50000);

    const results = {
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [],
      createdIds: [],
      updatedIds: []
    };

    // Helper to normalize domain
    const normalizeDomain = (url) => {
      if (!url) return null;
      try {
        const domain = url.toLowerCase()
          .replace(/^https?:\/\//, '')
          .replace(/^www\./, '')
          .replace(/\/$/, '')
          .split('/')[0];
        return domain;
      } catch {
        return null;
      }
    };

    // Helper to merge data (only fill in null/empty fields)
    const mergeData = (existing, newData) => {
      const updates = {};
      
      for (const [key, value] of Object.entries(newData)) {
        // Skip system fields
        if (['id', 'created_date', 'updated_date', 'created_by'].includes(key)) continue;
        
        // Only update if existing field is null, undefined, or empty string
        const existingValue = existing[key];
        if (existingValue === null || existingValue === undefined || existingValue === '') {
          if (value !== null && value !== undefined && value !== '') {
            updates[key] = value;
          }
        }
      }
      
      return updates;
    };

    // Process each target
    for (let i = 0; i < targets.length; i++) {
      const target = targets[i];
      
      try {
        const normalizedDomain = normalizeDomain(target.website);
        let matchedTarget = null;

        // Try domain matching first
        if (normalizedDomain) {
          matchedTarget = existingTargets.find(t => {
            const existingDomain = normalizeDomain(t.website);
            return existingDomain && existingDomain === normalizedDomain;
          });
        }

        // Fuzzy name matching for targets without website
        if (!matchedTarget && !normalizedDomain && target.name) {
          const similarTargets = existingTargets.filter(t => 
            t.name && 
            !t.website &&
            Math.abs(t.name.length - target.name.length) < 10
          ).slice(0, 20);

          if (similarTargets.length > 0) {
            try {
              const prompt = `Compare the company name "${target.name}" against these existing names:
${similarTargets.map((t, i) => `${i + 1}. ${t.name}`).join('\n')}

Return JSON:
{
  "isMatch": true/false,
  "matchedIndex": number (1-based) or null if no match,
  "confidence": 0-100
}

A match means the names refer to the same company despite minor spelling differences. Be strict - only match if you're very confident it's the same company.`;

              const result = await base44.integrations.Core.InvokeLLM({
                prompt,
                add_context_from_internet: false,
                response_json_schema: {
                  type: "object",
                  properties: {
                    isMatch: { type: "boolean" },
                    matchedIndex: { type: ["number", "null"] },
                    confidence: { type: "number" }
                  }
                }
              });

              if (result.isMatch && result.matchedIndex && result.confidence >= 80) {
                matchedTarget = similarTargets[result.matchedIndex - 1];
              }
            } catch (error) {
              console.error(`Fuzzy match error for ${target.name}:`, error);
            }
          }
        }

        // Update existing or create new
        if (matchedTarget) {
          const updates = mergeData(matchedTarget, target);
          
          if (Object.keys(updates).length > 0) {
            await base44.asServiceRole.entities.BDTarget.update(matchedTarget.id, updates);
            results.updated++;
            results.updatedIds.push(matchedTarget.id);
          } else {
            results.skipped++;
          }
        } else {
          const created = await base44.asServiceRole.entities.BDTarget.create({
            ...target,
            campaign: campaign || target.campaign || 'Uncategorized'
          });
          results.created++;
          results.createdIds.push(created.id);
        }

      } catch (error) {
        results.errors.push({
          company: target.name || 'Unknown',
          error: error.message
        });
      }
    }

    return Response.json({
      success: true,
      ...results,
      message: `✓ ${results.created} new targets created, ${results.updated} existing targets updated with new data${results.skipped > 0 ? `, ${results.skipped} skipped (no new data)` : ''}`
    });

  } catch (error) {
    console.error('Upsert error:', error);
    return Response.json({ 
      error: error.message || 'Failed to upsert targets' 
    }, { status: 500 });
  }
});