/**
 * Fetch active sequences from Outreach
 * Returns: { sequences: Array<{id, name, description}> }
 */
export default async function outreachGetSequences({}, { entities, user, functions }) {
  // Get user's connection
  const connections = await entities.OutreachConnection.list();
  const connection = connections.find(c => c.user_email === user.email && c.status === "connected");

  if (!connection) {
    throw new Error("Not connected to Outreach. Please connect your account first.");
  }

  // Check if token needs refresh
  const expiresAt = new Date(connection.expires_at);
  let accessToken = connection.access_token;

  if (expiresAt < new Date()) {
    const refreshed = await functions.outreachRefreshToken({ connectionId: connection.id });
    accessToken = refreshed.accessToken;
  }

  // Fetch sequences
  const response = await fetch("https://api.outreach.io/api/v2/sequences?filter[enabled]=true&page[size]=100", {
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/vnd.api+json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch sequences: ${response.statusText}`);
  }

  const data = await response.json();

  const sequences = data.data.map(seq => ({
    id: seq.id,
    name: seq.attributes.name,
    description: seq.attributes.description || "",
    tags: seq.attributes.tags || [],
  }));

  return { sequences };
}