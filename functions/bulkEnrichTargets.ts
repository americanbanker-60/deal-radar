import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { targetIds } = await req.json();

        if (!Array.isArray(targetIds) || targetIds.length === 0) {
            return Response.json({ error: 'targetIds array required' }, { status: 400 });
        }

        const results = {
            total: targetIds.length,
            processed: 0,
            errors: []
        };

        // Process all targets in parallel (20 at a time to avoid overwhelming the system)
        const BATCH_SIZE = 20;
        
        for (let i = 0; i < targetIds.length; i += BATCH_SIZE) {
            const batch = targetIds.slice(i, i + BATCH_SIZE);
            
            await Promise.allSettled(batch.map(async (targetId) => {
                try {
                    const target = await base44.asServiceRole.entities.BDTarget.get(targetId);
                    
                    // Run all enrichments in parallel for this target
                    const enrichments = [];

                    // 1. Correspondence Name
                    if (!target.correspondenceName || target.correspondenceName.trim() === '') {
                        enrichments.push(
                            base44.functions.invoke('generateShortNames', { targetId })
                        );
                    }

                    // 2. Quality Score
                    if (!target.qualityTier) {
                        enrichments.push(
                            base44.functions.invoke('scoreTargetQuality', { targetId })
                        );
                    }

                    // 3. Contact Enrichment
                    if (target.contactFirstName && target.contactLastName && !target.contactPreferredName) {
                        enrichments.push(
                            base44.functions.invoke('enrichContact', { targetId })
                        );
                    }

                    // 4. Personalization
                    if (!target.personalization_snippet || target.personalization_snippet.trim() === '') {
                        enrichments.push(
                            (async () => {
                                const city = target.city || "your area";
                                const sector = target.sectorFocus || target.subsector || "healthcare";
                                const prompt = `Write a single, natural personalized opening line for a business development email to ${target.name}. Location: ${city}, Sector: ${sector}. Write ONLY the opening line, no quotes.`;
                                const result = await base44.integrations.Core.InvokeLLM({ 
                                    prompt, 
                                    add_context_from_internet: false 
                                });
                                await base44.asServiceRole.entities.BDTarget.update(targetId, { 
                                    personalization_snippet: result.trim() 
                                });
                            })()
                        );
                    }

                    // 5. Growth Signals
                    if (!target.growthSignals || target.growthSignals.trim() === '') {
                        enrichments.push(
                            (async () => {
                                const prompt = `Search for recent news about "${target.name}" (${target.website || 'healthcare company'}) from the last 6 months. Look for: new offices, awards, hires, funding. Return JSON: {"signals": ["brief summaries"], "hasGrowthSignals": true/false}`;
                                const result = await base44.integrations.Core.InvokeLLM({
                                    prompt,
                                    add_context_from_internet: true,
                                    response_json_schema: { 
                                        type: "object", 
                                        properties: { 
                                            signals: { type: "array", items: { type: "string" } }, 
                                            hasGrowthSignals: { type: "boolean" } 
                                        } 
                                    }
                                });
                                await base44.asServiceRole.entities.BDTarget.update(targetId, { 
                                    growthSignals: (result.signals || []).join(", "), 
                                    growthSignalsDate: new Date().toISOString() 
                                });
                            })()
                        );
                    }

                    // 6. Strategic Rationale
                    if (!target.strategicRationale || target.strategicRationale.trim() === '') {
                        enrichments.push(
                            (async () => {
                                const prompt = `Research "${target.name}" (${target.website || 'healthcare company'} in ${target.city}, ${target.state}) and write a 2-sentence strategic investment thesis. Sector: ${target.sectorFocus || 'Healthcare Services'}, Revenue: ~$${target.revenue}M, Employees: ${target.employees}. Be specific and data-driven.`;
                                const rationale = await base44.integrations.Core.InvokeLLM({ 
                                    prompt, 
                                    add_context_from_internet: true 
                                });
                                await base44.asServiceRole.entities.BDTarget.update(targetId, { 
                                    strategicRationale: rationale.trim() 
                                });
                            })()
                        );
                    }

                    // Execute all enrichments in parallel for this target
                    await Promise.allSettled(enrichments);
                    results.processed++;
                } catch (error) {
                    results.errors.push({
                        targetId,
                        error: error.message
                    });
                }
            }));
        }

        return Response.json(results);
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});