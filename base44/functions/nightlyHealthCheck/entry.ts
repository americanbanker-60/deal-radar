import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Use service role since this is a scheduled/admin task
    const targets = await base44.asServiceRole.entities.BDTarget.list('lastActive', 50);

    if (!targets || targets.length === 0) {
      return Response.json({ success: true, message: 'No targets to process', updated: 0 });
    }

    console.log(`[nightlyHealthCheck] Processing ${targets.length} targets with oldest lastActive dates`);

    let updated = 0;
    const errors = [];

    for (const target of targets) {
      try {
        const prompt = `Analyze the website and social media for "${target.name}" (${target.website || 'healthcare company'}).

Extract:
1. Website status: working, broken, or missing
2. Most recent activity date from social media or news (YYYY-MM-DD format)
3. Is the company potentially dormant? (no activity in 12+ months)

Return JSON:
{
  "websiteStatus": "working" | "broken" | "missing",
  "lastActive": "YYYY-MM-DD" or null,
  "dormancyFlag": boolean
}`;

        const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt,
          add_context_from_internet: true,
          response_json_schema: {
            type: "object",
            properties: {
              websiteStatus: { type: "string" },
              lastActive: { type: "string" },
              dormancyFlag: { type: "boolean" }
            }
          }
        });

        await base44.asServiceRole.entities.BDTarget.update(target.id, {
          websiteStatus: result.websiteStatus || "unknown",
          lastActive: result.lastActive || target.lastActive || null,
          dormancyFlag: result.dormancyFlag || false,
        });

        updated++;
        console.log(`[nightlyHealthCheck] Updated ${target.name}: status=${result.websiteStatus}, dormant=${result.dormancyFlag}`);
      } catch (err) {
        console.error(`[nightlyHealthCheck] Error processing ${target.name}:`, err.message);
        errors.push({ name: target.name, error: err.message });

        // Mark as error status so it's not silently skipped
        await base44.asServiceRole.entities.BDTarget.update(target.id, {
          websiteStatus: "error",
        }).catch(() => {});
      }
    }

    return Response.json({
      success: true,
      processed: targets.length,
      updated,
      errors: errors.length > 0 ? errors : null,
    });

  } catch (error) {
    console.error('[nightlyHealthCheck] Fatal error:', error);
    return Response.json({ error: error.message || String(error) }, { status: 500 });
  }
});