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

        // Generate friendly name using AI
        const prompt = `Given the company name: "${target.name}"

Generate a friendly name that sounds natural in a sentence (e.g., "I'm reaching out regarding Local Urgent Care Center...").

Rules:
- Remove "The", "A", "An" prefixes
- Remove legal suffixes (LLC, Inc, Corp, Ltd, P.A., etc.)
- Remove "of [Location]" if it makes the name overly long
- Keep it concise but preserve brand identity
- Should be 2-5 words maximum
- Natural and conversational

Examples:
- "The local Urgent Care Center of Florida, LLC" → "Local Urgent Care Center"
- "Advanced Dermatology Associates of the Midwest, Inc." → "Advanced Dermatology"
- "Sunshine Pediatrics Group, P.A." → "Sunshine Pediatrics"

Return JSON:
{
  "friendlyName": "..."
}`;

        const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt,
            add_context_from_internet: false,
            response_json_schema: {
                type: "object",
                properties: {
                    friendlyName: { type: "string" }
                }
            }
        });

        const correspondenceName = result.friendlyName?.trim() || target.name;

        await base44.entities.BDTarget.update(targetId, { 
            correspondenceName: correspondenceName 
        });

        return Response.json({ 
            correspondenceName: correspondenceName,
            targetId 
        });
    } catch (error) {
        console.error('generateShortNames error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});