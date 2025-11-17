
import React, { useMemo, useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Download, Upload, Filter, Sparkles, Database, Settings, CircleAlert, Workflow, Mail, Loader2, HelpCircle, CheckCircle2, X, AlertTriangle, Globe, MapPin, Building2, Save } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";

import SchemaMapper from "../components/ops/SchemaMapper";
import { filterTargets, scoreTargets } from "../components/ops/analyticsHelpers";
import HowToUse from "../components/ops/HowToUse";
import OutreachIntegration from "../components/ops/OutreachIntegration";

const DEFAULT_FIELDS = [
  "Company Name","URL","HQ Location","Ownership","Founders / Executives","Revenue","Last Financing Year","Website","LinkedIn","Investors","City","State","Country","Industry","Subsector","Employee Count","Employee Range","Revenue Range","Email","First Name","Last Name","Job Title","Phone"
];

const SECTOR_OPTIONS = `HS: Allergy, Ear, Nose and Throat
HS: Anesthesiology
HS: ASC
HS: Behavioral - ABA
HS: Behavioral - IDD
HS: Behavioral - Interventional Pysch
HS: Behavioral - Mental
HS: Behavioral - Psych
HS: Behavioral - Psych / Residential
HS: Behavioral - SUD
HS: Cardiology
HS: Compound Pharmacy
HS: Dentistry
HS: Dermatology
HS: DME
HS: DPC
HS: Employer | Self Insured Services
HS: Functional Medicine / Wellness
HS: Gastroenterology
HS: General
HS: Health Systems
HS: Home Care
HS: Imaging
HS: Infusion Center
HS: Lab
HS: Medical Transportation
HS: MedSpa & Aesthetics
HS: Nephrology
HS: Neurology
HS: Optometry
HS: Ortho
HS: PAC - Home Health
HS: PAC - Hospice
HS: PAC - Skilled Nursing (SNF)
HS: Pain Management
HS: Pediatrics
HS: Physical Therapy
HS: Podiatry
HS: PPM
HS: Primary Care
HS: Sleep
HS: Speech Pathology
HS: Staffing
HS: Urgent Care
HS: Urology
HS: Vascular & Vein
HS: Veterinary
HS: Veterinary / Animal Health
HS: Vision
HS: Women's Health
HS: Wound Care`;

