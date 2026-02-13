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

        // Process 5 targets at a time
        const BATCH_SIZE = 5;
        
        for (let i = 0; i < targetIds.length; i += BATCH_SIZE) {
            const batch = targetIds.slice(i, i + BATCH_SIZE);
            
            await Promise.allSettled(batch.map(async (targetId) => {
                try {
                    const target = await base44.asServiceRole.entities.BDTarget.get(targetId);
                    
                    const needsState = !target.state || target.state.trim() === '';
                    const needsRevenue = !target.revenue;
                    const needsEmployees = !target.employees;

                    if (!needsState && !needsRevenue && !needsEmployees) {
                        results.processed++;
                        return;
                    }

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

                    const result = await base44.integrations.Core.InvokeLLM({
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
                    if (needsState && result.state) updates.state = result.state;
                    if (needsRevenue && result.revenue) updates.revenue = result.revenue;
                    if (needsEmployees && result.employees) updates.employees = result.employees;

                    if (Object.keys(updates).length > 0) {
                        await base44.asServiceRole.entities.BDTarget.update(targetId, updates);
                    }

                    results.processed++;
                } catch (error) {
                    results.errors.push({
                        targetId,
                        error: error.message
                    });
                }
            }));

            // Delay between batches
            if (i + BATCH_SIZE < targetIds.length) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        return Response.json(results);
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});