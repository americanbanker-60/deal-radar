/**
 * Shared scoring logic for BD targets
 * 
 * IMPORTANT: This logic is duplicated in functions/calculateFitScores.ts
 * If you modify this file, update the Deno function accordingly to keep scores consistent.
 */

/**
 * Calculate a fit score for a single target
 * @param {Object} target - The target company
 * @param {Object} options - Scoring options
 * @param {Object} options.weights - Weight distribution (employees, clinics, revenue, website, keywords)
 * @param {Object} options.targetRange - Target ranges for employees and revenue
 * @param {string} options.fitKeywords - Keywords to match in company data
 * @param {Object} options.peerData - Optional peer percentiles for relative scoring
 * @returns {number} Score from 0-100
 */
export function calculateScore(target, { weights = {}, targetRange = {}, fitKeywords = "", peerData = {} }) {
  const defaultWeights = {
    employees: 35,
    clinics: 25,
    revenue: 15,
    website: 15,
    keywords: 10
  };

  const w = { ...defaultWeights, ...weights };
  const keywordsLower = fitKeywords.toLowerCase();

  // Employee score
  let empScore = 0;
  const emp = target.employees || 0;
  if (emp > 0) {
    if (targetRange.minEmployees && targetRange.maxEmployees) {
      const mid = (targetRange.minEmployees + targetRange.maxEmployees) / 2;
      const distance = Math.abs(emp - mid);
      const range = targetRange.maxEmployees - targetRange.minEmployees;
      empScore = Math.max(0, 100 - (distance / range) * 100);
    } else if (peerData.empP75 && peerData.empP75 > 0) {
      empScore = Math.min(100, (emp / peerData.empP75) * 100);
    }
  }

  // Clinic score
  let clinicScore = 0;
  const clinics = target.clinicCount || 0;
  if (clinics > 0) {
    clinicScore = Math.min(100, clinics * 25);
  }

  // Revenue score
  let revScore = 0;
  const rev = target.revenue || 0;
  if (rev > 0) {
    if (targetRange.minRevenue && targetRange.maxRevenue) {
      const mid = (targetRange.minRevenue + targetRange.maxRevenue) / 2;
      const distance = Math.abs(rev - mid);
      const range = targetRange.maxRevenue - targetRange.minRevenue;
      revScore = Math.max(0, 100 - (distance / range) * 100);
    } else if (peerData.revP75 && peerData.revP75 > 0) {
      revScore = Math.min(100, (rev / peerData.revP75) * 100);
    }
  }

  // Website score
  let websiteScore = 0;
  if (target.websiteStatus === "working") websiteScore = 100;
  else if (target.websiteStatus === "broken") websiteScore = 50;

  // Keyword score
  let keywordScore = 0;
  if (keywordsLower) {
    const textToCheck = [
      target.name || "",
      target.industry || "",
      target.subsector || "",
      target.sectorFocus || "",
      target.notes || ""
    ].join(" ").toLowerCase();
    
    if (textToCheck.includes(keywordsLower)) {
      keywordScore = 100;
    }
  }

  // Calculate weighted total
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

  // Apply recency penalty based on lastActive date
  if (target.lastActive) {
    try {
      const lastActiveDate = new Date(target.lastActive);
      const now = new Date();
      const monthsInactive = (now - lastActiveDate) / (1000 * 60 * 60 * 24 * 30);
      
      if (monthsInactive > 12) {
        score = Math.max(0, score - 25);
      } else if (monthsInactive > 6) {
        score = Math.max(0, score - 10);
      }
    } catch (error) {
      // Invalid date, no penalty
    }
  }

  return score;
}

/**
 * Calculate percentile for an array of numbers
 */
function percentile(arr, p) {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

/**
 * Score multiple targets and sort by score
 */
export function scoreTargets(targets, options = {}) {
  const { fitKeywords = "", weights = {}, targetRange = {} } = options;

  // Calculate peer data for relative scoring (75th percentile)
  const empValues = targets.map(t => t.employees || 0).filter(e => e > 0);
  const revValues = targets.map(t => t.revenue || 0).filter(r => r > 0);
  
  const peerData = {
    empP75: percentile(empValues, 75),
    revP75: percentile(revValues, 75)
  };

  // Score each target
  const scored = targets.map((t) => ({
    ...t,
    score: calculateScore(t, { weights, targetRange, fitKeywords, peerData })
  }));

  // Sort by score descending
  return scored.sort((a, b) => (b.score || 0) - (a.score || 0));
}