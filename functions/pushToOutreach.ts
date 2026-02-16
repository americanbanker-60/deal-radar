import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { targetIds } = await req.json();

    if (!targetIds || !Array.isArray(targetIds) || targetIds.length === 0) {
      return Response.json({ error: 'No targets provided' }, { status: 400 });
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

    // Fetch targets
    const targets = await base44.entities.BDTarget.filter({
      id: { $in: targetIds }
    });

    const results = [];
    const errors = [];

    // Sector to Sequence mapping (you can customize these)
    const sectorSequenceMap = {
      'HS: Urgent Care': 'urgent-care-sequence',
      'HS: Dentistry': 'dentistry-sequence',
      'HS: Behavioral Health': 'behavioral-health-sequence',
      'HS: Primary Care': 'primary-care-sequence',
      'HS: Multi-Specialty': 'multi-specialty-sequence',
      'HS: General': 'general-healthcare-sequence'
    };

    for (const target of targets) {
      try {
        // Create prospect in Outreach
        const prospectData = {
          data: {
            type: 'prospect',
            attributes: {
              firstName: target.contactFirstName || '',
              lastName: target.contactLastName || '',
              emails: target.contactEmail ? [target.contactEmail] : [],
              title: target.contactTitle || '',
              company: target.name,
              phoneNumbers: target.contactPhone ? [{ number: target.contactPhone }] : [],
              custom1: target.sectorFocus || '', // Custom field for sector
              custom2: String(target.score || ''), // Custom field for score
              tags: [target.campaign, target.sectorFocus].filter(Boolean)
            }
          }
        };

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
          errors.push({ target: target.name, error: errorText });
          continue;
        }

        const prospectResult = await prospectResponse.json();
        const prospectId = prospectResult.data.id;

        // Add to sequence based on sector (if sequence exists)
        const sequenceName = sectorSequenceMap[target.sectorFocus] || sectorSequenceMap['HS: General'];
        
        // Note: This requires knowing the sequence IDs in Outreach
        // You'll need to fetch sequences first or configure them manually
        // For now, we'll just log it
        console.log(`Would add prospect ${prospectId} to sequence: ${sequenceName}`);

        results.push({
          target: target.name,
          prospectId,
          sequence: sequenceName,
          status: 'success'
        });

      } catch (error) {
        errors.push({ 
          target: target.name, 
          error: error.message 
        });
      }
    }

    return Response.json({
      success: true,
      pushed: results.length,
      results,
      errors,
      message: `Successfully pushed ${results.length} prospects to Outreach${errors.length > 0 ? ` (${errors.length} failed)` : ''}`
    });

  } catch (error) {
    console.error('Push to Outreach error:', error);
    return Response.json({ 
      error: error.message || 'Failed to push to Outreach' 
    }, { status: 500 });
  }
});