export default function OpsConsole(){
  const [page, setPage] = useState("grata");
  const [loading, setLoading] = useState(false);
  const [crawling, setCrawling] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const [crawlProgress, setCrawlProgress] = useState({ current: 0, total: 0 });
  const [enrichProgress, setEnrichProgress] = useState({ current: 0, total: 0 });
  const [showHowTo, setShowHowTo] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Grata states
  const [grCompaniesRaw, setGrCompaniesRaw] = useState([]);
  const [grHeaders, setGrHeaders] = useState([]);
  const [grMap, setGrMap] = useState({});

  // Shared filters & settings - ALL DEFAULTS OPEN
  const [regionFilter, setRegionFilter] = useState("");
  const [minRev, setMinRev] = useState(0);
  const [maxRev, setMaxRev] = useState(100000);
  const [ownerPref, setOwnerPref] = useState("Any");
  const [scoreThreshold, setScoreThreshold] = useState(0);
  const [insights, setInsights] = useState("");

  // Outreach custom fields
  const [vertical, setVertical] = useState("Healthcare Services");
  const [tag, setTag] = useState("BD-Priority");
  const [fitKeywords, setFitKeywords] = useState("Healthcare Services");

  // Email draft
  const [emailSubject, setEmailSubject] = useState("BD Targets & Market Snapshot");
  const [emailBody, setEmailBody] = useState("");

  // New states for saving targets
  const [selectedTargets, setSelectedTargets] = useState(new Set());
  const [campaignName, setCampaignName] = useState("");
  const [saving, setSaving] = useState(false);

  // Load saved mappings and settings from localStorage on mount
  useEffect(() => {
    try {
      const savedGrMap = localStorage.getItem('ops_console_gr_map');
      const savedVertical = localStorage.getItem('ops_console_vertical');
      const savedTag = localStorage.getItem('ops_console_tag');
      
      if (savedGrMap) {
        setGrMap(JSON.parse(savedGrMap));
        console.log("✅ Loaded saved Grata mappings");
      }
      if (savedVertical) {
        setVertical(savedVertical);
      }
      if (savedTag) {
        setTag(savedTag);
      }
    } catch (error) {
      console.error("Error loading saved settings:", error);
    }
  }, []);

  // Save Grata mapping whenever it changes
  useEffect(() => {
    if (Object.keys(grMap).length > 0) {
      localStorage.setItem('ops_console_gr_map', JSON.stringify(grMap));
      console.log("💾 Saved Grata mappings");
    }
  }, [grMap]);

  // Save settings
  useEffect(() => {
    localStorage.setItem('ops_console_vertical', vertical);
  }, [vertical]);

  useEffect(() => {
    localStorage.setItem('ops_console_tag', tag);
  }, [tag]);

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  const onUpload = async (file, kind) => {
    console.log("📤 Starting upload:", file.name, "kind:", kind);
    setLoading(true);
    setUploadError(null);
    
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          console.log("📖 File loaded, processing...");
          const content = e.target.result.split(',')[1];
          const ext = file.name.toLowerCase().split(".").pop();
          
          console.log("📋 File extension:", ext);
          console.log("📦 Content length:", content.length);
          
          let result;
          if (ext === "csv") {
            console.log("🔄 Calling parseCsvFile...");
            result = await base44.functions.invoke('parseCsvFile', { fileContent: content });
          } else {
            console.log("🔄 Calling parseExcelFile...");
            result = await base44.functions.invoke('parseExcelFile', { fileContent: content });
          }
          
          console.log("✅ Function returned:", result);
          
          const data = result.data;
          
          console.log("📊 Parsed data:", {
            headers: data.headers?.length,
            rows: data.rows?.length
          });
          
          if (!data.headers || !data.rows) {
            throw new Error("Invalid data format returned from parser");
          }
          
          if (kind === "gr-companies") { 
            console.log("✅ Setting Grata companies:", data.rows.length);
            setGrCompaniesRaw(data.rows); 
            setGrHeaders(data.headers); 
          }
          
          setLoading(false);
          showSuccess(`Successfully uploaded ${data.rows.length} rows! ${Object.keys(grMap).length > 0 ? '✓ Using saved column mappings' : '⚠️ Go to Settings to map columns'}`);
        } catch (innerError) {
          console.error("❌ Processing error:", innerError);
          setUploadError(innerError.message);
          setLoading(false);
        }
      };
      
      reader.onerror = (error) => {
        console.error("❌ FileReader error:", error);
        setUploadError("Failed to read file");
        setLoading(false);
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("❌ Upload error:", error);
      setUploadError(error.message);
      setLoading(false);
    }
  };

  const crawlWebsites = async () => {
    if (normalizedGR.length === 0) {
      setUploadError("No companies to crawl. Please upload data first.");
      return;
    }

    setCrawling(true);
    setCrawlProgress({ current: 0, total: normalizedGR.length });

    const enrichedRows = [];

    for (let i = 0; i < normalizedGR.length; i++) {
      const company = normalizedGR[i];
      setCrawlProgress({ current: i + 1, total: normalizedGR.length });

      if (!company.website) {
        enrichedRows.push({
          ...company,
          websiteStatus: "missing",
          clinicCount: undefined
        });
        continue;
      }

      try {
        const prompt = `Visit the website ${company.website} for the company "${company.name}". 
        
Extract the following information:
1. Website Status: Does the website load properly? (answer: "working" or "broken")
2. Number of Locations/Clinics: How many physical locations, clinics, or offices does this company operate? Look for phrases like "locations", "clinics", "offices", "facilities". If you can't find this information, return null.

Return your response as JSON with this exact structure:
{
  "websiteStatus": "working" or "broken",
  "clinicCount": number or null
}`;

        const result = await base44.integrations.Core.InvokeLLM({
          prompt,
          add_context_from_internet: true,
          response_json_schema: {
            type: "object",
            properties: {
              websiteStatus: { type: "string" },
              clinicCount: { type: ["number", "null"] }
            }
          }
        });

        enrichedRows.push({
          ...company,
          websiteStatus: result.websiteStatus || "unknown",
          clinicCount: result.clinicCount
        });
      } catch (error) {
        console.error(`Error crawling ${company.name}:`, error);
        enrichedRows.push({
          ...company,
          websiteStatus: "error",
          clinicCount: undefined
        });
      }
    }

    // Update the raw data with enriched information
    const enrichedMap = new Map(enrichedRows.map(r => [r.name, r]));
    const updatedRaw = grCompaniesRaw.map(raw => {
      const normalized = normalizeRow(raw, grMap, { preferRangeMidpoint: true });
      const enriched = enrichedMap.get(normalized.name);
      if (enriched) {
        raw._websiteStatus = enriched.websiteStatus;
        raw._clinicCount = enriched.clinicCount;
      }
      return raw;
    });

    setGrCompaniesRaw(updatedRaw);
    setCrawling(false);
    setCrawlProgress({ current: 0, total: 0 });
    showSuccess(`Crawled ${enrichedRows.length} company websites!`);
  };

  const enrichNamesAndSectors = async () => {
    if (normalizedGR.length === 0) {
      setUploadError("No companies to enrich. Please upload data first.");
      return;
    }

    setEnriching(true);
    setEnrichProgress({ current: 0, total: normalizedGR.length });

    const enrichedRows = [];

    for (let i = 0; i < normalizedGR.length; i++) {
      const company = normalizedGR[i];
      setEnrichProgress({ current: i + 1, total: normalizedGR.length });

      try {
        const prompt = `Given the full company name: "${company.name}"

Generate two fields following these exact rules:

**Company Short Name Rules:**
- Remove leading articles: The, A, An
- Remove legal terms: LLC, Inc, Incorporated, Corporation, Corp, Company, Co, Group, Holdings, Partners, Services, MSO, PC, PLLC, PA
- Retain core unique identifiers + specialty term
- Use Title Case
- Do NOT add new words
- Should look natural in an email subject line
- If uncertain, use a conservative shortened version

**Sector Focus Rules:**
- Use "HS: {Sector Name}" format
- Choose from this list ONLY:
${SECTOR_OPTIONS}
- Infer from company name keywords
- If ambiguous, use "HS: General"

Examples:
- "The River Pediatrics Group" → Short Name: "River Pediatrics", Sector: "HS: Pediatrics"
- "Blue Oak Cardiology, LLC" → Short Name: "Blue Oak Cardiology", Sector: "HS: Cardiology"
- "Willow Grove Behavioral Health Services" → Short Name: "Willow Grove Behavioral Health", Sector: "HS: Behavioral - Mental"

Return JSON:
{
  "companyShortName": "...",
  "sectorFocus": "..."
}`;

        const result = await base44.integrations.Core.InvokeLLM({
          prompt,
          response_json_schema: {
            type: "object",
            properties: {
              companyShortName: { type: "string" },
              sectorFocus: { type: "string" }
            }
          }
        });

        enrichedRows.push({
          ...company,
          companyShortName: result.companyShortName || company.name,
          sectorFocus: result.sectorFocus || "HS: General"
        });
      } catch (error) {
        console.error(`Error enriching ${company.name}:`, error);
        enrichedRows.push({
          ...company,
          companyShortName: company.name,
          sectorFocus: "HS: General"
        });
      }
    }

    // Update the raw data with enriched information
    const enrichedMap = new Map(enrichedRows.map(r => [r.name, r]));
    const updatedRaw = grCompaniesRaw.map(raw => {
      const normalized = normalizeRow(raw, grMap, { preferRangeMidpoint: true });
      const enriched = enrichedMap.get(normalized.name);
      if (enriched) {
        raw._companyShortName = enriched.companyShortName;
        raw._sectorFocus = enriched.sectorFocus;
      }
      return raw;
    });

    setGrCompaniesRaw(updatedRaw);
    setEnriching(false);
    setEnrichProgress({ current: 0, total: 0 });
    showSuccess(`Enriched ${enrichedRows.length} company names and sectors!`);
  };
  
  const saveToDatabase = async () => {
    if (selectedTargets.size === 0) {
      setUploadError("Please select companies to save");
      return;
    }

    if (!campaignName.trim()) {
      setUploadError("Please enter a campaign name");
      return;
    }

    setSaving(true);
    
    try {
      // Get existing targets to check for duplicates
      const existingTargets = await base44.entities.BDTarget.list();
      const existingUrls = new Set(existingTargets.map(t => t.website?.toLowerCase()).filter(Boolean));

      const targetsToSave = grScored
        .filter((_, index) => selectedTargets.has(index))
        .filter(t => t.website && !existingUrls.has(t.website.toLowerCase())) // Only save if website exists and is not a duplicate
        .map(t => ({
          campaign: campaignName.trim(),
          name: t.name,
          companyShortName: t.companyShortName,
          sectorFocus: t.sectorFocus,
          website: t.website,
          websiteStatus: t.websiteStatus,
          hq: t.hq,
          industry: t.industry,
          subsector: t.subsector,
          revenue: t.revenue,
          employees: t.employees,
          clinicCount: t.clinicCount,
          ownership: t.ownership,
          score: t.score,
          contactEmail: t.contact?.email,
          contactFirstName: t.contact?.firstName,
          contactLastName: t.contact?.lastName,
          contactTitle: t.contact?.title,
          contactPhone: t.contact?.phone,
          linkedin: t.linkedin,
          notes: t.notes,
          status: "new"
        }));

      if (targetsToSave.length === 0) {
        setUploadError("All selected companies already exist in database or lack a website for de-duplication.");
        setSaving(false);
        return;
      }

      await base44.entities.BDTarget.bulkCreate(targetsToSave);
      
      showSuccess(`Saved ${targetsToSave.length} companies to "${campaignName}"! ${selectedTargets.size - targetsToSave.length} duplicates skipped.`);
      setSelectedTargets(new Set());
      setCampaignName("");
    } catch (error) {
      console.error("Save error:", error);
      setUploadError("Failed to save: " + error.message);
    }
    
    setSaving(false);
  };

  const toggleSelectAll = () => {
    if (selectedTargets.size === grScored.length) {
      setSelectedTargets(new Set());
    } else {
      setSelectedTargets(new Set(grScored.map((_, i) => i)));
    }
  };

  const toggleTarget = (index) => {
    const newSelected = new Set(selectedTargets);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedTargets(newSelected);
  };
  
  const normalizedGR = useMemo(() => {
    const normalized = grCompaniesRaw.map((r) => normalizeRow(r, grMap, { preferRangeMidpoint: true }));
    console.log("🔄 Normalized data:", {
      total: normalized.length,
      sample: normalized[0]
    });
    return normalized;
  }, [grCompaniesRaw, grMap]);
  
  const filteredGR = useMemo(() => {
    const filtered = filterTargets(normalizedGR, { regionFilter, minRev, maxRev, ownerPref });
    console.log("🔄 Filtered data:", {
      total: filtered.length,
      filters: { regionFilter, minRev, maxRev, ownerPref }
    });
    return filtered;
  }, [normalizedGR, regionFilter, minRev, maxRev, ownerPref]);
  
  const grScored = useMemo(() => {
    const scored = scoreTargets(filteredGR, { fitKeywords });
    console.log("🔄 Scored data:", {
      total: scored.length,
      fitKeywords
    });
    return scored;
  }, [filteredGR, fitKeywords]);

  const downloadText = (filename, text) => {
    const blob = new Blob([text], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; 
    a.download = filename; 
    a.click(); 
    URL.revokeObjectURL(url);
  };

  const copy = async (text) => { 
    try { 
      await navigator.clipboard.writeText(text);
      showSuccess("Copied to clipboard!");
    } catch(e) {
      console.error("Copy failed:", e);
      setUploadError("Failed to copy to clipboard");
    } 
  };

  const insightsFor = (label, scored) => {
    const top = scored.slice(0, 10);
    const names = top.map((t) => t.name).filter(Boolean).slice(0,5).join(", ");
    const lines = [
      `${label}: ${scored.length} qualified targets; top 5: ${names || "(add data)"}.`,
      `Prioritized ${top.length} targets with Score ≥ ${scoreThreshold}.`,
    ].filter(Boolean);
    return `• ${lines.join("\n• ")}`;
  };

  const generateOutputs = (label, scored) => {
    const text = insightsFor(label, scored);
    setInsights(text);
    setEmailBody(`Hi team,\n\n${text}\n\nAttached are the cleaned targets and snapshot.\n\n- ${label} export generated from Ops Console`);
  };

  const exportExcel = async (filename, data) => {
    setLoading(true);
    try {
      const result = await base44.functions.invoke('exportToExcel', {
        data,
        filename
      });
      window.open(result.data.fileUrl, '_blank');
    } catch (error) {
      console.error("Excel export error:", error);
      setUploadError("Failed to export Excel: " + error.message);
    }
    setLoading(false);
  };

  const exportCSV = async (filename, data) => {
    setLoading(true);
    try {
      const result = await base44.functions.invoke('dataToCsv', { data });
      downloadText(filename, result.data.csv);
    } catch (error) {
      console.error("CSV export error:", error);
      setUploadError("Failed to export CSV: " + error.message);
    }
    setLoading(false);
  };

  const outreachCsv = (rows, opts) => {
    const out = rows.map((r) => ({
      Email: r.contact?.email || "",
      "First Name": r.contact?.firstName || "",
      "Last Name": r.contact?.lastName || "",
      Company: r.name || "",
      "Company Short Name": r.companyShortName || r.name,
      "Sector Focus": r.sectorFocus || "",
      "Job Title": r.contact?.title || "",
      "Account Name": r.name || "",
      Source: opts.source,
      Vertical: opts.vertical,
      Tag: opts.tag,
      Score: r.score ?? "",
      Region: r.hq || "",
      Clinics: r.clinicCount || "",
    }));
    return out;
  };

  useEffect(() => {
    if (!fitKeywords || fitKeywords.trim().toLowerCase() === "healthcare services") {
      setFitKeywords(vertical);
    }
  }, [vertical]);

  return (
    <div className="w-full mx-auto p-4 md:p-6 space-y-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <HowToUse open={showHowTo} onClose={() => setShowHowTo(false)} />
      
      <div className="flex items-center gap-3 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="p-3 bg-emerald-600 rounded-lg">
          <Database className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900">Grata Ops Console</h1>
          <p className="text-sm text-slate-600">Top-of-funnel deal sourcing for bootstrapped companies</p>
        </div>
        <Link to={createPageUrl("SavedTargets")}>
          <Button variant="outline">
            <Database className="w-4 h-4 mr-2" />
            View Saved Targets
          </Button>
        </Link>
        <Button
          variant="outline"
          onClick={() => setShowHowTo(true)}
          className="gap-2"
        >
          <Sparkles className="w-4 h-4" />
          How to Use
        </Button>
        <Badge variant="secondary">v3</Badge>
      </div>

      {successMessage && (
        <Alert className="bg-green-50 border-green-200 relative">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {successMessage}
          </AlertDescription>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6"
            onClick={() => setSuccessMessage(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        </Alert>
      )}

      {uploadError && (
        <Alert className="bg-red-50 border-red-200 relative">
          <CircleAlert className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Error:</strong> {uploadError}
          </AlertDescription>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6"
            onClick={() => setUploadError(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        </Alert>
      )}

      {loading && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl shadow-xl flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
            <span className="font-medium">Processing...</span>
          </div>
        </div>
      )}

      {crawling && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
              <span className="font-medium">Crawling Websites...</span>
            </div>
            <Progress value={(crawlProgress.current / crawlProgress.total) * 100} className="w-64" />
            <div className="text-sm text-slate-600 mt-2 text-center">
              {crawlProgress.current} / {crawlProgress.total} companies
            </div>
          </div>
        </div>
      )}

      {enriching && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
              <span className="font-medium">Enriching Names & Sectors...</span>
            </div>
            <Progress value={(enrichProgress.current / enrichProgress.total) * 100} className="w-64" />
            <div className="text-sm text-slate-600 mt-2 text-center">
              {enrichProgress.current} / {enrichProgress.total} companies
            </div>
          </div>
        </div>
      )}

      <Tabs value={page} onValueChange={setPage}>
        <TabsList className="bg-white border border-slate-200">
          <TabsTrigger value="grata">Grata Data</TabsTrigger>
          <TabsTrigger value="settings"><Settings className="w-4 h-4 mr-1"/>Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="grata" className="space-y-6">
          {grCompaniesRaw.length === 0 && (
            <Card className="shadow-sm border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-emerald-600 rounded-lg">
                    <HelpCircle className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-emerald-900 mb-2">Getting Started with Grata Data</h3>
                    <p className="text-sm text-emerald-700 mb-3">
                      Upload your Grata company exports to discover and score potential targets. Focus on bootstrapped, privately-held companies.
                    </p>
                    <Button
                      onClick={() => setShowHowTo(true)}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      View Step-by-Step Guide
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {grCompaniesRaw.length > 0 && (
            <Card className="shadow-sm border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  Data Pipeline Debug
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">{grCompaniesRaw.length}</div>
                    <div className="text-xs text-slate-600 mt-1">Rows Uploaded</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">{normalizedGR.length}</div>
                    <div className="text-xs text-slate-600 mt-1">After Mapping</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-indigo-600">{filteredGR.length}</div>
                    <div className="text-xs text-slate-600 mt-1">After Filters</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-emerald-600">{grScored.length}</div>
                    <div className="text-xs text-slate-600 mt-1">Final Scored</div>
                  </div>
                </div>
                {filteredGR.length === 0 && normalizedGR.length > 0 && (
                  <Alert className="mt-4 bg-amber-50 border-amber-200">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-800 text-sm">
                      <strong>All rows filtered out!</strong> Your filters might be too restrictive. Try adjusting Region, Revenue, or Ownership filters below.
                    </AlertDescription>
                  </Alert>
                )}
                {normalizedGR.length === 0 && grCompaniesRaw.length > 0 && (
                  <Alert className="mt-4 bg-red-50 border-red-200">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800 text-sm">
                      <strong>Column mapping issue!</strong> Go to Settings and map your columns to internal fields.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}
          
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-transparent">
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5 text-emerald-600"/>
                  Upload Grata Companies (.csv/.xlsx)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                <Input 
                  type="file" 
                  accept=".csv,.xlsx" 
                  onChange={(e) => e.target.files && onUpload(e.target.files[0], "gr-companies")}
                  className="cursor-pointer"
                />
                <div className="text-xs text-muted-foreground flex items-start gap-2">
                  <CircleAlert className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  Schema Mapper in Settings handles ranges → midpoint.
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-transparent">
                <CardTitle className="flex items-center gap-2">
                  <Workflow className="w-5 h-5 text-indigo-600"/>
                  Workflow
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground pt-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  Upload → Map headers in Settings
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                  Enrich names & sectors with AI
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  Crawl websites for clinic counts
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                  Filter & score → Save to database
                </div>
              </CardContent>
            </Card>
          </div>

          {grCompaniesRaw.length > 0 && (
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="shadow-sm border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-purple-600"/>
                    Company Names & Sectors
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-700 mb-3">
                    AI generates clean short names and assigns sectors for Outreach campaigns.
                  </p>
                  <Button
                    onClick={enrichNamesAndSectors}
                    disabled={enriching || normalizedGR.length === 0}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Building2 className="w-4 h-4 mr-2" />
                    Enrich Names & Sectors
                  </Button>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5 text-blue-600"/>
                    Website Intelligence
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-700 mb-3">
                    Automatically crawl websites to extract clinic/location counts and verify site health.
                  </p>
                  <Button
                    onClick={crawlWebsites}
                    disabled={crawling || normalizedGR.length === 0}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Globe className="w-4 h-4 mr-2" />
                    Crawl All Websites
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          <Card className="shadow-sm border-slate-200">
            <CardHeader className="bg-gradient-to-r from-amber-50 to-transparent">
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-amber-600"/>
                Filters + Outreach Fields
              </CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-4 pt-4">
              <div className="space-y-2">
                <div className="text-sm font-medium">Region contains (leave blank for all)</div>
                <Input 
                  value={regionFilter} 
                  onChange={(e) => setRegionFilter(e.target.value)}
                  placeholder="e.g., United States"
                />
              </div>
              
              <div className="space-y-2">
                <div className="text-sm font-medium">Ownership preference</div>
                <Select value={ownerPref} onValueChange={setOwnerPref}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Any">Any</SelectItem>
                    <SelectItem value="Founder-owned">Founder/Bootstrapped Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm font-medium">Score threshold</div>
                <div className="px-2">
                  <Slider 
                    value={[scoreThreshold]} 
                    onValueChange={(v) => setScoreThreshold(v[0])} 
                    min={0} 
                    max={100}
                  />
                </div>
                <div className="text-xs text-muted-foreground">Highlight ≥ {scoreThreshold}</div>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm font-medium">Revenue range ($MM)</div>
                <div className="flex gap-2">
                  <Input 
                    type="number" 
                    value={minRev} 
                    onChange={(e) => setMinRev(parseFloat(e.target.value))}
                    placeholder="Min"
                  />
                  <Input 
                    type="number" 
                    value={maxRev} 
                    onChange={(e) => setMaxRev(parseFloat(e.target.value))}
                    placeholder="Max"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm font-medium">Strategic Fit Keywords (+10)</div>
                <Input 
                  placeholder="ex: urgent care, pediatric" 
                  value={fitKeywords} 
                  onChange={(e) => setFitKeywords(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <div className="text-sm font-medium">Outreach Vertical</div>
                <Input value={vertical} onChange={(e) => setVertical(e.target.value)}/>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm font-medium">Outreach Tag</div>
                <Input value={tag} onChange={(e) => setTag(e.target.value)}/>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-slate-200 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Total Qualified Targets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-emerald-600">{grScored.length}</div>
              <div className="text-xs text-muted-foreground mt-2">After filters</div>
            </CardContent>
          </Card>

          {grScored.length > 0 && (
            <Card className="shadow-sm border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Save className="w-5 h-5 text-purple-600"/>
                  Save to Database
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="text-sm font-medium">Campaign Name</div>
                  <Input
                    placeholder="e.g., California Urgent Care Q1 2025"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{selectedTargets.size} selected</Badge>
                  <Button
                    onClick={saveToDatabase}
                    disabled={saving || selectedTargets.size === 0 || !campaignName.trim()}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save {selectedTargets.size} Companies
                      </>
                    )}
                  </Button>
                </div>
                <Alert className="bg-blue-50 border-blue-200">
                  <CircleAlert className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800 text-xs">
                    Duplicates (based on website URL) are automatically skipped. Companies without a website will also be skipped.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}

          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>Targets (Grata – ranked by fit)</CardTitle>
                <div className="flex items-center gap-2">
                  {grScored.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={toggleSelectAll}
                    >
                      {selectedTargets.size === grScored.length ? "Deselect All" : "Select All"}
                    </Button>
                  )}
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                    {grScored.length} qualified
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b-2 border-slate-200 bg-slate-50">
                      <th className="py-3 px-4 font-semibold w-12">
                        <Checkbox
                          checked={selectedTargets.size === grScored.length && grScored.length > 0}
                          onCheckedChange={toggleSelectAll}
                        />
                      </th>
                      <th className="py-3 px-4 font-semibold">Name</th>
                      <th className="py-3 px-4 font-semibold">Short Name</th>
                      <th className="py-3 px-4 font-semibold">Sector</th>
                      <th className="py-3 px-4 font-semibold">HQ</th>
                      <th className="py-3 px-4 font-semibold">Revenue</th>
                      <th className="py-3 px-4 font-semibold">Employees</th>
                      <th className="py-3 px-4 font-semibold">Clinics</th>
                      <th className="py-3 px-4 font-semibold">Website</th>
                      <th className="py-3 px-4 font-semibold">Score</th>
                      <th className="py-3 px-4 font-semibold">Priority</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grScored.map((t, i) => (
                      <tr key={i} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4">
                          <Checkbox
                            checked={selectedTargets.has(i)}
                            onCheckedChange={() => toggleTarget(i)}
                          />
                        </td>
                        <td className="py-3 px-4 max-w-[200px] truncate font-medium">{t.name}</td>
                        <td className="py-3 px-4 text-slate-600">{t.companyShortName || "—"}</td>
                        <td className="py-3 px-4">
                          {t.sectorFocus && (
                            <Badge variant="outline" className="text-xs">{t.sectorFocus}</Badge>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-600">{t.hq}</td>
                        <td className="py-3 px-4 text-slate-600">{isNaN(t.revenue) ? "—" : `$${t.revenue}M`}</td>
                        <td className="py-3 px-4 text-slate-600">{isNaN(t.employees) ? "—" : Math.round(t.employees)}</td>
                        <td className="py-3 px-4 text-slate-600">
                          {t.clinicCount ? (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-blue-600" />
                              {t.clinicCount}
                            </div>
                          ) : "—"}
                        </td>
                        <td className="py-3 px-4">
                          {t.websiteStatus === "working" && (
                            <Badge className="bg-green-100 text-green-700 text-xs">✓</Badge>
                          )}
                          {t.websiteStatus === "broken" && (
                            <Badge className="bg-red-100 text-red-700 text-xs">✗</Badge>
                          )}
                          {!t.websiteStatus && <span className="text-xs text-muted-foreground">—</span>}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-24">
                              <Progress value={t.score} className="h-2" />
                            </div>
                            <span className="text-xs font-medium">{t.score}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {t.score >= scoreThreshold ? (
                            <Badge className="bg-green-100 text-green-700 border-green-200">Priority</Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="space-y-4 mt-6 pt-4 border-t border-slate-200">
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="secondary" 
                    onClick={() => exportCSV("grata_cleaned_scored_targets.csv", grScored)}
                    disabled={loading || grScored.length === 0}
                  >
                    <Download className="w-4 h-4 mr-2"/>CSV
                  </Button>
                  <Button 
                    variant="secondary" 
                    onClick={() => exportExcel("grata_cleaned_scored_targets.xlsx", grScored)}
                    disabled={loading || grScored.length === 0}
                  >
                    <Download className="w-4 h-4 mr-2"/>XLSX
                  </Button>
                  <Button 
                    variant="secondary" 
                    onClick={() => exportCSV("grata_outreach_prospects.csv", outreachCsv(grScored, { source:"Grata", vertical, tag }))}
                    disabled={loading || grScored.length === 0}
                  >
                    <Download className="w-4 h-4 mr-2"/>Outreach CSV
                  </Button>
                  <Button 
                    onClick={() => generateOutputs("Grata", grScored)}
                    className="bg-emerald-600 hover:bg-emerald-700"
                    disabled={grScored.length === 0}
                  >
                    <Sparkles className="w-4 h-4 mr-2"/>Generate Insights + Email
                  </Button>
                </div>
                
                <OutreachIntegration 
                  prospects={grScored.filter(t => t.score >= scoreThreshold)} 
                  onSyncComplete={(result) => {
                    console.log("Sync complete:", result);
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {insights && (
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="bg-gradient-to-r from-green-50 to-transparent">
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-green-600"/>
                  Email Draft
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                <div className="space-y-2">
                  <div className="text-sm font-medium">Subject</div>
                  <Input value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Body</div>
                  <Textarea value={emailBody} onChange={(e) => setEmailBody(e.target.value)} className="h-40" />
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => copy(emailSubject)}>Copy Subject</Button>
                  <Button onClick={() => copy(emailBody)} className="bg-green-600 hover:bg-green-700">Copy Body</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-transparent">
              <CardTitle>Outreach.io Setup</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <Alert className="bg-blue-50 border-blue-200">
                <CircleAlert className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800 text-sm">
                  <strong>First-time setup:</strong> Create an OAuth application in your Outreach.io account (Settings → API → OAuth Applications). 
                  The credentials are already configured. Click "Connect Outreach Account" on the Grata Data tab to start syncing.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <div className="p-4 bg-slate-50 rounded-lg border">
                  <h4 className="font-semibold text-sm mb-2">Configured Secrets</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <code className="text-xs bg-white px-2 py-1 rounded">OUTREACH_CLIENT_ID</code>
                      <Badge className="bg-green-100 text-green-700">Configured</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <code className="text-xs bg-white px-2 py-1 rounded">OUTREACH_CLIENT_SECRET</code>
                      <Badge className="bg-green-100 text-green-700">Configured</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <code className="text-xs bg-white px-2 py-1 rounded">OUTREACH_REDIRECT_URI</code>
                      <Badge className="bg-green-100 text-green-700">Configured</Badge>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-sm text-green-900 mb-2">OAuth Scopes Required:</h4>
                  <div className="space-y-1 text-sm text-green-800">
                    <div>• <code>prospects.all</code> - Create and update prospects</div>
                    <div>• <code>sequences.read</code> - View and select sequences</div>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground">
                  Connect your account from the Grata Data tab to start syncing prospects directly to Outreach.
                </div>
              </div>
            </CardContent>
          </Card>
        
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-transparent">
              <CardTitle>Schema Mapper – Grata</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <SchemaMapper 
                headers={grHeaders} 
                mapping={grMap} 
                setMapping={setGrMap} 
                internalFields={DEFAULT_FIELDS} 
              />
            </CardContent>
          </Card>

          <Card className="shadow-sm border-slate-200">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-transparent">
              <CardTitle>Scoring Methodology</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm font-medium text-blue-900 mb-2">Fit Score (0-100) - Top-of-Funnel Focus</div>
                <div className="space-y-2 text-xs text-blue-700">
                  <div><strong>35 pts:</strong> Employee count proximity to peer median (PRIMARY)</div>
                  <div><strong>25 pts:</strong> Clinic/location count match (if crawled)</div>
                  <div><strong>15 pts:</strong> Revenue proximity to peer median (SECONDARY)</div>
                  <div><strong>15 pts:</b> Website status (working = full points, broken = 0)</div>
                  <div><strong>10 pts:</strong> Strategic fit keywords match</div>
                </div>
              </div>
              
              {insights && (
                <div className="space-y-2 pt-2">
                  <div className="text-sm font-medium">Generated Insights</div>
                  <Textarea value={insights} readOnly className="h-32 bg-slate-50" />
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => copy(insights)}>
                      Copy Insights
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper functions
function normalizeRow(row, map, opts) {
  const pick = (k) => map[k] ? row[map[k]] : undefined;
  const name = pick("Company Name") || row.Company || row["Company"] || row["Name"] || "";

  const revenueRange = pick("Revenue Range");
  const empRange = pick("Employee Range");
  const employeeCountRaw = pick("Employee Count") || row.Employees;

  const revenue = opts?.preferRangeMidpoint && revenueRange ? midpointFromRange(revenueRange) : toNumber(pick("Revenue"));
  const employees = opts?.preferRangeMidpoint && empRange ? midpointFromRange(empRange) : toNumber(employeeCountRaw);
  const lastFinancingYear = pick("Last Financing Year") || yearFrom(String(pick("Notes")||""));

  return {
    name,
    url: pick("URL") || row.URL || row.Website || "",
    website: pick("Website") || row.Website || "",
    linkedin: pick("LinkedIn") || row.LinkedIn || "",
    hq: pick("HQ Location") || row["HQ"] || row.City || row.State || row.Country || "",
    industry: pick("Industry") || row.Industry || "Healthcare Services",
    subsector: pick("Subsector") || row.Subsector || "",
    revenue: isNaN(Number(revenue)) ? undefined : Math.round(Number(revenue) / 1_000_000),
    employees: employees,
    ownership: pick("Ownership") || row.Ownership || "Unknown",
    lastFinancingYear: lastFinancingYear ? parseInt(String(lastFinancingYear),10) : undefined,
    investors: pick("Investors") || row.Investors || "",
    notes: row.Notes || "",
    websiteStatus: row._websiteStatus,
    clinicCount: row._clinicCount,
    companyShortName: row._companyShortName,
    sectorFocus: row._sectorFocus,
    contact: {
      email: pick("Email") || row.Email || "",
      firstName: pick("First Name") || row["First Name"] || "",
      lastName: pick("Last Name") || row["Last Name"] || "",
      title: pick("Job Title") || row["Job Title"] || "",
      phone: pick("Phone") || row.Phone || "",
    }
  };
}

const toNumber = (v) => {
  if (v === null || v === undefined) return NaN;
  if (typeof v === "number") return v;
  const s = String(v).replace(/[$,%\s,]/g, "").replace(/[–—]/g, "-");
  const n = parseFloat(s);
  return isNaN(n) ? NaN : n;
};

const midpointFromRange = (val) => {
  if (!val) return undefined;
  const s = String(val).replace(/[$,\s]/g, "").replace(/[–—]/g, "-").toLowerCase();
  const unit = s.endsWith("m") ? 1_000_000 : s.endsWith("b") ? 1_000_000_000 : s.endsWith("k") ? 1_000 : 1;
  const stripped = s.replace(/[mbk]$/i, "");
  const m = stripped.match(/(\d+(?:\.\d+)?)[^\d]+(\d+(?:\.\d+)?)/);
  if (m) {
    const a = parseFloat(m[1]) * unit;
    const b = parseFloat(m[2]) * unit;
    return (a + b) / 2;
  }
  const single = parseFloat(stripped);
  return isNaN(single) ? undefined : single * unit;
};

const yearFrom = (d) => {
  if (!d) return undefined;
  const m = d.match(/(20\d{2}|19\d{2})/);
  return m ? parseInt(m[1], 10) : undefined;
};
