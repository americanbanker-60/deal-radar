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
  const prompt = `Classify this healthcare company into ONE specific sector based on the company name.

**Company Name:** ${target.name}

**Valid Sectors (choose ONE):**
${VALID_SECTORS}

**Classification Rules:**
1. Look for specialty keywords in the company name (e.g., "Dermatology", "Urgent Care", "Pediatrics")
2. Choose the MOST SPECIFIC sector that matches
3. Examples:
   - "Midwest Dermatology Partners" → "HS: Dermatology"
   - "Blue Ridge Urgent Care" → "HS: Urgent Care"
   - "Summit Behavioral Health" → "HS: Behavioral - Mental"
   - "Coastal Physical Therapy" → "HS: Physical Therapy"
   - "Valley Primary Care" → "HS: Primary Care"
4. Only use "HS: General" if NO specialty is mentioned in the name

Return JSON with ONLY the sector (no explanation needed):
{
  "sector": "exact sector from list above"
}`;

  const result = await base44.integrations.Core.InvokeLLM({
    prompt,
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
    sector_reasoning: `Classified based on company name: ${target.name}`
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