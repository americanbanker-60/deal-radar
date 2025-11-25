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

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { prospects, sequenceId, customFields } = await req.json();

        if (!prospects || prospects.length === 0) {
            return Response.json({ error: 'No prospects provided' }, { status: 400 });
        }

        const accessToken = await getValidToken(base44, user);

        let created = 0;
        let updated = 0;
        const errors = [];

        // Process prospects one by one to avoid rate limits
        for (const prospect of prospects) {
            try {
                // Check if prospect exists by email
                const searchResponse = await fetch(
                    `https://api.outreach.io/api/v2/prospects?filter[emails]=${encodeURIComponent(prospect.email)}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                            'Content-Type': 'application/vnd.api+json',
                        },
                    }
                );

                if (!searchResponse.ok) {
                    throw new Error(`Search failed: ${await searchResponse.text()}`);
                }

                const searchData = await searchResponse.json();
                
                const prospectData = {
                    data: {
                        type: 'prospect',
                        attributes: {
                            emails: [prospect.email],
                            firstName: prospect.firstName,
                            lastName: prospect.lastName,
                            title: prospect.title,
                            company: prospect.company,
                            tags: customFields?.customTag ? [customFields.customTag] : [],
                            customSource: customFields?.customSource || 'Ops Console',
                        },
                    },
                };

                let prospectId;

                if (searchData.data && searchData.data.length > 0) {
                    // Update existing prospect
                    prospectId = searchData.data[0].id;
                    prospectData.data.id = prospectId;

                    const updateResponse = await fetch(
                        `https://api.outreach.io/api/v2/prospects/${prospectId}`,
                        {
                            method: 'PATCH',
                            headers: {
                                'Authorization': `Bearer ${accessToken}`,
                                'Content-Type': 'application/vnd.api+json',
                            },
                            body: JSON.stringify(prospectData),
                        }
                    );

                    if (!updateResponse.ok) {
                        throw new Error(`Update failed: ${await updateResponse.text()}`);
                    }

                    updated++;
                } else {
                    // Create new prospect
                    const createResponse = await fetch(
                        'https://api.outreach.io/api/v2/prospects',
                        {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${accessToken}`,
                                'Content-Type': 'application/vnd.api+json',
                            },
                            body: JSON.stringify(prospectData),
                        }
                    );

                    if (!createResponse.ok) {
                        throw new Error(`Create failed: ${await createResponse.text()}`);
                    }

                    const createData = await createResponse.json();
                    prospectId = createData.data.id;
                    created++;
                }

                // Add to sequence if specified
                if (sequenceId && prospectId) {
                    await sleep(200); // Rate limit protection
                    
                    const sequenceStateData = {
                        data: {
                            type: 'sequenceState',
                            relationships: {
                                prospect: {
                                    data: { type: 'prospect', id: prospectId }
                                },
                                sequence: {
                                    data: { type: 'sequence', id: sequenceId }
                                },
                            },
                        },
                    };

                    const sequenceResponse = await fetch(
                        'https://api.outreach.io/api/v2/sequenceStates',
                        {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${accessToken}`,
                                'Content-Type': 'application/vnd.api+json',
                            },
                            body: JSON.stringify(sequenceStateData),
                        }
                    );

                    if (!sequenceResponse.ok) {
                        // Don't fail the whole operation if sequence add fails
                        console.error(`Failed to add to sequence: ${await sequenceResponse.text()}`);
                    }
                }

                // Rate limit protection
                await sleep(200);

            } catch (error) {
                errors.push({
                    email: prospect.email,
                    error: error.message,
                });
            }
        }

        return Response.json({
            success: errors.length === 0,
            created,
            updated,
            errors: errors.length > 0 ? errors : undefined,
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});