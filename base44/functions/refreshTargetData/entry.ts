import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { checkRateLimit, rateLimitResponse } from '../../shared/rate-limiter.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Rate limit: 3 refresh requests per minute for admin
    const rateCheck = checkRateLimit(user.email, { maxRequests: 3, keyPrefix: 'refresh-data' });
    if (!rateCheck.allowed) {
      return rateLimitResponse(rateCheck.retryAfterMs);
    }

    const { targetIds, daysOld = 30, batchSize = 10 } = await req.json();

    // Get targets to refresh
    let targets;
    if (targetIds && targetIds.length > 0) {
      // Refresh specific targets
      targets = await Promise.all(
        targetIds.map(id => base44.asServiceRole.entities.BDTarget.get(id))
      );
    } else {
      // Auto-select targets that haven't been refreshed recently
      const allTargets = await base44.asServiceRole.entities.BDTarget.list('-created_date', 5000);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      targets = allTargets.filter(t => {
        const lastRefresh = t.growthSignalsDate ? new Date(t.growthSignalsDate) : new Date(0);
        return lastRefresh < cutoffDate;
      }).slice(0, batchSize);
    }

    if (targets.length === 0) {
      return Response.json({ 
        success: true, 
        message: 'No targets need refreshing',
        refreshed: 0
      });
    }

    const results = {
      total: targets.length,
      success: 0,
      errors: 0,
      details: []
    };

    // Process each target
    for (const target of targets) {
      try {
        const updates = {};
        
        // 1. Re-crawl website for status and clinic count
        if (target.website) {
          try {
            const crawlPrompt = `Check if the website ${target.website} is working and extract:
1. Website status (working/broken/missing)
2. Number of physical locations/clinics mentioned
3. Most recent activity date (from news, blog posts, copyright year)

Return JSON:
{
  "websiteStatus": "working"|"broken"|"missing",
  "clinicCount": number or null,
  "lastActiveDate": "YYYY-MM-DD" or null
}`;

            const crawlResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
              prompt: crawlPrompt,
              add_context_from_internet: true,
              response_json_schema: {
                type: "object",
                properties: {
                  websiteStatus: { type: "string" },
                  clinicCount: { type: ["number", "null"] },
                  lastActiveDate: { type: ["string", "null"] }
                }
              }
            });

            updates.websiteStatus = crawlResult.websiteStatus;
            if (crawlResult.clinicCount) {
              updates.clinicCount = crawlResult.clinicCount;
            }
            if (crawlResult.lastActiveDate) {
              updates.lastActive = crawlResult.lastActiveDate;
            }
          } catch (error) {
            console.error(`Crawl failed for ${target.name}:`, error.message);
            updates.websiteStatus = 'error';
          }
        }

        // 2. Check for growth signals (last 6 months)
        try {
          const growthPrompt = `Search for recent news about "${target.name}" (${target.website || 'healthcare company'}) from the last 6 months.

Look for:
1. New office/clinic openings
2. Awards and recognition
3. Executive hires
4. Funding/Investment
5. Expansion indicators

Return JSON with brief summaries:
{
  "signals": ["Brief signal 1", "Brief signal 2"],
  "hasGrowthSignals": true/false
}`;

          const growthResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt: growthPrompt,
            add_context_from_internet: true,
            response_json_schema: {
              type: "object",
              properties: {
                signals: { type: "array", items: { type: "string" } },
                hasGrowthSignals: { type: "boolean" }
              }
            }
          });

          updates.growthSignals = (growthResult.signals || []).join(", ");
          updates.growthSignalsDate = new Date().toISOString();
        } catch (error) {
          console.error(`Growth check failed for ${target.name}:`, error.message);
        }

        // 3. Update dormancy flag (12+ months inactive)
        if (updates.lastActive || target.lastActive) {
          const lastActiveDate = new Date(updates.lastActive || target.lastActive);
          const monthsInactive = (Date.now() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
          updates.dormancyFlag = monthsInactive >= 12;
        }

        // 4. Re-score if we have updated data
        if (Object.keys(updates).length > 0) {
          // Get scoring params from localStorage defaults
          // Same default weights as calculateFitScores and processBatchScoring
          const weights = {
            employees: 35,
            clinics: 25,
            revenue: 15,
            website: 15,
            keywords: 10
          };

          // Recalculate score
          const updatedTarget = { ...target, ...updates };
          const newScore = calculateScore(updatedTarget, weights);
          updates.score = newScore;
        }

        // Apply updates
        await base44.asServiceRole.entities.BDTarget.update(target.id, updates);
        
        results.success++;
        results.details.push({
          name: target.name,
          status: 'success',
          updated: Object.keys(updates)
        });

      } catch (error) {
        results.errors++;
        results.details.push({
          name: target.name,
          status: 'error',
          error: error.message
        });
      }
    }

    return Response.json({
      success: true,
      message: `Refreshed ${results.success} of ${results.total} targets`,
      results
    });

  } catch (error) {
    console.error('Refresh error:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});

// Score calculation - consistent with calculateFitScores and processBatchScoring
function calculateScore(target, weights) {
  const w = weights;

  // Employee score (using peer-relative since we don't have target ranges in refresh context)
  let empScore = 0;
  const emp = target.employees || 0;
  if (emp > 0) {
    // Cap at 100 employees as "ideal" for refresh scoring
    empScore = Math.min(100, (emp / 100) * 100);
  }

  // Clinic score - same as other implementations
  let clinicScore = 0;
  const clinics = target.clinicCount || 0;
  if (clinics > 0) {
    clinicScore = Math.min(100, clinics * 25);
  }

  // Revenue score
  let revScore = 0;
  const rev = target.revenue || 0;
  if (rev > 0) {
    revScore = Math.min(100, (rev / 50) * 100);
  }

  // Website score - same as other implementations
  let websiteScore = 0;
  if (target.websiteStatus === 'working') websiteScore = 100;
  else if (target.websiteStatus === 'broken') websiteScore = 50;

  // Keyword score placeholder (no keywords in refresh context)
  const keywordScore = 0;

  // Calculate weighted total - same formula as other implementations
  const totalWeight = w.employees + w.clinics + w.revenue + w.website + w.keywords;
  let score = totalWeight > 0
    ? Math.round(
        (empScore * w.employees +
         clinicScore * w.clinics +
         revScore * w.revenue +
         websiteScore * w.website +
         keywordScore * w.keywords) / totalWeight
      )
    : 0;

  // Apply recency penalty - same as other implementations
  if (target.lastActive) {
    try {
      const lastActiveDate = new Date(target.lastActive);
      const now = new Date();
      const monthsInactive = (now.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
      if (monthsInactive > 12) {
        score = Math.max(0, score - 25);
      } else if (monthsInactive > 6) {
        score = Math.max(0, score - 10);
      }
    } catch {
      // Invalid date, no penalty
    }
  }

  return score;
}