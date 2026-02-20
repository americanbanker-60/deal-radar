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
            skipped: 0,
            errors: []
        };

        // Fetch all targets and pre-filter for missing data
        const allTargets = await Promise.all(
            targetIds.map(id => base44.asServiceRole.entities.BDTarget.get(id))
        );

        const pendingTargets = allTargets.filter(t => {
            const needsState = !t.state || t.state.trim() === '';
            const needsRevenue = !t.revenue;
            const needsEmployees = !t.employees;
            return needsState || needsRevenue || needsEmployees;
        });

        results.skipped = allTargets.length - pendingTargets.length;

        if (pendingTargets.length === 0) {
            return Response.json(results);
        }

        // Process 10 targets per LLM call for maximum efficiency
        const BATCH_SIZE = 10;
        
        for (let i = 0; i < pendingTargets.length; i += BATCH_SIZE) {
            const batch = pendingTargets.slice(i, i + BATCH_SIZE);
            
            try {
                // Build batch data with only essential fields
                const batchData = batch.map(t => ({
                    id: t.id,
                    name: t.name,
                    website: t.website || '',
                    needsState: !t.state || t.state.trim() === '',
                    needsRevenue: !t.revenue,
                    needsEmployees: !t.employees
                }));

                // Optimized prompt with static instructions first for caching
                const systemPrompt = `You are a data enrichment assistant. For each company, research and return ONLY missing fields. Use 2-letter state codes. Return minified JSON array with format: [{"id":"x","state":"TX","revenue":15.5,"employees":120}]. Omit fields if not found.`;

                const userPrompt = batchData.map(t => 
                    `${t.id}: "${t.name}" (${t.website}) - Need: ${[
                        t.needsState && 'state',
                        t.needsRevenue && 'revenue',
                        t.needsEmployees && 'employees'
                    ].filter(Boolean).join(',')}`
                ).join('\n');

                const result = await base44.integrations.Core.InvokeLLM({
                    prompt: `${systemPrompt}\n\n${userPrompt}`,
                    add_context_from_internet: true,
                    response_json_schema: {
                        type: "object",
                        properties: {
                            results: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        id: { type: "string" },
                                        state: { type: "string" },
                                        revenue: { type: "number" },
                                        employees: { type: "number" }
                                    }
                                }
                            }
                        }
                    }
                });

                // Update all records from batch
                const updatePromises = (result.results || []).map(async (data) => {
                    const updates = {};
                    const targetData = batchData.find(t => t.id === data.id);
                    
                    if (targetData?.needsState && data.state) updates.state = data.state;
                    if (targetData?.needsRevenue && data.revenue) updates.revenue = data.revenue;
                    if (targetData?.needsEmployees && data.employees) updates.employees = data.employees;

                    if (Object.keys(updates).length > 0) {
                        await base44.asServiceRole.entities.BDTarget.update(data.id, updates);
                        results.processed++;
                    }
                });

                await Promise.all(updatePromises);

            } catch (error) {
                batch.forEach(t => {
                    results.errors.push({
                        targetId: t.id,
                        error: error.message
                    });
                });
            }
        }

        return Response.json(results);
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});