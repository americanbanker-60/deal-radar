/**
 * Initialize Outreach OAuth flow
 * Returns: { authUrl: string } - URL to redirect user to
 */
export default async function outreachInitAuth({ redirectUri }, { secrets }) {
  const clientId = secrets.OUTREACH_CLIENT_ID;
  
  if (!clientId) {
    throw new Error("Outreach Client ID not configured. Please add it in Settings.");
  }

  // Outreach OAuth authorization endpoint
  const authUrl = new URL("https://api.outreach.io/oauth/authorize");
  authUrl.searchParams.append("client_id", clientId);
  authUrl.searchParams.append("redirect_uri", redirectUri || secrets.OUTREACH_REDIRECT_URI);
  authUrl.searchParams.append("response_type", "code");
  authUrl.searchParams.append("scope", "prospects.all sequences.read");

  return { authUrl: authUrl.toString() };
}