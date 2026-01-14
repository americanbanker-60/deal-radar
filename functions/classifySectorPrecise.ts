import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const VALID_SECTORS = `HS: Women's Health
HCIT: Benefit Management Solutions
HCIT: Care Delivery
HCIT: Compliance
HCIT: General
HCIT: Inventory and Cost Solutions
HCIT: Life Sciences/Pharmacy Focused Solutions
HCIT: Medication Adherence
HCIT: Member Engagement
HCIT: Other Payor Services
HCIT: Payment Accuracy & Cost Containment
HCIT: Pharma
HCIT: Population Health / VBC Enablement
HCIT: Practice Management
HCIT: Provider Focused Solutions
HCIT: RCM
HS: Allergy, Ear, Nose and Throat
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
HS: Wound Care
Other - See Notes
Other: Consumer
Other: Wealth Management
Pharma: CRO Services`;

async function classifyTarget(target, base44) {
  const websiteContext = target.website ? `Visit ${target.website} and analyze what healthcare services this company provides.` : '';
  
  const prompt = `You are classifying a healthcare company into a specific sector. Be AGGRESSIVE about finding the most specific match.

**Company Information:**
- Name: ${target.name}
- Website: ${target.website || 'Not available'}

${websiteContext}

**Task:** Identify the PRIMARY healthcare specialty/sector from this list:
${VALID_SECTORS}

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
    add_context_from_internet: target.website ? true : false,
    response_json_schema: {
      type: "object",
      properties: {
        sector: { type: "string" }
      },
      required: ["sector"]
    }
  });

  return {
    sector_focus_primary: result.sector || "HS: General",
    sector_confidence_score: 90,
    sector_reasoning: `Classified using ${target.website ? 'website context and ' : ''}company name analysis`
  };
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { targetId } = await req.json();
    
    if (!targetId) {
      return Response.json({ error: 'targetId required' }, { status: 400 });
    }
    
    console.log(`🔍 Fetching target ${targetId}...`);
    
    // Fetch target
    const targets = await base44.entities.BDTarget.filter({ id: targetId });
    if (!targets.length) {
      return Response.json({ error: 'Target not found' }, { status: 404 });
    }
    
    const target = targets[0];
    console.log(`📊 Classifying: ${target.name}`);
    
    const classification = await classifyTarget(target, base44);
    
    console.log(`✓ Classification result:`, classification);
    
    // Update target
    await base44.entities.BDTarget.update(targetId, {
      sectorFocus: classification.sector_focus_primary
    });
    
    console.log(`✓ Updated ${target.name} → ${classification.sector_focus_primary}`);
    
    return Response.json({
      success: true,
      targetId,
      name: target.name,
      ...classification
    });
  } catch (error) {
    console.error("❌ Classification error:", error);
    return Response.json({ 
      success: false,
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});