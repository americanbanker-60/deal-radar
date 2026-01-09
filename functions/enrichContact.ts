import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const NICKNAME_MAP = {
  matthew: ["matt"], michael: ["mike"], robert: ["rob", "bob"],
  william: ["will", "bill"], richard: ["rich", "rick"],
  christopher: ["chris"], daniel: ["dan"], andrew: ["andy", "drew"],
  nicholas: ["nick"], jonathan: ["jon"], benjamin: ["ben"],
  alexander: ["alex"], steven: ["steve"], joseph: ["joe"],
  thomas: ["tom"], timothy: ["tim"], david: ["dave"],
  james: ["jim", "jimmy"], charles: ["charlie", "chuck"],
  elizabeth: ["liz", "beth"], jennifer: ["jen"], deborah: ["deb"],
  catherine: ["cathy", "kate"], margaret: ["maggie", "meg"],
  patricia: ["pat", "patty"], kimberly: ["kim"], susan: ["sue"]
};

const DOCTOR_CREDENTIALS = ["MD", "DO", "MBBS", "DDS", "DMD", "OD", "DPM", "PHD", "DRPH", "DPT", "DC"];

function capitalize(s) {
  return s ? s[0].toUpperCase() + s.slice(1).toLowerCase() : s;
}

function lowerAlpha(s) {
  return (s || "").toLowerCase().replace(/[^a-z]/g, "");
}

function getCandidateNicknames(firstName) {
  const key = lowerAlpha(firstName);
  const nicknames = NICKNAME_MAP[key] || [];
  return [firstName, ...nicknames.map(capitalize)];
}

