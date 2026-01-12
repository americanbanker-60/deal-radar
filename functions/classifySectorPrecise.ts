import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const VALID_SECTORS = [
  "HS: Women's Health",
  "HCIT: Benefit Management Solutions",
  "HCIT: Care Delivery",
  "HCIT: Compliance",
  "HCIT: General",
  "HCIT: Inventory and Cost Solutions",
  "HCIT: Life Sciences/Pharmacy Focused Solutions",
  "HCIT: Medication Adherence",
  "HCIT: Member Engagement",
  "HCIT: Other Payor Services",
  "HCIT: Payment Accuracy & Cost Containment",
  "HCIT: Pharma",
  "HCIT: Population Health / VBC Enablement",
  "HCIT: Practice Management",
  "HCIT: Provider Focused Solutions",
  "HCIT: RCM",
  "HS: Allergy, Ear, Nose and Throat",
  "HS: Anesthesiology",
  "HS: ASC",
  "HS: Behavioral - ABA",
  "HS: Behavioral - IDD",
  "HS: Behavioral - Interventional Pysch",
  "HS: Behavioral - Mental",
  "HS: Behavioral - Psych",
  "HS: Behavioral - Psych / Residential",
  "HS: Behavioral - SUD",
  "HS: Cardiology",
  "HS: Compound Pharmacy",
  "HS: Dentistry",
  "HS: Dermatology",
  "HS: DME",
  "HS: DPC",
  "HS: Employer | Self Insured Services",
  "HS: Functional Medicine / Wellness",
  "HS: Gastroenterology",
  "HS: General",
  "HS: Health Systems",
  "HS: Home Care",
  "HS: Imaging",
  "HS: Infusion Center",
  "HS: Lab",
  "HS: Medical Transportation",
  "HS: MedSpa & Aesthetics",
  "HS: Nephrology",
  "HS: Neurology",
  "HS: Optometry",
  "HS: Ortho",
  "HS: PAC - Home Health",
  "HS: PAC - Hospice",
  "HS: PAC - Skilled Nursing (SNF)",
  "HS: Pain Management",
  "HS: Pediatrics",
  "HS: Physical Therapy",
  "HS: Podiatry",
  "HS: PPM",
  "HS: Primary Care",
  "HS: Sleep",
  "HS: Speech Pathology",
  "HS: Staffing",
  "HS: Urgent Care",
  "HS: Urology",
  "HS: Vascular & Vein",
  "HS: Veterinary",
  "HS: Veterinary / Animal Health",
  "HS: Vision",
  "HS: Wound Care",
  "Other - See Notes",
  "Other: Consumer",
  "Other: Wealth Management",
  "Pharma: CRO Services"
];

const SPECIALTY_KEYWORDS = {
  "HS: Dermatology": ["dermatology", "derm", "skin", "laser", "mohs"],
  "HS: Cardiology": ["cardiology", "cardiac", "heart"],
  "HS: Orthopedics": ["orthopedic", "ortho", "spine", "joint"],
  "HS: Dentistry": ["dental", "dentist", "orthodontic", "oral surgery"],
  "HS: Optometry": ["eye", "vision", "retina", "ophthalmology", "optometry"],
  "HS: Behavioral - Mental": ["psychiatry", "therapy", "counseling", "mental health", "psychology"],
  "HS: Urgent Care": ["urgent care", "walk-in", "immediate care"],
  "HS: Physical Therapy": ["physical therapy", "pt", "rehab"],
  "HS: Pediatrics": ["pediatric", "pediatrics", "children"],
  "HS: Pain Management": ["pain management", "pain relief"],
  "HS: MedSpa & Aesthetics": ["medspa", "aesthetic", "cosmetic"],
  "HS: Home Care": ["home care", "home health"],
  "HS: Hospice": ["hospice"],
  "HS: Lab": ["lab", "laboratory", "diagnostic"],
  "HS: Imaging": ["imaging", "radiology", "mri", "ct scan"],
  "HS: Allergy, Ear, Nose and Throat": ["ent", "allergy", "otolaryngology"],
  "HCIT: Practice Management": ["practice management", "ehr", "emr"],
  "HCIT: RCM": ["revenue cycle", "billing", "claims"],
  "HCIT: Care Delivery": ["telehealth", "telemedicine"],
  "HS: Staffing": ["staffing", "temp staffing", "physician staffing"]
};

function classifyTarget(target) {
  const name = (target.name || "").toLowerCase();
  const shortName = (target.companyShortName || "").toLowerCase();
  const website = (target.website || "").toLowerCase();
  const clinicCount = target.clinicCount || 0;
  
  let scores = {};
  
  // Match keywords
  for (const [sector, keywords] of Object.entries(SPECIALTY_KEYWORDS)) {
    let score = 0;
    for (const kw of keywords) {
      if (name.includes(kw)) score += 40;
      if (shortName.includes(kw)) score += 35;
    }
    if (score > 0) scores[sector] = score;
  }
  
  // Clinic count boost
  if (clinicCount > 1) {
    for (const sector of Object.keys(scores)) {
      scores[sector] += 20;
    }
  }
  
  // Weak website penalty
  if (!target.website || target.websiteStatus === "broken") {
    for (const sector of Object.keys(scores)) {
      scores[sector] = Math.max(0, scores[sector] - 20);
    }
  }
  
  // Find best match
  let primarySector = "HS: General";
  let confidence = 0;
  
  if (Object.keys(scores).length > 0) {
    primarySector = Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
    confidence = Math.min(100, Object.entries(scores).sort((a, b) => b[1] - a[1])[0][1]);
  }
  
  const confidenceTier = confidence >= 75 ? "High" : confidence >= 55 ? "Medium" : "Low";
  
  return {
    sector_focus_primary: primarySector,
    sector_confidence_score: Math.round(confidence),
    sector_confidence_tier: confidenceTier
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
    const classification = classifyTarget(target);
    
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