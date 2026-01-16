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
 * Website crawling for clinic count and health status
 */
export async function crawlCompanyWebsite(company) {
  if (!company.website) {
    return {
      websiteStatus: "missing",
      clinicCount: undefined
    };
  }

  try {
    const prompt = `Visit the website ${company.website} for the company "${company.name}". 

Extract the following information:
1. Website Status: Does the website load properly? (answer: "working" or "broken")
2. Number of Locations/Clinics: How many physical locations, clinics, or offices does this company operate? Look for phrases like "locations", "clinics", "offices", "facilities". If you can't find this information, return null.

Return your response as JSON with this exact structure:
{
  "websiteStatus": "working" or "broken",
  "clinicCount": number or null
}`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          websiteStatus: { type: "string" },
          clinicCount: { type: ["number", "null"] }
        }
      }
    });

    return {
      websiteStatus: result.websiteStatus || "unknown",
      clinicCount: result.clinicCount
    };
  } catch (error) {
    console.error(`Error crawling ${company.name}:`, error);
    return {
      websiteStatus: "error",
      clinicCount: undefined
    };
  }
}

/**
 * Generate clean short name for a company
 */
export async function generateShortName(companyName) {
  try {
    const prompt = `Given the full company name: "${companyName}"

Generate a clean short name following these rules:
- Remove leading articles: The, A, An
- Remove legal terms: LLC, Inc, Incorporated, Corporation, Corp, Company, Co, Group, Holdings, Partners, Services, MSO, PC, PLLC, PA
- Retain core unique identifiers + specialty term
- Use Title Case
- Do NOT add new words
- Should look natural in an email subject line

Examples:
- "The River Pediatrics Group" → "River Pediatrics"
- "Blue Oak Cardiology, LLC" → "Blue Oak Cardiology"
- "Willow Grove Behavioral Health Services" → "Willow Grove Behavioral Health"

Return JSON:
{
  "shortName": "..."
}`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          shortName: { type: "string" }
        }
      }
    });

    return result.shortName || companyName;
  } catch (error) {
    console.error(`Error generating short name for ${companyName}:`, error);
    return companyName;
  }
}