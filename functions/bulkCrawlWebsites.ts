import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { companies } = await req.json();

    if (!companies || !Array.isArray(companies)) {
      return Response.json({ error: 'Invalid input: companies must be an array' }, { status: 400 });
    }

    const crawledCompanies = [];
    const errors = [];

    for (let i = 0; i < companies.length; i++) {
      const company = companies[i];
      
      try {
        const prompt = `Analyze the website and social media for "${company.name}" (${company.website || 'healthcare company'}).

Extract:
1. Website status: working, broken, or missing
2. Number of clinic/office locations (check locations page, about us, etc.)
3. Most recent activity date from social media or news (YYYY-MM-DD format)
4. Is the company potentially dormant? (no activity in 12+ months)
5. Brief rationale: One sentence explaining where you found the clinic count (e.g., "Found 5 locations listed on /contact page")

Return JSON:
{
  "websiteStatus": "working" | "broken" | "missing",
  "clinicCount": number or null,
  "lastActive": "YYYY-MM-DD" or null,
  "dormancyFlag": boolean,
  "enrichmentRationale": "brief explanation string"
}`;

        const result = await base44.integrations.Core.InvokeLLM({
          prompt,
          add_context_from_internet: true,
          response_json_schema: {
            type: "object",
            properties: {
              websiteStatus: { type: "string" },
              clinicCount: { type: "number" },
              lastActive: { type: "string" },
              dormancyFlag: { type: "boolean" },
              enrichmentRationale: { type: "string" }
            }
          }
        });

        crawledCompanies.push({
          name: company.name,
          website: company.website,
          websiteStatus: result.websiteStatus || "unknown",
          clinicCount: result.clinicCount || null,
          lastActive: result.lastActive || null,
          dormancyFlag: result.dormancyFlag || false,
          crawlRationale: result.enrichmentRationale || null
        });

      } catch (error) {
        console.error(`Error crawling ${company.name}:`, error);
        errors.push({
          companyName: company.name,
          error: error.message
        });
        
        // Add company with error status if crawl fails
        crawledCompanies.push({
          name: company.name,
          website: company.website,
          websiteStatus: "error",
          clinicCount: null,
          lastActive: null,
          dormancyFlag: false,
          crawlRationale: null
        });
      }
    }

    return Response.json({
      success: true,
      crawledCompanies,
      errors: errors.length > 0 ? errors : null
    });

  } catch (error) {
    console.error("Bulk crawl error:", error);
    return Response.json({
      error: error.message || String(error)
    }, { status: 500 });
  }
});