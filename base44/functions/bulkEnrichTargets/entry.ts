import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * Full enrichment pipeline for BD targets.
 * Runs all enrichment steps in order, writing results to DB after each step.
 * Designed for batch processing with progress reporting.
 *
 * Steps:
 * 1. Company short name + correspondence name (LLM)
 * 2. Sector classification (LLM)
 * 3. Company data: state, revenue, employees (LLM + internet)
 * 4. Website crawl: status, clinic count, last active (LLM + internet)
 * 5. Quality scoring (algorithmic)
 * 6. Strategic rationale (LLM + internet)
 * 7. Personalized opener (LLM)
 */

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Retry wrapper for DB writes with exponential backoff on 429s
async function dbUpdateWithRetry(base44, targetId, updates, maxRetries = 3) {
  let delay = 300;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      await base44.asServiceRole.entities.BDTarget.update(targetId, updates);
      return;
    } catch (err) {
      const is429 = err?.status === 429 || (err?.message || '').includes('429');
      if (is429 && attempt < maxRetries) {
        await sleep(delay);
        delay *= 2;
      } else {
        throw err;
      }
    }
  }
}

// Step 1: Names
async function enrichNames(base44, target) {
  if (target.correspondenceName && target.companyShortName) return null; // already done

  const [shortName, corrName] = await Promise.all([
    base44.integrations.Core.InvokeLLM({
      prompt: `Transform this company name into a clean, short name. Remove legal suffixes (LLC, Inc, etc). Return ONLY the name.\n\nCompany: "${target.name}"`,
      add_context_from_internet: false,
    }),
    base44.integrations.Core.InvokeLLM({
      prompt: `Transform this company name into a natural, email-friendly correspondence name. Remove formalities. Return ONLY the name.\n\nCompany: "${target.name}"`,
      add_context_from_internet: false,
    }),
  ]);

  const updates = {
    companyShortName: shortName.trim(),
    correspondenceName: corrName.trim(),
  };
  await dbUpdateWithRetry(base44, target.id, updates);
  return updates;
}

// Step 2: Sector
async function enrichSector(base44, target) {
  if (target.sectorFocus && target.sectorFocus.trim() !== '') return null;

  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `Classify this healthcare company into ONE subsector. Choose the most specific fit.\n\nCompany: ${target.name}\nWebsite: ${target.website || 'N/A'}\n\nOptions: HS: Behavioral Health, HS: Dental / Orthodontics, HS: Dermatology, HS: Home Health, HS: Imaging, HS: Physical Therapy, HS: Primary Care, HS: Urgent Care, HS: Vision / Ophthalmology, HS: Multi-Specialty, HS: Pharmacy, HS: Laboratory, HS: General\n\nReturn ONLY the subsector code.`,
    add_context_from_internet: false,
  });

  const updates = { sectorFocus: result.trim() };
  await dbUpdateWithRetry(base44, target.id, updates);
  return updates;
}

// Step 3: Company data (state, revenue, employees)
async function enrichCompanyData(base44, target) {
  const needsState = !target.state || target.state.trim() === '';
  const needsRevenue = !target.revenue;
  const needsEmployees = !target.employees;
  if (!needsState && !needsRevenue && !needsEmployees) return null;

  const fields = [needsState && 'state', needsRevenue && 'revenue ($M)', needsEmployees && 'employees'].filter(Boolean).join(', ');

  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `Research "${target.name}" (${target.website || 'healthcare company'}) and provide: ${fields}.\n\nReturn JSON: {"state": "XX", "revenue": number_in_millions, "employees": number}\nOmit fields you cannot find. Use 2-letter state codes.`,
    add_context_from_internet: true,
    response_json_schema: {
      type: "object",
      properties: {
        state: { type: "string" },
        revenue: { type: "number" },
        employees: { type: "number" },
      },
    },
  });

  const updates = {};
  if (needsState && result.state) {
    const s = result.state.trim().replace(/\.+$/, '');
    if (s.length === 2) updates.state = s.toUpperCase();
  }
  if (needsRevenue && result.revenue) updates.revenue = result.revenue;
  if (needsEmployees && result.employees) updates.employees = Math.round(result.employees);

  if (Object.keys(updates).length > 0) {
    await dbUpdateWithRetry(base44, target.id, updates);
  }
  return updates;
}

// Step 4: Website crawl
async function enrichWebsite(base44, target) {
  if (target.websiteStatus && target.websiteStatus !== 'error') return null;
  if (!target.website) return null;

  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `Check "${target.name}" website (${target.website}). Extract: 1) Site status (working/broken/missing), 2) Number of clinic/office locations, 3) Most recent activity date.\n\nReturn JSON: {"websiteStatus": "working"|"broken"|"missing", "clinicCount": number|null, "lastActive": "YYYY-MM-DD"|null}`,
    add_context_from_internet: true,
    response_json_schema: {
      type: "object",
      properties: {
        websiteStatus: { type: "string" },
        clinicCount: { type: "number" },
        lastActive: { type: "string" },
      },
    },
  });

  const updates = {
    websiteStatus: result.websiteStatus || 'unknown',
    clinicCount: result.clinicCount || target.clinicCount || null,
    lastActive: result.lastActive || target.lastActive || null,
  };
  await dbUpdateWithRetry(base44, target.id, updates);
  return updates;
}

