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
  const prompt = `You are a precision healthcare sector classifier. Your role is to categorize companies into healthcare verticals with surgical accuracy.

**Company Details:**
- Name: ${target.name}
- Short Name: ${target.companyShortName || 'N/A'}
- Website: ${target.website || 'N/A'}
- Industry: ${target.industry || 'N/A'}
- Subsector: ${target.subsector || 'N/A'}

**Classification Rules:**
1. Choose from ONLY these valid sectors:
${VALID_SECTORS}

2. Prioritize specificity over generalization
3. If truly ambiguous, use "HS: General" or "HCIT: General"
4. Return confidence score 0-100 based on signal clarity

**Examples:**
- "Midwest Dermatology Partners" → "HS: Dermatology" (95% confidence)
- "Blue Ridge Urgent Care" → "HS: Urgent Care" (90% confidence)
- "Summit Mental Health Services" → "HS: Behavioral - Mental" (85% confidence)
- "HealthTech Solutions Inc" → "HCIT: General" (40% confidence)

Return JSON:
{
  "sector": "exact sector from list",
  "confidence": 85,
  "reasoning": "brief explanation"
}`;

  const result = await base44.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: {
      type: "object",
      properties: {
        sector: { type: "string" },
        confidence: { type: "number" },
        reasoning: { type: "string" }
      }
    }
  });

  return {
    sector_focus_primary: result.sector || "HS: General",
    sector_confidence_score: Math.round(result.confidence || 50),
    sector_reasoning: result.reasoning || ""
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { targetId } = await req.json();
    
    if (!targetId) {
      return Response.json({ error: 'targetId required' }, { status: 400 });
    }
    
    // Fetch target
    const targets = await base44.entities.BDTarget.filter({ id: targetId });
    if (!targets.length) {
      return Response.json({ error: 'Target not found' }, { status: 404 });
    }
    
    const target = targets[0];
    const classification = await classifyTarget(target, base44);
    
    // Update target
    await base44.entities.BDTarget.update(targetId, {
      sectorFocus: classification.sector_focus_primary
    });
    
    return Response.json({
      targetId,
      name: target.name,
      ...classification
    });
  } catch (error) {
    console.error("Classification error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});