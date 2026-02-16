import React, { useMemo, useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Download, Upload, Sparkles, Database, Settings, CircleAlert, Loader2, HelpCircle, CheckCircle2, X, Globe, Building2, Save, Plus } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";

import SchemaMapper from "../components/ops/SchemaMapper";
import ScoringWeights from "../components/ops/ScoringWeights";
import HowToUse from "../components/ops/HowToUse";
import DataPipelineDebug from "../components/ops/DataPipelineDebug";
import WorkflowSummary from "../components/ops/WorkflowSummary";
import TargetsTable from "../components/ops/TargetsTable";
import { filterTargets, scoreTargets, toNumber, midpointFromRange, normalizeState, cleanCompanyNameRegex } from "../components/utils/data-engine";

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
  // Shared filters & settings
  const [regionFilter, setRegionFilter] = useState("");
  const [minRev, setMinRev] = useState(0);
  const [maxRev, setMaxRev] = useState(100000);
  const [ownerPref, setOwnerPref] = useState("Any");

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

  // New states for saving targets
  const [selectedTargets, setSelectedTargets] = useState(new Set());
  const [campaignName, setCampaignName] = useState("");
  const [selectedCampaignId, setSelectedCampaignId] = useState("");
  const [campaigns, setCampaigns] = useState([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [showNewCampaignDialog, setShowNewCampaignDialog] = useState(false);
  const [newCampaignData, setNewCampaignData] = useState({
    name: "",
    description: "",
    vertical: "Healthcare Services",
    status: "active"
  });
  const [saving, setSaving] = useState(false);
  const [scoreThreshold] = useState(70);
  const [reclassifyingSectors, setReclassifyingSectors] = useState(false);
  const [sectorProgress, setSectorProgress] = useState({ current: 0, total: 0 });
  const [recalculatingScores, setRecalculatingScores] = useState(false);
  const [showLookalikeDialog, setShowLookalikeDialog] = useState(false);
  const [lookalikeTarget, setLookalikeTarget] = useState(null);
  const [lookalikes, setLookalikes] = useState([]);
  const [findingLookalikes, setFindingLookalikes] = useState(false);
  const [addingLookalike, setAddingLookalike] = useState(null);

  // Load saved settings and campaigns on mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const savedVertical = localStorage.getItem('ops_console_vertical');
        const savedTag = localStorage.getItem('ops_console_tag');
        
        if (savedVertical) {
          setVertical(savedVertical);
        }
        if (savedTag) {
          setTag(savedTag);
        }

        // Load existing campaigns
        setLoadingCampaigns(true);
        const existingCampaigns = await base44.entities.Campaign.list('-created_date');
        setCampaigns(existingCampaigns);
        setLoadingCampaigns(false);
      } catch (error) {
        console.error("Error loading initial data:", error);
        setLoadingCampaigns(false);
      }
    };

    loadInitialData();
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

    try {
      const companies = normalizedGR.map(company => ({
        name: company.name,
        website: company.website
      }));

      const result = await base44.functions.invoke('bulkCrawlWebsites', {
        companies
      });

      const crawledCompanies = result.data.crawledCompanies;

      // Update the raw data with crawled information
      const crawledMap = new Map(crawledCompanies.map(c => [c.name, c]));
      const updatedRaw = grCompaniesRaw.map(raw => {
        const normalized = normalizeRow(raw);
        const crawled = crawledMap.get(normalized.name);
        if (crawled) {
          raw._websiteStatus = crawled.websiteStatus;
          raw._clinicCount = crawled.clinicCount;
          raw._lastActive = crawled.lastActive;
          raw._dormancyFlag = crawled.dormancyFlag;
        }
        return raw;
      });

      setGrCompaniesRaw(updatedRaw);
      
      const errorMsg = result.data.errors?.length > 0 
        ? ` (${result.data.errors.length} errors)` 
        : '';
      showSuccess(`Crawled ${crawledCompanies.length} company websites!${errorMsg}`);
    } catch (error) {
      console.error("Bulk crawl error:", error);
      setUploadError("Failed to crawl websites: " + (error.message || String(error)));
    }
    
    setCrawling(false);
  };

  const enrichNamesAndSectors = async () => {
    if (normalizedGR.length === 0) {
      setUploadError("No companies to enrich. Please upload data first.");
      return;
    }

    setEnriching(true);

    try {
      const result = await base44.functions.invoke('bulkEnrichTargets', {
        targets: normalizedGR
      });

      const enrichedRows = result.data.enrichedTargets;

      // Update the raw data with enriched information
      const enrichedMap = new Map(enrichedRows.map(r => [r.name, r]));
      const updatedRaw = grCompaniesRaw.map(raw => {
        const normalized = normalizeRow(raw);
        const enriched = enrichedMap.get(normalized.name);
        if (enriched) {
          raw._companyShortName = enriched.companyShortName;
          raw._correspondenceName = enriched.correspondenceName;
          raw._sectorFocus = enriched.sectorFocus;
        }
        return raw;
      });

      setGrCompaniesRaw(updatedRaw);
      
      const errorMsg = result.data.errors?.length > 0 
        ? ` (${result.data.errors.length} errors)` 
        : '';
      showSuccess(`Enriched ${enrichedRows.length} company names and sectors!${errorMsg}`);
    } catch (error) {
      console.error("Bulk enrichment error:", error);
      setUploadError("Failed to enrich: " + (error.message || String(error)));
    }
    
    setEnriching(false);
  };
  
  const createNewCampaign = async () => {
    if (!newCampaignData.name.trim()) {
      setUploadError("Please enter a campaign name");
      return;
    }

    try {
      const campaign = await base44.entities.Campaign.create(newCampaignData);
      setCampaigns(prev => [campaign, ...prev]);
      setSelectedCampaignId(campaign.id);
      setCampaignName(campaign.name);
      setShowNewCampaignDialog(false);
      setNewCampaignData({
        name: "",
        description: "",
        vertical: "Healthcare Services",
        status: "active"
      });
      showSuccess(`Campaign "${campaign.name}" created!`);
    } catch (error) {
      console.error("Error creating campaign:", error);
      setUploadError("Failed to create campaign: " + error.message);
    }
  };

  const saveToDatabase = async () => {
    if (selectedTargets.size === 0) {
      setUploadError("Please select companies to save");
      return;
    }

    if (!selectedCampaignId && !campaignName.trim()) {
      setUploadError("Please select or create a campaign");
      return;
    }

    setSaving(true);
    
    try {
      const selectedList = grScored.filter((_, index) => selectedTargets.has(index));
      
      // Determine campaign name and ID
      const finalCampaignId = selectedCampaignId || null;
      const finalCampaignName = selectedCampaignId 
        ? campaigns.find(c => c.id === selectedCampaignId)?.name 
        : campaignName.trim();
      
      // Get existing targets for AI comparison
      const existingTargets = await base44.entities.BDTarget.list('-created_date', 5000);
      
      if (existingTargets.length === 0) {
        // No existing records, save all in batches
        const targetsToSave = selectedList.map(t => ({
          campaign: finalCampaignName,
          campaign_id: finalCampaignId,
          name: t.name,
          companyShortName: t.companyShortName,
          correspondenceName: t.correspondenceName,
          sectorFocus: t.sectorFocus,
          website: t.website,
          websiteStatus: t.websiteStatus,
          lastActive: t.lastActive,
          dormancyFlag: t.dormancyFlag,
          personalization_snippet: t.personalization_snippet,
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
        
        // Save in batches of 500
        const BATCH_SIZE = 500;
        let savedCount = 0;
        for (let i = 0; i < targetsToSave.length; i += BATCH_SIZE) {
          const batch = targetsToSave.slice(i, i + BATCH_SIZE);
          await base44.entities.BDTarget.bulkCreate(batch);
          savedCount += batch.length;
          console.log(`Saved batch ${Math.floor(i / BATCH_SIZE) + 1}: ${savedCount}/${targetsToSave.length}`);
        }
        
        showSuccess(`Saved ${targetsToSave.length} companies to "${finalCampaignName}"!`);
        setSelectedTargets(new Set());
        setSelectedCampaignId("");
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

      // For large batches (>100), skip AI duplicate detection to avoid timeouts
      let targetsToSave = [];
      let duplicateCount = 0;
      
      if (selectedList.length > 100) {
        console.log(`Large batch (${selectedList.length}), using simple duplicate check by website`);
        const existingWebsites = new Set(existingTargets.map(t => t.website?.toLowerCase()).filter(Boolean));
        
        selectedList.forEach((t) => {
          if (t.website && existingWebsites.has(t.website.toLowerCase())) {
            duplicateCount++;
            console.log(`Duplicate website: ${t.name}`);
            return;
          }
          
          targetsToSave.push({
            campaign: finalCampaignName,
            campaign_id: finalCampaignId,
            name: t.name,
            companyShortName: t.companyShortName,
            correspondenceName: t.correspondenceName,
            sectorFocus: t.sectorFocus,
            website: t.website,
            websiteStatus: t.websiteStatus,
            lastActive: t.lastActive,
            dormancyFlag: t.dormancyFlag,
            personalization_snippet: t.personalization_snippet,
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
      } else {
        // Use AI for smaller batches
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

        selectedList.forEach((t, idx) => {
          if (duplicateIndices.has(idx)) {
            duplicateCount++;
            console.log(`AI detected duplicate: ${t.name}`);
            return;
          }

          targetsToSave.push({
            campaign: finalCampaignName,
            campaign_id: finalCampaignId,
            name: t.name,
            companyShortName: t.companyShortName,
            correspondenceName: t.correspondenceName,
            sectorFocus: t.sectorFocus,
            website: t.website,
            websiteStatus: t.websiteStatus,
            lastActive: t.lastActive,
            dormancyFlag: t.dormancyFlag,
            personalization_snippet: t.personalization_snippet,
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
      }

      if (targetsToSave.length === 0) {
        setUploadError("All selected companies are duplicates of existing records.");
        setSaving(false);
        return;
      }

      console.log(`Saving ${targetsToSave.length} companies to campaign: ${campaignName}`);
      
      // Save in batches of 500
      const BATCH_SIZE = 500;
      let savedCount = 0;
      for (let i = 0; i < targetsToSave.length; i += BATCH_SIZE) {
        const batch = targetsToSave.slice(i, i + BATCH_SIZE);
        await base44.entities.BDTarget.bulkCreate(batch);
        savedCount += batch.length;
        console.log(`Saved batch ${Math.floor(i / BATCH_SIZE) + 1}: ${savedCount}/${targetsToSave.length}`);
      }
      
      const message = duplicateCount > 0 
        ? `Saved ${targetsToSave.length} companies to "${finalCampaignName}"! (${duplicateCount} AI-detected duplicates skipped)`
        : `Saved ${targetsToSave.length} companies to "${finalCampaignName}"!`;
      
      showSuccess(message);
      setSelectedTargets(new Set());
      setSelectedCampaignId("");
      setCampaignName("");
      
      // Redirect to Saved Targets page after 1 second
      setTimeout(() => {
        window.location.href = createPageUrl("SavedTargets");
      }, 1000);
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

  const toggleTarget = useCallback((index) => {
    setSelectedTargets(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(index)) {
        newSelected.delete(index);
      } else {
        newSelected.add(index);
      }
      return newSelected;
    });
  }, []);

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

  const generateRationalesForSelected = async () => {
    const selectedList = grScored.filter((_, index) => selectedTargets.has(index));
    const highScoring = selectedList.filter(t => t.score >= scoreThreshold);
    
    if (highScoring.length === 0) {
      setUploadError("No high-scoring (priority) targets selected. Select targets with score >= " + scoreThreshold);
      return;
    }

    setGeneratingRationales(true);
    setRationaleProgress({ current: 0, total: highScoring.length });

    for (let i = 0; i < highScoring.length; i++) {
      const target = highScoring[i];
      setRationaleProgress({ current: i + 1, total: highScoring.length });

      try {
        const result = await base44.functions.invoke('generateRationale', { 
          targetId: target.id,
          weights 
        });
        
        // Update local state with the rationale
        target.notes = result.data.rationale;
      } catch (error) {
        console.error(`Error generating rationale for ${target.name}:`, error);
      }
    }

    // Force re-render by updating the raw data
    setGrCompaniesRaw([...grCompaniesRaw]);
    setGeneratingRationales(false);
    setRationaleProgress({ current: 0, total: 0 });
    showSuccess(`Generated strategic rationales for ${highScoring.length} priority targets!`);
  };

  const bulkPersonalizeSelected = async () => {
    const selectedList = grScored.filter((_, index) => selectedTargets.has(index));
    
    if (selectedList.length === 0) {
      setUploadError("Please select targets to personalize");
      return;
    }

    setPersonalizingTargets(true);
    setPersonalizeProgress({ current: 0, total: selectedList.length });

    for (let i = 0; i < selectedList.length; i++) {
      const target = selectedList[i];
      setPersonalizeProgress({ current: i + 1, total: selectedList.length });

      try {
        const city = target.city || "your area";
        const sector = target.sectorFocus || target.subsector || "healthcare";
        
        const prompt = `Write a single, natural personalized opening line for a business development email to ${target.name}. 

Location: ${city}
Sector: ${sector}

The opening should be conversational and reference their location and sector naturally. Examples:
- "I saw your work in the Dallas pediatric space..."
- "Your urgent care presence in Austin caught my attention..."
- "I noticed your dermatology practice in Miami..."

Write ONLY the opening line, no quotes, no explanation. Make it sound natural and genuine.`;

        const result = await base44.integrations.Core.InvokeLLM({
          prompt,
          add_context_from_internet: false
        });

        // Update the raw data with personalization snippet
        const enrichedMap = grCompaniesRaw.findIndex(raw => 
          normalizeRow(raw).name === target.name
        );
        if (enrichedMap >= 0) {
          grCompaniesRaw[enrichedMap]._personalization_snippet = result.trim();
        }
      } catch (error) {
        console.error(`Error personalizing ${target.name}:`, error);
      }
    }

    setGrCompaniesRaw([...grCompaniesRaw]);
    setPersonalizingTargets(false);
    setPersonalizeProgress({ current: 0, total: 0 });
    showSuccess(`Generated personalized openers for ${selectedList.length} targets!`);
  };

  const detectGrowthSignalsForSelected = async () => {
    const selectedList = grScored.filter((_, index) => selectedTargets.has(index));
    
    if (selectedList.length === 0) {
      setUploadError("Please select targets to analyze");
      return;
    }

    setDetectingGrowth(true);
    setGrowthProgress({ current: 0, total: selectedList.length });

    for (let i = 0; i < selectedList.length; i++) {
      const target = selectedList[i];
      setGrowthProgress({ current: i + 1, total: selectedList.length });

      try {
        const prompt = `Search for recent news about "${target.name}" (${target.website || 'healthcare company'}) from the last 6 months.

Look for:
1. New office/clinic openings
2. Awards and recognition
3. Executive hires
4. Funding/Investment
5. Growth indicators

Return JSON with brief summaries (1 sentence each):
{
  "signals": ["Opened 3rd location in Phoenix (Jan 2026)"],
  "hasGrowthSignals": true
}`;

        const result = await base44.integrations.Core.InvokeLLM({
          prompt,
          add_context_from_internet: true,
          response_json_schema: {
            type: "object",
            properties: {
              signals: { type: "array", items: { type: "string" } },
              hasGrowthSignals: { type: "boolean" }
            }
          }
        });

        // Update the raw data with growth signals
        const enrichedIndex = grCompaniesRaw.findIndex(raw => 
          normalizeRow(raw).name === target.name
        );
        if (enrichedIndex >= 0) {
          grCompaniesRaw[enrichedIndex]._growthSignals = result.signals || [];
        }
      } catch (error) {
        console.error(`Error detecting growth for ${target.name}:`, error);
      }
    }

    setGrCompaniesRaw([...grCompaniesRaw]);
    setDetectingGrowth(false);
    setGrowthProgress({ current: 0, total: 0 });
    showSuccess(`Detected growth signals for ${selectedList.length} companies!`);
  };

  const findLookalikes = async (target) => {
    setLookalikeTarget(target);
    setShowLookalikeDialog(true);
    setFindingLookalikes(true);
    setLookalikes([]);

    try {
      const prompt = `Search for 3 similar healthcare companies to "${target.name}" that match these criteria:

Target Company Profile:
- Name: ${target.name}
- Sector: ${target.sectorFocus || target.subsector || "Healthcare Services"}
- Location: ${target.city}, ${target.state}
- Revenue: ~$${target.revenue}M
- Employees: ~${target.employees}

Search Criteria:
- Same or similar subsector (${target.sectorFocus || target.subsector || "Healthcare Services"})
- Similar geographic region (${target.state} or nearby states)
- Revenue range: $${minRev}M - $${maxRev}M
- Employee range: similar size to target

For each company found, provide:
1. Full company name
2. Website URL
3. City and State
4. Estimated revenue (in millions)
5. Estimated employee count
6. Brief description of what they do

Return JSON:
{
  "companies": [
    {
      "name": "Company Name",
      "website": "https://example.com",
      "city": "City",
      "state": "State",
      "revenue": 10,
      "employees": 50,
      "description": "Brief description"
    }
  ]
}`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            companies: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  website: { type: "string" },
                  city: { type: "string" },
                  state: { type: "string" },
                  revenue: { type: "number" },
                  employees: { type: "number" },
                  description: { type: "string" }
                }
              }
            }
          }
        }
      });

      setLookalikes(result.companies || []);
    } catch (error) {
      console.error("Error finding lookalikes:", error);
      setUploadError("Failed to find lookalikes: " + error.message);
    }
    
    setFindingLookalikes(false);
  };

  const addLookalikeToDatabase = async (lookalike) => {
    setAddingLookalike(lookalike.name);
    
    try {
      await base44.entities.BDTarget.create({
        campaign: campaignName.trim() || "Lookalike Discovery",
        name: lookalike.name,
        website: lookalike.website,
        city: lookalike.city,
        state: lookalike.state,
        revenue: lookalike.revenue,
        employees: lookalike.employees,
        notes: lookalike.description,
        sectorFocus: lookalikeTarget.sectorFocus,
        status: "new"
      });

      showSuccess(`Added ${lookalike.name} to database!`);
      
      // Remove from lookalikes list
      setLookalikes(prev => prev.filter(l => l.name !== lookalike.name));
    } catch (error) {
      console.error("Error adding lookalike:", error);
      setUploadError("Failed to add lookalike: " + error.message);
    }
    
    setAddingLookalike(null);
  };

  const reclassifySelectedSectors = async () => {
    const selectedList = grScored.filter((_, index) => selectedTargets.has(index));
    
    if (selectedList.length === 0) {
      setUploadError("Please select targets to reclassify");
      return;
    }

    setReclassifyingSectors(true);
    setSectorProgress({ current: 0, total: selectedList.length });

    const { classifyCompanySector } = await import("../components/utils/data-engine");
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
  
  const normalizeRow = useCallback((row) => {
    const rawRevenue = row["Revenue Estimate"];
    const rawEmployees = row["Employee Estimate"];
    const rawName = row.Name || "";
    const cleanedName = cleanCompanyNameRegex(rawName);
    const normalizedState = normalizeState(row.State);

    let revenue = midpointFromRange(rawRevenue);
    if (revenue && revenue > 1_000_000) {
      revenue = Math.round(revenue / 1_000_000);
    } else if (revenue === undefined) {
      const numRevenue = toNumber(rawRevenue);
      revenue = isNaN(Number(numRevenue)) ? undefined : Math.round(Number(numRevenue) / 1_000_000);
    }

    let employees = midpointFromRange(rawEmployees);
    if (employees === undefined) {
      employees = toNumber(rawEmployees);
    }
    employees = employees ? Math.round(employees) : undefined;

    return {
      name: cleanedName,
      url: row.Domain || "",
      website: row.Domain || "",
      linkedin: row.LinkedIn || "",
      city: row.City || "",
      state: normalizedState,
      hq: (row.City || "") + (normalizedState ? ", " + normalizedState : ""),
      industry: "Healthcare Services",
      subsector: "",
      revenue: revenue,
      employees: employees,
      ownership: "Unknown",
      lastFinancingYear: toNumber(row["Year Founded"]),
      investors: "",
      notes: row.Notes || "",
      websiteStatus: row._websiteStatus,
      clinicCount: row._clinicCount || toNumber(row["Clinic Location Count"]),
      lastActive: row._lastActive,
      dormancyFlag: row._dormancyFlag,
      companyShortName: row._companyShortName || row["Short Name"] || "",
      correspondenceName: row._correspondenceName || "",
      sectorFocus: row._sectorFocus || row.Sector || "",
      personalization_snippet: row._personalization_snippet || "",
      growthSignals: (row._growthSignals || []).join(", "),
      contact: {
        email: row["Executive Email"] || row["Primary Email"] || "",
        firstName: row["Executive First Name"] || "",
        lastName: row["Executive Last Name"] || "",
        title: row["Executive Title"] || "",
        phone: row["Primary Phone"] || "",
      }
    };
  }, []);

  const normalizedGR = useMemo(() => {
    const normalized = grCompaniesRaw.map((r) => normalizeRow(r));
    console.log("🔄 Normalized data:", {
      total: normalized.length,
      sample: normalized[0]
    });
    return normalized;
  }, [grCompaniesRaw, normalizeRow]);
  
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
      fitKeywords: vertical,
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
      fitKeywords: vertical,
      weights
    });
    return scored;
  }, [filteredGR, vertical, weights, targetMinEmp, targetMaxEmp, targetMinRev, targetMaxRev]);

  const downloadText = (filename, text) => {
    const blob = new Blob([text], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; 
    a.download = filename; 
    a.click(); 
    URL.revokeObjectURL(url);
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
      "Correspondence Name": r.correspondenceName || r.name,
      "Sector Focus": r.sectorFocus || "",
      "Job Title": r.contact?.title || "",
      "Account Name": r.name || "",
      Source: opts.source,
      Vertical: opts.vertical,
      Tag: opts.tag,
      Score: r.score ?? "",
      Region: r.hq || "",
      Clinics: r.clinicCount || "",
      "Personalization": r.personalization_snippet || "",
    }));
    return out;
  };



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
          <p className="text-xs sm:text-sm text-slate-600 mt-1">Import, filter, and score Grata data • All enrichment and outreach happens on Saved Targets</p>
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
            <div className="flex items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
              <span className="font-medium">Crawling Websites...</span>
            </div>
            <div className="text-sm text-slate-600 mt-2">
              Processing {normalizedGR.length} companies in backend
            </div>
          </div>
        </div>
      )}

      {enriching && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl shadow-xl">
            <div className="flex items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
              <span className="font-medium">Enriching Names & Sectors...</span>
            </div>
            <div className="text-sm text-slate-600 mt-2">
              Processing {normalizedGR.length} companies in backend
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



      <Dialog open={showNewCampaignDialog} onOpenChange={setShowNewCampaignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Campaign</DialogTitle>
            <DialogDescription>
              Define a new campaign to organize your targets
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Campaign Name *</label>
              <Input
                placeholder="e.g., California Urgent Care Q1 2025"
                value={newCampaignData.name}
                onChange={(e) => setNewCampaignData({...newCampaignData, name: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input
                placeholder="Brief description of this campaign"
                value={newCampaignData.description}
                onChange={(e) => setNewCampaignData({...newCampaignData, description: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Vertical</label>
              <Input
                placeholder="e.g., Healthcare Services"
                value={newCampaignData.vertical}
                onChange={(e) => setNewCampaignData({...newCampaignData, vertical: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={newCampaignData.status}
                onValueChange={(value) => setNewCampaignData({...newCampaignData, status: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowNewCampaignDialog(false);
                  setNewCampaignData({
                    name: "",
                    description: "",
                    vertical: "Healthcare Services",
                    status: "active"
                  });
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={createNewCampaign}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Create Campaign
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showLookalikeDialog} onOpenChange={setShowLookalikeDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Find Lookalike Companies</DialogTitle>
            <DialogDescription>
              {lookalikeTarget && (
                <span>Similar companies to <strong>{lookalikeTarget.name}</strong> in {lookalikeTarget.sectorFocus || "Healthcare Services"}</span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {findingLookalikes ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
                <p className="text-sm text-slate-600">Searching for similar companies...</p>
              </div>
            </div>
          ) : lookalikes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-slate-600">No lookalike companies found. Try adjusting your filters.</p>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              {lookalikes.map((lookalike, idx) => (
                <div key={idx} className="border rounded-lg p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900 mb-1">{lookalike.name}</h3>
                      <div className="space-y-1 text-sm text-slate-600">
                        <div className="flex items-center gap-4">
                          <span>📍 {lookalike.city}, {lookalike.state}</span>
                          <span>💰 ${lookalike.revenue}M revenue</span>
                          <span>👥 {lookalike.employees} employees</span>
                        </div>
                        {lookalike.website && (
                          <div className="flex items-center gap-2">
                            <Globe className="w-3 h-3" />
                            <a href={lookalike.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              {lookalike.website}
                            </a>
                          </div>
                        )}
                        {lookalike.description && (
                          <p className="text-slate-600 mt-2">{lookalike.description}</p>
                        )}
                      </div>
                    </div>
                    <Button
                      onClick={() => addLookalikeToDatabase(lookalike)}
                      disabled={addingLookalike === lookalike.name}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      {addingLookalike === lookalike.name ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Add to Database
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

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
                    <h3 className="font-semibold text-emerald-900 mb-2">Data Intake & Filtering</h3>
                    <p className="text-sm text-emerald-700 mb-3">
                      Upload Grata exports, filter and score companies, then save to your database. All AI enrichment and outreach happens on the Saved Targets page.
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
                  <div className="text-sm font-medium">Select Campaign</div>
                  <div className="flex gap-2">
                    <Select
                      value={selectedCampaignId}
                      onValueChange={(value) => {
                        if (value === "new") {
                          setShowNewCampaignDialog(true);
                        } else {
                          setSelectedCampaignId(value);
                          setCampaignName("");
                        }
                      }}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder={loadingCampaigns ? "Loading campaigns..." : "Select existing campaign..."} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">
                          <div className="flex items-center gap-2">
                            <Plus className="w-4 h-4" />
                            Create New Campaign
                          </div>
                        </SelectItem>
                        {campaigns.map((campaign) => (
                          <SelectItem key={campaign.id} value={campaign.id}>
                            {campaign.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {!selectedCampaignId && (
                    <div className="mt-2">
                      <div className="text-xs text-slate-500 mb-1">Or enter a new campaign name:</div>
                      <Input
                        placeholder="e.g., California Urgent Care Q1 2025"
                        value={campaignName}
                        onChange={(e) => setCampaignName(e.target.value)}
                      />
                    </div>
                  )}
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
                    disabled={saving || selectedTargets.size === 0 || (!selectedCampaignId && !campaignName.trim())}
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
                    Duplicates are auto-skipped. After saving, you'll be redirected to Saved Targets to begin enrichment and outreach.
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
                onFindLookalikes={findLookalikes}
              />
              
              <div className="space-y-4 mt-6 pt-4 border-t border-slate-200">
                <Alert className="bg-purple-50 border-purple-200">
                  <CircleAlert className="h-4 w-4 text-purple-600" />
                  <AlertDescription className="text-purple-800 text-xs">
                    <strong>Next Step:</strong> After saving, go to <strong>Saved Targets</strong> to run AI enrichment (Growth Signals, Rationales, Personalization) and sync to Outreach.
                  </AlertDescription>
                </Alert>
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
                </div>
              </div>
            </CardContent>
          </Card>


        </TabsContent>

        <TabsContent value="settings" className="space-y-6">

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
        </TabsContent>
      </Tabs>
    </div>
  );
}

// normalizeRow moved to useCallback inside component for performance