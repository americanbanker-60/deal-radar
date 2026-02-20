import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { prospects, sequenceId, customFields } = await req.json();

    if (!prospects || !Array.isArray(prospects) || prospects.length === 0) {
      return Response.json({ error: 'No prospects provided' }, { status: 400 });
    }

    // Get Outreach connection for this user
    const connections = await base44.asServiceRole.entities.OutreachConnection.filter({
      user_email: user.email,
      status: 'connected'
    });

    if (!connections || connections.length === 0) {
      return Response.json({ 
        error: 'No active Outreach connection found. Please connect your Outreach account first.' 
      }, { status: 400 });
    }

    const connection = connections[0];
    let accessToken = connection.access_token;

    // Check if token is expired and refresh if needed
    if (new Date(connection.expires_at) < new Date()) {
      const refreshResponse = await fetch('https://api.outreach.io/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: connection.refresh_token,
          client_id: Deno.env.get('OUTREACH_CLIENT_ID'),
          client_secret: Deno.env.get('OUTREACH_CLIENT_SECRET')
        })
      });

      if (!refreshResponse.ok) {
        return Response.json({ 
          error: 'Failed to refresh Outreach token. Please reconnect your account.' 
        }, { status: 400 });
      }

      const tokens = await refreshResponse.json();
      accessToken = tokens.access_token;

      // Update stored tokens
      await base44.asServiceRole.entities.OutreachConnection.update(connection.id, {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString()
      });
    }

    const created = [];
    const updated = [];
    const errors = [];

    for (const prospect of prospects) {
      try {
        // Create prospect in Outreach
        const prospectData = {
          data: {
            type: 'prospect',
            attributes: {
              firstName: prospect.firstName || '',
              lastName: prospect.lastName || '',
              emails: prospect.email ? [prospect.email] : [],
              title: prospect.title || '',
              company: prospect.company || '',
              phoneNumbers: prospect.phone ? [{ number: prospect.phone }] : [],
              tags: customFields?.customTag ? [customFields.customTag] : []
            }
          }
        };

        // Add custom fields if provided
        if (customFields?.customSource) {
          prospectData.data.attributes.custom1 = customFields.customSource;
        }

        const prospectResponse = await fetch('https://api.outreach.io/api/v2/prospects', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/vnd.api+json'
          },
          body: JSON.stringify(prospectData)
        });

        if (!prospectResponse.ok) {
          const errorText = await prospectResponse.text();
          
          // Check if it's a duplicate error (prospect already exists)
          if (errorText.includes('already exists') || errorText.includes('duplicate')) {
            updated.push({ email: prospect.email, status: 'exists' });
          } else {
            errors.push({ email: prospect.email, error: errorText });
          }
          continue;
        }

        const prospectResult = await prospectResponse.json();
        created.push({ 
          email: prospect.email,
          prospectId: prospectResult.data.id,
          status: 'created'
        });

      } catch (error) {
        errors.push({ 
          email: prospect.email,
          error: error.message 
        });
      }
    }

    return Response.json({
      success: true,
      created: created.length,
      updated: updated.length,
      errors,
      message: `Successfully synced ${created.length} prospects${updated.length > 0 ? ` (${updated.length} already existed)` : ''}${errors.length > 0 ? ` (${errors.length} failed)` : ''}`
    });

  } catch (error) {
    console.error('Outreach sync error:', error);
    return Response.json({ 
      error: error.message || 'Failed to sync prospects to Outreach' 
    }, { status: 500 });
  }
});