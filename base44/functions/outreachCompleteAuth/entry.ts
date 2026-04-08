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
        error: 'Missing credentials. OUTREACH_CLIENT_ID set: ' + !!clientId + ', OUTREACH_CLIENT_SECRET set: ' + !!clientSecret,
      }, { status: 500 });
    }

    // Step 1: Exchange authorization code for access token
    let tokens;
    try {
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
        return Response.json({
          error: 'Token exchange failed (' + tokenResponse.status + '): ' + errorText,
          step: 'token_exchange',
        }, { status: 400 });
      }

      tokens = await tokenResponse.json();
    } catch (fetchErr) {
      return Response.json({
        error: 'Network error during token exchange: ' + fetchErr.message,
        step: 'token_exchange',
      }, { status: 500 });
    }

    // Step 2: Store the connection
    try {
      const connectionData = {
        user_email: user.email,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: new Date(Date.now() + (tokens.expires_in || 7200) * 1000).toISOString(),
        status: 'connected',
      };

      // Try to find existing connection using user's own auth context
      let existingConnections = [];
      try {
        existingConnections = await base44.entities.OutreachConnection.filter({
          user_email: user.email,
        });
      } catch {
        // filter might not be supported — try list instead
        try {
          const all = await base44.entities.OutreachConnection.list();
          existingConnections = all.filter(c => c.user_email === user.email);
        } catch (listErr) {
          console.log('OutreachConnection list failed:', listErr.message);
        }
      }

      if (existingConnections && existingConnections.length > 0) {
        await base44.entities.OutreachConnection.update(
          existingConnections[0].id,
          connectionData
        );
      } else {
        await base44.entities.OutreachConnection.create(connectionData);
      }
    } catch (dbErr) {
      return Response.json({
        error: 'Token exchange succeeded but failed to save connection: ' + dbErr.message,
        step: 'save_connection',
        hint: 'Check OutreachConnection entity permissions in Base44',
      }, { status: 500 });
    }

    return Response.json({
      success: true,
      message: 'Successfully connected to Outreach!',
    });

  } catch (error) {
    console.error('outreachCompleteAuth error:', error);
    return Response.json({
      error: error.message || 'Failed to complete OAuth',
      step: 'unknown',
      success: false,
    }, { status: 500 });
  }
});
