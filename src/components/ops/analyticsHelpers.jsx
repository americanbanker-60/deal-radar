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
    const inRegion = !regionFilter || (c.hq || "").toLowerCase().includes(regionFilter.toLowerCase());
    const revMm = c.revenue;
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
  const { fitKeywords } = opts;
  
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
    
    // Employee count match (35 points) - PRIMARY
    if (!isNaN(t.employees) && p50Emp && t.employees > 0) {
      const proximity = 1 - Math.min(1, Math.abs((t.employees - p50Emp) / (p50Emp || 1)));
      score += 35 * proximity;
    }
    
    // Clinic/location count match (25 points)
    if (!isNaN(t.clinicCount) && p50Clinics && t.clinicCount > 0) {
      const proximity = 1 - Math.min(1, Math.abs((t.clinicCount - p50Clinics) / (p50Clinics || 1)));
      score += 25 * proximity;
    }
    
    // Revenue match (15 points) - SECONDARY
    if (!isNaN(t.revenue) && p50Rev && t.revenue > 0) {
      const proximity = 1 - Math.min(1, Math.abs((t.revenue - p50Rev) / (p50Rev || 1)));
      score += 15 * proximity;
    }
    
    // Website status (15 points)
    if (t.websiteStatus === "working") {
      score += 15;
    } else if (t.websiteStatus === "broken") {
      score += 0; // Penalty: no points
    }
    
    // Strategic fit keywords (10 points)
    if (kws.length && kws.some(k => 
      (t.name || "").toLowerCase().includes(k) || 
      (t.subsector || "").toLowerCase().includes(k) || 
      (t.industry || "").toLowerCase().includes(k)
    )) {
      score += 10;
    }
    
    return { ...t, score: Math.round(score) };
  }).sort((a, b) => b.score - a.score);
}

// Hook is no longer needed for deals analytics
export function useDealsAnalytics(deals) {
  return useMemo(() => ({
    dealCount: 0,
    medianMultiple: NaN,
    series: [],
    buyerSeries: []
  }), [deals]);
}