import React, { useState, useMemo, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Database, Filter, Download, MapPin, Building2, Search, ArrowLeft, ArrowUpDown, ArrowUp, ArrowDown, RefreshCw, Loader2, CheckSquare, Globe2, UserCheck, Sparkles, Award, Tag, Mail, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";

import OutreachIntegration from "../components/ops/OutreachIntegration";
import TargetRow from "../components/targets/TargetRow";
import ActionButtons from "../components/targets/ActionButtons";
import { LoadingOverlay } from "@/components/ui/loading-overlay";

export default function SavedTargets() {
  const [selectedCampaign, setSelectedCampaign] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState("desc");
  const [rescoring, setRescoring] = useState(false);
  const [crawling, setCrawling] = useState(false);
  const [crawlProgress, setCrawlProgress] = useState({ current: 0, total: 0 });
  const [enrichingContacts, setEnrichingContacts] = useState(false);
  const [enrichProgress, setEnrichProgress] = useState({ current: 0, total: 0 });
  const [scoringQuality, setScoringQuality] = useState(false);
  const [qualityProgress, setQualityProgress] = useState({ current: 0, total: 0 });
  const [clinicFilter, setClinicFilter] = useState("all");
  const [qualityFilter, setQualityFilter] = useState("all");
  const [sectorFilter, setSectorFilter] = useState("all");
  const [nameFilter, setNameFilter] = useState("all");
  const [correspondenceFilter, setCorrespondenceFilter] = useState("all");
  const [contactEnrichFilter, setContactEnrichFilter] = useState("all");
  const [growthSignalsFilter, setGrowthSignalsFilter] = useState("all");
  const [rationaleFilter, setRationaleFilter] = useState("all");
  const [personalizationFilter, setPersonalizationFilter] = useState("all");
  const [selectedTargets, setSelectedTargets] = useState(new Set());
  const [reclassifyingSectors, setReclassifyingSectors] = useState(false);
  const [sectorProgress, setSectorProgress] = useState({ current: 0, total: 0 });
  const [showBulkSectorDialog, setShowBulkSectorDialog] = useState(false);
  const [bulkSectorValue, setBulkSectorValue] = useState("");
  const [generatingShortNames, setGeneratingShortNames] = useState(false);
  const [shortNameProgress, setShortNameProgress] = useState({ current: 0, total: 0 });
  const [personalizingTargets, setPersonalizingTargets] = useState(false);
  const [personalizeProgress, setPersonalizeProgress] = useState({ current: 0, total: 0 });
  const [detectingGrowth, setDetectingGrowth] = useState(false);
  const [growthProgress, setGrowthProgress] = useState({ current: 0, total: 0 });
  const [generatingRationales, setGeneratingRationales] = useState(false);
  const [rationaleProgress, setRationaleProgress] = useState({ current: 0, total: 0 });
  const [generatingSingleRationale, setGeneratingSingleRationale] = useState(null);
  const [refreshingData, setRefreshingData] = useState(null);
  const [cleaningNames, setCleaningNames] = useState(false);
  const [cleanProgress, setCleanProgress] = useState({ current: 0, total: 0 });
  const [enrichingAll, setEnrichingAll] = useState(false);
  const [enrichAllProgress, setEnrichAllProgress] = useState({ step: "", current: 0, total: 0 });
  const [enrichingCompanyData, setEnrichingCompanyData] = useState(false);
  const [companyDataProgress, setCompanyDataProgress] = useState({ current: 0, total: 0 });
  const [extractingNames, setExtractingNames] = useState(false);
  const [extractProgress, setExtractProgress] = useState({ current: 0, total: 0 });
  const [insights, setInsights] = useState("");
  const [emailSubject, setEmailSubject] = useState("BD Targets & Market Snapshot");
  const [emailBody, setEmailBody] = useState("");
  const [fitKeywords, setFitKeywords] = useState("Healthcare Services");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  const queryClient = useQueryClient();

  const [user, setUser] = useState(null);

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: targets = [], isLoading } = useQuery({
    queryKey: ['bdTargets'],
    queryFn: () => base44.entities.BDTarget.list('-created_date', 50000),
  });

  const fetchFullTarget = async (targetId) => {
    return await base44.entities.BDTarget.get(targetId);
  };

  const deleteTargetMutation = useMutation({
    mutationFn: (id) => base44.entities.BDTarget.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bdTargets'] });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.BDTarget.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bdTargets'] });
    },
  });

  const scoreSelectedQuality = async () => {
    const selectedList = filteredTargets.filter(t => selectedTargets.has(t.id));
    
    if (selectedList.length === 0) {
      alert("Please select targets to score");
      return;
    }

    setScoringQuality(true);
    setQualityProgress({ current: 0, total: selectedList.length });

    const BATCH_SIZE = 10;
    let completed = 0;

    for (let i = 0; i < selectedList.length; i += BATCH_SIZE) {
      const batch = selectedList.slice(i, i + BATCH_SIZE);

      await Promise.allSettled(batch.map(async (target) => {
        try {
          await base44.functions.invoke('scoreTargetQuality', { targetId: target.id });
        } catch (error) {
          console.error(`Error scoring ${target.name}:`, error);
        }
      }));

      completed += batch.length;
      setQualityProgress({ current: completed, total: selectedList.length });
    }

    await queryClient.invalidateQueries({ queryKey: ['bdTargets'] });
    setScoringQuality(false);
    setQualityProgress({ current: 0, total: 0 });
  };

  const enrichSelectedContacts = async () => {
    const selectedList = filteredTargets.filter(t => selectedTargets.has(t.id));
    const withContacts = selectedList.filter(t => t.contactFirstName && t.contactLastName);
    const pendingContacts = withContacts.filter(t => !t.contactPreferredName || !t.contactPreferredName.trim());
    
    if (pendingContacts.length === 0) {
      alert("All selected targets with contacts are already enriched");
      return;
    }

    setEnrichingContacts(true);
    setEnrichProgress({ current: 0, total: pendingContacts.length });

    const BATCH_SIZE = 15;
    let completed = 0;
    let skippedCount = withContacts.length - pendingContacts.length;

    for (let i = 0; i < pendingContacts.length; i += BATCH_SIZE) {
      const batch = pendingContacts.slice(i, i + BATCH_SIZE);

      await Promise.allSettled(batch.map(async (target) => {
        try {
          await base44.functions.invoke('enrichContact', { targetId: target.id });
        } catch (error) {
          console.error(`Error enriching ${target.name}:`, error);
        }
      }));

      completed += batch.length;
      setEnrichProgress({ current: completed, total: pendingContacts.length });
    }

    await queryClient.invalidateQueries({ queryKey: ['bdTargets'] });
    setEnrichingContacts(false);
    setEnrichProgress({ current: 0, total: 0 });
    alert(`Contact enrichment complete!\n✓ ${pendingContacts.length} enriched\n⊝ ${skippedCount} skipped (already enriched)`);
  };

  const reclassifySelectedSectors = async () => {
    const selectedList = filteredTargets.filter(t => selectedTargets.has(t.id));
    
    if (selectedList.length === 0) {
      alert("Please select targets to reclassify");
      return;
    }

    setReclassifyingSectors(true);
    setSectorProgress({ current: 0, total: selectedList.length });

    const { classifyCompanySector } = await import("../components/utils/data-engine");
    let successCount = 0;
    let errorCount = 0;

    try {
      for (let i = 0; i < selectedList.length; i++) {
        const target = selectedList[i];
        setSectorProgress({ current: i + 1, total: selectedList.length });

        try {
          const sector = await classifyCompanySector({ name: target.name, website: target.website });
          await base44.entities.BDTarget.update(target.id, { sectorFocus: sector });
          successCount++;
        } catch (error) {
          console.error(`✗ Error reclassifying ${target.name}:`, error);
          errorCount++;
        }
      }

      await queryClient.invalidateQueries({ queryKey: ['bdTargets'] });
      alert(`Reclassification complete!\n✓ ${successCount} successful\n✗ ${errorCount} failed`);
    } catch (error) {
      console.error("Reclassification error:", error);
      alert("Reclassification failed: " + error.message);
    } finally {
      setReclassifyingSectors(false);
      setSectorProgress({ current: 0, total: 0 });
    }
  };

  const generateCorrespondenceNamesForSelected = async () => {
    const selectedList = filteredTargets.filter(t => selectedTargets.has(t.id));
    const pendingList = selectedList.filter(t => !t.correspondenceName || !t.correspondenceName.trim());
    
    if (pendingList.length === 0) {
      alert("All selected targets already have correspondence names");
      return;
    }

    setGeneratingShortNames(true);
    setShortNameProgress({ current: 0, total: pendingList.length });

    const BATCH_SIZE = 3;
    let completed = 0;
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = selectedList.length - pendingList.length;

    for (let i = 0; i < pendingList.length; i += BATCH_SIZE) {
      const batch = pendingList.slice(i, i + BATCH_SIZE);

      const results = await Promise.allSettled(batch.map(async (target) => {
        try {
          const result = await base44.functions.invoke('generateShortNames', { targetId: target.id });
          if (result.data && result.data.correspondenceName) {
            return { success: true, name: target.name };
          } else {
            throw new Error('No correspondence name returned');
          }
        } catch (error) {
          console.error(`Error generating correspondence name for ${target.name}:`, error);
          return { success: false, name: target.name, error: error.message };
        }
      }));

      results.forEach(result => {
        if (result.status === 'fulfilled' && result.value.success) {
          successCount++;
        } else {
          errorCount++;
        }
      });

      completed += batch.length;
      setShortNameProgress({ current: completed, total: pendingList.length });
      
      // Delay between batches to avoid rate limits
      if (i + BATCH_SIZE < pendingList.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    await queryClient.invalidateQueries({ queryKey: ['bdTargets'] });
    setGeneratingShortNames(false);
    setShortNameProgress({ current: 0, total: 0 });
    
    alert(`Correspondence names generated!\n✓ ${successCount} successful\n✗ ${errorCount} failed\n⊝ ${skippedCount} skipped (already enriched)`);
  };

  const bulkPersonalizeSelected = async () => {
    const selectedList = filteredTargets.filter(t => selectedTargets.has(t.id));
    const pendingList = selectedList.filter(t => !t.personalization_snippet || !t.personalization_snippet.trim());
    
    if (pendingList.length === 0) {
      alert("All selected targets already have personalization snippets");
      return;
    }

    setPersonalizingTargets(true);
    setPersonalizeProgress({ current: 0, total: pendingList.length });

    const BATCH_SIZE = 15;
    let completed = 0;
    let skippedCount = selectedList.length - pendingList.length;

    for (let i = 0; i < pendingList.length; i += BATCH_SIZE) {
      const batch = pendingList.slice(i, i + BATCH_SIZE);

      await Promise.allSettled(batch.map(async (target) => {
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

          await base44.entities.BDTarget.update(target.id, {
            personalization_snippet: result.trim()
          });
        } catch (error) {
          console.error(`Error personalizing ${target.name}:`, error);
        }
      }));

      completed += batch.length;
      setPersonalizeProgress({ current: completed, total: pendingList.length });
    }

    await queryClient.invalidateQueries({ queryKey: ['bdTargets'] });
    setPersonalizingTargets(false);
    setPersonalizeProgress({ current: 0, total: 0 });
    alert(`Personalization complete!\n✓ ${pendingList.length} personalized\n⊝ ${skippedCount} skipped (already enriched)`);
  };

  const detectGrowthSignalsForSelected = async () => {
    const selectedList = filteredTargets.filter(t => selectedTargets.has(t.id));
    const pendingList = selectedList.filter(t => !t.growthSignals || !t.growthSignals.trim());
    
    if (pendingList.length === 0) {
      alert("All selected targets already have growth signals");
      return;
    }

    setDetectingGrowth(true);
    setGrowthProgress({ current: 0, total: pendingList.length });

    const BATCH_SIZE = 10;
    let completed = 0;
    let skippedCount = selectedList.length - pendingList.length;

    for (let i = 0; i < pendingList.length; i += BATCH_SIZE) {
      const batch = pendingList.slice(i, i + BATCH_SIZE);

      await Promise.allSettled(batch.map(async (target) => {
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

          await base44.entities.BDTarget.update(target.id, {
            growthSignals: (result.signals || []).join(", "),
            growthSignalsDate: new Date().toISOString()
          });
        } catch (error) {
          console.error(`Error detecting growth for ${target.name}:`, error);
        }
      }));

      completed += batch.length;
      setGrowthProgress({ current: completed, total: pendingList.length });
    }

    await queryClient.invalidateQueries({ queryKey: ['bdTargets'] });
    setDetectingGrowth(false);
    setGrowthProgress({ current: 0, total: 0 });
    alert(`Growth signals detected!\n✓ ${pendingList.length} analyzed\n⊝ ${skippedCount} skipped (already enriched)`);
  };

  const generateRationalesForSelected = async () => {
    const selectedList = filteredTargets.filter(t => selectedTargets.has(t.id));
    const pendingList = selectedList.filter(t => !t.strategicRationale || !t.strategicRationale.trim());
    
    if (pendingList.length === 0) {
      alert("All selected targets already have strategic rationales");
      return;
    }

    setGeneratingRationales(true);
    setRationaleProgress({ current: 0, total: pendingList.length });

    const BATCH_SIZE = 10;
    let completed = 0;
    let skippedCount = selectedList.length - pendingList.length;

    for (let i = 0; i < pendingList.length; i += BATCH_SIZE) {
      const batch = pendingList.slice(i, i + BATCH_SIZE);

      await Promise.allSettled(batch.map(async (target) => {
        try {
          const prompt = `Research "${target.name}" (${target.website || 'healthcare company'} in ${target.city}, ${target.state}) and write a 2-sentence strategic investment thesis explaining why this would be a good acquisition target.

Company Details:
- Sector: ${target.sectorFocus || 'Healthcare Services'}
- Revenue: ~$${target.revenue}M
- Employees: ${target.employees}
- Clinics: ${target.clinicCount || 'unknown'}

Focus on: market position, growth potential, strategic fit, and competitive advantages. Be specific and data-driven.`;

          const rationale = await base44.integrations.Core.InvokeLLM({
            prompt,
            add_context_from_internet: true
          });
          
          await base44.entities.BDTarget.update(target.id, {
            strategicRationale: rationale.trim()
          });
        } catch (error) {
          console.error(`Error generating rationale for ${target.name}:`, error);
        }
      }));

      completed += batch.length;
      setRationaleProgress({ current: completed, total: pendingList.length });
    }

    await queryClient.invalidateQueries({ queryKey: ['bdTargets'] });
    setGeneratingRationales(false);
    setRationaleProgress({ current: 0, total: 0 });
    alert(`Strategic rationales generated!\n✓ ${pendingList.length} generated\n⊝ ${skippedCount} skipped (already enriched)`);
  };

  const enrichAllSelected = async () => {
    const selectedList = filteredTargets.filter(t => selectedTargets.has(t.id));
    
    // Pre-filter for truly pending records (missing any enrichment)
    const pendingList = selectedList.filter(t => {
      return !t.correspondenceName || !t.qualityTier || 
             (!t.contactPreferredName && t.contactFirstName) ||
             !t.personalization_snippet || !t.growthSignals || 
             !t.strategicRationale || !t.state || !t.revenue || !t.employees;
    });
    
    if (pendingList.length === 0) {
      alert("All selected targets are fully enriched");
      return;
    }

    const skippedCount = selectedList.length - pendingList.length;

    setEnrichingAll(true);
    setEnrichAllProgress({ step: "Starting...", current: 0, total: pendingList.length });
    
    try {
      // Chunk into groups of 5 for controlled processing
      const chunks = _.chunk(pendingList, 5);
      let completed = 0;
      let successCount = 0;
      const errors = [];

      // Process each chunk sequentially
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        setEnrichAllProgress({ 
          step: `Processing chunk ${i + 1} of ${chunks.length}...`, 
          current: completed, 
          total: pendingList.length 
        });

        try {
          const result = await base44.functions.invoke('bulkEnrichTargets', {
            targetIds: chunk.map(t => t.id)
          });

          successCount += result.data.processed;
          if (result.data.errors && result.data.errors.length > 0) {
            errors.push(...result.data.errors);
          }
        } catch (error) {
          console.error(`Chunk ${i + 1} error:`, error);
          chunk.forEach(t => {
            errors.push({ targetId: t.id, error: error.message });
          });
        }

        completed += chunk.length;
        setEnrichAllProgress({ 
          step: `Processed ${completed} of ${pendingList.length}...`, 
          current: completed, 
          total: pendingList.length 
        });

        // Refresh data after each chunk
        await queryClient.invalidateQueries({ queryKey: ['bdTargets'] });

        // Small delay between chunks to avoid rate limits
        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      const message = [
        `✓ ${successCount} enriched`,
        skippedCount > 0 && `⊝ ${skippedCount} skipped (already enriched)`,
        errors.length > 0 && `✗ ${errors.length} failed`
      ].filter(Boolean).join('\n');
      
      alert(`Enrichment complete!\n${message}`);
    } catch (error) {
      console.error("Enrichment error:", error);
      alert("Enrichment failed: " + error.message);
    } finally {
      setEnrichingAll(false);
      setEnrichAllProgress({ step: "", current: 0, total: 0 });
    }
  };

  const enrichCompanyDataSelected = async () => {
    const selectedList = filteredTargets.filter(t => selectedTargets.has(t.id));
    
    setEnrichingCompanyData(true);
    setCompanyDataProgress({ current: 0, total: selectedList.length });
    
    try {
      const result = await base44.functions.invoke('enrichCompanyData', {
        targetIds: selectedList.map(t => t.id)
      });

      await queryClient.invalidateQueries({ queryKey: ['bdTargets'] });
      
      const message = [
        `✓ ${result.data.processed} enriched`,
        result.data.skipped > 0 && `⊝ ${result.data.skipped} skipped (complete)`,
        result.data.errors.length > 0 && `✗ ${result.data.errors.length} failed`
      ].filter(Boolean).join('\n');
      
      alert(`Company data enrichment complete!\n${message}`);
    } catch (error) {
      console.error("Company data enrichment error:", error);
      alert("Company data enrichment failed: " + error.message);
    } finally {
      setEnrichingCompanyData(false);
      setCompanyDataProgress({ current: 0, total: 0 });
    }
  };

  const generateSingleRationale = async (target) => {
    setGeneratingSingleRationale(target.id);
    
    try {
      const prompt = `Research "${target.name}" (${target.website || 'healthcare company'} in ${target.city}, ${target.state}) and write a 2-sentence strategic investment thesis explaining why this would be a good acquisition target.

Company Details:
- Sector: ${target.sectorFocus || 'Healthcare Services'}
- Revenue: ~$${target.revenue}M
- Employees: ${target.employees}
- Clinics: ${target.clinicCount || 'unknown'}

Focus on: market position, growth potential, strategic fit, and competitive advantages. Be specific and data-driven.`;

      const rationale = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true
      });
      
      await base44.entities.BDTarget.update(target.id, {
        strategicRationale: rationale.trim()
      });

      await queryClient.invalidateQueries({ queryKey: ['bdTargets'] });
    } catch (error) {
      console.error(`Error generating rationale for ${target.name}:`, error);
      alert("Failed to generate rationale: " + error.message);
    }
    
    setGeneratingSingleRationale(null);
  };

  const refreshSingleTargetData = async (targetId) => {
    setRefreshingData(targetId);
    
    try {
      const result = await base44.functions.invoke('enrichCompanyData', {
        targetIds: [targetId]
      });

      await queryClient.invalidateQueries({ queryKey: ['bdTargets'] });
      
      if (result.data.errors.length > 0) {
        alert("Failed to refresh data: " + result.data.errors[0].error);
      }
    } catch (error) {
      console.error("Error refreshing data:", error);
      alert("Failed to refresh data: " + error.message);
    }
    
    setRefreshingData(null);
  };

  const cleanCompanyNamesForSelected = async () => {
    const selectedList = filteredTargets.filter(t => selectedTargets.has(t.id));
    
    if (selectedList.length === 0) {
      alert("Please select targets to clean names");
      return;
    }

    setCleaningNames(true);
    setCleanProgress({ current: 0, total: selectedList.length });

    const { generateFriendlyName, generateCorrespondenceName } = await import("../components/utils/data-engine");

    for (let i = 0; i < selectedList.length; i++) {
      const target = selectedList[i];
      setCleanProgress({ current: i + 1, total: selectedList.length });

      try {
        const [friendlyName, correspondenceName] = await Promise.all([
          generateFriendlyName(target.name),
          generateCorrespondenceName(target.name)
        ]);

        await base44.entities.BDTarget.update(target.id, {
          companyShortName: friendlyName,
          correspondenceName: correspondenceName
        });
      } catch (error) {
        console.error(`Error cleaning name for ${target.name}:`, error);
      }
    }

    await queryClient.invalidateQueries({ queryKey: ['bdTargets'] });
    setCleaningNames(false);
    setCleanProgress({ current: 0, total: 0 });
  };

  const extractCompanyNamesForSelected = async () => {
    const selectedList = filteredTargets.filter(t => selectedTargets.has(t.id));
    const withWebsites = selectedList.filter(t => t.website && (!t.name || t.name.trim() === ''));
    
    if (withWebsites.length === 0) {
      alert("Please select targets with websites but missing names");
      return;
    }

    setExtractingNames(true);
    setExtractProgress({ current: 0, total: withWebsites.length });

    for (let i = 0; i < withWebsites.length; i++) {
      const target = withWebsites[i];
      setExtractProgress({ current: i + 1, total: withWebsites.length });

      try {
        await base44.functions.invoke('extractCompanyName', { targetId: target.id });
      } catch (error) {
        console.error(`Error extracting name for target ${target.id}:`, error);
      }
    }

    await queryClient.invalidateQueries({ queryKey: ['bdTargets'] });
    setExtractingNames(false);
    setExtractProgress({ current: 0, total: 0 });
  };

  const generateInsightsAndEmail = () => {
    const top = filteredTargets.slice(0, 10);
    const names = top.map(t => t.name).slice(0, 5).join(", ");
    const withGrowth = filteredTargets.filter(t => t.growthSignals && t.growthSignals.trim()).length;
    
    const insightText = [
      `${filteredTargets.length} qualified targets across ${campaigns.length} campaigns`,
      `Top 5: ${names || "(add data)"}`,
      `${withGrowth} companies with recent growth signals`,
      `${filteredTargets.filter(t => t.score >= 70).length} high-priority targets (Score ≥ 70)`
    ].join("\n• ");

    setInsights(`• ${insightText}`);
    setEmailBody(`Hi team,\n\n${insightText}\n\nAttached is the latest target snapshot.\n\n- BD Team`);
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      alert("Copied to clipboard!");
    } catch (error) {
      console.error("Copy failed:", error);
    }
  };

  const applyBulkSector = async () => {
    if (!bulkSectorValue) {
      alert("Please select a sector");
      return;
    }

    const selectedList = filteredTargets.filter(t => selectedTargets.has(t.id));
    
    for (const target of selectedList) {
      await base44.entities.BDTarget.update(target.id, { sectorFocus: bulkSectorValue });
    }

    await queryClient.invalidateQueries({ queryKey: ['bdTargets'] });
    setShowBulkSectorDialog(false);
    setBulkSectorValue("");
  };

  const crawlSelectedWebsites = async () => {
    const selectedList = filteredTargets.filter(t => selectedTargets.has(t.id));
    if (selectedList.length === 0) return;

    setCrawling(true);
    setCrawlProgress({ current: 0, total: selectedList.length });

    const { crawlCompanyWebsite } = await import("../components/utils/data-engine");

    for (let i = 0; i < selectedList.length; i++) {
      const target = selectedList[i];
      setCrawlProgress({ current: i + 1, total: selectedList.length });

      const crawlResult = await crawlCompanyWebsite({ name: target.name, website: target.website });
      
      try {
        await base44.entities.BDTarget.update(target.id, {
          websiteStatus: crawlResult.websiteStatus,
          clinicCount: crawlResult.clinicCount
        });
      } catch (error) {
        console.error(`Error updating ${target.name}:`, error);
      }
    }

    await queryClient.invalidateQueries({ queryKey: ['bdTargets'] });
    setCrawling(false);
    setCrawlProgress({ current: 0, total: 0 });
  };

  const rescoreTargets = async () => {
    if (targets.length === 0) return;
    
    setRescoring(true);
    try {
      const weights = JSON.parse(localStorage.getItem('ops_console_weights') || '{"employees":35,"clinics":25,"revenue":15,"website":15,"keywords":10}');
      const targetMinEmp = localStorage.getItem('ops_console_targetMinEmp') || "";
      const targetMaxEmp = localStorage.getItem('ops_console_targetMaxEmp') || "";
      const targetMinRev = localStorage.getItem('ops_console_targetMinRev') || "";
      const targetMaxRev = localStorage.getItem('ops_console_targetMaxRev') || "";
      const fitKeywords = localStorage.getItem('ops_console_vertical') || "Healthcare Services";

      const result = await base44.functions.invoke('processBatchScoring', {
        targetIds: targets.map(t => t.id),
        weights,
        targetRange: {
          minEmployees: targetMinEmp ? parseInt(targetMinEmp) : null,
          maxEmployees: targetMaxEmp ? parseInt(targetMaxEmp) : null,
          minRevenue: targetMinRev ? parseFloat(targetMinRev) : null,
          maxRevenue: targetMaxRev ? parseFloat(targetMaxRev) : null
        },
        fitKeywords
      });

      await queryClient.invalidateQueries({ queryKey: ['bdTargets'] });
      alert(`Successfully re-scored ${result.data.updated} targets!`);
    } catch (error) {
      console.error("Re-score error:", error);
      alert("Failed to re-score: " + error.message);
    }
    setRescoring(false);
  };

  const campaigns = useMemo(() => {
    const unique = [...new Set(targets.map(t => t.campaign).filter(Boolean))];
    return unique.sort();
  }, [targets]);

  const uniqueSectors = useMemo(() => {
    const sectors = [...new Set(targets.map(t => t.sectorFocus).filter(Boolean))];
    return sectors.sort();
  }, [targets]);

  const filteredTargets = useMemo(() => {
    let filtered = targets.filter(t => {
      const campaignMatch = selectedCampaign === "all" || t.campaign === selectedCampaign;
      const statusMatch = statusFilter === "all" || t.status === statusFilter;
      const clinicMatch = clinicFilter === "all" || 
                    (clinicFilter === "missing" && !t.clinicCount) ||
                    (clinicFilter === "has" && t.clinicCount);
      const qualityMatch = qualityFilter === "all" || t.qualityTier === qualityFilter;
      const sectorMatch = sectorFilter === "all" || 
                    (sectorFilter === "missing" && (!t.sectorFocus || t.sectorFocus.trim() === '')) ||
                    (sectorFilter === "has" && t.sectorFocus && t.sectorFocus.trim() !== '') ||
                    t.sectorFocus === sectorFilter;
      const nameMatch = nameFilter === "all" ||
                    (nameFilter === "missing" && (!t.name || t.name.trim() === '')) ||
                    (nameFilter === "has" && t.name && t.name.trim() !== '');
      const correspondenceMatch = correspondenceFilter === "all" ||
                    (correspondenceFilter === "missing" && (!t.correspondenceName || t.correspondenceName.trim() === '')) ||
                    (correspondenceFilter === "has" && t.correspondenceName && t.correspondenceName.trim() !== '');
      const contactEnrichMatch = contactEnrichFilter === "all" ||
                    (contactEnrichFilter === "missing" && !t.contactPreferredName) ||
                    (contactEnrichFilter === "has" && t.contactPreferredName);
      const growthMatch = growthSignalsFilter === "all" ||
                    (growthSignalsFilter === "missing" && (!t.growthSignals || t.growthSignals.trim() === '')) ||
                    (growthSignalsFilter === "has" && t.growthSignals && t.growthSignals.trim() !== '');
      const rationaleMatch = rationaleFilter === "all" ||
                    (rationaleFilter === "missing" && (!t.strategicRationale || t.strategicRationale.trim() === '')) ||
                    (rationaleFilter === "has" && t.strategicRationale && t.strategicRationale.trim() !== '');
      const personalizationMatch = personalizationFilter === "all" ||
                    (personalizationFilter === "missing" && (!t.personalization_snippet || t.personalization_snippet.trim() === '')) ||
                    (personalizationFilter === "has" && t.personalization_snippet && t.personalization_snippet.trim() !== '');
      const searchMatch = !searchQuery || 
                    (t.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (t.correspondenceName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (t.city || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (t.state || "").toLowerCase().includes(searchQuery.toLowerCase());
      return campaignMatch && statusMatch && clinicMatch && qualityMatch && sectorMatch && nameMatch && 
             correspondenceMatch && contactEnrichMatch && growthMatch && rationaleMatch && 
             personalizationMatch && searchMatch;
    });

    if (sortField) {
      filtered = [...filtered].sort((a, b) => {
        const aVal = a[sortField] ?? 0;
        const bVal = b[sortField] ?? 0;
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
      });
    }

    return filtered;
  }, [targets, selectedCampaign, statusFilter, clinicFilter, qualityFilter, sectorFilter, nameFilter, correspondenceFilter, contactEnrichFilter, growthSignalsFilter, rationaleFilter, personalizationFilter, searchQuery, sortField, sortDirection]);

  const paginatedTargets = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredTargets.slice(startIndex, endIndex);
  }, [filteredTargets, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredTargets.length / itemsPerPage);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedCampaign, statusFilter, clinicFilter, qualityFilter, sectorFilter, nameFilter, correspondenceFilter, contactEnrichFilter, growthSignalsFilter, rationaleFilter, personalizationFilter, searchQuery]);

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const SortHeader = ({ field, children }) => (
    <th 
      className="py-3 px-4 font-semibold cursor-pointer hover:bg-slate-100 transition-colors"
      onClick={() => toggleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortField === field ? (
          sortDirection === "desc" ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />
        ) : (
          <ArrowUpDown className="w-3 h-3 text-slate-400" />
        )}
      </div>
    </th>
  );

  const toggleSelectAll = useCallback(() => {
    setSelectedTargets(prev => {
      if (prev.size === filteredTargets.length) {
        return new Set();
      } else {
        return new Set(filteredTargets.map(t => t.id));
      }
    });
  }, [filteredTargets]);

  const toggleTarget = useCallback((id) => {
    setSelectedTargets(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      return newSelected;
    });
  }, []);

  const exportCSV = async (exportAll = true) => {
    const toExport = exportAll ? filteredTargets : filteredTargets.filter(t => selectedTargets.has(t.id));
    const data = toExport.map(t => ({
      Campaign: t.campaign,
      "Company Name": t.name,
      "Correspondence Name": t.correspondenceName,
      "Sector Focus": t.sectorFocus,
      City: t.city,
      State: t.state,
      Revenue: t.revenue ? `$${t.revenue}M` : "",
      Employees: t.employees,
      Clinics: t.clinicCount,
      Score: t.score,
      "Fit Score": t.score,
      "Growth Signals": t.growthSignals || "",
      Status: t.status,
      Email: t.contactEmail,
      "First Name": t.contactFirstName,
      "Last Name": t.contactLastName,
      Title: t.contactTitle,
      Website: t.website,
      "Strategic Rationale": t.strategicRationale || "",
      Notes: t.notes || ""
    }));

    const result = await base44.functions.invoke('dataToCsv', { data });
    const blob = new Blob([result.data.csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `saved-targets-${selectedCampaign}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Database className="w-12 h-12 text-emerald-600 mx-auto mb-4 animate-pulse" />
          <p className="text-slate-600">Loading saved targets...</p>
        </div>
      </div>
    );
  }

  const SECTOR_OPTIONS = [
    "HS: Women's Health", "HCIT: Benefit Management Solutions", "HCIT: Care Delivery", "HCIT: Compliance",
    "HCIT: General", "HCIT: Inventory and Cost Solutions", "HCIT: Life Sciences/Pharmacy Focused Solutions",
    "HCIT: Medication Adherence", "HCIT: Member Engagement", "HCIT: Other Payor Services",
    "HCIT: Payment Accuracy & Cost Containment", "HCIT: Pharma", "HCIT: Population Health / VBC Enablement",
    "HCIT: Practice Management", "HCIT: Provider Focused Solutions", "HCIT: RCM",
    "HS: Allergy, Ear, Nose and Throat", "HS: Anesthesiology", "HS: ASC", "HS: Behavioral - ABA",
    "HS: Behavioral - IDD", "HS: Behavioral - Interventional Pysch", "HS: Behavioral - Mental",
    "HS: Behavioral - Psych", "HS: Behavioral - Psych / Residential", "HS: Behavioral - SUD",
    "HS: Cardiology", "HS: Compound Pharmacy", "HS: Dentistry", "HS: Dermatology", "HS: DME", "HS: DPC",
    "HS: Employer | Self Insured Services", "HS: Functional Medicine / Wellness", "HS: Gastroenterology",
    "HS: General", "HS: Health Systems", "HS: Home Care", "HS: Imaging", "HS: Infusion Center", "HS: Lab",
    "HS: Medical Transportation", "HS: MedSpa & Aesthetics", "HS: Nephrology", "HS: Neurology",
    "HS: Optometry", "HS: Ortho", "HS: PAC - Home Health", "HS: PAC - Hospice",
    "HS: PAC - Skilled Nursing (SNF)", "HS: Pain Management", "HS: Pediatrics", "HS: Physical Therapy",
    "HS: Podiatry", "HS: PPM", "HS: Primary Care", "HS: Sleep", "HS: Speech Pathology", "HS: Staffing",
    "HS: Urgent Care", "HS: Urology", "HS: Vascular & Vein", "HS: Veterinary",
    "HS: Veterinary / Animal Health", "HS: Vision", "HS: Wound Care", "Other - See Notes",
    "Other: Consumer", "Other: Wealth Management", "Pharma: CRO Services"
  ];

  return (
    <div className="w-full mx-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <Dialog open={showBulkSectorDialog} onOpenChange={setShowBulkSectorDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Sector to Selected Companies</DialogTitle>
            <DialogDescription>
              Choose a sector to apply to {selectedTargets.size} selected compan{selectedTargets.size === 1 ? 'y' : 'ies'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Select value={bulkSectorValue} onValueChange={setBulkSectorValue}>
              <SelectTrigger>
                <SelectValue placeholder="Select a sector..." />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {SECTOR_OPTIONS.map(sector => (
                  <SelectItem key={sector} value={sector}>{sector}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkSectorDialog(false)}>Cancel</Button>
            <Button onClick={applyBulkSector} disabled={!bulkSectorValue}>Apply to {selectedTargets.size}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {generatingShortNames && (
        <LoadingOverlay message="Generating Short Names..." progress={shortNameProgress} />
      )}

      {reclassifyingSectors && (
        <LoadingOverlay message="Reclassifying Sectors..." progress={sectorProgress} />
      )}

      {personalizingTargets && (
        <LoadingOverlay message="Creating Personalized Openers..." progress={personalizeProgress} />
      )}
      <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex flex-col sm:flex-row items-start gap-3">
          <Link to={createPageUrl("OpsConsole")}>
            <Button variant="outline" size="icon" className="flex-shrink-0">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6914b46d39cf2944cbc25c62/f8da923e2_image.png" 
            alt="Deal Radar Logo" 
            className="w-12 h-12 object-contain flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Saved BD Targets</h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              {targets.length} companies across {campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''}
              {targets.some(t => !t.campaign) && (
                <span className="text-amber-600 ml-2">• {targets.filter(t => !t.campaign).length} missing campaign name</span>
              )}
            </p>
            {user && targets.length > 0 && (
              <Alert className="mt-3 bg-blue-50 border-blue-200">
                <AlertDescription className="text-blue-800 text-xs">
                  <strong>Viewing as:</strong> {user.email} • 
                  <strong className="ml-2">Most recent:</strong> {new Date(targets[0].created_date).toLocaleDateString()} • 
                  <strong className="ml-2">Oldest:</strong> {new Date(targets[targets.length - 1].created_date).toLocaleDateString()}
                  <div className="mt-1 text-blue-700">
                    ℹ️ You can only see targets you uploaded. If missing recent uploads, check if you used a different account.
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 items-center mb-4">
          <Button
            variant="destructive"
            size="sm"
            disabled={rescoring}
            onClick={async () => {
              const today = new Date().toISOString().split('T')[0];
              const todayTargets = targets.filter(t => t.created_date && t.created_date.startsWith(today));
              
              if (todayTargets.length === 0) {
                alert("No targets uploaded today");
                return;
              }
              
              if (!confirm(`Delete ${todayTargets.length} targets uploaded today (${new Date().toLocaleDateString()})? This cannot be undone.`)) return;
              
              setRescoring(true);
              try {
                const result = await base44.functions.invoke('bulkDeleteTargets', {
                  targetIds: todayTargets.map(t => t.id)
                });
                
                await queryClient.invalidateQueries({ queryKey: ['bdTargets'] });
                alert(`Successfully deleted ${result.data.deleted} targets`);
              } catch (error) {
                console.error("Delete error:", error);
                alert("Delete failed: " + error.message);
              }
              setRescoring(false);
            }}
          >
            {rescoring ? "Deleting..." : `Delete Today's Upload (${targets.filter(t => t.created_date && t.created_date.startsWith(new Date().toISOString().split('T')[0])).length})`}
          </Button>
        </div>

        <ActionButtons
          rescoring={rescoring}
          cleaningNames={cleaningNames}
          cleanProgress={cleanProgress}
          extractingNames={extractingNames}
          extractProgress={extractProgress}
          generatingShortNames={generatingShortNames}
          shortNameProgress={shortNameProgress}
          reclassifyingSectors={reclassifyingSectors}
          sectorProgress={sectorProgress}
          scoringQuality={scoringQuality}
          qualityProgress={qualityProgress}
          enrichingContacts={enrichingContacts}
          enrichProgress={enrichProgress}
          crawling={crawling}
          crawlProgress={crawlProgress}
          personalizingTargets={personalizingTargets}
          detectingGrowth={detectingGrowth}
          generatingRationales={generatingRationales}
          enrichingAll={enrichingAll}
          enrichAllProgress={enrichAllProgress}
          enrichingCompanyData={enrichingCompanyData}
          companyDataProgress={companyDataProgress}
          selectedCount={selectedTargets.size}
          filteredCount={filteredTargets.length}
          targetsCount={targets.length}
          onRescore={rescoreTargets}
          onCleanNames={cleanCompanyNamesForSelected}
          onExtractNames={extractCompanyNamesForSelected}
          onExportAll={() => exportCSV(true)}
          onGenerateInsights={generateInsightsAndEmail}
          onGenerateShortNames={generateCorrespondenceNamesForSelected}
          onReclassify={reclassifySelectedSectors}
          onAssignSector={() => setShowBulkSectorDialog(true)}
          onScoreQuality={scoreSelectedQuality}
          onEnrichContacts={enrichSelectedContacts}
          onCrawlWebsites={crawlSelectedWebsites}
          onBulkPersonalize={bulkPersonalizeSelected}
          onDetectGrowth={detectGrowthSignalsForSelected}
          onGenerateRationales={generateRationalesForSelected}
          onEnrichAll={enrichAllSelected}
          onEnrichCompanyData={enrichCompanyDataSelected}
          onExportSelected={() => exportCSV(false)}
        />
      </div>

      <Card className="shadow-sm border-slate-200">
        <Collapsible defaultOpen={true}>
          <CardHeader className="pb-3">
            <CollapsibleTrigger className="w-full">
              <CardTitle className="flex items-center gap-2 hover:text-slate-700 transition-colors">
                <Filter className="w-5 h-5" />
                Filters
                <Badge variant="outline" className="ml-auto">{filteredTargets.length} results</Badge>
              </CardTitle>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="grid md:grid-cols-4 lg:grid-cols-5 gap-4 pt-0">
              <div className="space-y-2">
                <div className="text-sm font-medium">Campaign</div>
                <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Campaigns</SelectItem>
                    {campaigns.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Status</div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="qualified">Qualified</SelectItem>
                    <SelectItem value="disqualified">Disqualified</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Clinic Count</div>
                <Select value={clinicFilter} onValueChange={setClinicFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="missing">Missing Clinic Count</SelectItem>
                    <SelectItem value="has">Has Clinic Count</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Quality Tier</div>
                <Select value={qualityFilter} onValueChange={setQualityFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Quality</SelectItem>
                    <SelectItem value="great">GREAT</SelectItem>
                    <SelectItem value="good">GOOD</SelectItem>
                    <SelectItem value="bad">BAD</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Sector</div>
                <Select value={sectorFilter} onValueChange={setSectorFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sectors</SelectItem>
                    <SelectItem value="missing">Missing Sector</SelectItem>
                    <SelectItem value="has">Has Sector</SelectItem>
                    {uniqueSectors.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Company Name</div>
                <Select value={nameFilter} onValueChange={setNameFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="missing">Missing Name</SelectItem>
                    <SelectItem value="has">Has Name</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Correspondence Name</div>
                <Select value={correspondenceFilter} onValueChange={setCorrespondenceFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="missing">Missing Correspondence</SelectItem>
                    <SelectItem value="has">Has Correspondence</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Contact Enrichment</div>
                <Select value={contactEnrichFilter} onValueChange={setContactEnrichFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="missing">Not Enriched</SelectItem>
                    <SelectItem value="has">Enriched</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Growth Signals</div>
                <Select value={growthSignalsFilter} onValueChange={setGrowthSignalsFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="missing">Missing Signals</SelectItem>
                    <SelectItem value="has">Has Signals</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Rationale</div>
                <Select value={rationaleFilter} onValueChange={setRationaleFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="missing">Missing Rationale</SelectItem>
                    <SelectItem value="has">Has Rationale</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Personalization</div>
                <Select value={personalizationFilter} onValueChange={setPersonalizationFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="missing">Missing Personalization</SelectItem>
                    <SelectItem value="has">Has Personalization</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2 lg:col-span-1">
                <div className="text-sm font-medium">Search</div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search by name or location..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {filteredTargets.length === 0 ? (
        <Card className="shadow-sm border-emerald-200">
          <CardContent className="pt-6 text-center">
            <Database className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 mb-4">No saved targets yet. Go to Ops Console to add companies.</p>
            <Link to={createPageUrl("OpsConsole")}>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go to Ops Console
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-sm border-slate-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Saved Companies</CardTitle>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                  {filteredTargets.length} results
                </Badge>
                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-slate-600">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[2000px]">
                <thead>
                  <tr className="text-left border-b-2 border-slate-200 bg-slate-50">
                    <th className="py-3 px-4 font-semibold w-12">
                      <Checkbox
                        checked={selectedTargets.size === filteredTargets.length && filteredTargets.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </th>
                    <th className="py-3 px-4 font-semibold whitespace-nowrap">Name</th>
                    <th className="py-3 px-4 font-semibold whitespace-nowrap">Correspondence Name</th>
                    <th className="py-3 px-4 font-semibold whitespace-nowrap">Sector</th>
                    <th className="py-3 px-4 font-semibold whitespace-nowrap">City</th>
                    <th className="py-3 px-4 font-semibold whitespace-nowrap">State</th>
                    <th className="py-3 px-4 font-semibold whitespace-nowrap">Revenue</th>
                    <SortHeader field="employees">Employees</SortHeader>
                    <SortHeader field="clinicCount">Clinics</SortHeader>
                    <th className="py-3 px-4 font-semibold">Website</th>
                    <th className="py-3 px-4 font-semibold">Quality Tier</th>
                    <th className="py-3 px-4 font-semibold">Contact</th>
                    <th className="py-3 px-4 font-semibold">Growth Signals</th>
                    <th className="py-3 px-4 font-semibold">Personalization</th>
                    <SortHeader field="score">Score</SortHeader>
                    <th className="py-3 px-4 font-semibold">Fit</th>
                    <th className="py-3 px-4 font-semibold">Priority</th>
                    <th className="py-3 px-4 font-semibold">Strategic Rationale</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTargets.map((t) => (
                    <TargetRow
                      key={t.id}
                      target={t}
                      isSelected={selectedTargets.has(t.id)}
                      onToggle={toggleTarget}
                      onGenerateRationale={generateSingleRationale}
                      isGeneratingRationale={generatingSingleRationale === t.id}
                      onRefreshData={refreshSingleTargetData}
                      isRefreshingData={refreshingData === t.id}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {insights && (
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="bg-gradient-to-r from-green-50 to-transparent">
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-green-600"/>
              Email Draft & Insights
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
              <Button variant="secondary" onClick={() => copyToClipboard(emailSubject)}>Copy Subject</Button>
              <Button onClick={() => copyToClipboard(emailBody)} className="bg-green-600 hover:bg-green-700">Copy Body</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedTargets.size > 0 && (
        <Card className="shadow-sm border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="w-5 h-5 text-blue-600" />
              Outreach Integration ({selectedTargets.size} selected)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <OutreachIntegration 
              prospects={filteredTargets.filter(t => selectedTargets.has(t.id) && t.contactEmail)} 
              onSyncComplete={(result) => {
                console.log("Sync complete:", result);
              }}
            />
          </CardContent>
        </Card>
      )}

      {cleaningNames && (
        <LoadingOverlay message="Cleaning Company Names..." progress={cleanProgress} />
      )}

      {extractingNames && (
        <LoadingOverlay message="Extracting Company Names from Websites..." progress={extractProgress} />
      )}

      {detectingGrowth && (
        <LoadingOverlay message="Detecting Growth Signals..." progress={growthProgress} />
      )}

      {generatingRationales && (
        <LoadingOverlay message="Generating Strategic Rationales..." progress={rationaleProgress} />
      )}
    </div>
  );
}