/**
 * Sync prospects to Outreach and optionally add to sequence
 * Returns: { success: boolean, created: number, updated: number, errors: Array }
 */
export default async function outreachSyncProspects({ prospects, sequenceId, customFields }, { entities, user, functions }) {
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

  const results = {
    created: 0,
    updated: 0,
    errors: [],
  };

  // Process each prospect
  for (const prospect of prospects) {
    try {
      // First, check if prospect exists by email
      const searchResponse = await fetch(
        `https://api.outreach.io/api/v2/prospects?filter[emails]=${encodeURIComponent(prospect.email)}`,
        {
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/vnd.api+json",
          },
        }
      );

      let prospectId = null;
      let isUpdate = false;

      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        if (searchData.data && searchData.data.length > 0) {
          prospectId = searchData.data[0].id;
          isUpdate = true;
        }
      }

      // Prepare prospect data
      const prospectData = {
        data: {
          type: "prospect",
          attributes: {
            emails: [prospect.email],
            firstName: prospect.firstName || "",
            lastName: prospect.lastName || "",
            title: prospect.title || "",
            company: prospect.company || "",
            ...(customFields || {}),
          },
        },
      };

      // Add custom fields if provided
      if (customFields) {
        prospectData.data.attributes.customFields = customFields;
      }

      // Create or update prospect
      let response;
      if (isUpdate) {
        // Update existing
        prospectData.data.id = prospectId;
        response = await fetch(`https://api.outreach.io/api/v2/prospects/${prospectId}`, {
          method: "PATCH",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/vnd.api+json",
          },
          body: JSON.stringify(prospectData),
        });
        if (response.ok) results.updated++;
      } else {
        // Create new
        response = await fetch("https://api.outreach.io/api/v2/prospects", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/vnd.api+json",
          },
          body: JSON.stringify(prospectData),
        });
        
        if (response.ok) {
          const createdData = await response.json();
          prospectId = createdData.data.id;
          results.created++;
        }
      }

      if (!response.ok) {
        const error = await response.text();
        results.errors.push({
          email: prospect.email,
          error: error,
        });
        continue;
      }

      // Add to sequence if specified
      if (sequenceId && prospectId) {
        const sequenceStateData = {
          data: {
            type: "sequenceState",
            relationships: {
              prospect: {
                data: { type: "prospect", id: prospectId },
              },
              sequence: {
                data: { type: "sequence", id: sequenceId },
              },
            },
          },
        };

        const seqResponse = await fetch("https://api.outreach.io/api/v2/sequenceStates", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/vnd.api+json",
          },
          body: JSON.stringify(sequenceStateData),
        });

        if (!seqResponse.ok) {
          const seqError = await seqResponse.text();
          results.errors.push({
            email: prospect.email,
            error: `Added prospect but failed to add to sequence: ${seqError}`,
          });
        }
      }

      // Rate limiting - wait a bit between requests
      await new Promise(resolve => setTimeout(resolve, 200));

    } catch (error) {
      results.errors.push({
        email: prospect.email,
        error: error.message,
      });
    }
  }

  return {
    success: results.errors.length === 0,
    created: results.created,
    updated: results.updated,
    errors: results.errors,
  };
}