import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { targets, targetIds } = await req.json();

    // Support passing targetIds to fetch from DB directly
    let targetsToProcess = targets;
    if (!targetsToProcess && targetIds && Array.isArray(targetIds)) {
      targetsToProcess = await Promise.all(
        targetIds.map(id => base44.asServiceRole.entities.BDTarget.get(id))
      );
    }

    if (!targetsToProcess || !Array.isArray(targetsToProcess)) {
      return Response.json({ error: 'Invalid input: targets must be an array' }, { status: 400 });
    }

    const enrichedTargets = [];
    const errors = [];

    const sleep = (ms) => new Promise(r => setTimeout(r, ms));

    const enrichOne = async (target) => {
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

      // Run all 3 LLM calls in parallel per target
      const [shortNameResult, corrNameResult, sectorResult] = await Promise.all([
        base44.integrations.Core.InvokeLLM({ prompt: shortNamePrompt, add_context_from_internet: false }),
        base44.integrations.Core.InvokeLLM({ prompt: corrNamePrompt, add_context_from_internet: false }),
        base44.integrations.Core.InvokeLLM({ prompt: sectorPrompt, add_context_from_internet: false }),
      ]);

      const enriched = {
        ...target,
        companyShortName: shortNameResult.trim(),
        correspondenceName: corrNameResult.trim(),
        sectorFocus: sectorResult.trim()
      };

      // If target has an id (from DB), write back directly
      if (target.id) {
        let delay = 300;
        for (let attempt = 0; attempt < 4; attempt++) {
          try {
            await base44.asServiceRole.entities.BDTarget.update(target.id, {
              correspondenceName: enriched.correspondenceName,
              sectorFocus: enriched.sectorFocus,
            });
            break;
          } catch (err) {
            const is429 = err?.status === 429 || (err?.message || '').includes('429') || (err?.message || '').includes('Rate limit');
            if (is429 && attempt < 3) {
              await sleep(delay);
              delay *= 2;
            } else {
              throw err;
            }
          }
        }
      }

      return enriched;
    };

    // Process targets in parallel (up to 5 at a time to avoid rate limits)
    const CONCURRENCY = 5;
    for (let i = 0; i < targetsToProcess.length; i += CONCURRENCY) {
      const batch = targetsToProcess.slice(i, i + CONCURRENCY);
      const results = await Promise.allSettled(batch.map(enrichOne));
      for (let j = 0; j < results.length; j++) {
        const result = results[j];
        const target = batch[j];
        if (result.status === 'fulfilled') {
          enrichedTargets.push(result.value);
        } else {
          console.error(`Error enriching target ${target.name}:`, result.reason);
          errors.push({ targetName: target.name, error: result.reason?.message || String(result.reason) });
          enrichedTargets.push({ ...target, companyShortName: target.name, correspondenceName: target.name, sectorFocus: "HS: General" });
        }
      }
      // Small pause between concurrency groups to stay within rate limits
      if (i + CONCURRENCY < targetsToProcess.length) {
        await sleep(200);
      }
    }

    return Response.json({
      success: true,
      processed: enrichedTargets.length,
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