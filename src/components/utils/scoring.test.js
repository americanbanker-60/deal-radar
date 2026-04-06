import { describe, it, expect } from 'vitest';
import { calculateScore, scoreTargets } from './scoring';

describe('calculateScore', () => {
  const defaultWeights = {
    employees: 35,
    clinics: 25,
    revenue: 15,
    website: 15,
    keywords: 10,
  };

  it('returns 0 for an empty target with no data', () => {
    const score = calculateScore({}, { weights: defaultWeights });
    expect(score).toBe(0);
  });

  it('gives full employee score when target is at midpoint of range', () => {
    const score = calculateScore(
      { employees: 75 },
      {
        weights: { employees: 100, clinics: 0, revenue: 0, website: 0, keywords: 0 },
        targetRange: { minEmployees: 50, maxEmployees: 100 },
      }
    );
    expect(score).toBe(100);
  });

  it('handles division by zero when minEmployees === maxEmployees', () => {
    const score = calculateScore(
      { employees: 50 },
      {
        weights: { employees: 100, clinics: 0, revenue: 0, website: 0, keywords: 0 },
        targetRange: { minEmployees: 50, maxEmployees: 50 },
      }
    );
    // Should return 100 (employee matches exactly), not NaN/Infinity
    expect(score).toBe(100);
    expect(Number.isFinite(score)).toBe(true);
  });

  it('returns 0 employee score when minEmployees === maxEmployees but target differs', () => {
    const score = calculateScore(
      { employees: 100 },
      {
        weights: { employees: 100, clinics: 0, revenue: 0, website: 0, keywords: 0 },
        targetRange: { minEmployees: 50, maxEmployees: 50 },
      }
    );
    expect(score).toBe(0);
  });

  it('handles division by zero when minRevenue === maxRevenue', () => {
    const score = calculateScore(
      { revenue: 10 },
      {
        weights: { employees: 0, clinics: 0, revenue: 100, website: 0, keywords: 0 },
        targetRange: { minRevenue: 10, maxRevenue: 10 },
      }
    );
    expect(score).toBe(100);
    expect(Number.isFinite(score)).toBe(true);
  });

  it('scores clinic count linearly capped at 100', () => {
    const weights = { employees: 0, clinics: 100, revenue: 0, website: 0, keywords: 0 };
    expect(calculateScore({ clinicCount: 1 }, { weights })).toBe(25);
    expect(calculateScore({ clinicCount: 4 }, { weights })).toBe(100);
    expect(calculateScore({ clinicCount: 10 }, { weights })).toBe(100); // capped
  });

  it('gives full website score for working sites', () => {
    const weights = { employees: 0, clinics: 0, revenue: 0, website: 100, keywords: 0 };
    expect(calculateScore({ websiteStatus: 'working' }, { weights })).toBe(100);
    expect(calculateScore({ websiteStatus: 'broken' }, { weights })).toBe(50);
    expect(calculateScore({}, { weights })).toBe(0);
  });

  it('gives full keyword score when keyword matches', () => {
    const weights = { employees: 0, clinics: 0, revenue: 0, website: 0, keywords: 100 };
    expect(
      calculateScore(
        { name: 'ABC Dental Group' },
        { weights, fitKeywords: 'dental' }
      )
    ).toBe(100);
  });

  it('gives zero keyword score when keyword does not match', () => {
    const weights = { employees: 0, clinics: 0, revenue: 0, website: 0, keywords: 100 };
    expect(
      calculateScore(
        { name: 'ABC Dental Group' },
        { weights, fitKeywords: 'cardiology' }
      )
    ).toBe(0);
  });

  it('applies recency penalty for 12+ months inactive', () => {
    const old = new Date();
    old.setMonth(old.getMonth() - 14);
    const score = calculateScore(
      { employees: 75, lastActive: old.toISOString() },
      {
        weights: { employees: 100, clinics: 0, revenue: 0, website: 0, keywords: 0 },
        targetRange: { minEmployees: 50, maxEmployees: 100 },
      }
    );
    expect(score).toBe(75); // 100 - 25 penalty
  });

  it('applies smaller recency penalty for 6-12 months inactive', () => {
    const old = new Date();
    old.setMonth(old.getMonth() - 8);
    const score = calculateScore(
      { employees: 75, lastActive: old.toISOString() },
      {
        weights: { employees: 100, clinics: 0, revenue: 0, website: 0, keywords: 0 },
        targetRange: { minEmployees: 50, maxEmployees: 100 },
      }
    );
    expect(score).toBe(90); // 100 - 10 penalty
  });

  it('uses peer data when no target range is provided', () => {
    const score = calculateScore(
      { employees: 100 },
      {
        weights: { employees: 100, clinics: 0, revenue: 0, website: 0, keywords: 0 },
        peerData: { empP75: 100 },
      }
    );
    expect(score).toBe(100);
  });

  it('correctly combines weighted scores', () => {
    const score = calculateScore(
      { employees: 75, clinicCount: 2, websiteStatus: 'working' },
      {
        weights: { employees: 50, clinics: 25, revenue: 0, website: 25, keywords: 0 },
        targetRange: { minEmployees: 50, maxEmployees: 100 },
      }
    );
    // empScore=100, clinicScore=50, websiteScore=100
    // (100*50 + 50*25 + 100*25) / 100 = (5000+1250+2500)/100 = 87.5 → 88
    expect(score).toBe(88);
  });
});

describe('scoreTargets', () => {
  it('sorts targets by score descending', () => {
    const targets = [
      { name: 'A', employees: 10 },
      { name: 'B', employees: 100 },
      { name: 'C', employees: 50 },
    ];
    const scored = scoreTargets(targets, {
      weights: { employees: 100, clinics: 0, revenue: 0, website: 0, keywords: 0 },
    });
    expect(scored[0].name).toBe('B');
    expect(scored[scored.length - 1].name).toBe('A');
  });

  it('returns empty array for empty input', () => {
    const scored = scoreTargets([]);
    expect(scored).toEqual([]);
  });

  it('calculates peer data from the dataset', () => {
    const targets = [
      { name: 'A', employees: 20 },
      { name: 'B', employees: 40 },
      { name: 'C', employees: 60 },
      { name: 'D', employees: 80 },
    ];
    const scored = scoreTargets(targets, {
      weights: { employees: 100, clinics: 0, revenue: 0, website: 0, keywords: 0 },
    });
    // All should have scores, none should be NaN
    scored.forEach(t => {
      expect(Number.isFinite(t.score)).toBe(true);
      expect(t.score).toBeGreaterThanOrEqual(0);
    });
  });
});
