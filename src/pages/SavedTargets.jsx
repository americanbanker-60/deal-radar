import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Database, Filter, Download, Trash2, MapPin, Globe, Building2, Search, ArrowLeft, ArrowUpDown, ArrowUp, ArrowDown, RefreshCw, Loader2 } from "lucide-react";
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
  const [clinicFilter, setClinicFilter] = useState("all");
  const queryClient = useQueryClient();

  const { data: targets = [], isLoading } = useQuery({
    queryKey: ['bdTargets'],
    queryFn: () => base44.entities.BDTarget.list('-created_date'),
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
    const unique = [...new Set(targets.map(t => t.campaign))];
    return unique.sort();
  }, [targets]);

  const filteredTargets = useMemo(() => {
    let filtered = targets.filter(t => {
      const campaignMatch = selectedCampaign === "all" || t.campaign === selectedCampaign;
      const statusMatch = statusFilter === "all" || t.status === statusFilter;
      const clinicMatch = clinicFilter === "all" || 
                    (clinicFilter === "missing" && !t.clinicCount) ||
                    (clinicFilter === "has" && t.clinicCount);
      const searchMatch = !searchQuery || 
                    (t.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (t.companyShortName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (t.city || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (t.state || "").toLowerCase().includes(searchQuery.toLowerCase());
      return campaignMatch && statusMatch && clinicMatch && searchMatch;
    });

    if (sortField) {
      filtered = [...filtered].sort((a, b) => {
        const aVal = a[sortField] ?? 0;
        const bVal = b[sortField] ?? 0;
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
      });
    }

    return filtered;
  }, [targets, selectedCampaign, statusFilter, searchQuery, sortField, sortDirection]);

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

  const exportCSV = async () => {
    const data = filteredTargets.map(t => ({
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

  return (
    <div className="w-full mx-auto p-4 md:p-6 space-y-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="flex items-center gap-3 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <Link to={createPageUrl("OpsConsole")}>
          <Button variant="outline" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="p-3 bg-emerald-600 rounded-lg">
          <Database className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900">Saved BD Targets</h1>
          <p className="text-sm text-slate-600">{targets.length} companies across {campaigns.length} campaigns</p>
        </div>
        <Button 
          variant="outline" 
          onClick={rescoreTargets} 
          disabled={rescoring || targets.length === 0}
        >
          {rescoring ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Re-score All
        </Button>
        <Button onClick={exportCSV} disabled={filteredTargets.length === 0}>
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-4 gap-4">
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

          <div className="space-y-2 md:col-span-2">
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
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b-2 border-slate-200 bg-slate-50">
                    <th className="py-3 px-4 font-semibold whitespace-nowrap">Campaign</th>
                        <th className="py-3 px-4 font-semibold whitespace-nowrap">Name</th>
                        <th className="py-3 px-4 font-semibold whitespace-nowrap">Short Name</th>
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
                        <Badge variant="outline" className="text-xs">{t.campaign}</Badge>
                      </td>
                      <td className="py-3 px-4 max-w-[200px] truncate font-medium">{t.name}</td>
                      <td className="py-3 px-4 text-slate-600">{t.companyShortName || "—"}</td>
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