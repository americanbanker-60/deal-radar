import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { connectionId } = await req.json();

        const clientId = Deno.env.get("OUTREACH_CLIENT_ID");
        const clientSecret = Deno.env.get("OUTREACH_CLIENT_SECRET");
        
        if (!clientId || !clientSecret) {
            return Response.json({ error: 'Outreach credentials not configured' }, { status: 500 });
        }

        // Get connection
        const connection = await base44.asServiceRole.entities.OutreachConnection.filter({
            id: connectionId,
            user_email: user.email
        });

        if (!connection || connection.length === 0) {
            return Response.json({ error: 'Connection not found' }, { status: 404 });
        }

        const conn = connection[0];

        // Refresh token
        const tokenResponse = await fetch('https://api.outreach.io/oauth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: clientId,
                client_secret: clientSecret,
                refresh_token: conn.refresh_token,
                grant_type: 'refresh_token',
            }),
        });

        if (!tokenResponse.ok) {
            const error = await tokenResponse.text();
            // Mark as expired
            await base44.asServiceRole.entities.OutreachConnection.update(conn.id, {
                status: 'expired',
            });
            return Response.json({ error: 'Failed to refresh token: ' + error }, { status: 500 });
        }

        const tokens = await tokenResponse.json();
        const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

        // Update connection
        await base44.asServiceRole.entities.OutreachConnection.update(conn.id, {
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token || conn.refresh_token,
            expires_at: expiresAt,
            status: 'connected',
        });

        return Response.json({ 
            success: true,
            access_token: tokens.access_token 
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});