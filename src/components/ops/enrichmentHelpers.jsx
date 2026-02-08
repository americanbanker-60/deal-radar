import { base44 } from "@/api/base44Client";

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

/**
 * AI-based sector classification for a single company
 */
export async function classifyCompanySector(company) {
  try {
    const websiteContext = company.website 
      ? `Visit ${company.website} and analyze what healthcare services this company provides.` 
      : '';
    
    const prompt = `You are classifying a healthcare company into a specific sector. Be AGGRESSIVE about finding the most specific match.

**Company Information:**
- Name: ${company.name}
- Website: ${company.website || 'Not available'}

${websiteContext}

**Task:** Identify the PRIMARY healthcare specialty/sector from this list:
${SECTOR_OPTIONS}

**Critical Instructions:**
1. Look for ANY specialty keywords in the company name or website
2. Common patterns to watch for:
   - "Dermatology" / "Derm" / "Skin" → HS: Dermatology
   - "Urgent Care" / "Walk-in" → HS: Urgent Care
   - "Mental Health" / "Psychiatry" / "Psych" → HS: Behavioral - Mental
   - "Physical Therapy" / "PT" / "Rehab" → HS: Physical Therapy
   - "Cardiology" / "Heart" → HS: Cardiology
   - "Orthopedic" / "Ortho" / "Spine" / "Joint" → HS: Ortho
   - "Primary Care" / "Family Medicine" / "Internal Medicine" → HS: Primary Care
   - "Pediatric" / "Kids" / "Children" → HS: Pediatrics
   - "Vision" / "Optometry" / "Eye" → HS: Optometry or HS: Vision
   - "Dental" / "Dentistry" → HS: Dentistry
   - "Pain" → HS: Pain Management
   - "GI" / "Gastro" / "Digestive" → HS: Gastroenterology
   - "Urology" / "Kidney" → HS: Urology
   - "ASC" / "Surgery Center" → HS: ASC
   - "Imaging" / "Radiology" / "MRI" / "CT" → HS: Imaging
   - "Lab" / "Laboratory" / "Diagnostics" → HS: Lab
   - "Home Health" / "Home Care" → HS: Home Care or HS: PAC - Home Health
   - "Hospice" → HS: PAC - Hospice
   - "Skilled Nursing" / "SNF" → HS: PAC - Skilled Nursing (SNF)

3. ONLY use "HS: General" if there are absolutely NO specialty indicators
4. When in doubt between specific options, choose the most specific one

Return JSON:
{
  "sector": "exact match from the list above"
}`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: company.website ? true : false,
      response_json_schema: {
        type: "object",
        properties: {
          sector: { type: "string" }
        },
        required: ["sector"]
      }
    });

    return result.sector || "HS: General";
  } catch (error) {
    console.error(`Error classifying ${company.name}:`, error);
    return "HS: General";
  }
}

/**
 * Website crawling for clinic count, health status, and social activity
 */
export async function crawlCompanyWebsite(company) {
  if (!company.website) {
    return {
      websiteStatus: "missing",
      clinicCount: undefined,
      lastActive: null,
      dormancyFlag: false
    };
  }

  try {
    const prompt = `Visit the website ${company.website} and social media for the company "${company.name}". 

Extract the following information:
1. Website Status: Does the website load properly? (answer: "working" or "broken")
2. Number of Locations/Clinics: How many physical locations, clinics, or offices does this company operate? Look for phrases like "locations", "clinics", "offices", "facilities". If you can't find this information, return null.
3. Last Active Date: Check the company's LinkedIn page, Facebook page, or website blog/news section for the most recent post, update, or activity. Return the date in YYYY-MM-DD format. If no recent activity is found, return null.
4. Is the company active? Based on the last active date, determine if there has been ANY activity (social media, website updates, news) in the past 12 months.

Return your response as JSON with this exact structure:
{
  "websiteStatus": "working" or "broken",
  "clinicCount": number or null,
  "lastActiveDate": "YYYY-MM-DD" or null,
  "hasRecentActivity": true or false
}`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          websiteStatus: { type: "string" },
          clinicCount: { type: ["number", "null"] },
          lastActiveDate: { type: ["string", "null"] },
          hasRecentActivity: { type: "boolean" }
        }
      }
    });

    return {
      websiteStatus: result.websiteStatus || "unknown",
      clinicCount: result.clinicCount,
      lastActive: result.lastActiveDate,
      dormancyFlag: !result.hasRecentActivity
    };
  } catch (error) {
    console.error(`Error crawling ${company.name}:`, error);
    return {
      websiteStatus: "error",
      clinicCount: undefined,
      lastActive: null,
      dormancyFlag: false
    };
  }
}

/**
 * Clean company name with regex - strips legal suffixes
 */
export function cleanCompanyName(name) {
  if (!name) return name;
  
  // Remove legal suffixes with regex
  let cleaned = name
    .replace(/,?\s+(LLC|L\.L\.C\.|Inc\.?|Incorporated|Corporation|Corp\.?|Ltd\.?|Limited|P\.A\.|PA|Co\.?|Company|Group|Holdings|Partners|Services|MSO|PC|P\.C\.|PLLC|P\.L\.L\.C\.)/gi, '')
    .replace(/^(The|A|An)\s+/i, '') // Remove leading articles
    .trim();
  
  return cleaned || name; // Fallback to original if cleaning results in empty string
}

/**
 * Generate friendly name for complex company names using AI
 */
export async function generateFriendlyName(companyName) {
  try {
    // First apply regex cleaning
    const regexCleaned = cleanCompanyName(companyName);
    
    // If the name is simple after regex, return it
    if (regexCleaned.split(' ').length <= 4) {
      return regexCleaned;
    }
    
    // For complex names, use AI to make it sound natural
    const prompt = `Given the company name: "${companyName}"

Generate a friendly name that sounds natural in a sentence (e.g., "I'm reaching out regarding Local Urgent Care Center...").

Rules:
- Remove "The", "A", "An" prefixes
- Remove legal suffixes (LLC, Inc, Corp, Ltd, P.A., etc.)
- Remove "of [Location]" if it makes the name overly long
- Keep it concise but preserve brand identity
- Should be 2-5 words maximum
- Natural and conversational

Examples:
- "The local Urgent Care Center of Florida, LLC" → "Local Urgent Care Center"
- "Advanced Dermatology Associates of the Midwest, Inc." → "Advanced Dermatology"
- "Sunshine Pediatrics Group, P.A." → "Sunshine Pediatrics"

Return JSON:
{
  "friendlyName": "..."
}`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          friendlyName: { type: "string" }
        }
      }
    });

    return result.friendlyName || regexCleaned;
  } catch (error) {
    console.error(`Error generating friendly name for ${companyName}:`, error);
    return cleanCompanyName(companyName);
  }
}

/**
 * Generate clean short name for a company (used in existing flows)
 */
export async function generateShortName(companyName) {
  return generateFriendlyName(companyName);
}