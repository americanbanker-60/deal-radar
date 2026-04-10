import React, { useMemo, useReducer, useEffect, useCallback, useState } from "react";
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
import ColumnMapper, { applyMapping } from "../components/ops/ColumnMapper";
import DuplicateResolver, { detectDuplicates, mergeNewIntoExisting, overwriteWithIncoming } from "../components/ops/DuplicateResolver";
import ScoringWeights from "../components/ops/ScoringWeights";
import HowToUse from "../components/ops/HowToUse";
import DataPipelineDebug from "../components/ops/DataPipelineDebug";
import WorkflowSummary from "../components/ops/WorkflowSummary";
import TargetsTable from "../components/ops/TargetsTable";
import OutreachStatusBadge from "../components/ops/OutreachStatusBadge";
import { filterTargets, scoreTargets, toNumber, midpointFromRange, normalizeState, cleanCompanyNameRegex } from "../components/utils/data-engine";
import { reducer, initialState, ActionTypes } from "./ops-console/useOpsConsoleReducer";

export default function OpsConsole(){
  const [state, dispatch] = useReducer(reducer, initialState);
  const [showHealthAlerts, setShowHealthAlerts] = useState(false);

  const {
    // Upload
    loading, uploadError, successMessage, grCompaniesRaw, grHeaders, pendingUpload, showColumnMapper, showDuplicateResolver, duplicateData,
    // Crawl
    crawling, crawlProgress,
    // Enrich
    enriching, enrichProgress, reclassifyingSectors, sectorProgress, recalculatingScores,
    // Filters
    regionFilter, minRev, maxRev, ownerPref,
    // Scoring
    weights, targetMinEmp, targetMaxEmp, targetMinRev, targetMaxRev, scoreThreshold,
    // Campaign
    campaignName, selectedCampaignId, campaigns, loadingCampaigns, showNewCampaignDialog, newCampaignData,
    // Save
    saving, saveProgress,
    // UI
    page, showHowTo, showLookalikeDialog, lookalikeTarget, lookalikes, findingLookalikes, addingLookalike,
    // Selection
    selectedTargets,
    // Settings
    vertical, tag,
    // Personalize
    personalizingTargets, personalizeProgress,
    // Growth
    detectingGrowth, growthProgress,
    // Rationale
    generatingRationales, rationaleProgress,
    // Health
    healthAlertCount,
    healthAlertTargets,
  } = state;

  // Load health alert count on mount
  useEffect(() => {
    const loadHealthAlerts = async () => {
      try {
        const allTargets = await base44.entities.BDTarget.list('-created_date', 500);
        const alertTargets = allTargets.filter(t =>
          t.websiteStatus === 'broken' || t.dormancyFlag === true
        );
        dispatch({ type: ActionTypes.SET_HEALTH_ALERT_COUNT, payload: { count: alertTargets.length, targets: alertTargets } });
      } catch (err) {
        console.error('Failed to load health alerts:', err);
      }
    };
    loadHealthAlerts();
  }, []);

  // Load saved settings and campaigns on mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Load existing campaigns
        dispatch({ type: ActionTypes.SET_LOADING_CAMPAIGNS, payload: true });
        const existingCampaigns = await base44.entities.Campaign.list('-created_date');
        dispatch({ type: ActionTypes.SET_CAMPAIGNS, payload: existingCampaigns });
        dispatch({ type: ActionTypes.SET_LOADING_CAMPAIGNS, payload: false });
      } catch (error) {
        console.error("Error loading initial data:", error);
        dispatch({ type: ActionTypes.SET_LOADING_CAMPAIGNS, payload: false });
      }
    };

    loadInitialData();
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('ops_console_vertical', vertical);
  }, [vertical]);

  useEffect(() => {
    localStorage.setItem('ops_console_tag', tag);
  }, [tag]);

  // Save scoring weights to localStorage
  useEffect(() => {
    localStorage.setItem('ops_console_weights', JSON.stringify(weights));
  }, [weights]);

  // Save target ranges to localStorage
  useEffect(() => {
    localStorage.setItem('ops_console_targetMinEmp', targetMinEmp);
    localStorage.setItem('ops_console_targetMaxEmp', targetMaxEmp);
    localStorage.setItem('ops_console_targetMinRev', targetMinRev);
    localStorage.setItem('ops_console_targetMaxRev', targetMaxRev);
  }, [targetMinEmp, targetMaxEmp, targetMinRev, targetMaxRev]);

  const showSuccess = (message) => {
    dispatch({ type: ActionTypes.SET_SUCCESS_MESSAGE, payload: message });
    setTimeout(() => dispatch({ type: ActionTypes.SET_SUCCESS_MESSAGE, payload: null }), 5000);
  };

  const onUpload = async (file) => {
    dispatch({ type: ActionTypes.SET_LOADING, payload: true });
    dispatch({ type: ActionTypes.SET_UPLOAD_ERROR, payload: null });

    try {
      const uploadResult = await base44.integrations.Core.UploadFile({ file });
      const fileUrl = uploadResult.file_url;

      const ext = file.name.toLowerCase().split(".").pop();

      let result;
      if (ext === "csv") {
        result = await base44.functions.invoke('parseCsvFile', { fileUrl });
      } else {
        result = await base44.functions.invoke('parseExcelFile', { fileUrl });
      }

      const data = result.data;

      if (!data.rows || data.rows.length === 0) {
        throw new Error("No data extracted from file. Please check the file format.");
      }

      const headers = data.headers || Object.keys(data.rows[0]);
      const rowsWithSource = data.rows.map(r => ({ ...r, _sourceFileUrl: fileUrl }));

      // Store parsed data and show the column mapper
      dispatch({ type: ActionTypes.SET_PENDING_UPLOAD, payload: { rows: rowsWithSource, headers } });
      dispatch({ type: ActionTypes.SET_SHOW_COLUMN_MAPPER, payload: true });
      dispatch({ type: ActionTypes.SET_LOADING, payload: false });

      showSuccess(`✓ Parsed ${data.rows.length} rows with ${headers.length} columns. Map your columns below.`);
    } catch (error) {
      console.error("❌ Upload error:", error);
      dispatch({ type: ActionTypes.SET_UPLOAD_ERROR, payload: error.message || "File processing failed." });
      dispatch({ type: ActionTypes.SET_LOADING, payload: false });
    }
  };

  const confirmColumnMapping = useCallback(async (mapping) => {
    if (!pendingUpload) return;

    const { rows } = pendingUpload;

    // Apply the user's column mapping to each row
    const mappedRows = rows.map(row => {
      const mapped = applyMapping(row, mapping);
      return { ...row, _mapped: mapped };
    });

    dispatch({ type: ActionTypes.SET_SHOW_COLUMN_MAPPER, payload: false });

    // Check for duplicates against existing database targets
    dispatch({ type: ActionTypes.SET_LOADING, payload: true });
    try {
      const existingTargets = await base44.entities.BDTarget.list('-created_date', 50000);
      const { newRows, duplicateRows } = detectDuplicates(mappedRows, existingTargets);

      if (duplicateRows.length > 0) {
        // Show duplicate resolver
        dispatch({ type: ActionTypes.SET_DUPLICATE_DATA, payload: { newRows, duplicateRows, mapping } });
        dispatch({ type: ActionTypes.SET_SHOW_DUPLICATE_RESOLVER, payload: true });
        dispatch({ type: ActionTypes.SET_LOADING, payload: false });
      } else {
        // No duplicates — import directly
        dispatch({ type: ActionTypes.SET_GR_COMPANIES_RAW, payload: mappedRows });
        dispatch({ type: ActionTypes.SET_GR_HEADERS, payload: Object.keys(mapping) });
        dispatch({ type: ActionTypes.SET_PENDING_UPLOAD, payload: null });
        dispatch({ type: ActionTypes.SET_LOADING, payload: false });
        showSuccess(`✓ Imported ${mappedRows.length} companies (no duplicates found)`);
      }
    } catch (err) {
      console.error("Duplicate check failed:", err);
      // Fall back to importing everything if duplicate check fails
      dispatch({ type: ActionTypes.SET_GR_COMPANIES_RAW, payload: mappedRows });
      dispatch({ type: ActionTypes.SET_GR_HEADERS, payload: Object.keys(mapping) });
      dispatch({ type: ActionTypes.SET_PENDING_UPLOAD, payload: null });
      dispatch({ type: ActionTypes.SET_LOADING, payload: false });
      showSuccess(`✓ Imported ${mappedRows.length} companies (duplicate check skipped)`);
    }
  }, [pendingUpload]);

  const confirmDuplicateStrategy = useCallback(async (strategy) => {
    if (!duplicateData) return;

    const { newRows, duplicateRows, mapping } = duplicateData;

    dispatch({ type: ActionTypes.SET_SHOW_DUPLICATE_RESOLVER, payload: false });

    if (strategy === "ignore") {
      // Only import new rows
      dispatch({ type: ActionTypes.SET_GR_COMPANIES_RAW, payload: newRows });
      dispatch({ type: ActionTypes.SET_GR_HEADERS, payload: Object.keys(mapping) });
      dispatch({ type: ActionTypes.SET_PENDING_UPLOAD, payload: null });
      dispatch({ type: ActionTypes.SET_DUPLICATE_DATA, payload: null });
      showSuccess(`✓ Imported ${newRows.length} new companies. Skipped ${duplicateRows.length} duplicates.`);
      return;
    }

    // For "fill" or "overwrite", update existing targets in the database
    dispatch({ type: ActionTypes.SET_LOADING, payload: true });
    let updatedCount = 0;

    try {
      for (const dup of duplicateRows) {
        const updates = strategy === "fill"
          ? mergeNewIntoExisting(dup._existingTarget, dup)
          : overwriteWithIncoming(dup);

        if (Object.keys(updates).length > 0) {
          await base44.entities.BDTarget.update(dup._existingTarget.id, updates);
          updatedCount++;
        }
      }
    } catch (err) {
      console.error("Error updating duplicates:", err);
      dispatch({ type: ActionTypes.SET_UPLOAD_ERROR, payload: "Some duplicate updates failed: " + err.message });
    }

    // Import the new rows into the local table
    dispatch({ type: ActionTypes.SET_GR_COMPANIES_RAW, payload: newRows });
    dispatch({ type: ActionTypes.SET_GR_HEADERS, payload: Object.keys(mapping) });
    dispatch({ type: ActionTypes.SET_PENDING_UPLOAD, payload: null });
    dispatch({ type: ActionTypes.SET_DUPLICATE_DATA, payload: null });
    dispatch({ type: ActionTypes.SET_LOADING, payload: false });

    const action = strategy === "fill" ? "filled missing data for" : "overwrote";
    showSuccess(`✓ Imported ${newRows.length} new companies. ${action} ${updatedCount} existing targets.`);
  }, [duplicateData]);

  const cancelColumnMapping = useCallback(() => {
    dispatch({ type: ActionTypes.SET_SHOW_COLUMN_MAPPER, payload: false });
    dispatch({ type: ActionTypes.SET_SHOW_DUPLICATE_RESOLVER, payload: false });
    dispatch({ type: ActionTypes.SET_PENDING_UPLOAD, payload: null });
    dispatch({ type: ActionTypes.SET_DUPLICATE_DATA, payload: null });
  }, []);

  const crawlWebsites = async () => {
    if (normalizedGR.length === 0) {
      dispatch({ type: ActionTypes.SET_UPLOAD_ERROR, payload: "No companies to crawl. Please upload data first." });
      return;
    }

    dispatch({ type: ActionTypes.SET_CRAWLING, payload: true });
    dispatch({ type: ActionTypes.SET_CRAWL_PROGRESS, payload: { current: 0, total: normalizedGR.length } });

    try {
      const companies = normalizedGR.map(company => ({
        name: company.name,
        website: company.website
      }));

      // Process in batches to show progress
      const BATCH_SIZE = 50;
      const allCrawled = [];

      for (let i = 0; i < companies.length; i += BATCH_SIZE) {
        const batch = companies.slice(i, i + BATCH_SIZE);

        const result = await base44.functions.invoke('bulkCrawlWebsites', {
          companies: batch
        });

        allCrawled.push(...(result.data.crawledCompanies || []));
        dispatch({ type: ActionTypes.SET_CRAWL_PROGRESS, payload: { current: Math.min(i + BATCH_SIZE, companies.length), total: companies.length } });
      }

      // Update the raw data with crawled information
      const crawledMap = new Map(allCrawled.map(c => [c.name, c]));
      const updatedRaw = grCompaniesRaw.map(raw => {
        const normalized = normalizeRow(raw);
        const crawled = crawledMap.get(normalized.name);
        if (crawled) {
          raw._websiteStatus = crawled.websiteStatus;
          raw._clinicCount = crawled.clinicCount;
          raw._lastActive = crawled.lastActive;
          raw._dormancyFlag = crawled.dormancyFlag;
          raw._crawlRationale = crawled.crawlRationale;
        }
        return raw;
      });

      dispatch({ type: ActionTypes.SET_GR_COMPANIES_RAW, payload: updatedRaw });
      showSuccess(`Crawled ${allCrawled.length} company websites!`);
    } catch (error) {
      console.error("Bulk crawl error:", error);
      dispatch({ type: ActionTypes.SET_UPLOAD_ERROR, payload: "Failed to crawl websites: " + (error.message || String(error)) });
    }

    dispatch({ type: ActionTypes.SET_CRAWLING, payload: false });
    dispatch({ type: ActionTypes.SET_CRAWL_PROGRESS, payload: { current: 0, total: 0 } });
  };

  const enrichNamesAndSectors = async () => {
    if (normalizedGR.length === 0) {
      dispatch({ type: ActionTypes.SET_UPLOAD_ERROR, payload: "No companies to enrich. Please upload data first." });
      return;
    }

    dispatch({ type: ActionTypes.SET_ENRICHING, payload: true });
    dispatch({ type: ActionTypes.SET_ENRICH_PROGRESS, payload: { current: 0, total: normalizedGR.length } });

    try {
      // Process in batches to show progress
      const BATCH_SIZE = 50;
      const allEnriched = [];

      for (let i = 0; i < normalizedGR.length; i += BATCH_SIZE) {
        const batch = normalizedGR.slice(i, i + BATCH_SIZE);

        const result = await base44.functions.invoke('bulkEnrichTargets', {
          targets: batch
        });

        allEnriched.push(...(result.data.enrichedTargets || []));
        dispatch({ type: ActionTypes.SET_ENRICH_PROGRESS, payload: { current: Math.min(i + BATCH_SIZE, normalizedGR.length), total: normalizedGR.length } });
      }

      // Update the raw data with enriched information
      const enrichedMap = new Map(allEnriched.map(r => [r.name, r]));
      const updatedRaw = grCompaniesRaw.map(raw => {
        const normalized = normalizeRow(raw);
        const enriched = enrichedMap.get(normalized.name);
        if (enriched) {
          raw._companyShortName = enriched.companyShortName;
          raw._correspondenceName = enriched.correspondenceName;
          raw._sectorFocus = enriched.sectorFocus;
          raw._sectorRationale = enriched.sectorRationale;
        }
        return raw;
      });

      dispatch({ type: ActionTypes.SET_GR_COMPANIES_RAW, payload: updatedRaw });
      showSuccess(`Enriched ${allEnriched.length} company names and sectors!`);
    } catch (error) {
      console.error("Bulk enrichment error:", error);
      dispatch({ type: ActionTypes.SET_UPLOAD_ERROR, payload: "Failed to enrich: " + (error.message || String(error)) });
    }

    dispatch({ type: ActionTypes.SET_ENRICHING, payload: false });
    dispatch({ type: ActionTypes.SET_ENRICH_PROGRESS, payload: { current: 0, total: 0 } });
  };
  
  const createNewCampaign = async () => {
    if (!newCampaignData.name.trim()) {
      dispatch({ type: ActionTypes.SET_UPLOAD_ERROR, payload: "Please enter a campaign name" });
      return;
    }

    try {
      const campaign = await base44.entities.Campaign.create(newCampaignData);
      dispatch({ type: ActionTypes.CAMPAIGN_CREATED, payload: campaign });
      showSuccess(`Campaign "${campaign.name}" created!`);
    } catch (error) {
      console.error("Error creating campaign:", error);
      dispatch({ type: ActionTypes.SET_UPLOAD_ERROR, payload: "Failed to create campaign: " + error.message });
    }
  };

  const saveToDatabase = async () => {
    if (selectedTargets.size === 0) {
      dispatch({ type: ActionTypes.SET_UPLOAD_ERROR, payload: "Please select companies to save" });
      return;
    }

    if (!selectedCampaignId && !campaignName.trim()) {
      dispatch({ type: ActionTypes.SET_UPLOAD_ERROR, payload: "Please select or create a campaign" });
      return;
    }

    dispatch({ type: ActionTypes.SET_SAVING, payload: true });

    try {
      const selectedList = grScored.filter((_, index) => selectedTargets.has(index));

      // Determine campaign name and ID — create a formal Campaign record if one doesn't exist yet
      let finalCampaignId = selectedCampaignId || null;
      let finalCampaignName = selectedCampaignId
        ? campaigns.find(c => c.id === selectedCampaignId)?.name
        : campaignName.trim();

      if (!finalCampaignId && finalCampaignName) {
        dispatch({ type: ActionTypes.SET_SAVE_PROGRESS, payload: { current: 0, total: 1, step: "Creating campaign record..." } });
        const newCampaign = await base44.entities.Campaign.create({
          name: finalCampaignName,
          vertical: vertical || "Healthcare Services",
          status: "active",
        });
        finalCampaignId = newCampaign.id;
        dispatch({ type: ActionTypes.PREPEND_CAMPAIGN, payload: newCampaign });
      }
      
      // Prepare targets for upsert
      const targetsToUpsert = selectedList.map(t => ({
        campaign: finalCampaignName,
        campaign_id: finalCampaignId,
        name: t.name,
        companyShortName: t.companyShortName,
        correspondenceName: t.correspondenceName,
        sectorFocus: t.sectorFocus,
        sectorRationale: t.sectorRationale,
        website: t.website,
        websiteStatus: t.websiteStatus,
        lastActive: t.lastActive,
        dormancyFlag: t.dormancyFlag,
        crawlRationale: t.crawlRationale,
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
      
      // Process in batches to avoid timeouts
      const BATCH_SIZE = 100;
      const totalBatches = Math.ceil(targetsToUpsert.length / BATCH_SIZE);
      
      let totalCreated = 0;
      let totalUpdated = 0;
      let totalSkipped = 0;
      const allErrors = [];
      
      dispatch({ type: ActionTypes.SET_SAVE_PROGRESS, payload: { current: 0, total: targetsToUpsert.length, step: "Starting..." } });

      for (let i = 0; i < targetsToUpsert.length; i += BATCH_SIZE) {
        const batch = targetsToUpsert.slice(i, i + BATCH_SIZE);
        const batchNum = Math.floor(i / BATCH_SIZE) + 1;

        dispatch({ type: ActionTypes.SET_SAVE_PROGRESS, payload: {
          current: i,
          total: targetsToUpsert.length,
          step: `Processing batch ${batchNum} of ${totalBatches}...`
        }});
        
        try {
          const result = await base44.functions.invoke('upsertBDTargets', {
            targets: batch,
            campaign: finalCampaignName
          });
          
          totalCreated += result.data.created || 0;
          totalUpdated += result.data.updated || 0;
          totalSkipped += result.data.skipped || 0;
          if (result.data.errors) {
            allErrors.push(...result.data.errors);
          }
        } catch (error) {
          console.error(`Batch ${batchNum} error:`, error);
          allErrors.push({
            batch: batchNum,
            error: error.message || String(error)
          });
        }
        
        dispatch({ type: ActionTypes.SET_SAVE_PROGRESS, payload: {
          current: Math.min(i + BATCH_SIZE, targetsToUpsert.length),
          total: targetsToUpsert.length,
          step: `Completed batch ${batchNum} of ${totalBatches}`
        }});
      }
      
      const summary = [
        totalCreated > 0 && `✓ ${totalCreated} new targets created`,
        totalUpdated > 0 && `↻ ${totalUpdated} existing targets updated with new info`,
        totalSkipped > 0 && `⊝ ${totalSkipped} skipped (no new data)`,
        allErrors.length > 0 && `✗ ${allErrors.length} errors`
      ].filter(Boolean).join('\n');
      
      showSuccess(`Saved ${targetsToUpsert.length} records to "${finalCampaignName}"!\n${summary}`);
      dispatch({ type: ActionTypes.SET_SELECTED_TARGETS, payload: new Set() });
      dispatch({ type: ActionTypes.SET_SELECTED_CAMPAIGN_ID, payload: "" });
      dispatch({ type: ActionTypes.SET_CAMPAIGN_NAME, payload: "" });
      
      // Redirect to Saved Targets page after 2 seconds
      setTimeout(() => {
        window.location.href = createPageUrl("SavedTargets");
      }, 2000);
    } catch (error) {
      console.error("Save error:", error);
      dispatch({ type: ActionTypes.SET_UPLOAD_ERROR, payload: "Failed to save: " + (error.message || String(error)) });
    }

    dispatch({ type: ActionTypes.SET_SAVING, payload: false });
    dispatch({ type: ActionTypes.SET_SAVE_PROGRESS, payload: { current: 0, total: 0, step: "" } });
  };

  const toggleSelectAll = () => {
    if (selectedTargets.size === grScored.length) {
      dispatch({ type: ActionTypes.SET_SELECTED_TARGETS, payload: new Set() });
    } else {
      dispatch({ type: ActionTypes.SET_SELECTED_TARGETS, payload: new Set(grScored.map((_, i) => i)) });
    }
  };

  const toggleTarget = useCallback((index) => {
    const newSelected = new Set(selectedTargets);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    dispatch({ type: ActionTypes.SET_SELECTED_TARGETS, payload: newSelected });
  }, [selectedTargets]);

  const recalculateAllScores = async () => {
    dispatch({ type: ActionTypes.SET_RECALCULATING_SCORES, payload: true });
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
      dispatch({ type: ActionTypes.SET_UPLOAD_ERROR, payload: 'Failed to recalculate scores: ' + error.message });
    }
    dispatch({ type: ActionTypes.SET_RECALCULATING_SCORES, payload: false });
  };

  const generateRationalesForSelected = async () => {
    const selectedList = grScored.filter((_, index) => selectedTargets.has(index));
    const highScoring = selectedList.filter(t => t.score >= scoreThreshold);

    if (highScoring.length === 0) {
      dispatch({ type: ActionTypes.SET_UPLOAD_ERROR, payload: "No high-scoring (priority) targets selected. Select targets with score >= " + scoreThreshold });
      return;
    }

    dispatch({ type: ActionTypes.SET_GENERATING_RATIONALES, payload: true });
    dispatch({ type: ActionTypes.SET_RATIONALE_PROGRESS, payload: { current: 0, total: highScoring.length } });

    for (let i = 0; i < highScoring.length; i++) {
      const target = highScoring[i];
      dispatch({ type: ActionTypes.SET_RATIONALE_PROGRESS, payload: { current: i + 1, total: highScoring.length } });

      try {
        const rationale = await base44.integrations.Core.InvokeLLM({
          prompt: `Write a 2-sentence strategic investment thesis for acquiring "${target.name}" (${target.website || 'healthcare'} in ${target.city || '?'}, ${target.state || '?'}). Sector: ${target.sectorFocus || 'Healthcare'}. Revenue: ~$${target.revenue || '?'}M. Employees: ${target.employees || '?'}. Be specific and data-driven.`,
          add_context_from_internet: true
        });
        target.notes = rationale.trim();
      } catch (error) {
        console.error(`Error generating rationale for ${target.name}:`, error);
      }
    }

    dispatch({ type: ActionTypes.SET_GR_COMPANIES_RAW, payload: [...grCompaniesRaw] });
    dispatch({ type: ActionTypes.SET_GENERATING_RATIONALES, payload: false });
    dispatch({ type: ActionTypes.SET_RATIONALE_PROGRESS, payload: { current: 0, total: 0 } });
    showSuccess(`Generated strategic rationales for ${highScoring.length} priority targets!`);
  };

  const bulkPersonalizeSelected = async () => {
    const selectedList = grScored.filter((_, index) => selectedTargets.has(index));

    if (selectedList.length === 0) {
      dispatch({ type: ActionTypes.SET_UPLOAD_ERROR, payload: "Please select targets to personalize" });
      return;
    }

    dispatch({ type: ActionTypes.SET_PERSONALIZING_TARGETS, payload: true });
    dispatch({ type: ActionTypes.SET_PERSONALIZE_PROGRESS, payload: { current: 0, total: selectedList.length } });

    for (let i = 0; i < selectedList.length; i++) {
      const target = selectedList[i];
      dispatch({ type: ActionTypes.SET_PERSONALIZE_PROGRESS, payload: { current: i + 1, total: selectedList.length } });

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

    dispatch({ type: ActionTypes.SET_GR_COMPANIES_RAW, payload: [...grCompaniesRaw] });
    dispatch({ type: ActionTypes.SET_PERSONALIZING_TARGETS, payload: false });
    dispatch({ type: ActionTypes.SET_PERSONALIZE_PROGRESS, payload: { current: 0, total: 0 } });
    showSuccess(`Generated personalized openers for ${selectedList.length} targets!`);
  };

  const detectGrowthSignalsForSelected = async () => {
    const selectedList = grScored.filter((_, index) => selectedTargets.has(index));

    if (selectedList.length === 0) {
      dispatch({ type: ActionTypes.SET_UPLOAD_ERROR, payload: "Please select targets to analyze" });
      return;
    }

    dispatch({ type: ActionTypes.SET_DETECTING_GROWTH, payload: true });
    dispatch({ type: ActionTypes.SET_GROWTH_PROGRESS, payload: { current: 0, total: selectedList.length } });

    for (let i = 0; i < selectedList.length; i++) {
      const target = selectedList[i];
      dispatch({ type: ActionTypes.SET_GROWTH_PROGRESS, payload: { current: i + 1, total: selectedList.length } });

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

    dispatch({ type: ActionTypes.SET_GR_COMPANIES_RAW, payload: [...grCompaniesRaw] });
    dispatch({ type: ActionTypes.SET_DETECTING_GROWTH, payload: false });
    dispatch({ type: ActionTypes.SET_GROWTH_PROGRESS, payload: { current: 0, total: 0 } });
    showSuccess(`Detected growth signals for ${selectedList.length} companies!`);
  };

  const findLookalikes = async (target) => {
    dispatch({ type: ActionTypes.OPEN_LOOKALIKE_DIALOG, payload: target });

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

      dispatch({ type: ActionTypes.SET_LOOKALIKES, payload: result.companies || [] });
    } catch (error) {
      console.error("Error finding lookalikes:", error);
      dispatch({ type: ActionTypes.SET_UPLOAD_ERROR, payload: "Failed to find lookalikes: " + error.message });
    }

    dispatch({ type: ActionTypes.SET_FINDING_LOOKALIKES, payload: false });
  };

  const addLookalikeToDatabase = async (lookalike) => {
    dispatch({ type: ActionTypes.SET_ADDING_LOOKALIKE, payload: lookalike.name });
    
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
      dispatch({ type: ActionTypes.SET_LOOKALIKES, payload: lookalikes.filter(l => l.name !== lookalike.name) });
    } catch (error) {
      console.error("Error adding lookalike:", error);
      dispatch({ type: ActionTypes.SET_UPLOAD_ERROR, payload: "Failed to add lookalike: " + error.message });
    }

    dispatch({ type: ActionTypes.SET_ADDING_LOOKALIKE, payload: null });
  };

  const reclassifySelectedSectors = async () => {
    const selectedList = grScored.filter((_, index) => selectedTargets.has(index));

    if (selectedList.length === 0) {
      dispatch({ type: ActionTypes.SET_UPLOAD_ERROR, payload: "Please select targets to reclassify" });
      return;
    }

    dispatch({ type: ActionTypes.SET_RECLASSIFYING_SECTORS, payload: true });
    dispatch({ type: ActionTypes.SET_SECTOR_PROGRESS, payload: { current: 0, total: selectedList.length } });

    const { classifyCompanySector } = await import("../components/utils/data-engine");
    const enrichedRows = [];

    for (let i = 0; i < selectedList.length; i++) {
      const company = selectedList[i];
      dispatch({ type: ActionTypes.SET_SECTOR_PROGRESS, payload: { current: i + 1, total: selectedList.length } });

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

    dispatch({ type: ActionTypes.SET_GR_COMPANIES_RAW, payload: updatedRaw });
    dispatch({ type: ActionTypes.SET_RECLASSIFYING_SECTORS, payload: false });
    dispatch({ type: ActionTypes.SET_SECTOR_PROGRESS, payload: { current: 0, total: 0 } });
    showSuccess(`Reclassified ${enrichedRows.length} company sectors!`);
  };
  
  const normalizeRow = useCallback((row) => {
    try {
      // If column mapper was used, use the pre-mapped data
      if (row._mapped) {
        const m = row._mapped;
        const cleanedName = cleanCompanyNameRegex(m.name);
        const ns = m.state ? normalizeState(m.state) : "";
        let revenue = midpointFromRange(m.revenue);
        if (revenue && revenue > 1_000_000) revenue = Math.round(revenue / 1_000_000);
        else if (revenue === undefined) {
          const n = toNumber(m.revenue);
          revenue = isNaN(Number(n)) ? undefined : (Number(n) > 10000 ? Math.round(Number(n) / 1_000_000) : Number(n));
        }
        let employees = midpointFromRange(m.employees);
        if (employees === undefined) employees = toNumber(m.employees);
        employees = employees ? Math.round(employees) : undefined;

        return {
          name: cleanedName,
          url: m.website || "",
          website: m.website || "",
          linkedin: m.linkedin || "",
          city: m.city || "",
          state: ns,
          hq: (m.city || "") + (ns ? ", " + ns : ""),
          industry: m.industry || "Healthcare Services",
          subsector: "",
          revenue,
          employees,
          ownership: m.ownership || "Unknown",
          notes: m.notes || "",
          websiteStatus: row._websiteStatus,
          clinicCount: row._clinicCount,
          lastActive: row._lastActive,
          dormancyFlag: row._dormancyFlag,
          crawlRationale: row._crawlRationale || "",
          companyShortName: row._companyShortName || "",
          correspondenceName: row._correspondenceName || "",
          sectorFocus: row._sectorFocus || "",
          sectorRationale: row._sectorRationale || "",
          personalization_snippet: row._personalization_snippet || "",
          growthSignals: (row._growthSignals || []).join(", "),
          contact: {
            email: m.contact?.email || "",
            firstName: m.contact?.firstName || "",
            lastName: m.contact?.lastName || "",
            title: m.contact?.title || "",
            phone: m.contact?.phone || "",
          }
        };
      }

      // Check for new export schema (Company Name, Domain, Correspondence_Name, etc.)
      const isNewSchema = row["Company Name"] !== undefined;
      
      if (isNewSchema) {
        // New schema mapping
        const rawName = row["Company Name"] || "";
        const cleanedName = cleanCompanyNameRegex(rawName);
        const city = row.City || null;
        const state = row.State || null;
        const normalizedState = state ? normalizeState(state) : null;
        
        return {
          name: cleanedName,
          url: row.Domain || "",
          website: row.Domain || "",
          linkedin: "",
          city: city,
          state: normalizedState,
          hq: (city && normalizedState) ? `${city}, ${normalizedState}` : (city || normalizedState || ""),
          industry: "Healthcare Services",
          subsector: "",
          revenue: undefined,
          employees: undefined,
          ownership: "Unknown",
          lastFinancingYear: undefined,
          investors: "",
          notes: "",
          websiteStatus: row._websiteStatus,
          clinicCount: row._clinicCount,
          lastActive: row._lastActive,
          dormancyFlag: row._dormancyFlag,
          crawlRationale: row._crawlRationale || "",
          companyShortName: row.Correspondence_Name || row._companyShortName || "",
          correspondenceName: row.Correspondence_Name || row._correspondenceName || "",
          sectorFocus: row.Sector_Focus || row._sectorFocus || "",
          sectorRationale: row._sectorRationale || "",
          personalization_snippet: row.Personalized_Hook || row._personalization_snippet || "",
          growthSignals: (row._growthSignals || []).join(", "),
          contact: {
            email: "",
            firstName: "",
            lastName: "",
            title: "",
            phone: "",
          }
        };
      }
      
      // Old Grata schema mapping
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
        crawlRationale: row._crawlRationale || "",
        companyShortName: row._companyShortName || row["Short Name"] || "",
        correspondenceName: row._correspondenceName || "",
        sectorFocus: row._sectorFocus || row.Sector || "",
        sectorRationale: row._sectorRationale || "",
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
    } catch (error) {
      console.error("Error normalizing row:", error, row);
      // Return a minimal valid object on error
      return {
        name: "Error parsing row",
        url: "",
        website: "",
        linkedin: "",
        city: "",
        state: "",
        hq: "",
        industry: "Healthcare Services",
        subsector: "",
        revenue: undefined,
        employees: undefined,
        ownership: "Unknown",
        notes: `Error: ${error.message}`,
        contact: { email: "", firstName: "", lastName: "", title: "", phone: "" }
      };
    }
  }, []);

  const normalizedGR = useMemo(() => {
    return grCompaniesRaw.map((r) => normalizeRow(r));
  }, [grCompaniesRaw, normalizeRow]);
  
  const filteredGR = useMemo(() => {
    return filterTargets(normalizedGR, { regionFilter, minRev, maxRev, ownerPref });
  }, [normalizedGR, regionFilter, minRev, maxRev, ownerPref]);
  
  const grScored = useMemo(() => {
    return scoreTargets(filteredGR, { 
      fitKeywords: vertical,
      weights,
      targetRange: {
        minEmployees: targetMinEmp ? parseInt(targetMinEmp) : null,
        maxEmployees: targetMaxEmp ? parseInt(targetMaxEmp) : null,
        minRevenue: targetMinRev ? parseFloat(targetMinRev) : null,
        maxRevenue: targetMaxRev ? parseFloat(targetMaxRev) : null
      }
    });
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
    dispatch({ type: ActionTypes.SET_LOADING, payload: true });
    try {
      const result = await base44.functions.invoke('exportToExcel', {
        data,
        filename
      });
      window.open(result.data.fileUrl, '_blank');
    } catch (error) {
      console.error("Excel export error:", error);
      dispatch({ type: ActionTypes.SET_UPLOAD_ERROR, payload: "Failed to export Excel: " + (error.message || String(error)) });
    }
    dispatch({ type: ActionTypes.SET_LOADING, payload: false });
  };

  const exportCSV = async (filename, data) => {
    dispatch({ type: ActionTypes.SET_LOADING, payload: true });
    try {
      const result = await base44.functions.invoke('dataToCsv', { data });
      downloadText(filename, result.data.csv);
    } catch (error) {
      console.error("CSV export error:", error);
      dispatch({ type: ActionTypes.SET_UPLOAD_ERROR, payload: "Failed to export CSV: " + (error.message || String(error)) });
    }
    dispatch({ type: ActionTypes.SET_LOADING, payload: false });
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
      <HowToUse open={showHowTo} onClose={() => dispatch({ type: ActionTypes.SET_SHOW_HOW_TO, payload: false })} />
      
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
            onClick={() => dispatch({ type: ActionTypes.SET_SHOW_HOW_TO, payload: true })}
            className="gap-2 text-xs sm:text-sm"
          >
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">How to Use</span>
            <span className="sm:hidden">Help</span>
          </Button>
          <Badge variant="secondary" className="self-center">v3</Badge>
          <OutreachStatusBadge />
          {healthAlertCount > 0 && (
            <button
              onClick={() => setShowHealthAlerts(true)}
              className="self-center inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-red-100 text-red-700 border border-red-200 gap-1 cursor-pointer hover:bg-red-200 transition-colors"
            >
              <CircleAlert className="w-3 h-3" />
              {healthAlertCount} Health Alert{healthAlertCount !== 1 ? 's' : ''}
            </button>
          )}
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
            onClick={() => dispatch({ type: ActionTypes.SET_SUCCESS_MESSAGE, payload: null })}
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
            onClick={() => dispatch({ type: ActionTypes.SET_UPLOAD_ERROR, payload: null })}
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

      {saving && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl shadow-xl min-w-[400px]">
            <div className="flex items-center gap-3 mb-4">
              <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
              <span className="font-medium">Saving to Database...</span>
            </div>
            {saveProgress.total > 0 && (
              <div className="space-y-2">
                <Progress value={(saveProgress.current / saveProgress.total) * 100} className="w-full" />
                <div className="text-sm text-slate-600 text-center">
                  {saveProgress.current} / {saveProgress.total} records
                </div>
                {saveProgress.step && (
                  <div className="text-xs text-slate-500 text-center">
                    {saveProgress.step}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {crawling && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl shadow-xl min-w-[400px]">
            <div className="flex items-center gap-3 mb-4">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
              <span className="font-medium">Crawling Websites...</span>
            </div>
            {crawlProgress.total > 0 && (
              <div className="space-y-2">
                <Progress value={(crawlProgress.current / crawlProgress.total) * 100} className="w-full" />
                <div className="text-sm text-slate-600 text-center">
                  {crawlProgress.current} / {crawlProgress.total} companies
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {enriching && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl shadow-xl min-w-[400px]">
            <div className="flex items-center gap-3 mb-4">
              <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
              <span className="font-medium">Enriching Names & Sectors...</span>
            </div>
            {enrichProgress.total > 0 && (
              <div className="space-y-2">
                <Progress value={(enrichProgress.current / enrichProgress.total) * 100} className="w-full" />
                <div className="text-sm text-slate-600 text-center">
                  {enrichProgress.current} / {enrichProgress.total} companies
                </div>
              </div>
            )}
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



      <Dialog open={showHealthAlerts} onOpenChange={setShowHealthAlerts}>
        <DialogContent className="max-w-md max-h-[70vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="p-4 pb-2 bg-red-50 border-b">
            <DialogTitle className="flex items-center gap-2 text-red-900">
              <CircleAlert className="w-4 h-4" />
              Health Alerts
            </DialogTitle>
            <DialogDescription className="text-red-700">
              Targets with broken websites or dormant activity
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto divide-y">
            {healthAlertTargets.map((t) => (
              <Link
                key={t.id}
                to={createPageUrl("TargetDetails") + `?id=${t.id}`}
                onClick={() => setShowHealthAlerts(false)}
                className="flex items-start gap-2 p-3 hover:bg-slate-50 transition-colors block"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-900 truncate">{t.name}</div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {t.websiteStatus === 'broken' && (
                      <span className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-700">
                        <Globe className="w-2.5 h-2.5 mr-0.5" /> Broken Website
                      </span>
                    )}
                    {t.dormancyFlag && (
                      <span className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                        <CircleAlert className="w-2.5 h-2.5 mr-0.5" /> Dormant
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
            {healthAlertTargets.length === 0 && (
              <div className="p-4 text-sm text-slate-500 text-center">No health alerts found.</div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showNewCampaignDialog} onOpenChange={(open) => dispatch({ type: ActionTypes.SET_SHOW_NEW_CAMPAIGN_DIALOG, payload: open })}>
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
                onChange={(e) => dispatch({ type: ActionTypes.SET_NEW_CAMPAIGN_DATA, payload: {...newCampaignData, name: e.target.value} })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input
                placeholder="Brief description of this campaign"
                value={newCampaignData.description}
                onChange={(e) => dispatch({ type: ActionTypes.SET_NEW_CAMPAIGN_DATA, payload: {...newCampaignData, description: e.target.value} })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Vertical</label>
              <Input
                placeholder="e.g., Healthcare Services"
                value={newCampaignData.vertical}
                onChange={(e) => dispatch({ type: ActionTypes.SET_NEW_CAMPAIGN_DATA, payload: {...newCampaignData, vertical: e.target.value} })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={newCampaignData.status}
                onValueChange={(value) => dispatch({ type: ActionTypes.SET_NEW_CAMPAIGN_DATA, payload: {...newCampaignData, status: value} })}
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
                onClick={() => dispatch({ type: ActionTypes.RESET_NEW_CAMPAIGN_DIALOG })}
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

      <Dialog open={showLookalikeDialog} onOpenChange={(open) => dispatch({ type: ActionTypes.SET_SHOW_LOOKALIKE_DIALOG, payload: open })}>
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

      <Tabs value={page} onValueChange={(value) => dispatch({ type: ActionTypes.SET_PAGE, payload: value })}>
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
                      onClick={() => dispatch({ type: ActionTypes.SET_SHOW_HOW_TO, payload: true })}
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
                  Upload Companies (.csv or .xlsx)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                <Input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={(e) => e.target.files && onUpload(e.target.files[0])}
                  className="cursor-pointer"
                />
                <div className="text-xs text-muted-foreground flex items-start gap-2">
                  <CircleAlert className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  After upload, you'll map your columns before importing.
                </div>
              </CardContent>
            </Card>
            
            <WorkflowSummary />
          </div>

          {showColumnMapper && pendingUpload && (
            <ColumnMapper
              headers={pendingUpload.headers}
              sampleRows={pendingUpload.rows.slice(0, 3)}
              onConfirm={confirmColumnMapping}
              onCancel={cancelColumnMapping}
            />
          )}

          {showDuplicateResolver && duplicateData && (
            <DuplicateResolver
              newCount={duplicateData.newRows.length}
              duplicates={duplicateData.duplicateRows}
              onConfirm={confirmDuplicateStrategy}
              onCancel={cancelColumnMapping}
            />
          )}

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
                          dispatch({ type: ActionTypes.SET_SHOW_NEW_CAMPAIGN_DIALOG, payload: true });
                        } else {
                          dispatch({ type: ActionTypes.SET_SELECTED_CAMPAIGN_ID, payload: value });
                          dispatch({ type: ActionTypes.SET_CAMPAIGN_NAME, payload: "" });
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
                        onChange={(e) => dispatch({ type: ActionTypes.SET_CAMPAIGN_NAME, payload: e.target.value })}
                      />
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{selectedTargets.size} selected</Badge>

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
            setWeights={(w) => dispatch({ type: ActionTypes.SET_WEIGHTS, payload: w })}
            targetMinEmp={targetMinEmp}
            setTargetMinEmp={(v) => dispatch({ type: ActionTypes.SET_TARGET_MIN_EMP, payload: v })}
            targetMaxEmp={targetMaxEmp}
            setTargetMaxEmp={(v) => dispatch({ type: ActionTypes.SET_TARGET_MAX_EMP, payload: v })}
            targetMinRev={targetMinRev}
            setTargetMinRev={(v) => dispatch({ type: ActionTypes.SET_TARGET_MIN_REV, payload: v })}
            targetMaxRev={targetMaxRev}
            setTargetMaxRev={(v) => dispatch({ type: ActionTypes.SET_TARGET_MAX_REV, payload: v })}
            onRecalculate={recalculatingScores ? null : recalculateAllScores}
            previewTargets={grScored}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// normalizeRow moved to useCallback inside component for performance