import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { code, redirectUri } = await req.json();

        const clientId = Deno.env.get("OUTREACH_CLIENT_ID");
        const clientSecret = Deno.env.get("OUTREACH_CLIENT_SECRET");
        
        if (!clientId || !clientSecret) {
            return Response.json({ error: 'Outreach credentials not configured' }, { status: 500 });
        }

        // Exchange code for tokens
        const tokenResponse = await fetch('https://api.outreach.io/oauth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: clientId,
                client_secret: clientSecret,
                code: code,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code',
            }),
        });

        if (!tokenResponse.ok) {
            const error = await tokenResponse.text();
            return Response.json({ error: 'Failed to exchange code for tokens: ' + error }, { status: 500 });
        }

        const tokens = await tokenResponse.json();

        // Get Outreach user info
        const userResponse = await fetch('https://api.outreach.io/api/v2/users?filter[email]=' + user.email, {
            headers: {
                'Authorization': `Bearer ${tokens.access_token}`,
            },
        });

        let outreachUserId = null;
        if (userResponse.ok) {
            const userData = await userResponse.json();
            if (userData.data && userData.data.length > 0) {
                outreachUserId = userData.data[0].id;
            }
        }

        // Store connection using service role
        const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

        // Check if connection already exists
        const existing = await base44.asServiceRole.entities.OutreachConnection.filter({
            user_email: user.email
        });

        if (existing && existing.length > 0) {
            // Update existing
            await base44.asServiceRole.entities.OutreachConnection.update(existing[0].id, {
                access_token: tokens.access_token,
                refresh_token: tokens.refresh_token,
                expires_at: expiresAt,
                outreach_user_id: outreachUserId,
                status: 'connected',
            });
        } else {
            // Create new
            await base44.asServiceRole.entities.OutreachConnection.create({
                user_email: user.email,
                access_token: tokens.access_token,
                refresh_token: tokens.refresh_token,
                expires_at: expiresAt,
                outreach_user_id: outreachUserId,
                status: 'connected',
            });
        }

        return Response.json({ success: true });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});