/**
 * Refresh expired Outreach access token
 * Returns: { accessToken: string, expiresAt: string }
 */
export default async function outreachRefreshToken({ connectionId }, { secrets, entities }) {
  const connection = await entities.OutreachConnection.get(connectionId);
  
  if (!connection) {
    throw new Error("Connection not found");
  }

  const clientId = secrets.OUTREACH_CLIENT_ID;
  const clientSecret = secrets.OUTREACH_CLIENT_SECRET;

  const tokenResponse = await fetch("https://api.outreach.io/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: connection.refresh_token,
    }),
  });

  if (!tokenResponse.ok) {
    // Mark connection as expired
    await entities.OutreachConnection.update(connectionId, { status: "expired" });
    throw new Error("Failed to refresh token. Please reconnect your account.");
  }

  const tokens = await tokenResponse.json();
  const expiresAt = new Date(Date.now() + (tokens.expires_in * 1000)).toISOString();

  // Update connection with new tokens
  await entities.OutreachConnection.update(connectionId, {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token || connection.refresh_token,
    expires_at: expiresAt,
    status: "connected",
  });

  return { accessToken: tokens.access_token, expiresAt };
}