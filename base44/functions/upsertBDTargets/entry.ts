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

    // Fetch existing targets with websites for fast domain matching
    const existingTargetsResponse = await base44.asServiceRole.entities.BDTarget.list('-created_date', 10000);
    const existingTargets = Array.isArray(existingTargetsResponse) ? existingTargetsResponse : [];

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

    // Build a domain lookup map for fast duplicate detection
    const domainMap = new Map();
    existingTargets.forEach(t => {
      const domain = normalizeDomain(t.website);
      if (domain) {
        domainMap.set(domain, t);
      }
    });

    // Process targets in batches to avoid timeouts
    const BATCH_SIZE = 100;
    for (let i = 0; i < targets.length; i += BATCH_SIZE) {
      const batch = targets.slice(i, i + BATCH_SIZE);
      
      for (const target of batch) {
        try {
          const normalizedDomain = normalizeDomain(target.website);
          let matchedTarget = null;

          // Try domain matching first (fast)
          if (normalizedDomain && domainMap.has(normalizedDomain)) {
            matchedTarget = domainMap.get(normalizedDomain);
          }

          // Skip fuzzy matching for now to avoid timeouts
          // Can be added as a separate enrichment step later

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