async function queryNPI(firstName, lastName) {
  try {
    const url = `https://npiregistry.cms.hhs.gov/api/?version=2.1&first_name=${encodeURIComponent(firstName)}&last_name=${encodeURIComponent(lastName)}&limit=5`;
    const resp = await fetch(url, {
      headers: { "User-Agent": "DealRadarEnrichment/1.0" }
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    return data.results?.[0] || null;
  } catch (error) {
    console.error("NPI query error:", error);
    return null;
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { targetId } = await req.json();
    if (!targetId) {
      return Response.json({ error: 'targetId required' }, { status: 400 });
    }

    // Get target
    const targets = await base44.entities.BDTarget.filter({ id: targetId });
    if (!targets.length) {
      return Response.json({ error: 'Target not found' }, { status: 404 });
    }
    const target = targets[0];

    const firstName = target.contactFirstName?.trim();
    const lastName = target.contactLastName?.trim();
    const title = target.contactTitle?.trim();
    const email = target.contactEmail?.trim();

    if (!firstName || !lastName) {
      return Response.json({ 
        error: 'Contact must have first and last name',
        preferredName: firstName,
        confidence: 0
      }, { status: 400 });
    }

    const signals = [];
    let preferredName = firstName;
    let isDoctor = false;
    let credential = null;
    let honorific = "";

    // 1. Email heuristic
    if (email) {
      const localPart = email.split('@')[0];
      const token = localPart.split(/[._-]/)[0];
      const candidates = getCandidateNicknames(firstName).map(lowerAlpha);
      if (candidates.includes(lowerAlpha(token))) {
        preferredName = capitalize(token);
        signals.push({ source: "email", value: preferredName, strength: 0.3 });
      }
    }

    // 2. NPI Registry check (US healthcare only)
    const npiResult = await queryNPI(firstName, lastName);
    if (npiResult) {
      const npiCred = npiResult.basic?.credential;
      if (npiCred) {
        credential = npiCred.toUpperCase();
        if (DOCTOR_CREDENTIALS.includes(credential)) {
          isDoctor = true;
          honorific = "Dr.";
          signals.push({ source: "npi", credential, strength: 0.9 });
        }
      }
    }

    // 3. Title analysis
    if (title) {
      const titleLower = title.toLowerCase();
      if (/\b(physician|surgeon|doctor|md|do)\b/.test(titleLower)) {
        isDoctor = true;
        honorific = "Dr.";
        signals.push({ source: "title", value: title, strength: 0.5 });
      }
      
      // Extract credential from title
      const credMatch = title.match(/\b(MD|DO|PHD|DDS|DMD|OD|DPM|DC)\b/i);
      if (credMatch && !credential) {
        credential = credMatch[1].toUpperCase();
        if (DOCTOR_CREDENTIALS.includes(credential)) {
          isDoctor = true;
          honorific = "Dr.";
          signals.push({ source: "title_credential", credential, strength: 0.6 });
        }
      }
    }

    // 4. Web search with LLM
    const searchQuery = `"${firstName} ${lastName}" ${target.name || ""} healthcare ${title || ""}`;
    
    try {
      const llmResult = await base44.integrations.Core.InvokeLLM({
        prompt: `Search for: ${searchQuery}

Analyze the search results and determine:

1. PREFERRED NAME: Does this person commonly go by a nickname? 
   - Full name: ${firstName} ${lastName}
   - Common nicknames for ${firstName}: ${getCandidateNicknames(firstName).slice(1).join(", ") || "none"}
   - Look for how they introduce themselves, email signatures, LinkedIn, company bios
   
2. DOCTOR STATUS: Is this person a doctor/physician?
   - Look for: "Dr. ${firstName} ${lastName}", professional credentials (MD, DO, PhD, DDS, etc.)
   - Check: LinkedIn profiles, company bios, professional registries
   - Note: Not all healthcare workers are doctors (nurses, administrators, etc.)

Return your analysis as JSON with this structure:
{
  "preferredName": "the name they go by (e.g., Matt instead of Matthew)",
  "preferredNameConfidence": 0.0-1.0,
  "preferredNameEvidence": "brief explanation",
  "isDoctor": true/false,
  "doctorConfidence": 0.0-1.0,
  "credential": "MD/DO/PhD/etc or null",
  "doctorEvidence": "brief explanation with sources"
}`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            preferredName: { type: "string" },
            preferredNameConfidence: { type: "number" },
            preferredNameEvidence: { type: "string" },
            isDoctor: { type: "boolean" },
            doctorConfidence: { type: "number" },
            credential: { type: ["string", "null"] },
            doctorEvidence: { type: "string" }
          }
        }
      });

      // Apply LLM findings
      if (llmResult.preferredName && llmResult.preferredNameConfidence > 0.6) {
        preferredName = llmResult.preferredName;
        signals.push({ 
          source: "web_search", 
          value: preferredName, 
          strength: llmResult.preferredNameConfidence,
          evidence: llmResult.preferredNameEvidence 
        });
      }

      if (llmResult.isDoctor && llmResult.doctorConfidence > 0.6) {
        isDoctor = true;
        honorific = "Dr.";
        if (llmResult.credential) {
          credential = llmResult.credential;
        }
        signals.push({ 
          source: "web_search", 
          credential: llmResult.credential,
          strength: llmResult.doctorConfidence,
          evidence: llmResult.doctorEvidence
        });
      }

    } catch (llmError) {
      console.error("LLM search error:", llmError);
      // Continue with other signals
    }

    // Calculate final confidence
    const nameConfidence = Math.round(Math.max(...signals.map(s => s.strength || 0), 0.5) * 100);
    const doctorConfidence = Math.round(
      (signals.filter(s => s.credential || s.source === "npi").reduce((sum, s) => sum + (s.strength || 0), 0) / 
      Math.max(signals.filter(s => s.credential || s.source === "npi").length, 1)) * 100
    );

    const reason = signals
      .slice(0, 3)
      .map(s => `${s.source}: ${s.evidence || s.value || s.credential || "detected"}`)
      .join("; ");

    // Update target
    await base44.entities.BDTarget.update(targetId, {
      contactPreferredName: preferredName,
      contactPreferredNameConfidence: nameConfidence,
      contactHonorific: honorific,
      contactIsDoctor: isDoctor,
      contactDoctorConfidence: doctorConfidence,
      contactCredential: credential,
      contactEnrichmentReason: reason || "Analysis completed",
      contactEnrichmentDate: new Date().toISOString()
    });

    return Response.json({
      success: true,
      preferredName,
      nameConfidence,
      isDoctor,
      honorific,
      credential,
      doctorConfidence,
      reason,
      signals: signals.length
    });

  } catch (error) {
    console.error("Enrichment error:", error);
    return Response.json({ 
      error: error.message || String(error),
      success: false
    }, { status: 500 });
  }
});