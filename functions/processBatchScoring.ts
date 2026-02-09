import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { targetIds, weights, targetRange, fitKeywords } = await req.json();

    if (!targetIds || !Array.isArray(targetIds)) {
      return Response.json({ error: 'targetIds array required' }, { status: 400 });
    }

    // Fetch all targets by IDs
    const targets = await Promise.all(
      targetIds.map(id => base44.entities.BDTarget.get(id))
    );

    // Calculate scores using the same logic as client-side
    const scored = scoreTargets(targets, { fitKeywords, weights, targetRange });

    // Update all targets with new scores
    await Promise.all(
      scored.map(target => 
        base44.entities.BDTarget.update(target.id, { score: target.score })
      )
    );

    return Response.json({ 
      success: true, 
      updated: scored.length 
    });
  } catch (error) {
    console.error('Batch scoring error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// Scoring logic (same as client-side data-engine)
function scoreTargets(targets, { fitKeywords = "", weights = {}, targetRange = {} }) {
  const defaultWeights = {
    employees: 35,
    clinics: 25,
    revenue: 15,
    website: 15,
    keywords: 10
  };

  const w = { ...defaultWeights, ...weights };
  const keywordsLower = fitKeywords.toLowerCase();

  const empValues = targets.map(t => t.employees || 0).filter(e => e > 0);
  const revValues = targets.map(t => t.revenue || 0).filter(r => r > 0);

  const empP75 = percentile(empValues, 75);
  const revP75 = percentile(revValues, 75);

  return targets.map((t) => {
    let empScore = 0;
    const emp = t.employees || 0;
    if (emp > 0) {
      if (targetRange.minEmployees && targetRange.maxEmployees) {
        const mid = (targetRange.minEmployees + targetRange.maxEmployees) / 2;
        const distance = Math.abs(emp - mid);
        const range = targetRange.maxEmployees - targetRange.minEmployees;
        empScore = Math.max(0, 100 - (distance / range) * 100);
      } else if (empP75 > 0) {
        empScore = Math.min(100, (emp / empP75) * 100);
      }
    }

    let clinicScore = 0;
    const clinics = t.clinicCount || 0;
    if (clinics > 0) {
      clinicScore = Math.min(100, clinics * 25);
    }

    let revScore = 0;
    const rev = t.revenue || 0;
    if (rev > 0) {
      if (targetRange.minRevenue && targetRange.maxRevenue) {
        const mid = (targetRange.minRevenue + targetRange.maxRevenue) / 2;
        const distance = Math.abs(rev - mid);
        const range = targetRange.maxRevenue - targetRange.minRevenue;
        revScore = Math.max(0, 100 - (distance / range) * 100);
      } else if (revP75 > 0) {
        revScore = Math.min(100, (rev / revP75) * 100);
      }
    }

    let websiteScore = 0;
    if (t.websiteStatus === "working") websiteScore = 100;
    else if (t.websiteStatus === "broken") websiteScore = 50;

    let keywordScore = 0;
    if (keywordsLower) {
      const textToCheck = [
        t.name || "",
        t.industry || "",
        t.subsector || "",
        t.sectorFocus || "",
        t.notes || ""
      ].join(" ").toLowerCase();
      
      if (textToCheck.includes(keywordsLower)) {
        keywordScore = 100;
      }
    }

    const totalWeight = w.employees + w.clinics + w.revenue + w.website + w.keywords;
    const score = totalWeight > 0 
      ? Math.round(
          (empScore * w.employees + 
           clinicScore * w.clinics + 
           revScore * w.revenue + 
           websiteScore * w.website + 
           keywordScore * w.keywords) / totalWeight
        )
      : 0;

    return { ...t, score };
  });
}

function percentile(arr, p) {
  if (!arr || arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index % 1;
  if (lower === upper) return sorted[lower];
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}