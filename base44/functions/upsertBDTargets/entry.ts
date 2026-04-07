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

    // Helper: sleep for ms milliseconds
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    // Helper: write with retry on 429
    const writeWithRetry = async (fn, maxRetries = 5) => {
      let delay = 500;
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          return await fn();
        } catch (error) {
          const is429 = error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('Rate limit');
          if (is429 && attempt < maxRetries) {
            console.warn(`Rate limited. Retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
            await sleep(delay);
            delay = Math.min(delay * 2, 8000); // exponential backoff, cap at 8s
          } else {
            throw error;
          }
        }
      }
    };

    // Process targets sequentially with a small delay between writes to avoid rate limits
    const WRITE_DELAY_MS = 50; // 50ms between writes = ~20 writes/sec, well within limits

    for (const target of targets) {
      try {
        const normalizedDomain = normalizeDomain(target.website);
        let matchedTarget = null;

        if (normalizedDomain && domainMap.has(normalizedDomain)) {
          matchedTarget = domainMap.get(normalizedDomain);
        }

        if (matchedTarget) {
          const updates = mergeData(matchedTarget, target);
          
          if (Object.keys(updates).length > 0) {
            await writeWithRetry(() =>
              base44.asServiceRole.entities.BDTarget.update(matchedTarget.id, updates)
            );
            results.updated++;
            results.updatedIds.push(matchedTarget.id);
          } else {
            results.skipped++;
          }
        } else {
          const created = await writeWithRetry(() =>
            base44.asServiceRole.entities.BDTarget.create({
              ...target,
              campaign: campaign || target.campaign || 'Uncategorized'
            })
          );
          results.created++;
          results.createdIds.push(created.id);
        }

        await sleep(WRITE_DELAY_MS);

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