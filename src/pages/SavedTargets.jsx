import React, { useState, useMemo, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Database, Filter, Download, MapPin, Building2, Search, ArrowLeft, ArrowUpDown, ArrowUp, ArrowDown, RefreshCw, Loader2, CheckSquare, Globe2, UserCheck, Sparkles, Award, Tag, Mail, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";

import OutreachIntegration from "../components/ops/OutreachIntegration";
import TargetRow from "../components/targets/TargetRow";
import { scoreTargets } from "../utils/data-engine";

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
  const [cleaningNames, setCleaningNames] = useState(false);
  const [cleanProgress, setCleanProgress] = useState({ current: 0, total: 0 });
  const [insights, setInsights] = useState("");
  const [emailSubject, setEmailSubject] = useState("BD Targets & Market Snapshot");
  const [emailBody, setEmailBody] = useState("");
  const [fitKeywords, setFitKeywords] = useState("Healthcare Services");
  const queryClient = useQueryClient();

  const [user, setUser] = useState(null);

  const { data: targets = [], isLoading } = useQuery({
    queryKey: ['bdTargets'],
    queryFn: async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      return base44.entities.BDTarget.list('-created_date');
    },
  });

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

    for (let i = 0; i < selectedList.length; i++) {
      const target = selectedList[i];
      setQualityProgress({ current: i + 1, total: selectedList.length });

      try {
        await base44.functions.invoke('scoreTargetQuality', { targetId: target.id });
      } catch (error) {
        console.error(`Error scoring ${target.name}:`, error);
      }
    }

    await queryClient.invalidateQueries({ queryKey: ['bdTargets'] });
    setScoringQuality(false);
    setQualityProgress({ current: 0, total: 0 });
  };

  const enrichSelectedContacts = async () => {
    const selectedList = filteredTargets.filter(t => selectedTargets.has(t.id));
    const withContacts = selectedList.filter(t => t.contactFirstName && t.contactLastName);
    
    if (withContacts.length === 0) {
      alert("Please select targets with contact names (First Name and Last Name required)");
      return;
    }

    setEnrichingContacts(true);
    setEnrichProgress({ current: 0, total: withContacts.length });

    for (let i = 0; i < withContacts.length; i++) {
      const target = withContacts[i];
      setEnrichProgress({ current: i + 1, total: withContacts.length });

      try {
        await base44.functions.invoke('enrichContact', { targetId: target.id });
      } catch (error) {
        console.error(`Error enriching ${target.name}:`, error);
      }
    }

    await queryClient.invalidateQueries({ queryKey: ['bdTargets'] });
    setEnrichingContacts(false);
    setEnrichProgress({ current: 0, total: 0 });
  };

  const reclassifySelectedSectors = async () => {
    const selectedList = filteredTargets.filter(t => selectedTargets.has(t.id));
    
    if (selectedList.length === 0) {
      alert("Please select targets to reclassify");
      return;
    }

    setReclassifyingSectors(true);
    setSectorProgress({ current: 0, total: selectedList.length });

    const { classifyCompanySector } = await import("../utils/data-engine");
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

  const generateShortNamesForSelected = async () => {
    const selectedList = filteredTargets.filter(t => selectedTargets.has(t.id));
    
    if (selectedList.length === 0) {
      alert("Please select targets to generate short names");
      return;
    }

    setGeneratingShortNames(true);
    setShortNameProgress({ current: 0, total: selectedList.length });

    for (let i = 0; i < selectedList.length; i++) {
      const target = selectedList[i];
      setShortNameProgress({ current: i + 1, total: selectedList.length });

      try {
        await base44.functions.invoke('generateShortNames', { targetId: target.id });
      } catch (error) {
        console.error(`Error generating short name for ${target.name}:`, error);
      }
    }

    await queryClient.invalidateQueries({ queryKey: ['bdTargets'] });
    setGeneratingShortNames(false);
    setShortNameProgress({ current: 0, total: 0 });
  };

  const bulkPersonalizeSelected = async () => {
    const selectedList = filteredTargets.filter(t => selectedTargets.has(t.id));
    
    if (selectedList.length === 0) {
      alert("Please select targets to personalize");
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

        await base44.entities.BDTarget.update(target.id, {
          personalization_snippet: result.trim()
        });
      } catch (error) {
        console.error(`Error personalizing ${target.name}:`, error);
      }
    }

    await queryClient.invalidateQueries({ queryKey: ['bdTargets'] });
    setPersonalizingTargets(false);
    setPersonalizeProgress({ current: 0, total: 0 });
  };

  const detectGrowthSignalsForSelected = async () => {
    const selectedList = filteredTargets.filter(t => selectedTargets.has(t.id));
    
    if (selectedList.length === 0) {
      alert("Please select targets to analyze");
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

        await base44.entities.BDTarget.update(target.id, {
          growthSignals: (result.signals || []).join(", "),
          growthSignalsDate: new Date().toISOString()
        });
      } catch (error) {
        console.error(`Error detecting growth for ${target.name}:`, error);
      }
    }

    await queryClient.invalidateQueries({ queryKey: ['bdTargets'] });
    setDetectingGrowth(false);
    setGrowthProgress({ current: 0, total: 0 });
  };

  const generateRationalesForSelected = async () => {
    const selectedList = filteredTargets.filter(t => selectedTargets.has(t.id));
    
    if (selectedList.length === 0) {
      alert("Please select targets to generate rationales");
      return;
    }

    setGeneratingRationales(true);
    setRationaleProgress({ current: 0, total: selectedList.length });

    for (let i = 0; i < selectedList.length; i++) {
      const target = selectedList[i];
      setRationaleProgress({ current: i + 1, total: selectedList.length });

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
    }

    await queryClient.invalidateQueries({ queryKey: ['bdTargets'] });
    setGeneratingRationales(false);
    setRationaleProgress({ current: 0, total: 0 });
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

  const cleanCompanyNamesForSelected = async () => {
    const selectedList = filteredTargets.filter(t => selectedTargets.has(t.id));
    
    if (selectedList.length === 0) {
      alert("Please select targets to clean names");
      return;
    }

    setCleaningNames(true);
    setCleanProgress({ current: 0, total: selectedList.length });

    const { generateFriendlyName, generateCorrespondenceName } = await import("../utils/data-engine");

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

    const { crawlCompanyWebsite } = await import("../utils/data-engine");

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
      // Load weights and ranges from localStorage
      const weights = JSON.parse(localStorage.getItem('ops_console_weights') || '{"employees":35,"clinics":25,"revenue":15,"website":15,"keywords":10}');
      const targetMinEmp = localStorage.getItem('ops_console_targetMinEmp') || "";
      const targetMaxEmp = localStorage.getItem('ops_console_targetMaxEmp') || "";
      const targetMinRev = localStorage.getItem('ops_console_targetMinRev') || "";
      const targetMaxRev = localStorage.getItem('ops_console_targetMaxRev') || "";
      const fitKeywords = localStorage.getItem('ops_console_vertical') || "Healthcare Services";

      console.log("Re-scoring with:", { weights, targetMinEmp, targetMaxEmp, targetMinRev, targetMaxRev, fitKeywords });

      // Score them
      const scored = scoreTargets(targets, {
        fitKeywords,
        weights,
        targetRange: {
          minEmployees: targetMinEmp ? parseInt(targetMinEmp) : null,
          maxEmployees: targetMaxEmp ? parseInt(targetMaxEmp) : null,
          minRevenue: targetMinRev ? parseFloat(targetMinRev) : null,
          maxRevenue: targetMaxRev ? parseFloat(targetMaxRev) : null
        }
      });

      console.log("Scored results:", scored.slice(0, 3));

      // Update all targets with new scores
      let updated = 0;
      for (const target of scored) {
        await base44.entities.BDTarget.update(target.id, { score: target.score });
        updated++;
      }

      console.log(`Updated ${updated} targets`);
      await queryClient.invalidateQueries({ queryKey: ['bdTargets'] });
    } catch (error) {
      console.error("Re-score error:", error);
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
      const sectorMatch = sectorFilter === "all" || t.sectorFocus === sectorFilter;
      const searchMatch = !searchQuery || 
                    (t.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (t.companyShortName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (t.city || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (t.state || "").toLowerCase().includes(searchQuery.toLowerCase());
      return campaignMatch && statusMatch && clinicMatch && qualityMatch && sectorMatch && searchMatch;
    });

    if (sortField) {
      filtered = [...filtered].sort((a, b) => {
        const aVal = a[sortField] ?? 0;
        const bVal = b[sortField] ?? 0;
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
      });
    }

    return filtered;
  }, [targets, selectedCampaign, statusFilter, clinicFilter, qualityFilter, sectorFilter, searchQuery, sortField, sortDirection]);

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

  const toggleSelectAll = () => {
    if (selectedTargets.size === filteredTargets.length) {
      setSelectedTargets(new Set());
    } else {
      setSelectedTargets(new Set(filteredTargets.map(t => t.id)));
    }
  };

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
      "Short Name": t.companyShortName,
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
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
              <span className="font-medium">Generating Short Names...</span>
            </div>
            <Progress value={(shortNameProgress.current / shortNameProgress.total) * 100} className="w-64" />
            <div className="text-sm text-slate-600 mt-2 text-center">
              {shortNameProgress.current} / {shortNameProgress.total} companies
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

      {personalizingTargets && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
              <span className="font-medium">Creating Personalized Openers...</span>
            </div>
            <Progress value={(personalizeProgress.current / personalizeProgress.total) * 100} className="w-64" />
            <div className="text-sm text-slate-600 mt-2 text-center">
              {personalizeProgress.current} / {personalizeProgress.total} companies
            </div>
          </div>
        </div>
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
        <div className="flex flex-wrap gap-2 mt-4">
          <Button 
            variant="outline" 
            onClick={rescoreTargets} 
            disabled={rescoring || targets.length === 0}
            className="text-xs sm:text-sm"
          >
            {rescoring ? (
              <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
            )}
            <span className="hidden sm:inline">Re-score All</span>
            <span className="sm:hidden">Re-score</span>
          </Button>
          <Button 
            variant="outline" 
            onClick={cleanCompanyNamesForSelected} 
            disabled={cleaningNames || selectedTargets.size === 0}
            className="text-xs sm:text-sm"
          >
            {cleaningNames ? (
              <>
                <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2 animate-spin" />
                <span className="hidden sm:inline">Cleaning {cleanProgress.current}/{cleanProgress.total}</span>
                <span className="sm:hidden">Clean...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                <span className="hidden lg:inline">Clean Names ({selectedTargets.size})</span>
                <span className="lg:hidden">Clean ({selectedTargets.size})</span>
              </>
            )}
          </Button>
          <Button variant="outline" onClick={() => exportCSV(true)} disabled={filteredTargets.length === 0} className="text-xs sm:text-sm">
            <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
            <span className="hidden sm:inline">Export All</span>
            <span className="sm:hidden">Export</span>
          </Button>
          <Button 
            onClick={generateInsightsAndEmail} 
            disabled={filteredTargets.length === 0}
            className="bg-emerald-600 hover:bg-emerald-700 text-xs sm:text-sm"
          >
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
            <span className="hidden sm:inline">Generate Insights</span>
            <span className="sm:hidden">Insights</span>
          </Button>
          <Button 
            variant="outline" 
            onClick={generateShortNamesForSelected} 
            disabled={generatingShortNames || selectedTargets.size === 0}
            className="text-xs sm:text-sm"
          >
            {generatingShortNames ? (
              <>
                <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2 animate-spin" />
                <span className="hidden sm:inline">Generating {shortNameProgress.current}/{shortNameProgress.total}</span>
                <span className="sm:hidden">Gen...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                <span className="hidden lg:inline">Short Names ({selectedTargets.size})</span>
                <span className="lg:hidden">Names ({selectedTargets.size})</span>
              </>
            )}
          </Button>
          <Button 
            variant="outline" 
            onClick={reclassifySelectedSectors} 
            disabled={reclassifyingSectors || selectedTargets.size === 0}
            className="text-xs sm:text-sm"
          >
            {reclassifyingSectors ? (
              <>
                <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2 animate-spin" />
                <span className="hidden sm:inline">Reclassifying {sectorProgress.current}/{sectorProgress.total}</span>
                <span className="sm:hidden">Classify...</span>
              </>
            ) : (
              <>
                <Building2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                <span className="hidden lg:inline">AI Reclassify ({selectedTargets.size})</span>
                <span className="lg:hidden">AI ({selectedTargets.size})</span>
              </>
            )}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setShowBulkSectorDialog(true)} 
            disabled={selectedTargets.size === 0}
            className="text-xs sm:text-sm"
          >
            <Tag className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
            <span className="hidden lg:inline">Assign Sector ({selectedTargets.size})</span>
            <span className="lg:hidden">Assign ({selectedTargets.size})</span>
          </Button>
          <Button 
            variant="outline" 
            onClick={scoreSelectedQuality} 
            disabled={scoringQuality || selectedTargets.size === 0}
            className="text-xs sm:text-sm"
          >
            {scoringQuality ? (
              <>
                <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2 animate-spin" />
                <span className="hidden sm:inline">Scoring {qualityProgress.current}/{qualityProgress.total}</span>
                <span className="sm:hidden">Score...</span>
              </>
            ) : (
              <>
                <Award className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                <span className="hidden lg:inline">Score Quality ({selectedTargets.size})</span>
                <span className="lg:hidden">Quality ({selectedTargets.size})</span>
              </>
            )}
          </Button>
          <Button 
            variant="outline" 
            onClick={enrichSelectedContacts} 
            disabled={enrichingContacts || selectedTargets.size === 0}
            className="text-xs sm:text-sm"
          >
            {enrichingContacts ? (
              <>
                <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2 animate-spin" />
                <span className="hidden sm:inline">Enriching {enrichProgress.current}/{enrichProgress.total}</span>
                <span className="sm:hidden">Enrich...</span>
              </>
            ) : (
              <>
                <UserCheck className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                <span className="hidden lg:inline">Enrich Contacts ({selectedTargets.size})</span>
                <span className="lg:hidden">Contacts ({selectedTargets.size})</span>
              </>
            )}
          </Button>
          <Button 
            variant="outline" 
            onClick={crawlSelectedWebsites} 
            disabled={crawling || selectedTargets.size === 0}
            className="text-xs sm:text-sm"
          >
            {crawling ? (
              <>
                <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2 animate-spin" />
                <span className="hidden sm:inline">Crawling {crawlProgress.current}/{crawlProgress.total}</span>
                <span className="sm:hidden">Crawl...</span>
              </>
            ) : (
              <>
                <Globe2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                <span className="hidden lg:inline">Crawl Sites ({selectedTargets.size})</span>
                <span className="lg:hidden">Sites ({selectedTargets.size})</span>
              </>
            )}
          </Button>
          <Button 
            variant="outline" 
            onClick={bulkPersonalizeSelected} 
            disabled={personalizingTargets || selectedTargets.size === 0}
            className="text-xs sm:text-sm"
          >
            {personalizingTargets ? (
              <>
                <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2 animate-spin" />
                <span className="hidden sm:inline">Personalizing...</span>
                <span className="sm:hidden">Pers...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                <span className="hidden lg:inline">Bulk Personalize ({selectedTargets.size})</span>
                <span className="lg:hidden">Personalize ({selectedTargets.size})</span>
              </>
            )}
          </Button>
          <Button 
            variant="outline" 
            onClick={detectGrowthSignalsForSelected} 
            disabled={detectingGrowth || selectedTargets.size === 0}
            className="text-xs sm:text-sm"
          >
            {detectingGrowth ? (
              <>
                <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2 animate-spin" />
                <span className="hidden sm:inline">Detecting...</span>
                <span className="sm:hidden">Detect...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                <span className="hidden lg:inline">Growth Signals ({selectedTargets.size})</span>
                <span className="lg:hidden">Growth ({selectedTargets.size})</span>
              </>
            )}
          </Button>
          <Button 
            variant="outline" 
            onClick={generateRationalesForSelected} 
            disabled={generatingRationales || selectedTargets.size === 0}
            className="text-xs sm:text-sm"
          >
            {generatingRationales ? (
              <>
                <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2 animate-spin" />
                <span className="hidden sm:inline">Generating...</span>
                <span className="sm:hidden">Gen...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                <span className="hidden lg:inline">Rationales ({selectedTargets.size})</span>
                <span className="lg:hidden">Rationale ({selectedTargets.size})</span>
              </>
            )}
          </Button>
          <Button onClick={() => exportCSV(false)} disabled={selectedTargets.size === 0} className="text-xs sm:text-sm">
            <CheckSquare className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
            <span className="hidden sm:inline">Export Selected ({selectedTargets.size})</span>
            <span className="sm:hidden">Sel. ({selectedTargets.size})</span>
          </Button>
        </div>
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-7 gap-4">
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
                {uniqueSectors.map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
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
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                {filteredTargets.length} results
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[1200px]">
                <thead>
                  <tr className="text-left border-b-2 border-slate-200 bg-slate-50">
                    <th className="py-3 px-4 font-semibold w-12">
                      <Checkbox
                        checked={selectedTargets.size === filteredTargets.length && filteredTargets.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </th>
                    <th className="py-3 px-4 font-semibold whitespace-nowrap">Name</th>
                    <th className="py-3 px-4 font-semibold whitespace-nowrap">Short Name</th>
                    <th className="py-3 px-4 font-semibold whitespace-nowrap">Correspondence</th>
                    <th className="py-3 px-4 font-semibold whitespace-nowrap">Sector</th>
                    <th className="py-3 px-4 font-semibold whitespace-nowrap">City</th>
                    <th className="py-3 px-4 font-semibold whitespace-nowrap">State</th>
                    <th className="py-3 px-4 font-semibold whitespace-nowrap">Revenue</th>
                    <SortHeader field="employees">Employees</SortHeader>
                    <SortHeader field="clinicCount">Clinics</SortHeader>
                    <th className="py-3 px-4 font-semibold">Website</th>
                    <th className="py-3 px-4 font-semibold">Growth</th>
                    <SortHeader field="score">Score</SortHeader>
                    <th className="py-3 px-4 font-semibold">Fit</th>
                    <th className="py-3 px-4 font-semibold">Priority</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTargets.map((t) => (
                    <TargetRow
                      key={t.id}
                      target={t}
                      isSelected={selectedTargets.has(t.id)}
                      onToggle={toggleTarget}
                      onGenerateRationale={generateSingleRationale}
                      isGeneratingRationale={generatingSingleRationale === t.id}
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
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="font-medium">Cleaning Company Names...</span>
            </div>
            <Progress value={(cleanProgress.current / cleanProgress.total) * 100} className="w-64" />
            <div className="text-sm text-slate-600 mt-2 text-center">
              {cleanProgress.current} / {cleanProgress.total} companies
            </div>
          </div>
        </div>
      )}

      {detectingGrowth && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <Loader2 className="w-6 h-6 animate-spin text-green-600" />
              <span className="font-medium">Detecting Growth Signals...</span>
            </div>
            <Progress value={(growthProgress.current / growthProgress.total) * 100} className="w-64" />
            <div className="text-sm text-slate-600 mt-2 text-center">
              {growthProgress.current} / {growthProgress.total} companies
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
    </div>
  );
}