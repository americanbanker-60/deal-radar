import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { targetId } = await req.json();

    if (!targetId) {
      return Response.json({ error: 'targetId is required' }, { status: 400 });
    }

    // Fetch the target
    const target = await base44.entities.BDTarget.get(targetId);

    if (!target) {
      return Response.json({ error: 'Target not found' }, { status: 404 });
    }

    // Search for growth signals using AI
    const prompt = `Search for recent news and announcements about "${target.name}" (${target.website || 'healthcare company'}) from the last 6 months.

Look specifically for:
1. **New office/clinic openings** - Any expansion, new locations, or facility announcements
2. **Awards and recognition** - Industry awards, best workplace recognition, quality certifications
3. **Executive hires** - New C-suite executives, key leadership appointments, management changes
4. **Funding/Investment** - Capital raises, private equity deals, acquisition announcements
5. **Growth indicators** - Revenue milestones, patient volume increases, service expansion

For each growth signal found, provide a brief, actionable summary (1 sentence max).

Return JSON:
{
  "signals": [
    "Opened 3rd location in Phoenix (Jan 2026)",
    "Hired new COO with PE experience (Dec 2025)"
  ],
  "hasGrowthSignals": true/false
}

If NO credible recent news is found, return empty array and hasGrowthSignals: false.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          signals: {
            type: "array",
            items: { type: "string" }
          },
          hasGrowthSignals: { type: "boolean" }
        }
      }
    });

    // Update the target with growth signals
    await base44.entities.BDTarget.update(targetId, {
      growthSignals: result.signals || [],
      growthSignalsDate: new Date().toISOString()
    });

    return Response.json({
      success: true,
      signals: result.signals || [],
      hasGrowthSignals: result.hasGrowthSignals
    });

  } catch (error) {
    console.error('Error detecting growth signals:', error);
    return Response.json(
      { error: error.message || 'Failed to detect growth signals' },
      { status: 500 }
    );
  }
});