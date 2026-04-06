import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { checkRateLimit, rateLimitResponse } from '../../shared/rate-limiter.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limit: 10 bulk enrich requests per minute
    const rateCheck = checkRateLimit(user.email, { maxRequests: 10, keyPrefix: 'bulk-enrich' });
    if (!rateCheck.allowed) {
      return rateLimitResponse(rateCheck.retryAfterMs);
    }

    const { targets } = await req.json();

    if (!targets || !Array.isArray(targets)) {
      return Response.json({ error: 'Invalid input: targets must be an array' }, { status: 400 });
    }

    const enrichedTargets = [];
    const errors = [];

    for (let i = 0; i < targets.length; i++) {
      const target = targets[i];
      
      try {
        // Generate short names
        const shortNamePrompt = `Transform this company name into a clean, conversational short name:

Company Name: "${target.name}"

Rules:
- Remove legal suffixes (LLC, Inc, etc.)
- Keep essential identity words
- Make it natural and conversational
- Examples:
  • "The Pediatric Dental Group of North Atlanta, LLC" → "Pediatric Dental Group"
  • "Advanced Urgent Care Centers Inc." → "Advanced Urgent Care"

Return ONLY the short name, nothing else.`;

        const shortNameResult = await base44.integrations.Core.InvokeLLM({
          prompt: shortNamePrompt,
          add_context_from_internet: false
        });

        // Generate correspondence name
        const corrNamePrompt = `Transform this company name into a natural, email-friendly correspondence name:

Company Name: "${target.name}"

Rules:
- Very conversational and natural
- Remove all formalities
- How you'd refer to them in casual conversation
- Examples:
  • "The Pediatric Dental Group of North Atlanta, LLC" → "Pediatric Dental Group of North Atlanta"
  • "Smith Family Urgent Care, Inc." → "Smith Family Urgent Care"

Return ONLY the correspondence name, nothing else.`;

        const corrNameResult = await base44.integrations.Core.InvokeLLM({
          prompt: corrNamePrompt,
          add_context_from_internet: false
        });

        // Classify sector
        const sectorPrompt = `Classify this healthcare company into ONE of these specific subsectors:

Company: ${target.name}
Website: ${target.website || 'Not provided'}

Healthcare Subsectors (choose ONE):
- HS: Behavioral Health
- HS: Dental / Orthodontics
- HS: Dermatology
- HS: Home Health
- HS: Imaging
- HS: Physical Therapy
- HS: Primary Care
- HS: Urgent Care
- HS: Vision / Ophthalmology
- HS: Multi-Specialty
- HS: Pharmacy
- HS: Laboratory
- HS: Medical Devices
- HS: General

Instructions:
- Choose the MOST specific subsector that fits
- If company spans multiple areas, choose "HS: Multi-Specialty"
- If unclear or doesn't fit any specific category, use "HS: General"
- Return ONLY the subsector code (e.g., "HS: Dental / Orthodontics"), nothing else`;

        const sectorResult = await base44.integrations.Core.InvokeLLM({
          prompt: sectorPrompt,
          add_context_from_internet: false
        });

        enrichedTargets.push({
          ...target,
          companyShortName: shortNameResult.trim(),
          correspondenceName: corrNameResult.trim(),
          sectorFocus: sectorResult.trim()
        });

      } catch (error) {
        console.error(`Error enriching target ${target.name}:`, error);
        errors.push({
          targetName: target.name,
          error: error.message
        });
        
        // Add target with original values if enrichment fails
        enrichedTargets.push({
          ...target,
          companyShortName: target.name,
          correspondenceName: target.name,
          sectorFocus: "HS: General"
        });
      }
    }

    return Response.json({
      success: true,
      enrichedTargets,
      errors: errors.length > 0 ? errors : null
    });

  } catch (error) {
    console.error("Bulk enrich error:", error);
    return Response.json({
      error: error.message || String(error)
    }, { status: 500 });
  }
});