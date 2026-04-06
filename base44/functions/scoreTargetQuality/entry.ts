import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function scoreToTier(score) {
  if (score >= 75) return "great";
  if (score >= 45) return "good";
  return "bad";
}

async function checkWebsite(url) {
  if (!url) return { reachable: false, modernityScore: 0 };

  try {
    const resp = await fetch(url, { 
      method: "HEAD", 
      redirect: "follow",
      signal: AbortSignal.timeout(5000)
    });
    
    return { 
      reachable: resp.ok, 
      modernityScore: resp.ok ? 0.5 : 0 
    };
  } catch {
    return { reachable: false, modernityScore: 0 };
  }
}

async function scoreCompanyQuality(target) {
  let score = 50; // neutral starting point
  const flags = [];
  const signals = [];

  // Website health (critical signal)
  const site = await checkWebsite(target.website);
  signals.push({ kind: "WEBSITE_REACHABLE", value: site.reachable ? 1 : 0, strength: 0.8 });

  if (!site.reachable) {
    score -= 25;
    flags.push("Website unreachable");
  } else {
    score += 10;
  }

  // Website status from crawl
  if (target.websiteStatus === "broken") {
    score -= 20;
    flags.push("Broken website");
  } else if (target.websiteStatus === "working") {
    score += 10;
  }

  // Employee count (scale proxy)
  if (target.employees !== undefined && target.employees !== null) {
    signals.push({ kind: "EMPLOYEE_COUNT", value: target.employees, strength: 0.7 });

    if (target.employees < 20) {
      score -= 15;
      flags.push("Very low employee count");
    } else if (target.employees > 100) {
      score += 10;
    } else if (target.employees >= 50) {
      score += 5;
    }
  }

  // Revenue estimate (scale proxy)
  if (target.revenue !== undefined && target.revenue !== null) {
    signals.push({ kind: "REVENUE_ESTIMATE", value: target.revenue, strength: 0.7 });

    if (target.revenue < 5) {
      score -= 10;
      flags.push("Sub-scale revenue (<$5M)");
    } else if (target.revenue > 25) {
      score += 10;
    } else if (target.revenue >= 10) {
      score += 5;
    }
  }

  // Employee vs revenue mix
  if (target.employees && target.revenue) {
    const revPerEmp = (target.revenue * 1000000) / target.employees;
    signals.push({ kind: "EMPLOYEE_REVENUE_MIX", value: revPerEmp, strength: 0.6 });

    if (revPerEmp < 100000) {
      score -= 10;
      flags.push("Low revenue per employee");
    } else if (revPerEmp > 250000) {
      score += 5;
    }
  }

  // Multi-site bonus
  if (target.clinicCount !== undefined && target.clinicCount !== null) {
    signals.push({ kind: "LOCATION_COUNT", value: target.clinicCount, strength: 0.8 });

    if (target.clinicCount <= 1) {
      score -= 15;
      flags.push("Single-site operator");
    } else if (target.clinicCount >= 5) {
      score += 15;
    } else if (target.clinicCount >= 3) {
      score += 10;
    }
  }

  // Ownership quality (founder-owned preferred)
  if (target.ownership) {
    const ownerLower = target.ownership.toLowerCase();
    if (ownerLower.includes("founder") || ownerLower.includes("bootstrap")) {
      score += 10;
    } else if (ownerLower.includes("private equity") || ownerLower.includes("pe-backed")) {
      score -= 5;
      flags.push("PE-backed");
    }
  }

  const finalScore = clamp(Math.round(score), 0, 100);
  const tier = scoreToTier(finalScore);

  const confidence = clamp(
    40 + (signals.length / 7) * 40 + (finalScore > 70 || finalScore < 30 ? 10 : 0),
    0,
    100
  );

  const reason = `Classified as ${tier.toUpperCase()} (score: ${finalScore}/100). ${flags.length > 0 ? 'Issues: ' + flags.join(', ') : 'No major issues detected.'} Based on ${signals.length} signals including website health, employee count, revenue, and location count.`;

  return { score: finalScore, tier, confidence, reason, flags, signalCount: signals.length };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { targetId } = await req.json();
    if (!targetId) {
      return Response.json({ error: 'targetId required' }, { status: 400 });
    }

    const targets = await base44.entities.BDTarget.filter({ id: targetId });
    if (!targets.length) {
      return Response.json({ error: 'Target not found' }, { status: 404 });
    }
    const target = targets[0];

    const result = await scoreCompanyQuality(target);

    await base44.entities.BDTarget.update(targetId, {
      qualityTier: result.tier,
      qualityScore: result.score,
      qualityConfidence: result.confidence,
      qualityReason: result.reason,
      qualityFlags: result.flags
    });

    return Response.json({
      success: true,
      tier: result.tier,
      score: result.score,
      confidence: result.confidence,
      reason: result.reason,
      flags: result.flags,
      signalCount: result.signalCount
    });

  } catch (error) {
    console.error("Quality scoring error:", error);
    return Response.json({ 
      error: error.message || String(error),
      success: false
    }, { status: 500 });
  }
});