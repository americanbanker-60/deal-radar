import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Database, Filter, Download, Trash2, MapPin, Globe, Building2, Search, ArrowLeft, ArrowUpDown, ArrowUp, ArrowDown, RefreshCw, Loader2, CheckSquare, Globe2, UserCheck, Sparkles, Award, AlertTriangle, CheckCircle, Tag } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";

import { scoreTargets } from "../components/ops/analyticsHelpers";

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

    for (let i = 0; i < selectedList.length; i++) {
      const target = selectedList[i];
      setSectorProgress({ current: i + 1, total: selectedList.length });

      try {
        await base44.functions.invoke('classifySectorPrecise', { targetId: target.id });
      } catch (error) {
        console.error(`Error reclassifying ${target.name}:`, error);
      }
    }

    await queryClient.invalidateQueries({ queryKey: ['bdTargets'] });
    setReclassifyingSectors(false);
    setSectorProgress({ current: 0, total: 0 });
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

    for (let i = 0; i < selectedList.length; i++) {
      const target = selectedList[i];
      setCrawlProgress({ current: i + 1, total: selectedList.length });

      if (!target.website) continue;

      try {
        const prompt = `Visit the website ${target.website} for the company "${target.name}". 
        
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

        await base44.entities.BDTarget.update(target.id, {
          websiteStatus: result.websiteStatus || "unknown",
          clinicCount: result.clinicCount || undefined
        });
      } catch (error) {
        console.error(`Error crawling ${target.name}:`, error);
        await base44.entities.BDTarget.update(target.id, {
          websiteStatus: "error"
        });
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

  const toggleTarget = (id) => {
    const newSelected = new Set(selectedTargets);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedTargets(newSelected);
  };

  const exportCSV = async (exportAll = true) => {
    const toExport = exportAll ? filteredTargets : filteredTargets.filter(t => selectedTargets.has(t.id));
    const data = toExport.map(t => ({
      Campaign: t.campaign,
      "Company Name": t.name,
      "Short Name": t.companyShortName,
      "Sector Focus": t.sectorFocus,
      City: t.city,
      State: t.state,
      Revenue: t.revenue ? `$${t.revenue}M` : "",
      Employees: t.employees,
      Clinics: t.clinicCount,
      Score: t.score,
      Status: t.status,
      Email: t.contactEmail,
      "First Name": t.contactFirstName,
      "Last Name": t.contactLastName,
      Title: t.contactTitle,
      Website: t.website,
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
      <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex flex-col sm:flex-row items-start gap-3">
          <Link to={createPageUrl("OpsConsole")}>
            <Button variant="outline" size="icon" className="flex-shrink-0">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="p-3 bg-emerald-600 rounded-lg flex-shrink-0">
            <Database className="w-6 h-6 text-white" />
          </div>
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
          <Button variant="outline" onClick={() => exportCSV(true)} disabled={filteredTargets.length === 0} className="text-xs sm:text-sm">
            <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
            <span className="hidden sm:inline">Export All</span>
            <span className="sm:hidden">Export</span>
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
                    <th className="py-3 px-4 font-semibold whitespace-nowrap">Campaign</th>
                        <th className="py-3 px-4 font-semibold whitespace-nowrap">Name</th>
                            <th className="py-3 px-4 font-semibold whitespace-nowrap">Quality</th>
                            <th className="py-3 px-4 font-semibold whitespace-nowrap">Contact</th>
                            <th className="py-3 px-4 font-semibold whitespace-nowrap">Sector</th>
                        <th className="py-3 px-4 font-semibold whitespace-nowrap">City</th>
                        <th className="py-3 px-4 font-semibold whitespace-nowrap">State</th>
                        <th className="py-3 px-4 font-semibold whitespace-nowrap">Website</th>
                    <SortHeader field="employees">Employees</SortHeader>
                    <SortHeader field="clinicCount">Clinics</SortHeader>
                    <SortHeader field="score">Score</SortHeader>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTargets.map((t) => (
                    <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <Checkbox
                          checked={selectedTargets.has(t.id)}
                          onCheckedChange={() => toggleTarget(t.id)}
                        />
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="text-xs">{t.campaign}</Badge>
                      </td>
                      <td className="py-3 px-4 max-w-[200px] truncate font-medium">{t.name}</td>
                      <td className="py-3 px-4">
                        {t.qualityTier ? (
                          <div className="flex items-center gap-2">
                            <Badge className={
                              t.qualityTier === "great" ? "bg-green-100 text-green-800 border-green-200" :
                              t.qualityTier === "good" ? "bg-blue-100 text-blue-800 border-blue-200" :
                              "bg-amber-100 text-amber-800 border-amber-200"
                            }>
                              {t.qualityTier === "great" && <CheckCircle className="w-3 h-3 mr-1" />}
                              {t.qualityTier === "good" && <Award className="w-3 h-3 mr-1" />}
                              {t.qualityTier === "bad" && <AlertTriangle className="w-3 h-3 mr-1" />}
                              {t.qualityTier.toUpperCase()}
                            </Badge>
                            {t.qualityConfidence && (
                              <span className="text-xs text-slate-500">{t.qualityConfidence}%</span>
                            )}
                          </div>
                        ) : "—"}
                      </td>
                      <td className="py-3 px-4">
                        {t.contactFirstName && t.contactLastName ? (
                          <div className="text-sm">
                            <div className="font-medium flex items-center gap-1">
                              {t.contactHonorific && <span className="text-purple-600">{t.contactHonorific}</span>}
                              {t.contactPreferredName || t.contactFirstName} {t.contactLastName}
                              {t.contactPreferredName && t.contactPreferredNameConfidence > 70 && (
                                <Sparkles className="w-3 h-3 text-purple-500" title={`${t.contactPreferredNameConfidence}% confidence`} />
                              )}
                            </div>
                            {t.contactTitle && <div className="text-xs text-slate-500">{t.contactTitle}</div>}
                            {t.contactCredential && (
                              <Badge variant="outline" className="text-xs mt-1">{t.contactCredential}</Badge>
                            )}
                          </div>
                        ) : "—"}
                      </td>
                      <td className="py-3 px-4">
                            {t.sectorFocus && (
                              <Badge variant="outline" className="text-xs whitespace-nowrap">{t.sectorFocus}</Badge>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{t.city || t.hq || "—"}</td>
                                                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{t.state || "—"}</td>
                          <td className="py-3 px-4">
                        {t.website ? (
                          <a 
                            href={t.website.startsWith('http') ? t.website : `https://${t.website}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-xs truncate block max-w-[150px]"
                          >
                            {t.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                          </a>
                        ) : "—"}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{t.employees || "—"}</td>
                      <td className="py-3 px-4 text-slate-600">
                        {t.clinicCount ? (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-blue-600" />
                            {t.clinicCount}
                          </div>
                        ) : "—"}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16">
                            <Progress value={t.score} className="h-2" />
                          </div>
                          <span className="text-xs font-medium">{t.score}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Select
                          value={t.status}
                          onValueChange={(status) => updateStatusMutation.mutate({ id: t.id, status })}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="contacted">Contacted</SelectItem>
                            <SelectItem value="qualified">Qualified</SelectItem>
                            <SelectItem value="disqualified">Disqualified</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="py-3 px-4">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteTargetMutation.mutate(t.id)}
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}