import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { code } = await req.json();

    if (!code) {
      return Response.json({ error: 'Authorization code is required' }, { status: 400 });
    }

    const clientId = Deno.env.get('OUTREACH_CLIENT_ID');
    const clientSecret = Deno.env.get('OUTREACH_CLIENT_SECRET');
    const redirectUri = Deno.env.get('OUTREACH_REDIRECT_URI') || 'https://deal-radar.base44.app/OAuthCallback';

    if (!clientId || !clientSecret) {
      return Response.json({
        error: 'OUTREACH_CLIENT_ID and OUTREACH_CLIENT_SECRET must be configured in app secrets.'
      }, { status: 500 });
    }

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://api.outreach.io/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', errorText);
      return Response.json({
        error: 'Failed to exchange authorization code: ' + errorText
      }, { status: 400 });
    }

    const tokens = await tokenResponse.json();

    // Store the connection in the database
    // First check if user already has a connection
    const existingConnections = await base44.asServiceRole.entities.OutreachConnection.filter({
      user_email: user.email,
    });

    const connectionData = {
      user_email: user.email,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      status: 'connected',
    };

    if (existingConnections && existingConnections.length > 0) {
      // Update existing connection
      await base44.asServiceRole.entities.OutreachConnection.update(
        existingConnections[0].id,
        connectionData
      );
    } else {
      // Create new connection
      await base44.asServiceRole.entities.OutreachConnection.create(connectionData);
    }

    return Response.json({
      success: true,
      message: 'Successfully connected to Outreach!'
    });

  } catch (error) {
    console.error('outreachCompleteAuth error:', error);
    return Response.json({
      error: error.message || 'Failed to complete OAuth',
      success: false
    }, { status: 500 });
  }
});
