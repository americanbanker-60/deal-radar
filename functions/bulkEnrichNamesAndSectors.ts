import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { targets } = await req.json();

        if (!Array.isArray(targets) || targets.length === 0) {
            return Response.json({ error: 'targets must be a non-empty array' }, { status: 400 });
        }

        console.log(`Starting bulk enrichment for ${targets.length} targets`);

        const enrichedTargets = [];
        const errors = [];

        // Healthcare sector list for classification
        const healthcareSectors = [
            "HS: Behavioral Health",
            "HS: Dental",
            "HS: Dermatology",
            "HS: Home Health & Hospice",
            "HS: Ophthalmology",
            "HS: Orthopedics",
            "HS: Physical Therapy",
            "HS: Urgent Care",
            "HS: Veterinary",
            "HS: Women's Health",
            "HS: Primary Care",
            "HS: Pediatrics",
            "HS: General"
        ];

        // Process in batches of 10 to avoid overwhelming the LLM
        const BATCH_SIZE = 10;
        
        for (let i = 0; i < targets.length; i += BATCH_SIZE) {
            const batch = targets.slice(i, i + BATCH_SIZE);
            
            for (const target of batch) {
                try {
                    // Generate short name
                    const shortNamePrompt = `Convert this company name to a short, friendly version for casual conversation:
"${target.name}"

Rules:
- Remove legal suffixes (LLC, Inc, Corp, etc)
- Remove "The" prefix
- Keep proper names and key identifiers
- Make it conversational and natural
- Examples:
  * "The Pediatric Dental Group of North Atlanta, LLC" → "Pediatric Dental Group"
  * "ABC Healthcare Services, Inc." → "ABC Healthcare"

Return ONLY the short name, no explanation.`;

                    const shortNameResult = await base44.integrations.Core.InvokeLLM({
                        prompt: shortNamePrompt,
                        add_context_from_internet: false
                    });

                    // Generate correspondence name
                    const corrNamePrompt = `Convert this company name to a natural, conversational name for email correspondence:
"${target.name}"

Rules:
- Remove legal suffixes completely
- Remove "The" prefix
- Make it sound natural in an email
- Keep it concise
- Examples:
  * "The Pediatric Dental Group of North Atlanta, LLC" → "Pediatric Dental Group"
  * "Advanced Vision Care Center, Inc." → "Advanced Vision Care"

Return ONLY the correspondence name, no explanation.`;

                    const corrNameResult = await base44.integrations.Core.InvokeLLM({
                        prompt: corrNamePrompt,
                        add_context_from_internet: false
                    });

                    // Classify sector
                    const sectorPrompt = `Classify this healthcare company into ONE of these sectors:

Company: ${target.name}
Industry: ${target.industry || 'Healthcare'}
Subsector: ${target.subsector || 'N/A'}

Available Sectors:
${healthcareSectors.join('\n')}

Return ONLY the sector classification from the list above that best matches. If unsure, return "HS: General".`;

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
                    console.error(`Error enriching ${target.name}:`, error);
                    errors.push({
                        name: target.name,
                        error: error.message
                    });
                    
                    // Add target with fallback values
                    enrichedTargets.push({
                        ...target,
                        companyShortName: target.name,
                        correspondenceName: target.name,
                        sectorFocus: "HS: General"
                    });
                }
            }

            // Small delay between batches to avoid rate limiting
            if (i + BATCH_SIZE < targets.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        console.log(`Enrichment complete: ${enrichedTargets.length} processed, ${errors.length} errors`);

        return Response.json({
            enrichedTargets,
            errors,
            summary: {
                total: targets.length,
                processed: enrichedTargets.length,
                failed: errors.length
            }
        });

    } catch (error) {
        console.error('Bulk enrichment error:', error);
        return Response.json({ 
            error: error.message || 'Internal server error' 
        }, { status: 500 });
    }
});