/**
 * Complete Outreach OAuth flow with authorization code
 * Returns: { success: boolean, connectionId: string }
 */
export default async function outreachCompleteAuth({ code, redirectUri }, { secrets, entities, user }) {
  const clientId = secrets.OUTREACH_CLIENT_ID;
  const clientSecret = secrets.OUTREACH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Outreach credentials not configured");
  }

  // Exchange code for tokens
  const tokenResponse = await fetch("https://api.outreach.io/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri || secrets.OUTREACH_REDIRECT_URI,
      grant_type: "authorization_code",
      code: code,
    }),
  });

  if (!tokenResponse.ok) {
    const error = await tokenResponse.text();
    throw new Error(`Failed to get access token: ${error}`);
  }

  const tokens = await tokenResponse.json();

  // Get user info from Outreach
  const userResponse = await fetch("https://api.outreach.io/api/v2/users?filter[email]=" + user.email, {
    headers: {
      "Authorization": `Bearer ${tokens.access_token}`,
      "Content-Type": "application/vnd.api+json",
    },
  });

  let outreachUserId = null;
  if (userResponse.ok) {
    const userData = await userResponse.json();
    if (userData.data && userData.data.length > 0) {
      outreachUserId = userData.data[0].id;
    }
  }

  // Calculate expiration time
  const expiresAt = new Date(Date.now() + (tokens.expires_in * 1000)).toISOString();

  // Check if connection already exists
  const existing = await entities.OutreachConnection.list();
  const userConnection = existing.find(c => c.user_email === user.email);

  let connectionId;
  if (userConnection) {
    // Update existing
    await entities.OutreachConnection.update(userConnection.id, {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: expiresAt,
      outreach_user_id: outreachUserId,
      status: "connected",
    });
    connectionId = userConnection.id;
  } else {
    // Create new
    const connection = await entities.OutreachConnection.create({
      user_email: user.email,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: expiresAt,
      outreach_user_id: outreachUserId,
      status: "connected",
    });
    connectionId = connection.id;
  }

  return { success: true, connectionId };
}