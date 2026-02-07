import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { targetId } = await req.json();
        
        if (!targetId) {
            return Response.json({ error: 'Target ID required' }, { status: 400 });
        }

        const target = await base44.entities.BDTarget.get(targetId);
        
        if (!target) {
            return Response.json({ error: 'Target not found' }, { status: 404 });
        }

        // Generate short name using AI
        const prompt = `Generate a clean, concise company name for outreach emails.

Company name: "${target.name}"

Rules:
- Remove legal suffixes (LLC, Inc, Corp, Ltd, etc.)
- Remove "The" prefix
- Keep brand identity intact
- Max 3-4 words
- Natural and professional

Return ONLY the short name, nothing else.`;

        const shortName = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt,
            add_context_from_internet: false
        });

        const cleanShortName = shortName.trim().replace(/^["']|["']$/g, '');

        await base44.entities.BDTarget.update(targetId, { 
            companyShortName: cleanShortName 
        });

        return Response.json({ 
            shortName: cleanShortName,
            targetId 
        });
    } catch (error) {
        console.error('generateShortNames error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});