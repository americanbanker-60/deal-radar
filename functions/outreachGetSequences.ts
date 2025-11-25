import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

async function getValidToken(base44, user) {
    const connections = await base44.asServiceRole.entities.OutreachConnection.filter({
        user_email: user.email,
        status: 'connected'
    });

    if (!connections || connections.length === 0) {
        throw new Error('No active Outreach connection found');
    }

    const conn = connections[0];

    // Check if token is expired
    const expiresAt = new Date(conn.expires_at);
    const now = new Date();

    if (expiresAt <= now) {
        // Refresh token
        const refreshResult = await base44.functions.invoke('outreachRefreshToken', {
            connectionId: conn.id
        });
        return refreshResult.data.access_token;
    }

    return conn.access_token;
}

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const accessToken = await getValidToken(base44, user);

        // Fetch sequences from Outreach
        const response = await fetch('https://api.outreach.io/api/v2/sequences?page[limit]=100', {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/vnd.api+json',
            },
        });

        if (!response.ok) {
            const error = await response.text();
            return Response.json({ error: 'Failed to fetch sequences: ' + error }, { status: 500 });
        }

        const data = await response.json();

        const sequences = data.data.map(seq => ({
            id: seq.id,
            name: seq.attributes.name,
            description: seq.attributes.description,
            enabled: seq.attributes.enabled,
            tags: seq.attributes.tags,
        }));

        return Response.json({ sequences });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});