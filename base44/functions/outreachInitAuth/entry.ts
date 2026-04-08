import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clientId = Deno.env.get('OUTREACH_CLIENT_ID');
    const redirectUri = Deno.env.get('OUTREACH_REDIRECT_URI') || 'https://deal-radar.base44.app/OAuthCallback';

    if (!clientId) {
      return Response.json({
        error: 'OUTREACH_CLIENT_ID is not configured. Please set it in your app secrets.'
      }, { status: 500 });
    }

    const scopes = 'prospects.all sequences.read';

    const authUrl = `https://api.outreach.io/oauth/authorize?` +
      `client_id=${encodeURIComponent(clientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent(scopes)}`;

    return Response.json({
      success: true,
      authUrl
    });

  } catch (error) {
    console.error('outreachInitAuth error:', error);
    return Response.json({
      error: error.message || 'Failed to initialize OAuth'
    }, { status: 500 });
  }
});