// Step 5: Quality scoring (algorithmic, no LLM)
async function enrichQuality(base44, target, mergedData) {
  if (target.qualityTier) return null;

  const t = { ...target, ...mergedData };
  let score = 50;
  const flags = [];

  // Website
  if (t.websiteStatus === 'broken') { score -= 20; flags.push('Broken website'); }
  else if (t.websiteStatus === 'working') score += 10;

  // Employees
  if (t.employees) {
    if (t.employees < 20) { score -= 15; flags.push('Very low employees'); }
    else if (t.employees > 100) score += 10;
    else if (t.employees >= 50) score += 5;
  }

  // Revenue
  if (t.revenue) {
    if (t.revenue < 5) { score -= 10; flags.push('Sub-scale revenue'); }
    else if (t.revenue > 25) score += 10;
    else if (t.revenue >= 10) score += 5;
  }

  // Multi-site
  if (t.clinicCount !== undefined && t.clinicCount !== null) {
    if (t.clinicCount <= 1) { score -= 15; flags.push('Single-site'); }
    else if (t.clinicCount >= 5) score += 15;
    else if (t.clinicCount >= 3) score += 10;
  }

  const finalScore = Math.max(0, Math.min(100, Math.round(score)));
  const tier = finalScore >= 75 ? 'great' : finalScore >= 45 ? 'good' : 'bad';
  const reason = `${tier.toUpperCase()} (${finalScore}/100). ${flags.length > 0 ? flags.join(', ') : 'No issues.'}`;

  const updates = { qualityTier: tier, qualityScore: finalScore, qualityReason: reason, qualityFlags: flags };
  await dbUpdateWithRetry(base44, target.id, updates);
  return updates;
}

// Step 6: Strategic rationale
async function enrichRationale(base44, target, mergedData) {
  if (target.strategicRationale && target.strategicRationale.trim()) return null;

  const t = { ...target, ...mergedData };
  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `Write a 2-sentence strategic investment thesis for acquiring "${t.name}" (${t.website || 'healthcare'} in ${t.city || '?'}, ${t.state || '?'}). Sector: ${t.sectorFocus || 'Healthcare'}. Revenue: ~$${t.revenue || '?'}M. Employees: ${t.employees || '?'}. Clinics: ${t.clinicCount || '?'}. Be specific and data-driven.`,
    add_context_from_internet: true,
  });

  const updates = { strategicRationale: result.trim() };
  await dbUpdateWithRetry(base44, target.id, updates);
  return updates;
}

// Step 7: Personalization snippet
async function enrichPersonalization(base44, target, mergedData) {
  if (target.personalization_snippet && target.personalization_snippet.trim()) return null;

  const t = { ...target, ...mergedData };
  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `Write a single personalized opening line for a BD email to ${t.name} in ${t.city || 'their area'} (${t.sectorFocus || 'healthcare'}). Be conversational and reference their location/sector naturally. Return ONLY the line, no quotes.`,
    add_context_from_internet: false,
  });

  const updates = { personalization_snippet: result.trim() };
  await dbUpdateWithRetry(base44, target.id, updates);
  return updates;
}

// Main pipeline
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { targetIds, steps } = await req.json();

    if (!targetIds || !Array.isArray(targetIds) || targetIds.length === 0) {
      return Response.json({ error: 'targetIds array required' }, { status: 400 });
    }

    // Allow caller to specify which steps to run. Default: all steps.
    const allSteps = ['names', 'sector', 'companyData', 'website', 'quality', 'rationale', 'personalization'];
    const stepsToRun = steps && Array.isArray(steps) ? steps : allSteps;

    const results = {
      total: targetIds.length,
      processed: 0,
      skipped: 0,
      errors: [],
      stepResults: {},
    };

    // Process targets one at a time to avoid overloading LLM APIs
    for (const targetId of targetIds) {
      try {
        const target = await base44.asServiceRole.entities.BDTarget.get(targetId);
        const mergedData = {}; // accumulate updates across steps

        for (const step of stepsToRun) {
          try {
            let updates = null;
            switch (step) {
              case 'names': updates = await enrichNames(base44, target); break;
              case 'sector': updates = await enrichSector(base44, target); break;
              case 'companyData': updates = await enrichCompanyData(base44, target); break;
              case 'website': updates = await enrichWebsite(base44, target); break;
              case 'quality': updates = await enrichQuality(base44, target, mergedData); break;
              case 'rationale': updates = await enrichRationale(base44, target, mergedData); break;
              case 'personalization': updates = await enrichPersonalization(base44, target, mergedData); break;
            }
            if (updates) {
              Object.assign(mergedData, updates);
              results.stepResults[step] = (results.stepResults[step] || 0) + 1;
            }
          } catch (stepErr) {
            console.error(`Step ${step} failed for ${target.name}:`, stepErr.message);
            // Continue to next step — don't fail the whole target
          }
        }

        results.processed++;
      } catch (err) {
        console.error(`Failed to process target ${targetId}:`, err.message);
        results.errors.push({ targetId, error: err.message });
      }

      // Pause between targets to stay within rate limits
      if (targetIds.indexOf(targetId) < targetIds.length - 1) {
        await sleep(500);
      }
    }

    results.skipped = results.total - results.processed - results.errors.length;

    return Response.json({ success: true, ...results });
  } catch (error) {
    console.error('Bulk enrich pipeline error:', error);
    return Response.json({ error: error.message || String(error) }, { status: 500 });
  }
});
