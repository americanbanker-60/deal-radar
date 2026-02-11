import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
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

// Score calculation helper
function calculateScore(target, weights) {
  let score = 0;
  const { employees, clinicCount, revenue, websiteStatus } = target;

  // Employee score
  if (employees) {
    const empScore = Math.min(100, (employees / 100) * 100);
    score += (empScore * weights.employees) / 100;
  }

  // Clinic score
  if (clinicCount) {
    const clinicScore = Math.min(100, (clinicCount / 10) * 100);
    score += (clinicScore * weights.clinics) / 100;
  }

  // Revenue score
  if (revenue) {
    const revScore = Math.min(100, (revenue / 50) * 100);
    score += (revScore * weights.revenue) / 100;
  }

  // Website score
  if (websiteStatus === 'working') {
    score += weights.website;
  } else if (websiteStatus === 'broken') {
    score += weights.website * 0.3;
  }

  // Growth signals bonus
  if (target.growthSignals && target.growthSignals.trim()) {
    score += 5; // Bonus for growth
  }

  // Dormancy penalty
  if (target.dormancyFlag) {
    score = Math.max(0, score - 15);
  }

  return Math.round(Math.max(0, Math.min(100, score)));
}