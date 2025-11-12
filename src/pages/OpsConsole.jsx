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
import { Download, Upload, Filter, BarChart3, Sparkles, Database, Settings, CircleAlert, Workflow, Mail, Loader2, HelpCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";

import SchemaMapper from "../components/ops/SchemaMapper";
import { useDealsAnalytics, filterTargets, scoreTargets } from "../components/ops/analyticsHelpers";
import HowToUse from "../components/ops/HowToUse";
import OutreachIntegration from "../components/ops/OutreachIntegration";

/**
 * Base44 PitchBook + Grata Ops Console (v3)
 * -----------------------------------------
 * Features:
 *  - Excel import (.xlsx) alongside CSV for PitchBook & Grata
 *  - Grata range handling: revenue/employee ranges → midpoint
 *  - Outreach.io export with custom fields: Source, Vertical, Tag
 *  - Slack insights (webhook) + copy-to-clipboard
 *  - PPTX export with KPIs + insights + top targets
 *  - Email draft generator with copy buttons
 *  - Schema mapper (per-dataset)
 */

const DEFAULT_FIELDS = [
  "Company Name","URL","HQ Location","Ownership","Founders / Executives","Revenue","EBITDA","EBITDA Margin","Last Financing Year","Website","LinkedIn","Investors","City","State","Country","Industry","Subsector","Employee Count","Employee Range","Revenue Range","Email","First Name","Last Name","Job Title","Phone"
];

export default function OpsConsole(){
  const [page, setPage] = useState("pitchbook");
  const [loading, setLoading] = useState(false);
  const [showHowTo, setShowHowTo] = useState(false);

  // PitchBook states
  const [pbCompaniesRaw, setPbCompaniesRaw] = useState([]);
  const [pbDealsRaw, setPbDealsRaw] = useState([]);
  const [pbHeaders, setPbHeaders] = useState([]);
  const [pbMap, setPbMap] = useState({});

  // Grata states
  const [grCompaniesRaw, setGrCompaniesRaw] = useState([]);
  const [grHeaders, setGrHeaders] = useState([]);
  const [grMap, setGrMap] = useState({});

  // Shared filters & settings
  const [regionFilter, setRegionFilter] = useState("United States");
  const [minRev, setMinRev] = useState(10);
  const [maxRev, setMaxRev] = useState(200);
  const [minEbitda, setMinEbitda] = useState(1);
  const [maxEbitda, setMaxEbitda] = useState(50);
  const [ownerPref, setOwnerPref] = useState("Founder-owned");
  const [scoreThreshold, setScoreThreshold] = useState(65);
  const [slackWebhook, setSlackWebhook] = useState("");
  const [insights, setInsights] = useState("");

  // Outreach custom fields
  const [vertical, setVertical] = useState("Healthcare Services");
  const [tag, setTag] = useState("BD-Priority");
  const [fitKeywords, setFitKeywords] = useState("Healthcare Services");

  // Email draft
  const [emailSubject, setEmailSubject] = useState("BD Targets & Market Snapshot");
  const [emailBody, setEmailBody] = useState("");

  const onUpload = async (file, kind) => {
    setLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const content = e.target.result.split(',')[1]; // Get base64 content
        const ext = file.name.toLowerCase().split(".").pop();
        
        let result;
        if (ext === "csv") {
          result = await base44.functions.parseCsvFile({ fileContent: content });
        } else {
          result = await base44.functions.parseExcelFile({ fileContent: content });
        }
        
        if (kind === "pb-companies") { 
          setPbCompaniesRaw(result.rows); 
          setPbHeaders(result.headers); 
        }
        if (kind === "pb-deals") { 
          setPbDealsRaw(result.rows); 
        }
        if (kind === "gr-companies") { 
          setGrCompaniesRaw(result.rows); 
          setGrHeaders(result.headers); 
        }
        setLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("File upload error:", error);
      setLoading(false);
    }
  };

  const normalizedPB = useMemo(() => 
    pbCompaniesRaw.map((r) => normalizeRow(r, pbMap, { preferRangeMidpoint: false })), 
    [pbCompaniesRaw, pbMap]
  );
  
  const normalizedGR = useMemo(() => 
    grCompaniesRaw.map((r) => normalizeRow(r, grMap, { preferRangeMidpoint: true })), 
    [grCompaniesRaw, grMap]
  );

  const pbScored = useMemo(() => 
    scoreTargets(
      filterTargets(normalizedPB, { regionFilter, minRev, maxRev, minEbitda, maxEbitda, ownerPref }), 
      { fitKeywords }
    ), 
    [normalizedPB, regionFilter, minRev, maxRev, minEbitda, maxEbitda, ownerPref, fitKeywords]
  );
  
  const grScored = useMemo(() => 
    scoreTargets(
      filterTargets(normalizedGR, { regionFilter, minRev, maxRev, minEbitda, maxEbitda, ownerPref }), 
      { fitKeywords }
    ), 
    [normalizedGR, regionFilter, minRev, maxRev, minEbitda, maxEbitda, ownerPref, fitKeywords]
  );

  const pbDealsKpis = useDealsAnalytics(pbDealsRaw);

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
      alert("Copied to clipboard!");
    } catch(e) {
      console.error("Copy failed:", e);
    } 
  };

  const postToSlack = async (text) => {
    if (!slackWebhook) return alert("Add a Slack Incoming Webhook in Settings.");
    try { 
      await fetch(slackWebhook, { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ text })
      }); 
      alert("Posted to Slack."); 
    } catch(e) { 
      alert("Slack post failed. Check webhook."); 
    }
  };

  const insightsFor = (label, scored, kpis) => {
    const top = scored.slice(0, 10);
    const names = top.map((t) => t.name).filter(Boolean).slice(0,5).join(", ");
    const medMult = kpis && !isNaN(kpis.medianMultiple) ? `${kpis.medianMultiple.toFixed(1)}x` : "n/a";
    const lines = [
      `${label}: ${scored.length} qualified founder-owned targets; top 5: ${names || "(add data)"}.`,
      kpis ? `24m median EV/EBITDA from uploaded comps: ${medMult}.` : null,
      kpis ? `${kpis.dealCount} add-ons in last 24m; most active buyers on dashboard.` : null,
      `Prioritized ${top.length} targets with Likely Seller Score ≥ ${scoreThreshold}.`,
    ].filter(Boolean);
    return `• ${lines.join("\n• ")}`;
  };

  const generateOutputs = (label, scored, kpis) => {
    const text = insightsFor(label, scored, kpis);
    setInsights(text);
    setEmailBody(`Hi team,\n\n${text}\n\nAttached are the cleaned targets and snapshot.\n\n- ${label} export generated from Ops Console`);
  };

  const exportPPT = async (label, scored, kpis) => {
    setLoading(true);
    try {
      const slides = [
        {
          title: "Key KPIs (last 24 months)",
          bullets: [
            kpis ? `Deals: ${kpis.dealCount}` : null,
            kpis && !isNaN(kpis.medianMultiple) ? `Median EV/EBITDA: ${kpis.medianMultiple.toFixed(1)}x` : null,
            `Qualified Targets: ${scored.length}`,
            `Score Threshold: ${scoreThreshold}`
          ].filter(Boolean)
        },
        {
          title: "Top Targets",
          content: scored.slice(0,10).map((r, i) => 
            `${i+1}. ${r.name} — Rev ${isNaN(r.revenue) ? "—" : r.revenue + "MM"}, EBITDA ${isNaN(r.ebitda) ? "—" : r.ebitda + "MM"}, Score ${r.score}`
          ).join("\n")
        },
        {
          title: "Insights",
          content: insightsFor(label, scored, kpis)
        }
      ];

      const result = await base44.functions.generatePptx({
        title: `${label} – Deal Radar`,
        slides
      });

      window.open(result.fileUrl, '_blank');
    } catch (error) {
      console.error("PPTX generation error:", error);
      alert("Failed to generate PPTX");
    }
    setLoading(false);
  };

  const exportExcel = async (filename, data) => {
    setLoading(true);
    try {
      const result = await base44.functions.exportToExcel({
        data,
        filename
      });
      window.open(result.fileUrl, '_blank');
    } catch (error) {
      console.error("Excel export error:", error);
      alert("Failed to export Excel");
    }
    setLoading(false);
  };

  const exportCSV = async (filename, data) => {
    setLoading(true);
    try {
      const result = await base44.functions.dataToCsv({ data });
      downloadText(filename, result.csv);
    } catch (error) {
      console.error("CSV export error:", error);
      alert("Failed to export CSV");
    }
    setLoading(false);
  };

  const outreachCsv = (rows, opts) => {
    const out = rows.map((r) => ({
      Email: r.contact?.email || "",
      "First Name": r.contact?.firstName || "",
      "Last Name": r.contact?.lastName || "",
      Company: r.name || "",
      "Job Title": r.contact?.title || "",
      "Account Name": r.name || "",
      Source: opts.source,
      Vertical: opts.vertical,
      Tag: opts.tag,
      Score: r.score ?? "",
      Region: r.hq || "",
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
        <div className="p-3 bg-blue-600 rounded-lg">
          <Database className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900">PitchBook + Grata Ops Console</h1>
          <p className="text-sm text-slate-600">Deal sourcing & intelligence platform</p>
        </div>
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

      {loading && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl shadow-xl flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="font-medium">Processing...</span>
          </div>
        </div>
      )}

      <Tabs value={page} onValueChange={setPage}>
        <TabsList className="bg-white border border-slate-200">
          <TabsTrigger value="pitchbook">PitchBook</TabsTrigger>
          <TabsTrigger value="grata">Grata</TabsTrigger>
          <TabsTrigger value="settings"><Settings className="w-4 h-4 mr-1"/>Settings</TabsTrigger>
        </TabsList>

        {/* PITCHBOOK PAGE */}
        <TabsContent value="pitchbook" className="space-y-6">
          {pbCompaniesRaw.length === 0 && (
            <Card className="shadow-sm border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-600 rounded-lg">
                    <HelpCircle className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-900 mb-2">Getting Started with PitchBook Data</h3>
                    <p className="text-sm text-blue-700 mb-3">
                      Upload your PitchBook company exports to start analyzing acquisition targets. Don't know where to begin?
                    </p>
                    <Button
                      onClick={() => setShowHowTo(true)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      View Step-by-Step Guide
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-transparent">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Upload className="w-5 h-5 text-blue-600"/>
                  Upload Companies (.csv/.xlsx)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                <Input 
                  type="file" 
                  accept=".csv,.xlsx" 
                  onChange={(e) => e.target.files && onUpload(e.target.files[0], "pb-companies")}
                  className="cursor-pointer"
                />
                <div className="text-xs text-muted-foreground flex items-start gap-2">
                  <CircleAlert className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  Use Settings → Schema Mapper to map headers.
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-transparent">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Upload className="w-5 h-5 text-purple-600"/>
                  Upload Deals (.csv/.xlsx)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                <Input 
                  type="file" 
                  accept=".csv,.xlsx" 
                  onChange={(e) => e.target.files && onUpload(e.target.files[0], "pb-deals")}
                  className="cursor-pointer"
                />
                <div className="text-xs text-muted-foreground">
                  Optional: for deal flow analytics
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-sm border-slate-200">
            <CardHeader className="bg-gradient-to-r from-amber-50 to-transparent">
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-amber-600"/>
                Filters + Outreach Fields
              </CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-4 pt-4">
              <div className="space-y-2">
                <div className="text-sm font-medium">Region contains</div>
                <Input value={regionFilter} onChange={(e) => setRegionFilter(e.target.value)}/>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm font-medium">Ownership preference</div>
                <Select value={ownerPref} onValueChange={setOwnerPref}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Founder-owned">Founder-owned</SelectItem>
                    <SelectItem value="Any">Any</SelectItem>
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
                <div className="text-sm font-medium">EBITDA range ($MM)</div>
                <div className="flex gap-2">
                  <Input 
                    type="number" 
                    value={minEbitda} 
                    onChange={(e) => setMinEbitda(parseFloat(e.target.value))}
                    placeholder="Min"
                  />
                  <Input 
                    type="number" 
                    value={maxEbitda} 
                    onChange={(e) => setMaxEbitda(parseFloat(e.target.value))}
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

          {/* KPIs */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="shadow-sm border-slate-200 hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600">Total Qualified Targets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-blue-600">{pbScored.length}</div>
                <div className="text-xs text-muted-foreground mt-2">After filters</div>
              </CardContent>
            </Card>
            
            <Card className="shadow-sm border-slate-200 hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600">24-mo Deal Count</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-purple-600">{pbDealsKpis.dealCount || 0}</div>
                <div className="text-xs text-muted-foreground mt-2">From deals</div>
              </CardContent>
            </Card>
            
            <Card className="shadow-sm border-slate-200 hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600">Median EV/EBITDA</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-amber-600">
                  {isNaN(pbDealsKpis.medianMultiple) ? "—" : `${pbDealsKpis.medianMultiple.toFixed(1)}x`}
                </div>
                <div className="text-xs text-muted-foreground mt-2">Computed</div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="shadow-sm border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-600"/>
                  Deal Volume (24m)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={pbDealsKpis.series}>
                      <defs>
                        <linearGradient id="colorDeals" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="date" stroke="#64748b" />
                      <YAxis allowDecimals={false} stroke="#64748b" />
                      <Tooltip />
                      <Area 
                        type="monotone" 
                        dataKey="deals" 
                        stroke="#3b82f6" 
                        fill="url(#colorDeals)" 
                        strokeWidth={2} 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-sm border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-purple-600"/>
                  Top Buyers (24m)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={pbDealsKpis.buyerSeries}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="buyer" hide />
                      <YAxis allowDecimals={false} stroke="#64748b" />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" name="Deals" fill="#a855f7" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Targets Table */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader>
              <CardTitle>Targets (PitchBook – ranked)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b-2 border-slate-200 bg-slate-50">
                      <th className="py-3 px-4 font-semibold">Name</th>
                      <th className="py-3 px-4 font-semibold">HQ</th>
                      <th className="py-3 px-4 font-semibold">Revenue</th>
                      <th className="py-3 px-4 font-semibold">EBITDA</th>
                      <th className="py-3 px-4 font-semibold">Employees</th>
                      <th className="py-3 px-4 font-semibold">Ownership</th>
                      <th className="py-3 px-4 font-semibold">Last Fin.</th>
                      <th className="py-3 px-4 font-semibold">Score</th>
                      <th className="py-3 px-4 font-semibold">Priority</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pbScored.map((t, i) => (
                      <tr key={i} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 max-w-[260px] truncate font-medium">{t.name}</td>
                        <td className="py-3 px-4 text-slate-600">{t.hq}</td>
                        <td className="py-3 px-4 text-slate-600">{isNaN(t.revenue) ? "—" : `$${t.revenue}M`}</td>
                        <td className="py-3 px-4 text-slate-600">{isNaN(t.ebitda) ? "—" : `$${t.ebitda}M`}</td>
                        <td className="py-3 px-4 text-slate-600">{isNaN(t.employees) ? "—" : Math.round(t.employees)}</td>
                        <td className="py-3 px-4 text-slate-600">{t.ownership}</td>
                        <td className="py-3 px-4 text-slate-600">{t.lastFinancingYear || "—"}</td>
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
                    onClick={() => exportCSV("pb_cleaned_scored_targets.csv", pbScored)}
                    disabled={loading}
                  >
                    <Download className="w-4 h-4 mr-2"/>CSV
                  </Button>
                  <Button 
                    variant="secondary" 
                    onClick={() => exportExcel("pb_cleaned_scored_targets.xlsx", pbScored)}
                    disabled={loading}
                  >
                    <Download className="w-4 h-4 mr-2"/>XLSX
                  </Button>
                  <Button 
                    variant="secondary" 
                    onClick={() => exportCSV("pb_outreach_prospects.csv", outreachCsv(pbScored, { source:"PitchBook", vertical, tag }))}
                    disabled={loading}
                  >
                    <Download className="w-4 h-4 mr-2"/>Outreach CSV
                  </Button>
                  <Button 
                    onClick={() => generateOutputs("PitchBook", pbScored, pbDealsKpis)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Sparkles className="w-4 h-4 mr-2"/>Generate Insights + Email
                  </Button>
                  <Button 
                    onClick={() => exportPPT("PitchBook", pbScored, pbDealsKpis)}
                    disabled={loading}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Download className="w-4 h-4 mr-2"/>Export PPTX
                  </Button>
                </div>
                
                <OutreachIntegration 
                  prospects={pbScored.filter(t => t.score >= scoreThreshold)} 
                  onSyncComplete={(result) => {
                    console.log("Sync complete:", result);
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Email Draft */}
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

        {/* GRATA PAGE */}
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
                      Upload your Grata company exports to discover and score potential targets. Need help exporting from Grata?
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
                  Schema Mapper (Grata) in Settings handles ranges → midpoint.
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
                  Upload → Map headers
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  Filters → Score (Grata weights range data)
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                  Export Outreach & CSV/XLSX → Insights/PPT/Email
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>Targets (Grata – ranked)</CardTitle>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                  {grScored.length} qualified
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b-2 border-slate-200 bg-slate-50">
                      <th className="py-3 px-4 font-semibold">Name</th>
                      <th className="py-3 px-4 font-semibold">HQ</th>
                      <th className="py-3 px-4 font-semibold">Revenue</th>
                      <th className="py-3 px-4 font-semibold">EBITDA</th>
                      <th className="py-3 px-4 font-semibold">Employees</th>
                      <th className="py-3 px-4 font-semibold">Ownership</th>
                      <th className="py-3 px-4 font-semibold">Score</th>
                      <th className="py-3 px-4 font-semibold">Priority</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grScored.map((t, i) => (
                      <tr key={i} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 max-w-[260px] truncate font-medium">{t.name}</td>
                        <td className="py-3 px-4 text-slate-600">{t.hq}</td>
                        <td className="py-3 px-4 text-slate-600">{isNaN(t.revenue) ? "—" : `$${t.revenue}M`}</td>
                        <td className="py-3 px-4 text-slate-600">{isNaN(t.ebitda) ? "—" : `$${t.ebitda}M`}</td>
                        <td className="py-3 px-4 text-slate-600">{isNaN(t.employees) ? "—" : Math.round(t.employees)}</td>
                        <td className="py-3 px-4 text-slate-600">{t.ownership}</td>
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
                    disabled={loading}
                  >
                    <Download className="w-4 h-4 mr-2"/>CSV
                  </Button>
                  <Button 
                    variant="secondary" 
                    onClick={() => exportExcel("grata_cleaned_scored_targets.xlsx", grScored)}
                    disabled={loading}
                  >
                    <Download className="w-4 h-4 mr-2"/>XLSX
                  </Button>
                  <Button 
                    variant="secondary" 
                    onClick={() => exportCSV("grata_outreach_prospects.csv", outreachCsv(grScored, { source:"Grata", vertical, tag }))}
                    disabled={loading}
                  >
                    <Download className="w-4 h-4 mr-2"/>Outreach CSV
                  </Button>
                  <Button 
                    onClick={() => generateOutputs("Grata", grScored)}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Sparkles className="w-4 h-4 mr-2"/>Generate Insights + Email
                  </Button>
                  <Button 
                    onClick={() => exportPPT("Grata", grScored)}
                    disabled={loading}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    <Download className="w-4 h-4 mr-2"/>Export PPTX
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

          {/* Email Draft */}
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

        {/* SETTINGS PAGE */}
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
                  Add the credentials below, then click "Connect Outreach Account" on PitchBook or Grata tabs.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <div className="p-4 bg-slate-50 rounded-lg border">
                  <h4 className="font-semibold text-sm mb-2">Required Secrets (configure in Dashboard)</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <code className="text-xs bg-white px-2 py-1 rounded">OUTREACH_CLIENT_ID</code>
                      <Badge variant="outline">Required</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <code className="text-xs bg-white px-2 py-1 rounded">OUTREACH_CLIENT_SECRET</code>
                      <Badge variant="outline">Required</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <code className="text-xs bg-white px-2 py-1 rounded">OUTREACH_REDIRECT_URI</code>
                      <Badge variant="outline">Auto-configured</Badge>
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
                  After configuring secrets, connect your account from the PitchBook or Grata tab to start syncing prospects directly to Outreach.
                </div>
              </div>
            </CardContent>
          </Card>
        
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-transparent">
              <CardTitle>Schema Mapper – PitchBook</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <SchemaMapper 
                headers={pbHeaders} 
                mapping={pbMap} 
                setMapping={setPbMap} 
                internalFields={DEFAULT_FIELDS} 
              />
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
              <CardTitle>Integrations & Defaults</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="space-y-2">
                <div className="text-sm font-medium">Slack Incoming Webhook URL</div>
                <Input 
                  placeholder="https://hooks.slack.com/services/..." 
                  value={slackWebhook} 
                  onChange={(e) => setSlackWebhook(e.target.value)} 
                />
                <div className="text-xs text-muted-foreground flex items-start gap-2">
                  <CircleAlert className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  Create a Slack Incoming Webhook (per channel). We can upgrade to a Slack App/OAuth later.
                </div>
              </div>
              
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm font-medium text-blue-900 mb-2">Outreach.io CSV Export</div>
                <div className="text-xs text-blue-700">
                  Exports include: Email, First/Last Name, Company, Job Title, Account Name, Source, Vertical, Tag, Score, Region
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
                    <Button onClick={() => postToSlack(insights)} className="bg-purple-600 hover:bg-purple-700">
                      Post to Slack
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

// Helper functions extracted from original
function normalizeRow(row, map, opts) {
  const pick = (k) => map[k] ? row[map[k]] : undefined;
  const name = pick("Company Name") || row.Company || row["Company"] || row["Name"] || "";

  const revenueRange = pick("Revenue Range");
  const empRange = pick("Employee Range");
  const employeeCountRaw = pick("Employee Count") || row.Employees;

  const revenue = opts?.preferRangeMidpoint && revenueRange ? midpointFromRange(revenueRange) : toNumber(pick("Revenue"));
  const ebitda = toNumber(pick("EBITDA"));
  const margin = isNaN(toNumber(pick("EBITDA Margin"))) && revenue ? (ebitda / revenue) * 100 : toNumber(pick("EBITDA Margin"));
  const lastFinancingYear = pick("Last Financing Year") || yearFrom(String(pick("Notes")||""));
  const employees = opts?.preferRangeMidpoint && empRange ? midpointFromRange(empRange) : toNumber(employeeCountRaw);

  return {
    name,
    url: pick("URL") || row.URL || row.Website || "",
    website: pick("Website") || row.Website || "",
    linkedin: pick("LinkedIn") || row.LinkedIn || "",
    hq: pick("HQ Location") || row["HQ"] || row.City || row.State || row.Country || "",
    industry: pick("Industry") || row.Industry || "Healthcare Services",
    subsector: pick("Subsector") || row.Subsector || "",
    revenue: isNaN(Number(revenue)) ? undefined : Math.round(Number(revenue) / 1_000_000),
    ebitda: isNaN(Number(ebitda)) ? undefined : Math.round(Number(ebitda) / 1_000_000),
    margin,
    employees: employees,
    ownership: pick("Ownership") || row.Ownership || "Unknown",
    lastFinancingYear: lastFinancingYear ? parseInt(String(lastFinancingYear),10) : undefined,
    investors: pick("Investors") || row.Investors || "",
    notes: row.Notes || "",
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