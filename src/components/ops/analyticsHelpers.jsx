import { useMemo } from "react";

const toNumber = (v) => {
  if (v === null || v === undefined) return NaN;
  if (typeof v === "number") return v;
  const s = String(v).replace(/[$,%\s,]/g, "").replace(/[–—]/g, "-");
  const n = parseFloat(s);
  return isNaN(n) ? NaN : n;
};

const percentile = (arr, p) => {
  const a = [...arr].filter((x) => !isNaN(x)).sort((x, y) => x - y);
  if (!a.length) return NaN;
  const idx = (p / 100) * (a.length - 1);
  const lower = Math.floor(idx);
  const upper = Math.ceil(idx);
  if (lower === upper) return a[lower];
  const w = idx - lower;
  return a[lower] * (1 - w) + a[upper] * w;
};

export function filterTargets(rows, filters) {
  const { regionFilter, minRev, maxRev, ownerPref } = filters;
  
  return rows.filter((c) => {
    // Check all location fields for region match
    const locationFields = [c.hq, c.city, c.state].filter(Boolean).join(" ").toLowerCase();
    const inRegion = !regionFilter || locationFields.includes(regionFilter.toLowerCase());
    
    const revMm = c.revenue;
    
    // Only apply ownership filter if not "Any"
    const ownerMatch = ownerPref === "Any" || 
                       (c.ownership || "").toLowerCase().includes("founder") || 
                       (c.ownership || "").toLowerCase().includes("private") ||
                       (c.ownership || "").toLowerCase().includes("bootstrap");
    
    return inRegion && 
           (!isNaN(revMm) ? (revMm >= minRev && revMm <= maxRev) : true) && 
           ownerMatch;
  });
}

export function scoreTargets(rows, opts) {
  const { 
    fitKeywords,
    weights = {
      employees: 35,
      clinics: 25,
      revenue: 15,
      website: 15,
      keywords: 10
    },
    targetRange = {
      minEmployees: null,
      maxEmployees: null,
      minRevenue: null,
      maxRevenue: null
    }
  } = opts;
  
  // Calculate peer group medians
  const employees = rows.map((t) => t.employees).filter((x) => !isNaN(x) && x > 0);
  const revs = rows.map((t) => t.revenue).filter((x) => !isNaN(x) && x > 0);
  const clinics = rows.map((t) => t.clinicCount).filter((x) => !isNaN(x) && x > 0);
  
  const p50Emp = percentile(employees, 50);
  const p50Rev = percentile(revs, 50);
  const p50Clinics = percentile(clinics, 50);
  
  const kws = (fitKeywords || "").split(",").map(s => s.trim().toLowerCase()).filter(Boolean);

  return rows.map((t) => {
    let score = 0;
    let fitScore = 0;
    
    // Employee count match - with range-based scoring
    if (!isNaN(t.employees) && t.employees > 0) {
      if (targetRange.minEmployees && targetRange.maxEmployees) {
        // Range-based: full points if in range, decreasing outside
        const midRange = (targetRange.minEmployees + targetRange.maxEmployees) / 2;
        if (t.employees >= targetRange.minEmployees && t.employees <= targetRange.maxEmployees) {
          score += weights.employees; // Full points in range
          fitScore += 100; // Perfect fit
        } else {
          const proximity = 1 - Math.min(1, Math.abs((t.employees - midRange) / (midRange || 1)));
          score += weights.employees * proximity;
          fitScore += 100 * proximity;
        }
      } else if (p50Emp) {
        // Peer-based: proximity to median
        const proximity = 1 - Math.min(1, Math.abs((t.employees - p50Emp) / (p50Emp || 1)));
        score += weights.employees * proximity;
      }
    }
    
    // Clinic/location count match
    if (!isNaN(t.clinicCount) && p50Clinics && t.clinicCount > 0) {
      const proximity = 1 - Math.min(1, Math.abs((t.clinicCount - p50Clinics) / (p50Clinics || 1)));
      score += weights.clinics * proximity;
    }
    
    // Revenue match - with range-based scoring
    if (!isNaN(t.revenue) && t.revenue > 0) {
      if (targetRange.minRevenue && targetRange.maxRevenue) {
        // Range-based: full points if in range
        const midRange = (targetRange.minRevenue + targetRange.maxRevenue) / 2;
        if (t.revenue >= targetRange.minRevenue && t.revenue <= targetRange.maxRevenue) {
          score += weights.revenue; // Full points in range
          fitScore += 50; // Fit contribution
        } else {
          const proximity = 1 - Math.min(1, Math.abs((t.revenue - midRange) / (midRange || 1)));
          score += weights.revenue * proximity;
          fitScore += 50 * proximity;
        }
      } else if (p50Rev) {
        // Peer-based: proximity to median
        const proximity = 1 - Math.min(1, Math.abs((t.revenue - p50Rev) / (p50Rev || 1)));
        score += weights.revenue * proximity;
      }
    }
    
    // Website status
    if (t.websiteStatus === "working") {
      score += weights.website;
      fitScore += 25;
    } else if (t.websiteStatus === "broken") {
      score += 0; // Penalty: no points
      fitScore -= 50; // Negative fit
    }
    
    // Strategic fit keywords
    if (kws.length && kws.some(k => 
      (t.name || "").toLowerCase().includes(k) || 
      (t.subsector || "").toLowerCase().includes(k) || 
      (t.industry || "").toLowerCase().includes(k)
    )) {
      score += weights.keywords;
      fitScore += 25;
    }
    
    // Normalize fit score to 0-100
    fitScore = Math.max(0, Math.min(100, fitScore));
    
    return { 
      ...t, 
      score: Math.round(score),
      fitScore: Math.round(fitScore)
    };
  }).sort((a, b) => b.score - a.score);
}