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

        // Process 5 targets at a time with delays between batches
        const BATCH_SIZE = 5;
        
        for (let i = 0; i < targetIds.length; i += BATCH_SIZE) {
            const batch = targetIds.slice(i, i + BATCH_SIZE);
            
            const batchResults = await Promise.allSettled(batch.map(async (targetId) => {
                try {
                    const target = await base44.asServiceRole.entities.BDTarget.get(targetId);
                    
                    // Process enrichments sequentially to avoid overwhelming the system
                    // 1. Correspondence Name
                    if (!target.correspondenceName || target.correspondenceName.trim() === '') {
                        try {
                            await base44.functions.invoke('generateShortNames', { targetId });
                        } catch (err) {
                            console.error(`Correspondence name error: ${err.message}`);
                        }
                    }

                    // 2. Quality Score
                    if (!target.qualityTier) {
                        try {
                            await base44.functions.invoke('scoreTargetQuality', { targetId });
                        } catch (err) {
                            console.error(`Quality score error: ${err.message}`);
                        }
                    }

                    // 3. Contact Enrichment
                    if (target.contactFirstName && target.contactLastName && !target.contactPreferredName) {
                        try {
                            await base44.functions.invoke('enrichContact', { targetId });
                        } catch (err) {
                            console.error(`Contact enrichment error: ${err.message}`);
                        }
                    }

                    // 4. Personalization
                    if (!target.personalization_snippet || target.personalization_snippet.trim() === '') {
                        try {
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
                        } catch (err) {
                            console.error(`Personalization error: ${err.message}`);
                        }
                    }

                    // 5. Growth Signals
                    if (!target.growthSignals || target.growthSignals.trim() === '') {
                        try {
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
                        } catch (err) {
                            console.error(`Growth signals error: ${err.message}`);
                        }
                    }

                    // 6. Company Data (State, Revenue, Employees)
                    const needsState = !target.state || target.state.trim() === '';
                    const needsRevenue = !target.revenue;
                    const needsEmployees = !target.employees;

                    if (needsState || needsRevenue || needsEmployees) {
                        try {
                            const prompt = `Search for information about "${target.name}" (${target.website || 'healthcare company'}).

Find and return ONLY the following information:
${needsState ? '- State: US state where headquarters is located (2-letter code)' : ''}
${needsRevenue ? '- Annual Revenue: in millions (number only)' : ''}
${needsEmployees ? '- Employee Count: total number of employees (number only)' : ''}

Return JSON with ONLY the fields that need updating:
{
  ${needsState ? '"state": "TX",' : ''}
  ${needsRevenue ? '"revenue": 15.5,' : ''}
  ${needsEmployees ? '"employees": 120' : ''}
}

If you cannot find a field, omit it from the response.`;

                            const companyData = await base44.integrations.Core.InvokeLLM({
                                prompt,
                                add_context_from_internet: true,
                                response_json_schema: {
                                    type: "object",
                                    properties: {
                                        state: { type: "string" },
                                        revenue: { type: "number" },
                                        employees: { type: "number" }
                                    }
                                }
                            });

                            const updates = {};
                            if (needsState && companyData.state) updates.state = companyData.state;
                            if (needsRevenue && companyData.revenue) updates.revenue = companyData.revenue;
                            if (needsEmployees && companyData.employees) updates.employees = companyData.employees;

                            if (Object.keys(updates).length > 0) {
                                await base44.asServiceRole.entities.BDTarget.update(targetId, updates);
                            }
                        } catch (err) {
                            console.error(`Company data error: ${err.message}`);
                        }
                    }

                    // 7. Strategic Rationale
                    if (!target.strategicRationale || target.strategicRationale.trim() === '') {
                        try {
                            const prompt = `Research "${target.name}" (${target.website || 'healthcare company'} in ${target.city}, ${target.state}) and write a 2-sentence strategic investment thesis. Sector: ${target.sectorFocus || 'Healthcare Services'}, Revenue: ~$${target.revenue}M, Employees: ${target.employees}. Be specific and data-driven.`;
                            const rationale = await base44.integrations.Core.InvokeLLM({ 
                                prompt, 
                                add_context_from_internet: true 
                            });
                            await base44.asServiceRole.entities.BDTarget.update(targetId, { 
                                strategicRationale: rationale.trim() 
                            });
                        } catch (err) {
                            console.error(`Rationale error: ${err.message}`);
                        }
                    }

                    results.processed++;
                    return { success: true };
                } catch (error) {
                    results.errors.push({
                        targetId,
                        error: error.message
                    });
                    return { success: false, error: error.message };
                }
            }));

            // Small delay between batches to avoid rate limiting
            if (i + BATCH_SIZE < targetIds.length) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        return Response.json(results);
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});