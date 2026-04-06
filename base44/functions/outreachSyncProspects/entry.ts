import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { prospects, sequenceId, customFields, sectorSequenceMap } = await req.json();

    if (!prospects || !Array.isArray(prospects) || prospects.length === 0) {
      return Response.json({ error: 'No prospects provided' }, { status: 400 });
    }

    // Default sector to sequence mapping (can be overridden by caller)
    const defaultSectorSequenceMap = {
      'HS: Urgent Care': Deno.env.get('OUTREACH_SEQUENCE_URGENT_CARE'),
      'HS: Dentistry': Deno.env.get('OUTREACH_SEQUENCE_DENTISTRY'),
      'HS: Behavioral Health': Deno.env.get('OUTREACH_SEQUENCE_BEHAVIORAL_HEALTH'),
      'HS: Primary Care': Deno.env.get('OUTREACH_SEQUENCE_PRIMARY_CARE'),
      'HS: Multi-Specialty': Deno.env.get('OUTREACH_SEQUENCE_MULTI_SPECIALTY'),
      'HS: General': Deno.env.get('OUTREACH_SEQUENCE_GENERAL')
    };

    const sequenceMap = sectorSequenceMap || defaultSectorSequenceMap;
    const fallbackSequenceId = sequenceMap['HS: General'] || Deno.env.get('OUTREACH_SEQUENCE_GENERAL');

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
    const enrolled = [];
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
        
        // Map score to custom2
        if (prospect.score !== undefined && prospect.score !== null) {
          prospectData.data.attributes.custom2 = String(prospect.score);
        }
        
        // Generate and map Sales Context to custom3
        if (prospect.notes || prospect.crawlRationale) {
          try {
            const contextPrompt = `Summarize the following information about a healthcare company into a concise 2-3 sentence "Sales Context" for outreach:

Company: ${prospect.company || 'Unknown'}
Notes: ${prospect.notes || 'N/A'}
Research Rationale: ${prospect.crawlRationale || 'N/A'}

Write a brief, actionable summary highlighting key business insights that would help a sales rep personalize their outreach. Focus on what makes this target interesting.`;

            const summaryResult = await base44.integrations.Core.InvokeLLM({
              prompt: contextPrompt,
              add_context_from_internet: false
            });

            if (summaryResult) {
              prospectData.data.attributes.custom3 = summaryResult.trim();
            }
          } catch (llmError) {
            console.error('Failed to generate sales context:', llmError);
            // Continue without sales context if LLM fails
          }
        }

        const prospectResponse = await fetch('https://api.outreach.io/api/v2/prospects', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/vnd.api+json'
          },
          body: JSON.stringify(prospectData)
        });

        let outreachProspectId = null;
        let isNewProspect = false;

        if (!prospectResponse.ok) {
          const errorText = await prospectResponse.text();
          
          // Check if it's a duplicate error (prospect already exists)
          if (errorText.includes('already exists') || errorText.includes('duplicate')) {
            // Try to find the existing prospect by email
            const searchResponse = await fetch(
              `https://api.outreach.io/api/v2/prospects?filter[emails]=${encodeURIComponent(prospect.email)}`,
              {
                headers: {
                  'Authorization': `Bearer ${accessToken}`,
                  'Content-Type': 'application/vnd.api+json'
                }
              }
            );
            
            if (searchResponse.ok) {
              const searchResult = await searchResponse.json();
              if (searchResult.data && searchResult.data.length > 0) {
                outreachProspectId = searchResult.data[0].id;
                updated.push({ email: prospect.email, status: 'exists', prospectId: outreachProspectId });
              }
            } else {
              errors.push({ email: prospect.email, error: 'Prospect exists but could not retrieve ID' });
              continue;
            }
          } else {
            errors.push({ email: prospect.email, error: errorText });
            continue;
          }
        } else {
          const prospectResult = await prospectResponse.json();
          outreachProspectId = prospectResult.data.id;
          isNewProspect = true;
          created.push({ 
            email: prospect.email,
            prospectId: outreachProspectId,
            status: 'created'
          });
        }

        // Enroll in sequence if we have a prospect ID
        if (outreachProspectId) {
          // Determine sequence ID based on sectorFocus
          const targetSequenceId = prospect.sectorFocus && sequenceMap[prospect.sectorFocus] 
            ? sequenceMap[prospect.sectorFocus] 
            : fallbackSequenceId;

          if (targetSequenceId) {
            try {
              const sequenceStateData = {
                data: {
                  type: 'sequenceState',
                  relationships: {
                    prospect: {
                      data: { type: 'prospect', id: outreachProspectId }
                    },
                    sequence: {
                      data: { type: 'sequence', id: targetSequenceId }
                    }
                  }
                }
              };

              const sequenceResponse = await fetch('https://api.outreach.io/api/v2/sequenceStates', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${accessToken}`,
                  'Content-Type': 'application/vnd.api+json'
                },
                body: JSON.stringify(sequenceStateData)
              });

              if (sequenceResponse.ok) {
                enrolled.push({ 
                  email: prospect.email, 
                  prospectId: outreachProspectId,
                  sequenceId: targetSequenceId,
                  sector: prospect.sectorFocus || 'General'
                });
              } else {
                const errorText = await sequenceResponse.text();
                errors.push({ 
                  email: prospect.email, 
                  error: `Failed to enroll in sequence: ${errorText}` 
                });
              }
            } catch (seqError) {
              errors.push({ 
                email: prospect.email, 
                error: `Sequence enrollment error: ${seqError.message}` 
              });
            }
          }
        }

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
      enrolled: enrolled.length,
      errors,
      message: `Successfully synced ${created.length} prospects, enrolled ${enrolled.length} in sequences${updated.length > 0 ? ` (${updated.length} already existed)` : ''}${errors.length > 0 ? ` (${errors.length} failed)` : ''}`
    });

  } catch (error) {
    console.error('Outreach sync error:', error);
    return Response.json({ 
      error: error.message || 'Failed to sync prospects to Outreach' 
    }, { status: 500 });
  }
});