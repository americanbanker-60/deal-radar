// Consolidated data processing utilities for Deal Radar

import { base44 } from "@/api/base44Client";

// =====================
// DATA TRANSFORMATION
// =====================

export const toNumber = (v) => {
  if (v === null || v === undefined) return NaN;
  if (typeof v === "number") return v;
  const s = String(v).replace(/[$,%\s,]/g, "").replace(/[–—]/g, "-");
  const n = parseFloat(s);
  return isNaN(n) ? NaN : n;
};

export const percentile = (arr, p) => {
  if (!arr || arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index % 1;
  if (lower === upper) return sorted[lower];
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
};

export const midpointFromRange = (val) => {
  if (!val || val === null || val === undefined) return undefined;
  
  let s = String(val).trim().toLowerCase();
  s = s.replace(/[$€£¥₹,\s]/g, "").replace(/[–—]/g, "-");
  
  let unit = 1;
  if (s.endsWith("bn") || s.endsWith("billion")) {
    unit = 1_000_000_000;
    s = s.replace(/(bn|billion)$/i, "");
  } else if (s.endsWith("m") || s.endsWith("mn") || s.endsWith("mil") || s.endsWith("million")) {
    unit = 1_000_000;
    s = s.replace(/(m|mn|mil|million)$/i, "");
  } else if (s.endsWith("k") || s.endsWith("thousand")) {
    unit = 1_000;
    s = s.replace(/(k|thousand)$/i, "");
  }
  
  const rangePatterns = [
    /(\d+(?:\.\d+)?)\s*(?:-|to|\.\.)\s*(\d+(?:\.\d+)?)/,
    /between\s*(\d+(?:\.\d+)?)\s*and\s*(\d+(?:\.\d+)?)/,
    /(\d+(?:\.\d+)?)\s*[~≈]\s*(\d+(?:\.\d+)?)/
  ];
  
  for (const pattern of rangePatterns) {
    const match = s.match(pattern);
    if (match) {
      const a = parseFloat(match[1]) * unit;
      const b = parseFloat(match[2]) * unit;
      return (a + b) / 2;
    }
  }
  
  const numMatch = s.match(/(\d+(?:\.\d+)?)/);
  if (numMatch) {
    const single = parseFloat(numMatch[1]) * unit;
    return isNaN(single) ? undefined : single;
  }
  
  return undefined;
};

// =====================
// DATA FILTERING
// =====================

export function filterTargets(targets, { regionFilter, minRev, maxRev, ownerPref }) {
  return targets.filter((t) => {
    const regionMatch = !regionFilter || (t.state || "").toLowerCase().includes(regionFilter.toLowerCase());
    const revMatch = (t.revenue ?? 0) >= minRev && (t.revenue ?? 0) <= maxRev;
    const ownerMatch = ownerPref === "Any" || (t.ownership || "").toLowerCase().includes(ownerPref.toLowerCase());
    return regionMatch && revMatch && ownerMatch;
  });
}

// =====================
// SCORING ALGORITHM
// =====================

export function scoreTargets(targets, { fitKeywords = "", weights = {}, targetRange = {} }) {
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

  const scored = targets.map((t) => {
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
    if (t.lastActive) {
      try {
        const lastActiveDate = new Date(t.lastActive);
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

    return { ...t, score };
  });

  return scored.sort((a, b) => (b.score || 0) - (a.score || 0));
}

// =====================
// NAME CLEANING
// =====================

export function cleanCompanyNameRegex(name) {
  if (!name) return name;
  
  let cleaned = name
    .replace(/,?\s+(LLC|L\.L\.C\.|Inc\.?|Incorporated|Corporation|Corp\.?|Ltd\.?|Limited|P\.A\.|PA|Co\.?|Company|Group|Holdings|Partners|Services|MSO|PC|P\.C\.|PLLC|P\.L\.L\.C\.)/gi, '')
    .replace(/^(The|A|An)\s+/i, '')
    .trim();
  
  return cleaned || name;
}

export async function generateFriendlyName(companyName) {
  const regexCleaned = cleanCompanyNameRegex(companyName);
  
  if (regexCleaned === companyName) {
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Create a short, natural company name from: "${companyName}". Remove legal suffixes and articles. Return ONLY the name, no quotes or explanation. Examples: "ABC Pediatric Dental Group, LLC" → "ABC Pediatric Dental", "The North Atlanta Primary Care Partners" → "North Atlanta Primary Care"`,
        add_context_from_internet: false
      });
      return result.trim();
    } catch (error) {
      console.error("AI name generation failed:", error);
      return regexCleaned;
    }
  }
  
  return regexCleaned;
}

export async function generateCorrespondenceName(companyName) {
  const cleaned = cleanCompanyNameRegex(companyName);
  
  try {
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Convert this company name to a natural, conversational form for email greetings: "${cleaned}"

Examples:
- "ABC Pediatric Dental Group" → "Pediatric Dental Group" (drop initials if redundant)
- "North Atlanta Primary Care" → "North Atlanta Primary Care" (keep as-is if natural)
- "Children's Hospital Network" → "Children's Hospital Network" (keep as-is)
- "XYZ Medical Associates" → "XYZ Medical" (simplify if needed)

Return ONLY the natural name, no quotes or explanation.`,
      add_context_from_internet: false
    });
    
    return result.trim();
  } catch (error) {
    console.error("AI correspondence name failed:", error);
    return cleaned;
  }
}

// =====================
// SECTOR CLASSIFICATION
// =====================

const SECTOR_OPTIONS = `HS: Allergy, Ear, Nose and Throat
HS: Anesthesiology
HS: ASC
HS: Behavioral - ABA
HS: Behavioral - IDD
HS: Behavioral - Interventional Pysch
HS: Behavioral - Mental
HS: Behavioral - Psych
HS: Behavioral - Psych / Residential
HS: Behavioral - SUD
HS: Cardiology
HS: Compound Pharmacy
HS: Dentistry
HS: Dermatology
HS: DME
HS: DPC
HS: Employer | Self Insured Services
HS: Functional Medicine / Wellness
HS: Gastroenterology
HS: General
HS: Health Systems
HS: Home Care
HS: Imaging
HS: Infusion Center
HS: Lab
HS: Medical Transportation
HS: MedSpa & Aesthetics
HS: Nephrology
HS: Neurology
HS: Optometry
HS: Ortho
HS: PAC - Home Health
HS: PAC - Hospice
HS: PAC - Skilled Nursing (SNF)
HS: Pain Management
HS: Pediatrics
HS: Physical Therapy
HS: Podiatry
HS: PPM
HS: Primary Care
HS: Sleep
HS: Speech Pathology
HS: Staffing
HS: Urgent Care
HS: Urology
HS: Vascular & Vein
HS: Veterinary
HS: Veterinary / Animal Health
HS: Vision
HS: Women's Health
HS: Wound Care`;

export async function classifyCompanySector(company) {
  try {
    const prompt = `Classify this healthcare company into ONE of the following sectors:

${SECTOR_OPTIONS}

Company: ${company.name}
Website: ${company.website || "unknown"}

Return ONLY the sector code (e.g., "HS: Dentistry"), nothing else.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: false
    });

    const sector = result.trim();
    const validSector = SECTOR_OPTIONS.split('\n').find(s => s === sector);
    return validSector || "HS: General";
  } catch (error) {
    console.error("Sector classification failed:", error);
    return "HS: General";
  }
}

// =====================
// WEBSITE CRAWLING
// =====================

export async function crawlCompanyWebsite(company) {
  try {
    const prompt = `Analyze the website and social media for "${company.name}" (${company.website || 'healthcare company'}).

Extract:
1. Website status: working, broken, or missing
2. Number of clinic/office locations (check locations page, about us, etc.)
3. Most recent activity date from social media or news (YYYY-MM-DD format)
4. Is the company potentially dormant? (no activity in 12+ months)

Return JSON:
{
  "websiteStatus": "working" | "broken" | "missing",
  "clinicCount": number or null,
  "lastActive": "YYYY-MM-DD" or null,
  "dormancyFlag": boolean
}`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          websiteStatus: { type: "string" },
          clinicCount: { type: "number" },
          lastActive: { type: "string" },
          dormancyFlag: { type: "boolean" }
        }
      }
    });

    return {
      websiteStatus: result.websiteStatus || "unknown",
      clinicCount: result.clinicCount || null,
      lastActive: result.lastActive || null,
      dormancyFlag: result.dormancyFlag || false
    };
  } catch (error) {
    console.error(`Website crawl failed for ${company.name}:`, error);
    return {
      websiteStatus: "error",
      clinicCount: null,
      lastActive: null,
      dormancyFlag: false
    };
  }
}

// =====================
// STATE NORMALIZATION
// =====================

const STATE_MAP = {
  'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR', 'california': 'CA',
  'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE', 'florida': 'FL', 'georgia': 'GA',
  'hawaii': 'HI', 'idaho': 'ID', 'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA',
  'kansas': 'KS', 'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
  'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS',
  'missouri': 'MO', 'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV', 'new hampshire': 'NH',
  'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC',
  'north dakota': 'ND', 'ohio': 'OH', 'oklahoma': 'OK', 'oregon': 'OR', 'pennsylvania': 'PA',
  'rhode island': 'RI', 'south carolina': 'SC', 'south dakota': 'SD', 'tennessee': 'TN',
  'texas': 'TX', 'utah': 'UT', 'vermont': 'VT', 'virginia': 'VA', 'washington': 'WA',
  'west virginia': 'WV', 'wisconsin': 'WI', 'wyoming': 'WY', 'district of columbia': 'DC',
  'puerto rico': 'PR', 'guam': 'GU', 'virgin islands': 'VI'
};

export function normalizeState(state) {
  if (!state) return '';
  const trimmed = state.trim();
  
  if (trimmed.length === 2) return trimmed.toUpperCase();
  
  const lower = trimmed.toLowerCase();
  return STATE_MAP[lower] || trimmed;
}