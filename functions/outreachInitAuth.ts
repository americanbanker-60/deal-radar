import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { redirectUri } = await req.json();

        const clientId = Deno.env.get("OUTREACH_CLIENT_ID");
        
        if (!clientId) {
            return Response.json({ error: 'Outreach credentials not configured' }, { status: 500 });
        }

        const authUrl = `https://accounts.outreach.io/oauth/authorize?` +
            `client_id=${clientId}&` +
            `redirect_uri=${encodeURIComponent(redirectUri)}&` +
            `response_type=code&` +
            `scope=prospects.all sequences.read`;

        return Response.json({ authUrl });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});