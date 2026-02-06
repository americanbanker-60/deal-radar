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
import ScoringWeights from "../components/ops/ScoringWeights";
import { filterTargets, scoreTargets } from "../components/ops/analyticsHelpers";
import HowToUse from "../components/ops/HowToUse";
import OutreachIntegration from "../components/ops/OutreachIntegration";
import DataPipelineDebug from "../components/ops/DataPipelineDebug";
import WorkflowSummary from "../components/ops/WorkflowSummary";
import TargetsTable from "../components/ops/TargetsTable";

const DEFAULT_FIELDS = [
  "Name","Domain","Description","LinkedIn","Revenue Estimate","Employee Estimate","Employees on Professional Networks","Total Review Count","Aggregate Rating","City","State","Country","Zip Code","Year Founded","Primary Email","Primary Phone","Notes","Executive First Name","Executive Last Name","Executive Title","Executive Email"
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

  // Scoring weights - load from localStorage
  const [weights, setWeights] = useState(() => {
    try {
      const saved = localStorage.getItem('ops_console_weights');
      return saved ? JSON.parse(saved) : {
        employees: 35,
        clinics: 25,
        revenue: 15,
        website: 15,
        keywords: 10
      };
    } catch {
      return { employees: 35, clinics: 25, revenue: 15, website: 15, keywords: 10 };
    }
  });

  // Target ranges for fit score - load from localStorage
  const [targetMinEmp, setTargetMinEmp] = useState(() => localStorage.getItem('ops_console_targetMinEmp') || "");
  const [targetMaxEmp, setTargetMaxEmp] = useState(() => localStorage.getItem('ops_console_targetMaxEmp') || "");
  const [targetMinRev, setTargetMinRev] = useState(() => localStorage.getItem('ops_console_targetMinRev') || "");
  const [targetMaxRev, setTargetMaxRev] = useState(() => localStorage.getItem('ops_console_targetMaxRev') || "");

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
  const [reclassifyingSectors, setReclassifyingSectors] = useState(false);
  const [sectorProgress, setSectorProgress] = useState({ current: 0, total: 0 });

  // Load saved settings from localStorage on mount
  useEffect(() => {
    try {
      const savedVertical = localStorage.getItem('ops_console_vertical');
      const savedTag = localStorage.getItem('ops_console_tag');
      
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

  // Save settings
  useEffect(() => {
    localStorage.setItem('ops_console_vertical', vertical);
  }, [vertical]);

  useEffect(() => {
    localStorage.setItem('ops_console_tag', tag);
  }, [tag]);

  // Save scoring weights
  useEffect(() => {
    localStorage.setItem('ops_console_weights', JSON.stringify(weights));
  }, [weights]);

  // Save target ranges
  useEffect(() => {
    localStorage.setItem('ops_console_targetMinEmp', targetMinEmp);
    localStorage.setItem('ops_console_targetMaxEmp', targetMaxEmp);
    localStorage.setItem('ops_console_targetMinRev', targetMinRev);
    localStorage.setItem('ops_console_targetMaxRev', targetMaxRev);
  }, [targetMinEmp, targetMaxEmp, targetMinRev, targetMaxRev]);

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  const onUpload = async (file, kind) => {
    console.log("📤 Starting upload:", file.name, "kind:", kind);
    setLoading(true);
    setUploadError(null);
    
    try {
      // First, upload to Base44 CDN
      console.log("☁️ Uploading to CDN...");
      const uploadResult = await base44.integrations.Core.UploadFile({ file });
      const fileUrl = uploadResult.file_url;
      console.log("✅ File uploaded:", fileUrl);

      // Determine file type and call appropriate parser
      const ext = file.name.toLowerCase().split(".").pop();
      console.log("📋 File extension:", ext);
      
      let result;
      if (ext === "csv") {
        console.log("🔄 Calling parseCsvFile...");
        result = await base44.functions.invoke('parseCsvFile', { fileUrl });
      } else {
        console.log("🔄 Calling parseExcelFile...");
        result = await base44.functions.invoke('parseExcelFile', { fileUrl });
      }
      
      console.log("✅ Function returned:", result);
      
      const data = result.data;
      
      console.log("📊 Parsed data:", {
        headers: data.headers?.length,
        rows: data.rows?.length,
        diagnostics: data.diagnostics
      });
      
      if (!data.rows || data.rows.length === 0) {
        throw new Error("No data extracted from file");
      }
      
      if (kind === "gr-companies") { 
        console.log("✅ Setting Grata companies:", data.rows.length);
        // Store file URL in raw data for audit trail
        const rowsWithSource = data.rows.map(r => ({ ...r, _sourceFileUrl: fileUrl }));
        setGrCompaniesRaw(rowsWithSource); 
        setGrHeaders(data.headers || Object.keys(data.rows[0])); 
      }
      
      setLoading(false);
      const method = data.diagnostics?.extractionMethod || "standard parsing";
      showSuccess(`Uploaded ${data.rows.length} rows using ${method}!`);
    } catch (error) {
      console.error("❌ Upload error:", error);
      setUploadError(error.message || String(error));
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

    const { crawlCompanyWebsite } = await import("../components/ops/enrichmentHelpers");
    const enrichedRows = [];

    for (let i = 0; i < normalizedGR.length; i++) {
      const company = normalizedGR[i];
      setCrawlProgress({ current: i + 1, total: normalizedGR.length });

      const crawlResult = await crawlCompanyWebsite(company);
      enrichedRows.push({
        ...company,
        ...crawlResult
      });
    }

    // Update the raw data with enriched information
    const enrichedMap = new Map(enrichedRows.map(r => [r.name, r]));
    const updatedRaw = grCompaniesRaw.map(raw => {
      const normalized = normalizeRow(raw);
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

    const { generateShortName, classifyCompanySector } = await import("../components/ops/enrichmentHelpers");
    const enrichedRows = [];

    for (let i = 0; i < normalizedGR.length; i++) {
      const company = normalizedGR[i];
      setEnrichProgress({ current: i + 1, total: normalizedGR.length });

      try {
        const [shortName, sector] = await Promise.all([
          generateShortName(company.name),
          classifyCompanySector(company)
        ]);

        enrichedRows.push({
          ...company,
          companyShortName: shortName,
          sectorFocus: sector
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
      const normalized = normalizeRow(raw);
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
      const selectedList = grScored.filter((_, index) => selectedTargets.has(index));
      
      // Get existing targets for AI comparison
      const existingTargets = await base44.entities.BDTarget.list();
      
      if (existingTargets.length === 0) {
        // No existing records, save all
        const targetsToSave = selectedList.map(t => ({
          campaign: campaignName.trim(),
          name: t.name,
          companyShortName: t.companyShortName,
          sectorFocus: t.sectorFocus,
          website: t.website,
          websiteStatus: t.websiteStatus,
          city: t.city,
          state: t.state,
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
        
        await base44.entities.BDTarget.bulkCreate(targetsToSave);
        showSuccess(`Saved ${targetsToSave.length} companies to "${campaignName}"!`);
        setSelectedTargets(new Set());
        setCampaignName("");
        setSaving(false);
        return;
      }

      // Use AI to detect duplicates with fuzzy matching
      const newCompaniesData = selectedList.map(t => ({
        name: t.name,
        domain: t.website,
        city: t.city,
        state: t.state
      }));
      
      const existingCompaniesData = existingTargets.map(t => ({
        name: t.name,
        domain: t.website,
        city: t.city,
        state: t.state
      }));

      const prompt = `You are a duplicate detection system. Compare these two lists of companies and identify which companies from the NEW list are duplicates of companies in the EXISTING list.

EXISTING COMPANIES:
${JSON.stringify(existingCompaniesData, null, 2)}

NEW COMPANIES TO CHECK:
${JSON.stringify(newCompaniesData, null, 2)}

Instructions:
- Match companies by name similarity (e.g., "ABC Health" vs "ABC Healthcare"), domain similarity, or location if names are very similar
- Return a JSON array of indices (0-based) from the NEW list that are duplicates
- Be strict: only mark as duplicate if you're confident they're the same company
- If no duplicates, return an empty array`;

      const aiResult = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: false,
        response_json_schema: {
          type: "object",
          properties: {
            duplicate_indices: {
              type: "array",
              items: { type: "number" }
            }
          }
        }
      });

      const duplicateIndices = new Set(aiResult.duplicate_indices || []);
      const targetsToSave = [];
      let duplicateCount = 0;

      selectedList.forEach((t, idx) => {
        if (duplicateIndices.has(idx)) {
          duplicateCount++;
          console.log(`AI detected duplicate: ${t.name}`);
          return;
        }

        targetsToSave.push({
          campaign: campaignName.trim(),
          name: t.name,
          companyShortName: t.companyShortName,
          sectorFocus: t.sectorFocus,
          website: t.website,
          websiteStatus: t.websiteStatus,
          city: t.city,
          state: t.state,
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
        });
      });

      if (targetsToSave.length === 0) {
        setUploadError("All selected companies are duplicates of existing records.");
        setSaving(false);
        return;
      }

      console.log(`Saving ${targetsToSave.length} companies to campaign: ${campaignName}`);
      await base44.entities.BDTarget.bulkCreate(targetsToSave);
      
      const message = duplicateCount > 0 
        ? `Saved ${targetsToSave.length} companies to "${campaignName}"! (${duplicateCount} AI-detected duplicates skipped)`
        : `Saved ${targetsToSave.length} companies to "${campaignName}"!`;
      
      showSuccess(message);
      setSelectedTargets(new Set());
      setCampaignName("");
    } catch (error) {
      console.error("Save error:", error);
      setUploadError("Failed to save: " + (error.message || String(error)));
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

  const recalculateAllScores = async () => {
    setRecalculatingScores(true);
    try {
      const result = await base44.functions.invoke('calculateFitScores', {
        weights,
        targetRange: {
          minEmployees: targetMinEmp ? parseInt(targetMinEmp) : null,
          maxEmployees: targetMaxEmp ? parseInt(targetMaxEmp) : null,
          minRevenue: targetMinRev ? parseFloat(targetMinRev) : null,
          maxRevenue: targetMaxRev ? parseFloat(targetMaxRev) : null
        },
        fitKeywords: vertical
      });
      
      showSuccess(`Updated scores for ${result.data.updated} saved targets!`);
    } catch (error) {
      console.error('Score calculation error:', error);
      setUploadError('Failed to recalculate scores: ' + error.message);
    }
    setRecalculatingScores(false);
  };

  const reclassifySelectedSectors = async () => {
    const selectedList = grScored.filter((_, index) => selectedTargets.has(index));
    
    if (selectedList.length === 0) {
      setUploadError("Please select targets to reclassify");
      return;
    }

    setReclassifyingSectors(true);
    setSectorProgress({ current: 0, total: selectedList.length });

    const { classifyCompanySector } = await import("../components/ops/enrichmentHelpers");
    const enrichedRows = [];

    for (let i = 0; i < selectedList.length; i++) {
      const company = selectedList[i];
      setSectorProgress({ current: i + 1, total: selectedList.length });

      const sector = await classifyCompanySector(company);
      enrichedRows.push({
        ...company,
        sectorFocus: sector
      });
    }

    // Update the raw data
    const enrichedMap = new Map(enrichedRows.map(r => [r.name, r]));
    const updatedRaw = grCompaniesRaw.map(raw => {
      const normalized = normalizeRow(raw);
      const enriched = enrichedMap.get(normalized.name);
      if (enriched) {
        raw._sectorFocus = enriched.sectorFocus;
      }
      return raw;
    });

    setGrCompaniesRaw(updatedRaw);
    setReclassifyingSectors(false);
    setSectorProgress({ current: 0, total: 0 });
    showSuccess(`Reclassified ${enrichedRows.length} company sectors!`);
  };
  
  const normalizedGR = useMemo(() => {
    const normalized = grCompaniesRaw.map((r) => normalizeRow(r));
    console.log("🔄 Normalized data:", {
      total: normalized.length,
      sample: normalized[0]
    });
    return normalized;
  }, [grCompaniesRaw]);
  
  const filteredGR = useMemo(() => {
    const filtered = filterTargets(normalizedGR, { regionFilter, minRev, maxRev, ownerPref });
    console.log("🔄 Filtered data:", {
      total: filtered.length,
      filters: { regionFilter, minRev, maxRev, ownerPref }
    });
    return filtered;
  }, [normalizedGR, regionFilter, minRev, maxRev, ownerPref]);
  
  const grScored = useMemo(() => {
    const scored = scoreTargets(filteredGR, { 
      fitKeywords,
      weights,
      targetRange: {
        minEmployees: targetMinEmp ? parseInt(targetMinEmp) : null,
        maxEmployees: targetMaxEmp ? parseInt(targetMaxEmp) : null,
        minRevenue: targetMinRev ? parseFloat(targetMinRev) : null,
        maxRevenue: targetMaxRev ? parseFloat(targetMaxRev) : null
      }
    });
    console.log("🔄 Scored data:", {
      total: scored.length,
      fitKeywords,
      weights
    });
    return scored;
  }, [filteredGR, fitKeywords, weights, targetMinEmp, targetMaxEmp, targetMinRev, targetMaxRev]);

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
      setUploadError("Failed to export Excel: " + (error.message || String(error)));
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
      setUploadError("Failed to export CSV: " + (error.message || String(error)));
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
    <div className="w-full mx-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <HowToUse open={showHowTo} onClose={() => setShowHowTo(false)} />
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200">
        <img 
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6914b46d39cf2944cbc25c62/f8da923e2_image.png" 
          alt="Deal Radar Logo" 
          className="w-12 h-12 object-contain flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Grata Ops Console</h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">Top-of-funnel deal sourcing for bootstrapped companies</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Link to={createPageUrl("SavedTargets")} className="flex-1 sm:flex-none">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-md w-full sm:w-auto text-xs sm:text-sm">
              <Database className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
              <span className="hidden sm:inline">View Saved Targets</span>
              <span className="sm:hidden">Saved</span>
            </Button>
          </Link>
          <Button
            variant="outline"
            onClick={() => setShowHowTo(true)}
            className="gap-2 text-xs sm:text-sm"
          >
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">How to Use</span>
            <span className="sm:hidden">Help</span>
          </Button>
          <Badge variant="secondary" className="self-center">v3</Badge>
        </div>
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

      {reclassifyingSectors && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="font-medium">Reclassifying Sectors...</span>
            </div>
            <Progress value={(sectorProgress.current / sectorProgress.total) * 100} className="w-64" />
            <div className="text-sm text-slate-600 mt-2 text-center">
              {sectorProgress.current} / {sectorProgress.total} companies
            </div>
          </div>
        </div>
      )}

      {generatingRationales && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
              <span className="font-medium">Generating Strategic Rationales...</span>
            </div>
            <Progress value={(rationaleProgress.current / rationaleProgress.total) * 100} className="w-64" />
            <div className="text-sm text-slate-600 mt-2 text-center">
              {rationaleProgress.current} / {rationaleProgress.total} targets
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
            <DataPipelineDebug
              rawCount={grCompaniesRaw.length}
              normalizedCount={normalizedGR.length}
              filteredCount={filteredGR.length}
              scoredCount={grScored.length}
            />
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
            
            <WorkflowSummary />
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
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{selectedTargets.size} selected</Badge>
                  <Button
                    variant="outline"
                    onClick={reclassifySelectedSectors}
                    disabled={reclassifyingSectors || selectedTargets.size === 0}
                    className="text-xs sm:text-sm"
                  >
                    {reclassifyingSectors ? (
                      <>
                        <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2 animate-spin" />
                        Reclassifying...
                      </>
                    ) : (
                      <>
                        <Building2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                        AI Reclassify Sectors
                      </>
                    )}
                  </Button>
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
                    Duplicates (based on company name) are automatically skipped.
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
            <CardContent className="p-0">
              <TargetsTable
                targets={grScored}
                selectedTargets={selectedTargets}
                onToggleTarget={toggleTarget}
                onToggleAll={toggleSelectAll}
                scoreThreshold={scoreThreshold}
              />
              
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
              <CardTitle>AI Column Detection</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <SchemaMapper headers={grHeaders} />
            </CardContent>
          </Card>

          <ScoringWeights
            weights={weights}
            setWeights={setWeights}
            targetMinEmp={targetMinEmp}
            setTargetMinEmp={setTargetMinEmp}
            targetMaxEmp={targetMaxEmp}
            setTargetMaxEmp={setTargetMaxEmp}
            targetMinRev={targetMinRev}
            setTargetMinRev={setTargetMinRev}
            targetMaxRev={targetMaxRev}
            setTargetMaxRev={setTargetMaxRev}
            onRecalculate={recalculatingScores ? null : recalculateAllScores}
          />

          {insights && (
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="bg-gradient-to-r from-green-50 to-transparent">
                <CardTitle>Generated Insights</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <Textarea value={insights} readOnly className="h-32 bg-slate-50" />
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => copy(insights)}>
                    Copy Insights
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper functions
function normalizeRow(row) {
  const revenue = toNumber(row["Revenue Estimate"]);
  const employees = toNumber(row["Employee Estimate"]);

  return {
    name: row.Name || "",
    url: row.Domain || "",
    website: row.Domain || "",
    linkedin: row.LinkedIn || "",
    city: row.City || "",
    state: row.State || "",
    hq: (row.City || "") + (row.State ? ", " + row.State : ""),
    industry: "Healthcare Services",
    subsector: "",
    revenue: isNaN(Number(revenue)) ? undefined : Math.round(Number(revenue) / 1_000_000),
    employees: employees,
    ownership: "Unknown",
    lastFinancingYear: toNumber(row["Year Founded"]),
    investors: "",
    notes: row.Notes || "",
    websiteStatus: row._websiteStatus,
    clinicCount: row._clinicCount || toNumber(row["Clinic Location Count"]),
    companyShortName: row._companyShortName || row["Short Name"] || "",
    sectorFocus: row._sectorFocus || row.Sector || "",
    contact: {
      email: row["Executive Email"] || row["Primary Email"] || "",
      firstName: row["Executive First Name"] || "",
      lastName: row["Executive Last Name"] || "",
      title: row["Executive Title"] || "",
      phone: row["Primary Phone"] || "",
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