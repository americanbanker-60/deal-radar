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
        
        if (!target.website) {
            return Response.json({ error: 'No website found for this target' }, { status: 400 });
        }

        // Extract company name from website using AI
        const prompt = `Visit this website: ${target.website}

Extract the official company name. Return ONLY the company name, nothing else.

Examples:
- "ABC Healthcare Services, LLC" 
- "Community Medical Center"
- "Bright Futures Therapy"

Just the name, no explanation.`;

        const companyName = await base44.integrations.Core.InvokeLLM({
            prompt,
            add_context_from_internet: true
        });

        const cleanedName = companyName.trim().replace(/^["']|["']$/g, '');

        // Update the target
        await base44.entities.BDTarget.update(targetId, {
            name: cleanedName
        });

        return Response.json({ 
            success: true,
            name: cleanedName
        });
    } catch (error) {
        console.error('Extract company name error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});