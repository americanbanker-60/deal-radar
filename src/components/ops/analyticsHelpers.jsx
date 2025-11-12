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

const yearFrom = (d) => {
  if (!d) return undefined;
  const m = String(d).match(/(20\d{2}|19\d{2})/);
  return m ? parseInt(m[1], 10) : undefined;
};

export function useDealsAnalytics(deals) {
  return useMemo(() => {
    const within24m = deals.filter((d) => {
      const y = toNumber(d.Year ?? yearFrom(d.Date));
      return !isNaN(y) && y >= new Date().getFullYear() - 2;
    });
    
    const multiples = within24m.map((d) => {
      const ev = toNumber(d.EV);
      const e = toNumber(d.EBITDA);
      const m = !isNaN(toNumber(d.Multiple)) ? toNumber(d.Multiple) : (isNaN(ev) || isNaN(e) || e === 0 ? NaN : ev / e);
      return m;
    }).filter((x) => !isNaN(x));
    
    const medianMultiple = percentile(multiples, 50);

    const byMonth = {};
    within24m.forEach((d) => {
      const y = (d.Year ?? yearFrom(d.Date)) || "";
      const m = String(d.Month || "").padStart(2, "0");
      const key = `${y}-${m || "01"}`;
      byMonth[key] = (byMonth[key] || 0) + 1;
    });
    
    const series = Object.keys(byMonth).sort().map((k) => ({ date: k, deals: byMonth[k] }));

    const buyerCounts = {};
    within24m.forEach((d) => {
      const b = (d.Buyer || "Unknown").toString();
      buyerCounts[b] = (buyerCounts[b] || 0) + 1;
    });
    
    const buyerSeries = Object.entries(buyerCounts)
      .map(([buyer, count]) => ({ buyer, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    return { dealCount: within24m.length, medianMultiple, series, buyerSeries };
  }, [deals]);
}

export function filterTargets(rows, filters) {
  const { regionFilter, minRev, maxRev, minEbitda, maxEbitda, ownerPref } = filters;
  
  return rows.filter((c) => {
    const inRegion = (c.hq || "United States").toLowerCase().includes(regionFilter.toLowerCase());
    const revMm = c.revenue;
    const eMm = c.ebitda;
    const ownerMatch = ownerPref === "Any" || 
                       (c.ownership || "").toLowerCase().includes("founder") || 
                       (c.ownership || "").toLowerCase().includes("private");
    
    return inRegion && 
           !isNaN(revMm) && !isNaN(eMm) && 
           revMm >= minRev && revMm <= maxRev && 
           eMm >= minEbitda && eMm <= maxEbitda && 
           ownerMatch;
  });
}

export function scoreTargets(rows, opts) {
  const { fitKeywords } = opts;
  const revs = rows.map((t) => t.revenue).filter((x) => !isNaN(x));
  const ebs = rows.map((t) => t.ebitda).filter((x) => !isNaN(x));
  const p50R = percentile(revs, 50);
  const p50E = percentile(ebs, 50);
  const now = new Date().getFullYear();
  const kws = (fitKeywords || "").split(",").map(s => s.trim().toLowerCase()).filter(Boolean);

  return rows.map((t) => {
    let score = 0;
    
    // Revenue proximity to median (20 points)
    if (!isNaN(t.revenue) && p50R) {
      score += 20 * (1 - Math.min(1, Math.abs((t.revenue - p50R) / (p50R || 1))));
    }
    
    // EBITDA proximity to median (20 points)
    if (!isNaN(t.ebitda) && p50E) {
      score += 20 * (1 - Math.min(1, Math.abs((t.ebitda - p50E) / (p50E || 1))));
    }
    
    // Ownership preference (20 points)
    if ((t.ownership || "").toLowerCase().includes("founder")) {
      score += 20;
    } else if ((t.ownership || "").toLowerCase().includes("family")) {
      score += 10;
    }
    
    // Time since last financing (25 points)
    const yrs = t.lastFinancingYear ? now - t.lastFinancingYear : 6;
    score += Math.min(25, Math.max(0, (yrs / 8) * 25));
    
    // EBITDA margin (15 points)
    if (!isNaN(t.margin)) {
      score += Math.min(15, Math.max(0, (toNumber(t.margin) / 25) * 15));
    }
    
    // Strategic fit keywords bonus (10 points)
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