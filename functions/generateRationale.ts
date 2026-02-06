import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { targetId, weights } = await req.json();
        
        if (!targetId) {
            return Response.json({ error: 'Target ID required' }, { status: 400 });
        }

        // Get the target record
        const target = await base44.entities.BDTarget.get(targetId);
        
        if (!target) {
            return Response.json({ error: 'Target not found' }, { status: 404 });
        }

        // Build scoring context from weights
        const scoringContext = weights ? `Our acquisition criteria emphasizes: ${
            Object.entries(weights)
                .sort((a, b) => b[1] - a[1])
                .map(([key, val]) => `${key} (${val}%)`)
                .join(', ')
        }` : 'standard healthcare services acquisition criteria';

        const prompt = `Research ${target.name} (website: ${target.website || 'unknown'}, location: ${target.city}, ${target.state}) and write a 2-sentence strategic rationale for why this company is a priority acquisition target.

Company Details:
- Employees: ${target.employees || 'unknown'}
- Revenue: ${target.revenue ? `$${target.revenue}M` : 'unknown'}
- Clinics/Locations: ${target.clinicCount || 'unknown'}
- Sector: ${target.sectorFocus || 'Healthcare Services'}
- Score: ${target.score}/100

${scoringContext}

Focus on: recent growth indicators, market positioning, operational scale, or strategic fit. Be specific and data-driven. Keep it exactly 2 sentences.`;

        const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt,
            add_context_from_internet: true
        });

        // Update the target with the rationale
        await base44.entities.BDTarget.update(targetId, { 
            notes: result 
        });

        return Response.json({ 
            rationale: result,
            targetId 
        });
    } catch (error) {
        console.error('generateRationale error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});