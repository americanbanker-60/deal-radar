import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "../utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  BookOpen, 
  Box, 
  Workflow, 
  CheckCircle2, 
  AlertTriangle, 
  Code, 
  Settings, 
  Database,
  Shield,
  ExternalLink,
  ChevronRight,
  Info,
  Layers,
  GitBranch,
  Server,
  Lock,
  Users,
  FileText,
  Zap,
  Globe,
  Mail
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Documentation() {
  const [activeSection, setActiveSection] = useState("architecture");
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      
      // Redirect non-admins
      if (currentUser.role !== "admin") {
        window.location.href = createPageUrl("OpsConsole");
        return;
      }
    } catch (error) {
      console.error("Error checking access:", error);
      window.location.href = createPageUrl("OpsConsole");
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <p className="text-slate-600">Redirecting...</p>
      </div>
    );
  }

  if (false) {
    // dead code guard - kept as structural placeholder
  }

  const sections = [
    { id: "architecture", label: "Architecture", icon: Box },
    { id: "features", label: "Features & Workflows", icon: Workflow },
    { id: "status", label: "Feature Status", icon: CheckCircle2 },
    { id: "technical", label: "Technical Implementation", icon: Code },
    { id: "operations", label: "Operations & Maintenance", icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="p-3 bg-blue-600 rounded-lg flex-shrink-0">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 break-words">Deal Radar - System Documentation</h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">Comprehensive technical documentation for developers and stakeholders</p>
            </div>
            <Badge variant="secondary" className="flex-shrink-0">v3.0</Badge>
          </div>
        </div>

        <Alert className="bg-blue-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 text-sm">
            <strong>Documentation Purpose:</strong> This is the single source of truth for understanding the Deal Radar application's 
            design, implementation status, and technical architecture. All developers should reference this before making changes.
          </AlertDescription>
        </Alert>

        {/* Main Documentation */}
        <Tabs value={activeSection} onValueChange={setActiveSection}>
          <TabsList className="bg-white border border-slate-200 flex-wrap h-auto gap-1 p-2">
            {sections.map(section => {
              const Icon = section.icon;
              return (
                <TabsTrigger key={section.id} value={section.id} className="gap-2 text-xs sm:text-sm">
                  <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">{section.label}</span>
                  <span className="sm:hidden">{section.label.split(' ')[0]}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* ARCHITECTURE */}
          <TabsContent value="architecture" className="space-y-6">
            <Card>
              <CardHeader className="bg-gradient-to-r from-blue-50 to-transparent">
                <CardTitle className="flex items-center gap-2">
                  <Box className="w-5 h-5 text-blue-600" />
                  System Architecture Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-blue-600" />
                    Application Overview
                  </h3>
                  <p className="text-slate-700 mb-4">
                    <strong>Deal Radar</strong> is a top-of-funnel deal sourcing platform designed for private equity and business 
                    development teams targeting bootstrapped, privately-held companies in healthcare services. The platform ingests 
                    data from Grata exports, enriches it with AI-powered insights, scores targets based on fit criteria, and syncs 
                    prospects to Outreach.io for automated outreach campaigns.
                  </p>
                  
                  <div className="grid md:grid-cols-2 gap-4 mt-4">
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-blue-900 mb-2">Core Purpose</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Transform raw Grata data into qualified acquisition targets</li>
                        <li>• Score companies based on size, operational scale, and strategic fit</li>
                        <li>• Automate prospect enrichment and outreach workflows</li>
                        <li>• Enable data-driven BD pipeline management</li>
                      </ul>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <h4 className="font-semibold text-green-900 mb-2">Target Users</h4>
                      <ul className="text-sm text-green-800 space-y-1">
                        <li>• Private Equity deal sourcers</li>
                        <li>• Business Development teams</li>
                        <li>• M&A analysts and associates</li>
                        <li>• Healthcare services investment professionals</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Server className="w-5 h-5 text-purple-600" />
                    Technology Stack
                  </h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="p-4 bg-slate-50 rounded-lg border">
                      <h4 className="font-semibold text-slate-900 mb-2">Frontend</h4>
                      <ul className="text-sm text-slate-700 space-y-1">
                        <li>• React 18.2</li>
                        <li>• React Router DOM</li>
                        <li>• TanStack Query (data fetching)</li>
                        <li>• Tailwind CSS</li>
                        <li>• Radix UI components</li>
                        <li>• Framer Motion (animations)</li>
                        <li>• Recharts (data visualization)</li>
                      </ul>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg border">
                      <h4 className="font-semibold text-slate-900 mb-2">Backend & Platform</h4>
                      <ul className="text-sm text-slate-700 space-y-1">
                        <li>• Base44 Backend-as-a-Service</li>
                        <li>• Deno Deploy (serverless functions)</li>
                        <li>• PostgreSQL (managed by Base44)</li>
                        <li>• Row Level Security (RLS)</li>
                        <li>• OAuth 2.0 (Outreach integration)</li>
                      </ul>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg border">
                      <h4 className="font-semibold text-slate-900 mb-2">Integrations</h4>
                      <ul className="text-sm text-slate-700 space-y-1">
                        <li>• Outreach.io (OAuth)</li>
                        <li>• OpenAI GPT-4 (via Base44 Core)</li>
                        <li>• Web scraping (InvokeLLM)</li>
                        <li>• File parsing (CSV/XLSX)</li>
                        <li>• Email services (Base44 Core)</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <GitBranch className="w-5 h-5 text-indigo-600" />
                    Core Modules & Workflows
                  </h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-indigo-600 rounded-lg">
                          <Database className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-indigo-900 mb-2">1. Data Ingestion & Normalization</h4>
                          <p className="text-sm text-indigo-800 mb-2">
                            Processes Grata CSV/XLSX exports through a schema mapper that converts company data into normalized format. 
                            Handles revenue/employee ranges, extracts contact information, and validates data integrity.
                          </p>
                          <div className="text-xs text-indigo-700 font-mono bg-white p-2 rounded border border-indigo-200">
                            OpsConsole → Upload → parseCsvFile/parseExcelFile → normalizeRow → grCompaniesRaw
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-purple-600 rounded-lg">
                          <Zap className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-purple-900 mb-2">2. AI Enrichment Engine</h4>
                          <p className="text-sm text-purple-800 mb-2">
                            Uses GPT-4 to generate clean company short names, assign sector classifications, crawl websites for 
                            location counts, and validate website health status.
                          </p>
                          <div className="text-xs text-purple-700 font-mono bg-white p-2 rounded border border-purple-200">
                            enrichNamesAndSectors() → InvokeLLM → companyShortName, sectorFocus<br/>
                            crawlWebsites() → InvokeLLM (web search) → websiteStatus, clinicCount
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-amber-600 rounded-lg">
                          <Workflow className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-amber-900 mb-2">3. Scoring & Filtering System</h4>
                          <p className="text-sm text-amber-800 mb-2">
                            Calculates fit scores based on configurable weights (employee count, clinic count, revenue, website health, 
                            strategic keywords). Supports range-based scoring and peer group comparisons.
                          </p>
                          <div className="text-xs text-amber-700 font-mono bg-white p-2 rounded border border-amber-200">
                            scoreTargets() → weights + targetRanges → score (0-100) + fitScore (0-100)
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-green-600 rounded-lg">
                          <Users className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-green-900 mb-2">4. Outreach Integration</h4>
                          <p className="text-sm text-green-800 mb-2">
                            OAuth-based integration that creates/updates prospects in Outreach.io with enriched data, custom tags, 
                            and scores. Safe mode ensures no automatic sequence enrollment.
                          </p>
                          <div className="text-xs text-green-700 font-mono bg-white p-2 rounded border border-green-200">
                            OAuth flow → OutreachConnection → outreachSyncProspects → Outreach API
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-600 rounded-lg">
                          <Database className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-blue-900 mb-2">5. Campaign Management</h4>
                          <p className="text-sm text-blue-800 mb-2">
                            Saves scored targets to BDTarget entity with campaign tracking, status management, and duplicate detection. 
                            Supports bulk operations and campaign-based filtering.
                          </p>
                          <div className="text-xs text-blue-700 font-mono bg-white p-2 rounded border border-blue-200">
                            saveToDatabase() → BDTarget.bulkCreate() → SavedTargets page
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Database className="w-5 h-5 text-slate-600" />
                    Data Flow Architecture
                  </h3>
                  <div className="p-6 bg-slate-900 rounded-lg text-green-400 font-mono text-sm overflow-x-auto">
                    <pre>{`
┌─────────────────┐
│  Grata Export   │ (CSV/XLSX)
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│  Data Ingestion Pipeline (OpsConsole)                   │
│  - parseCsvFile / parseExcelFile functions              │
│  - Schema Mapper (localStorage mappings)                │
│  - normalizeRow() → handle ranges, extract contacts     │
└────────┬────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│  Enrichment Layer (AI Processing)                       │
│  - enrichNamesAndSectors() → companyShortName, sector   │
│  - crawlWebsites() → clinicCount, websiteStatus         │
└────────┬────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│  Scoring Engine (analyticsHelpers)                      │
│  - filterTargets() → region, revenue, ownership filters │
│  - scoreTargets() → weighted fit scoring                │
└────────┬────────────────────────────────────────────────┘
         │
         ├──────────────────────┬──────────────────────────┐
         ▼                      ▼                          ▼
┌─────────────────┐  ┌──────────────────┐  ┌──────────────────────┐
│  BDTarget DB    │  │  Outreach.io     │  │  Export (CSV/XLSX)   │
│  (Campaigns)    │  │  (Prospects)     │  │  (Email Insights)    │
└─────────────────┘  └──────────────────┘  └──────────────────────┘
                                `}</pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* FEATURES */}
          <TabsContent value="features" className="space-y-6">
            <Card>
              <CardHeader className="bg-gradient-to-r from-green-50 to-transparent">
                <CardTitle className="flex items-center gap-2">
                  <Workflow className="w-5 h-5 text-green-600" />
                  Features & User Workflows
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-4">
                  <FeatureSection
                    title="1. Grata Data Import & Processing"
                    icon={Database}
                    color="blue"
                    description="Upload and normalize company data from Grata exports"
                    workflows={[
                      {
                        name: "File Upload",
                        steps: [
                          "User navigates to OpsConsole → Grata Data tab",
                          "Clicks 'Upload Grata Companies' and selects CSV or XLSX file",
                          "File is base64 encoded and sent to parseCsvFile or parseExcelFile function",
                          "Function extracts headers and rows, returns structured JSON",
                          "Frontend stores raw data in grCompaniesRaw state"
                        ]
                      },
                      {
                        name: "Column Mapping",
                        steps: [
                          "User goes to Settings → Schema Mapper",
                          "Maps Grata column headers to internal fields (e.g., 'Company' → 'Company Name')",
                          "Mappings are saved to localStorage for future uploads",
                          "normalizeRow() applies mappings during data processing"
                        ]
                      },
                      {
                        name: "Data Normalization",
                        steps: [
                          "System converts revenue/employee ranges to midpoints (e.g., '$5M-$10M' → $7.5M)",
                          "Extracts contact information (email, firstName, lastName, title)",
                          "Normalizes location data (city, state, hq)",
                          "Validates and cleans numeric values"
                        ]
                      }
                    ]}
                  />

                  <FeatureSection
                    title="2. AI-Powered Enrichment"
                    icon={Zap}
                    color="purple"
                    description="Enhance company data with AI-generated insights and web intelligence"
                    workflows={[
                      {
                        name: "Company Name & Sector Enrichment",
                        steps: [
                          "User clicks 'Enrich Names & Sectors' button",
                          "For each company, GPT-4 generates:",
                          "  - Clean short name (removes LLC, Inc, legal terms)",
                          "  - Sector classification from predefined HS taxonomy",
                          "Results are stored in _companyShortName and _sectorFocus fields",
                          "~5-10 seconds per company"
                        ]
                      },
                      {
                        name: "Website Crawling",
                        steps: [
                          "User clicks 'Crawl All Websites' button",
                          "For each company with a website URL:",
                          "  - GPT-4 visits website via InvokeLLM (web search enabled)",
                          "  - Extracts clinic/location count from site content",
                          "  - Validates website status (working/broken)",
                          "Results stored in _websiteStatus and _clinicCount fields",
                          "~10-15 seconds per company"
                        ]
                      }
                    ]}
                  />

                  <FeatureSection
                    title="3. Scoring & Filtering Engine"
                    icon={Workflow}
                    color="amber"
                    description="Score companies based on fit criteria and apply business logic filters"
                    workflows={[
                      {
                        name: "Scoring Algorithm",
                        steps: [
                          "Configurable weights (default: 35% employees, 25% clinics, 15% revenue, 15% website, 10% keywords)",
                          "Range-based scoring: full points if within target range, proximity-based outside",
                          "Peer group comparison: scores relative to median of filtered cohort",
                          "Website health: working=full points, broken=0 points",
                          "Strategic keywords: bonus points for matches in name/industry"
                        ]
                      },
                      {
                        name: "Filter Application",
                        steps: [
                          "Region filter: case-insensitive substring match on location fields",
                          "Revenue range: filter by min/max in millions",
                          "Ownership: 'Founder/Bootstrapped Only' or 'Any'",
                          "Score threshold: highlight companies above threshold",
                          "Filters apply in sequence: normalize → filter → score"
                        ]
                      }
                    ]}
                  />

                  <FeatureSection
                    title="4. Campaign Management"
                    icon={Database}
                    color="green"
                    description="Save scored targets to database with campaign tracking"
                    workflows={[
                      {
                        name: "Save to Database",
                        steps: [
                          "User selects targets via checkboxes in OpsConsole table",
                          "Enters campaign name (e.g., 'California Urgent Care Q1 2025')",
                          "Clicks 'Save X Companies' button",
                          "System checks for duplicates based on website URL",
                          "Creates BDTarget records with all enriched data",
                          "Success message shows saved count + duplicates skipped"
                        ]
                      },
                      {
                        name: "View Saved Targets",
                        steps: [
                          "User navigates to 'Saved Targets' page",
                          "Filters by campaign, status, clinic count, search query",
                          "Sorts by score, employees, clinic count",
                          "Updates status (new → contacted → qualified → disqualified → closed)",
                          "Deletes individual targets",
                          "Exports to CSV or re-crawls selected targets"
                        ]
                      }
                    ]}
                  />

                  <FeatureSection
                    title="5. Outreach.io Integration"
                    icon={Mail}
                    color="indigo"
                    description="OAuth-based prospect sync to Outreach.io with safe mode"
                    workflows={[
                      {
                        name: "Connect Outreach Account",
                        steps: [
                          "User clicks 'Connect Outreach Account' in OpsConsole",
                          "System calls outreachInitAuth function to get OAuth URL",
                          "Popup window opens with Outreach login",
                          "User authorizes app with prospects.all and sequences.read scopes",
                          "Outreach redirects to OAuthCallback page",
                          "outreachCompleteAuth exchanges code for access/refresh tokens",
                          "OutreachConnection record created with encrypted tokens",
                          "Connection status updates to 'connected'"
                        ]
                      },
                      {
                        name: "Sync Prospects",
                        steps: [
                          "User configures custom tag and source fields",
                          "Clicks 'Create/Update Prospects in Outreach'",
                          "outreachSyncProspects function:",
                          "  - Checks for existing prospects by email",
                          "  - Creates new prospects or updates existing ones",
                          "  - Adds custom fields (tag, source, score, clinics)",
                          "  - Does NOT add to sequences (safe mode)",
                          "Returns summary: created, updated, errors"
                        ]
                      }
                    ]}
                  />

                  <FeatureSection
                    title="6. Export & Reporting"
                    icon={FileText}
                    color="slate"
                    description="Generate exports and email insights"
                    workflows={[
                      {
                        name: "Data Export",
                        steps: [
                          "CSV export: dataToCsv function converts to CSV string",
                          "XLSX export: exportToExcel function generates Excel file and uploads to storage",
                          "Outreach CSV: pre-formatted with specific columns for Outreach import",
                          "Export all filtered targets or selected subset"
                        ]
                      },
                      {
                        name: "Generate Insights Email",
                        steps: [
                          "User clicks 'Generate Insights + Email'",
                          "System creates summary with top 5 company names",
                          "Drafts email body with key metrics",
                          "User can copy subject and body to clipboard",
                          "Intended for internal stakeholder updates"
                        ]
                      }
                    ]}
                  />
                </div>

                <div className="mt-6">
                  <h3 className="font-semibold text-lg mb-3">Role-Based Access & Permissions</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="w-5 h-5 text-blue-600" />
                        <h4 className="font-semibold text-blue-900">Regular User</h4>
                      </div>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Access to OpsConsole and SavedTargets</li>
                        <li>• Can upload and process Grata data</li>
                        <li>• Can enrich, score, and filter targets</li>
                        <li>• Can save targets to campaigns (own data only via RLS)</li>
                        <li>• Can connect own Outreach account and sync prospects</li>
                        <li>• <strong>RLS ensures users only see their own BDTarget and OutreachConnection records</strong></li>
                      </ul>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="w-5 h-5 text-purple-600" />
                        <h4 className="font-semibold text-purple-900">Admin / Super Admin</h4>
                      </div>
                      <ul className="text-sm text-purple-800 space-y-1">
                        <li>• All regular user permissions</li>
                        <li>• Access to Documentation page (this page)</li>
                        <li>• Can manage environment variables and secrets</li>
                        <li>• Can view backend function logs and errors</li>
                        <li>• Can invite other users to the platform</li>
                        <li>• Full visibility into system architecture and implementation</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* FEATURE STATUS */}
          <TabsContent value="status" className="space-y-6">
            <Card>
              <CardHeader className="bg-gradient-to-r from-amber-50 to-transparent">
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-amber-600" />
                  Feature Implementation Status
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800 text-sm">
                    <strong>Legend:</strong> ✅ Fully Implemented | ⚠️ Partially Implemented | ❌ Not Implemented | 🔄 In Progress
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <StatusSection
                    title="Data Ingestion & Processing"
                    items={[
                      { name: "CSV file upload and parsing", status: "implemented", notes: "Uses parseCsvFile backend function" },
                      { name: "XLSX file upload and parsing", status: "implemented", notes: "Uses parseExcelFile backend function" },
                      { name: "Schema mapper with localStorage persistence", status: "implemented", notes: "Mappings auto-apply to future uploads" },
                      { name: "Range-to-midpoint conversion (revenue, employees)", status: "implemented", notes: "Handles $5M-$10M, 50-100 format" },
                      { name: "Contact extraction (email, name, title)", status: "implemented", notes: "Supports multiple contact fields" },
                      { name: "Debug panel showing data pipeline stages", status: "implemented", notes: "Shows raw → normalized → filtered → scored counts" },
                      { name: "Batch upload (multiple files at once)", status: "not-implemented", notes: "Would require queue system" },
                      { name: "File validation and error recovery", status: "partial", notes: "Basic error messages, no retry logic" }
                    ]}
                  />

                  <StatusSection
                    title="AI Enrichment"
                    items={[
                      { name: "Company name cleaning (remove legal terms)", status: "implemented", notes: "GPT-4 generates clean short names" },
                      { name: "Sector classification from HS taxonomy", status: "implemented", notes: "78 predefined healthcare sectors" },
                      { name: "Website crawling for clinic/location counts", status: "implemented", notes: "Uses InvokeLLM with web search" },
                      { name: "Website health validation (working/broken)", status: "implemented", notes: "Automatic site status check" },
                      { name: "Progress indicators for enrichment", status: "implemented", notes: "Shows current/total with loading overlay" },
                      { name: "Retry failed enrichments", status: "not-implemented", notes: "Failed companies get generic defaults" },
                      { name: "Enrichment result caching", status: "not-implemented", notes: "Re-enriches on every click" },
                      { name: "LinkedIn profile enrichment", status: "not-implemented", notes: "Field exists but not populated" }
                    ]}
                  />

                  <StatusSection
                    title="Scoring & Filtering"
                    items={[
                      { name: "Weighted scoring algorithm", status: "implemented", notes: "5 factors with configurable weights" },
                      { name: "Range-based scoring (target employee/revenue ranges)", status: "implemented", notes: "Full points in range, proximity-based outside" },
                      { name: "Peer group comparison scoring", status: "implemented", notes: "Scores relative to filtered cohort median" },
                      { name: "Website health scoring", status: "implemented", notes: "Working=full points, broken=0" },
                      { name: "Strategic keyword matching", status: "implemented", notes: "+10 bonus for keyword matches" },
                      { name: "Region filter (location substring)", status: "implemented", notes: "Case-insensitive, matches city/state/hq" },
                      { name: "Revenue range filter", status: "implemented", notes: "Min/max in millions" },
                      { name: "Ownership preference filter", status: "implemented", notes: "Founder/Bootstrapped vs Any" },
                      { name: "Score threshold highlighting", status: "implemented", notes: "Priority badge for high scorers" },
                      { name: "Clinic count filter", status: "implemented", notes: "SavedTargets page only" },
                      { name: "Re-scoring with updated weights", status: "implemented", notes: "SavedTargets page has 'Re-score All' button" },
                      { name: "Scoring explanation/breakdown", status: "not-implemented", notes: "No UI showing how score was calculated" },
                      { name: "Custom scoring formulas", status: "not-implemented", notes: "Weights are fixed in code" },
                      { name: "Historical score tracking", status: "not-implemented", notes: "Only current score is stored" }
                    ]}
                  />

                  <StatusSection
                    title="Campaign Management"
                    items={[
                      { name: "Save targets to database with campaign name", status: "implemented", notes: "BDTarget entity with RLS" },
                      { name: "Bulk save (select multiple targets)", status: "implemented", notes: "Checkbox selection + bulkCreate" },
                      { name: "Duplicate detection (by website URL)", status: "implemented", notes: "Skips existing URLs automatically" },
                      { name: "Campaign-based filtering", status: "implemented", notes: "SavedTargets page dropdown" },
                      { name: "Status management (new → contacted → qualified → closed)", status: "implemented", notes: "Dropdown per target" },
                      { name: "Individual target deletion", status: "implemented", notes: "Trash icon per row" },
                      { name: "Re-crawl selected targets", status: "implemented", notes: "Updates websiteStatus and clinicCount" },
                      { name: "Campaign analytics/reporting", status: "not-implemented", notes: "No campaign-level metrics dashboard" },
                      { name: "Bulk status updates", status: "not-implemented", notes: "Must update one by one" },
                      { name: "Campaign templates", status: "not-implemented", notes: "No saved campaign configurations" },
                      { name: "Target notes/annotations", status: "partial", notes: "Notes field exists but no rich UI" }
                    ]}
                  />

                  <StatusSection
                    title="Outreach.io Integration"
                    items={[
                      { name: "OAuth 2.0 authorization flow", status: "implemented", notes: "Popup-based with multi-channel result handling" },
                      { name: "Token storage with encryption", status: "implemented", notes: "OutreachConnection entity with RLS" },
                      { name: "Token refresh on expiry", status: "implemented", notes: "outreachRefreshToken function" },
                      { name: "Create/update prospects", status: "implemented", notes: "Safe mode: no sequence enrollment" },
                      { name: "Custom fields (tag, source, score, clinics)", status: "implemented", notes: "Configurable per sync" },
                      { name: "Sync result summary (created/updated/errors)", status: "implemented", notes: "Shows counts and error details" },
                      { name: "Connection status management", status: "implemented", notes: "Connected/expired/disconnected states" },
                      { name: "Sequence selection and enrollment", status: "not-implemented", notes: "Safe mode prevents auto-enrollment" },
                      { name: "Sync scheduling/automation", status: "not-implemented", notes: "Manual sync only" },
                      { name: "Bi-directional sync (Outreach → Deal Radar)", status: "not-implemented", notes: "One-way push only" },
                      { name: "Multiple Outreach accounts per user", status: "not-implemented", notes: "One connection per user" }
                    ]}
                  />

                  <StatusSection
                    title="Export & Reporting"
                    items={[
                      { name: "CSV export", status: "implemented", notes: "dataToCsv backend function" },
                      { name: "XLSX export with cloud storage", status: "implemented", notes: "exportToExcel function uploads file" },
                      { name: "Outreach-formatted CSV", status: "implemented", notes: "Pre-formatted columns for Outreach import" },
                      { name: "Export filtered vs all targets", status: "implemented", notes: "Respects active filters" },
                      { name: "Export selected targets only", status: "implemented", notes: "SavedTargets page" },
                      { name: "Email insights generator", status: "implemented", notes: "Creates draft email with top targets" },
                      { name: "PowerPoint/PDF reports", status: "not-implemented", notes: "generatePptx function exists but not wired up" },
                      { name: "Scheduled reports", status: "not-implemented", notes: "Would need scheduled tasks" },
                      { name: "Dashboard visualizations", status: "not-implemented", notes: "No charts/graphs for campaign metrics" }
                    ]}
                  />

                  <StatusSection
                    title="User Experience & Polish"
                    items={[
                      { name: "Responsive design (mobile/desktop)", status: "implemented", notes: "Tailwind responsive classes" },
                      { name: "Loading states and progress indicators", status: "implemented", notes: "Loaders for async operations" },
                      { name: "Success/error toast notifications", status: "implemented", notes: "Alert components with auto-dismiss" },
                      { name: "Horizontal table scrolling", status: "implemented", notes: "overflow-x-auto with min-width" },
                      { name: "Sortable columns", status: "implemented", notes: "SavedTargets has click-to-sort headers" },
                      { name: "Search functionality", status: "implemented", notes: "SavedTargets search by name/location" },
                      { name: "How-to-Use tutorial", status: "implemented", notes: "HowToUse dialog with step-by-step guide" },
                      { name: "Dark mode", status: "not-implemented", notes: "Light theme only" },
                      { name: "Keyboard shortcuts", status: "not-implemented", notes: "Mouse-only interactions" },
                      { name: "Undo/redo actions", status: "not-implemented", notes: "No action history" },
                      { name: "Bulk edit interface", status: "not-implemented", notes: "No multi-select edit form" }
                    ]}
                  />

                  <StatusSection
                    title="Security & Privacy"
                    items={[
                      { name: "Row Level Security (RLS) for BDTarget", status: "implemented", notes: "Users only see their own targets" },
                      { name: "Row Level Security (RLS) for OutreachConnection", status: "implemented", notes: "User-scoped connections" },
                      { name: "OAuth token encryption", status: "implemented", notes: "Tokens stored encrypted in DB" },
                      { name: "User authentication (Base44)", status: "implemented", notes: "Built-in auth system" },
                      { name: "Privacy Policy page", status: "implemented", notes: "Static content page" },
                      { name: "Terms of Service page", status: "implemented", notes: "Static content page" },
                      { name: "Role-based access control (admin)", status: "partial", notes: "User role exists but limited enforcement" },
                      { name: "Audit logs", status: "not-implemented", notes: "No tracking of user actions" },
                      { name: "Data export deletion after download", status: "not-implemented", notes: "Excel files persist in storage" },
                      { name: "Two-factor authentication", status: "not-implemented", notes: "Base44 platform limitation" }
                    ]}
                  />
                </div>

                <div className="mt-6">
                  <h3 className="font-semibold text-lg mb-3">Known Gaps & Limitations</h3>
                  <div className="space-y-3">
                    <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-amber-900 mb-1">Data Pipeline Assumptions</h4>
                          <ul className="text-sm text-amber-800 space-y-1">
                            <li>• Assumes Grata data structure doesn't change frequently (schema mapper would need updates)</li>
                            <li>• Range parsing assumes specific formats ($5M-$10M, 50-100, etc.)</li>
                            <li>• No handling for non-numeric revenue/employee values beyond ranges</li>
                            <li>• Duplicate detection relies on website URL - companies without websites can be duplicated</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-red-900 mb-1">Enrichment Constraints</h4>
                          <ul className="text-sm text-red-800 space-y-1">
                            <li>• Website crawling is slow (10-15 sec per company) and cannot be parallelized easily</li>
                            <li>• No retry logic for failed enrichments - companies get default values</li>
                            <li>• Enrichment results are not cached - re-enriching same data costs API credits</li>
                            <li>• GPT-4 token costs can be high for large datasets (200+ companies)</li>
                            <li>• Sector classification accuracy depends on company name clarity</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-blue-900 mb-1">Outreach Integration Limitations</h4>
                          <ul className="text-sm text-blue-800 space-y-1">
                            <li>• Safe mode prevents automatic sequence enrollment (by design)</li>
                            <li>• No bi-directional sync - changes in Outreach don't reflect back</li>
                            <li>• Token refresh happens on-demand, not proactively</li>
                            <li>• OAuth popup can be blocked by browser popup blockers</li>
                            <li>• Only one Outreach connection per user (no multi-account support)</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-purple-900 mb-1">Workflow Constraints</h4>
                          <ul className="text-sm text-purple-800 space-y-1">
                            <li>• No campaign templates or saved configurations</li>
                            <li>• Cannot undo saves to database (no soft delete)</li>
                            <li>• Bulk operations are limited (no bulk edit, bulk status update)</li>
                            <li>• No automation or scheduling of enrichment/sync tasks</li>
                            <li>• Limited analytics - no campaign performance dashboard</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="font-semibold text-lg mb-3">Roadmap Considerations</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <h4 className="font-semibold text-green-900 mb-2">High Priority Enhancements</h4>
                      <ul className="text-sm text-green-800 space-y-1">
                        <li>• Enrichment result caching to reduce API costs</li>
                        <li>• Bulk edit interface for status/notes updates</li>
                        <li>• Campaign analytics dashboard with charts</li>
                        <li>• Scoring explanation UI (show how score was calculated)</li>
                        <li>• Retry failed enrichments functionality</li>
                      </ul>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-blue-900 mb-2">Medium Priority Features</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Scheduled enrichment/sync tasks</li>
                        <li>• PowerPoint report generation integration</li>
                        <li>• LinkedIn profile enrichment</li>
                        <li>• Campaign templates and saved filters</li>
                        <li>• Audit logs for compliance</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TECHNICAL */}
          <TabsContent value="technical" className="space-y-6">
            <Card>
              <CardHeader className="bg-gradient-to-r from-purple-50 to-transparent">
                <CardTitle className="flex items-center gap-2">
                  <Code className="w-5 h-5 text-purple-600" />
                  Technical Implementation Details
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <TechnicalSection
                  title="Data Models & Entities"
                  icon={Database}
                  color="blue"
                >
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-900 rounded-lg text-green-400 font-mono text-xs overflow-x-auto">
                      <pre>{`// BDTarget Entity (entities/BDTarget.json)
{
  "name": "BDTarget",
  "type": "object",
  "properties": {
    "campaign": { "type": "string", "description": "Campaign name" },
    "name": { "type": "string", "description": "Full company name" },
    "companyShortName": { "type": "string", "description": "AI-generated short name" },
    "sectorFocus": { "type": "string", "description": "HS sector classification" },
    "website": { "type": "string", "description": "Company website URL" },
    "websiteStatus": { 
      "type": "string", 
      "enum": ["working", "broken", "missing", "unknown", "error"] 
    },
    "city": { "type": "string" },
    "state": { "type": "string" },
    "hq": { "type": "string", "description": "Headquarters location" },
    "industry": { "type": "string" },
    "subsector": { "type": "string" },
    "revenue": { "type": "number", "description": "Estimated revenue in millions" },
    "employees": { "type": "number", "description": "Employee count" },
    "clinicCount": { "type": "number", "description": "Physical locations" },
    "ownership": { "type": "string" },
    "score": { "type": "number", "description": "Fit score (0-100)" },
    "contactEmail": { "type": "string" },
    "contactFirstName": { "type": "string" },
    "contactLastName": { "type": "string" },
    "contactTitle": { "type": "string" },
    "contactPhone": { "type": "string" },
    "linkedin": { "type": "string" },
    "notes": { "type": "string" },
    "status": { 
      "type": "string", 
      "enum": ["new", "contacted", "qualified", "disqualified", "closed"],
      "default": "new"
    }
  },
  "required": ["campaign", "name"],
  "rls": {
    "read": { "created_by": "{{user.email}}" },
    "update": { "created_by": "{{user.email}}" },
    "delete": { "created_by": "{{user.email}}" }
  }
}

// OutreachConnection Entity (entities/OutreachConnection.json)
{
  "name": "OutreachConnection",
  "type": "object",
  "properties": {
    "user_email": { "type": "string" },
    "access_token": { "type": "string", "description": "Encrypted token" },
    "refresh_token": { "type": "string", "description": "Encrypted token" },
    "expires_at": { "type": "string", "format": "date-time" },
    "outreach_user_id": { "type": "string" },
    "status": { 
      "type": "string", 
      "enum": ["connected", "expired", "disconnected"],
      "default": "connected"
    }
  },
  "required": ["user_email", "access_token", "refresh_token"],
  "rls": {
    "read": { "user_email": "{{user.email}}" },
    "update": { "user_email": "{{user.email}}" },
    "delete": { "user_email": "{{user.email}}" }
  }
}

// Built-in: User entity (automatic)
// - id, email, full_name, role, created_date
// - RLS: users can only update their own records`}</pre>
                    </div>
                  </div>
                </TechnicalSection>

                <TechnicalSection
                  title="Backend Functions"
                  icon={Server}
                  color="purple"
                >
                  <div className="space-y-3">
                    <FunctionDoc
                      name="parseCsvFile"
                      description="Parses CSV content from base64 string"
                      inputs={["fileContent: base64 string"]}
                      outputs={["headers: string[], rows: object[]"]}
                      notes="Handles quoted fields, comma-separated values"
                    />
                    <FunctionDoc
                      name="parseExcelFile"
                      description="Parses XLSX content from base64 string"
                      inputs={["fileContent: base64 string"]}
                      outputs={["headers: string[], rows: object[]"]}
                      notes="Uses xlsx library, reads first worksheet only"
                    />
                    <FunctionDoc
                      name="dataToCsv"
                      description="Converts JSON array to CSV string"
                      inputs={["data: object[]"]}
                      outputs={["csv: string"]}
                      notes="Escapes quotes, handles special characters"
                    />
                    <FunctionDoc
                      name="exportToExcel"
                      description="Generates XLSX file and uploads to storage"
                      inputs={["data: object[], filename: string"]}
                      outputs={["fileUrl: string"]}
                      notes="Returns public URL to download file"
                    />
                    <FunctionDoc
                      name="outreachInitAuth"
                      description="Initiates Outreach OAuth flow"
                      inputs={[]}
                      outputs={["authUrl: string, redirectUri: string"]}
                      notes="Requires OUTREACH_CLIENT_ID, OUTREACH_REDIRECT_URI env vars"
                    />
                    <FunctionDoc
                      name="outreachCompleteAuth"
                      description="Completes OAuth flow, exchanges code for tokens"
                      inputs={["code: string"]}
                      outputs={["success: boolean, message: string"]}
                      notes="Creates OutreachConnection record with encrypted tokens"
                    />
                    <FunctionDoc
                      name="outreachRefreshToken"
                      description="Refreshes expired Outreach access token"
                      inputs={[]}
                      outputs={["access_token: string"]}
                      notes="Called automatically by other Outreach functions"
                    />
                    <FunctionDoc
                      name="outreachGetSequences"
                      description="Fetches user's Outreach sequences"
                      inputs={[]}
                      outputs={["sequences: array"]}
                      notes="Not currently used in UI"
                    />
                    <FunctionDoc
                      name="outreachSyncProspects"
                      description="Creates/updates prospects in Outreach"
                      inputs={["prospects: array, sequenceId: string|null, customFields: object"]}
                      outputs={["success: boolean, created: number, updated: number, errors: array"]}
                      notes="Safe mode: sequenceId should be null to prevent auto-enrollment"
                    />
                  </div>
                </TechnicalSection>

                <TechnicalSection
                  title="Frontend Architecture"
                  icon={Layers}
                  color="green"
                >
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <h4 className="font-semibold text-green-900 mb-2">State Management</h4>
                      <ul className="text-sm text-green-800 space-y-1">
                        <li>• React useState for local component state</li>
                        <li>• TanStack Query for server state (BDTarget entities)</li>
                        <li>• localStorage for persisted settings (schema mappings, weights, filters)</li>
                        <li>• No global state management library (Redux, Zustand, etc.)</li>
                      </ul>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-blue-900 mb-2">Key Components</h4>
                      <div className="space-y-2 text-sm text-blue-800">
                        <div><strong>pages/OpsConsole.js:</strong> Main data processing interface (upload, enrich, score, export)</div>
                        <div><strong>pages/SavedTargets.js:</strong> Campaign management and target tracking</div>
                        <div><strong>pages/OAuthCallback.js:</strong> Handles Outreach OAuth redirect</div>
                        <div><strong>components/ops/SchemaMapper:</strong> Column mapping configuration</div>
                        <div><strong>components/ops/ScoringWeights:</strong> Scoring configuration UI</div>
                        <div><strong>components/ops/HowToUse:</strong> Step-by-step tutorial dialog</div>
                        <div><strong>components/ops/OutreachIntegration:</strong> Outreach connection & sync UI</div>
                        <div><strong>components/ops/analyticsHelpers:</strong> Scoring and filtering logic</div>
                      </div>
                    </div>

                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <h4 className="font-semibold text-purple-900 mb-2">Data Flow Pattern</h4>
                      <div className="text-sm text-purple-800 font-mono bg-white p-2 rounded border border-purple-200">
                        Upload → Parse → Store (grCompaniesRaw)<br/>
                        → useMemo: normalizeRow (apply schema mappings)<br/>
                        → useMemo: filterTargets (apply business rules)<br/>
                        → useMemo: scoreTargets (calculate fit scores)<br/>
                        → Render table with scored results
                      </div>
                    </div>
                  </div>
                </TechnicalSection>

                <TechnicalSection
                  title="Authentication & Security"
                  icon={Lock}
                  color="red"
                >
                  <div className="space-y-4">
                    <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                      <h4 className="font-semibold text-red-900 mb-2">Base44 Authentication</h4>
                      <ul className="text-sm text-red-800 space-y-1">
                        <li>• Built-in authentication system (email/password)</li>
                        <li>• User sessions managed by Base44 platform</li>
                        <li>• base44.auth.me() returns current user or throws error</li>
                        <li>• base44.auth.logout() clears session</li>
                        <li>• base44.auth.redirectToLogin() redirects to login page</li>
                      </ul>
                    </div>

                    <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                      <h4 className="font-semibold text-orange-900 mb-2">Row Level Security (RLS)</h4>
                      <div className="text-sm text-orange-800 space-y-2">
                        <div>All BDTarget and OutreachConnection records have RLS policies:</div>
                        <div className="font-mono text-xs bg-white p-2 rounded border border-orange-200">
                          "rls": {`{`}<br/>
                          &nbsp;&nbsp;"read": {`{ "created_by": "{{user.email}}" }`},<br/>
                          &nbsp;&nbsp;"update": {`{ "created_by": "{{user.email}}" }`},<br/>
                          &nbsp;&nbsp;"delete": {`{ "created_by": "{{user.email}}" }`}<br/>
                          {`}`}
                        </div>
                        <div>This ensures users can only access their own data, enforced at the database level.</div>
                      </div>
                    </div>

                    <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <h4 className="font-semibold text-yellow-900 mb-2">Outreach OAuth Security</h4>
                      <ul className="text-sm text-yellow-800 space-y-1">
                        <li>• OAuth 2.0 authorization code flow</li>
                        <li>• Client credentials stored in environment variables (not in code)</li>
                        <li>• Access/refresh tokens encrypted in database</li>
                        <li>• Tokens scoped to prospects.all and sequences.read</li>
                        <li>• Multi-channel OAuth callback (postMessage, localStorage, BroadcastChannel)</li>
                      </ul>
                    </div>
                  </div>
                </TechnicalSection>

                <TechnicalSection
                  title="Third-Party Integrations"
                  icon={Globe}
                  color="indigo"
                >
                  <div className="space-y-3">
                    <IntegrationDoc
                      name="Base44 Core - InvokeLLM"
                      purpose="AI enrichment and web scraping"
                      usage="GPT-4 for name cleaning, sector classification, website crawling"
                      config="No API key needed - built into Base44 platform"
                      notes="add_context_from_internet: true enables web search for clinic count extraction"
                    />
                    <IntegrationDoc
                      name="Base44 Core - UploadFile"
                      purpose="File storage for Excel exports"
                      usage="Uploads generated XLSX files to cloud storage"
                      config="No configuration needed"
                      notes="Returns public URL for download"
                    />
                    <IntegrationDoc
                      name="Base44 Core - SendEmail"
                      purpose="Email notifications (not currently used)"
                      usage="Could send automated campaign reports"
                      config="No configuration needed"
                      notes="Potential future enhancement"
                    />
                    <IntegrationDoc
                      name="Outreach.io API"
                      purpose="Prospect sync and campaign management"
                      usage="Create/update prospects with enriched data"
                      config="Requires: OUTREACH_CLIENT_ID, OUTREACH_CLIENT_SECRET, OUTREACH_REDIRECT_URI"
                      notes="OAuth app must be created in Outreach settings first"
                    />
                  </div>
                </TechnicalSection>
              </CardContent>
            </Card>
          </TabsContent>

          {/* OPERATIONS */}
          <TabsContent value="operations" className="space-y-6">
            <Card>
              <CardHeader className="bg-gradient-to-r from-slate-50 to-transparent">
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-slate-600" />
                  Operations & Maintenance
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                      <Server className="w-5 h-5" />
                      Environment Variables
                    </h3>
                    <div className="space-y-2 text-sm text-blue-800">
                      <div className="flex items-center justify-between p-2 bg-white rounded border border-blue-200">
                        <code className="text-xs">OUTREACH_CLIENT_ID</code>
                        <Badge className="bg-green-100 text-green-700">Required</Badge>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-white rounded border border-blue-200">
                        <code className="text-xs">OUTREACH_CLIENT_SECRET</code>
                        <Badge className="bg-green-100 text-green-700">Required</Badge>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-white rounded border border-blue-200">
                        <code className="text-xs">OUTREACH_REDIRECT_URI</code>
                        <Badge className="bg-green-100 text-green-700">Required</Badge>
                      </div>
                      <div className="text-xs text-blue-700 mt-2">
                        These are configured in the Base44 dashboard under Settings → Environment Variables
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                      <Database className="w-5 h-5" />
                      Database Management
                    </h3>
                    <ul className="text-sm text-green-800 space-y-2">
                      <li><strong>Provider:</strong> PostgreSQL (managed by Base44)</li>
                      <li><strong>Entities:</strong> BDTarget, OutreachConnection (+ built-in User entity)</li>
                      <li><strong>Backups:</strong> Automatic daily backups by Base44 platform</li>
                      <li><strong>Migrations:</strong> Handled automatically when entity schemas change</li>
                      <li><strong>RLS:</strong> Row Level Security policies enforced at database level</li>
                      <li><strong>Monitoring:</strong> Available in Base44 dashboard</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <h3 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                      <Code className="w-5 h-5" />
                      Deployment Process
                    </h3>
                    <div className="text-sm text-purple-800 space-y-2">
                      <div><strong>Platform:</strong> Base44 (automatic deployment on save)</div>
                      <div><strong>Frontend:</strong> Vite build → deployed to Base44 CDN</div>
                      <div><strong>Backend Functions:</strong> Deno Deploy (serverless)</div>
                      <div><strong>Hot Reload:</strong> Changes reflected immediately in preview</div>
                      <div><strong>Version Control:</strong> Base44 maintains version history</div>
                      <div className="text-xs text-purple-700 mt-2">
                        No manual deployment steps required - save in Base44 AI Assistant and changes go live
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <h3 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      Known Limitations & Constraints
                    </h3>
                    <ul className="text-sm text-amber-800 space-y-2">
                      <li>• <strong>Enrichment Speed:</strong> Website crawling is slow (10-15 sec per company), no parallelization</li>
                      <li>• <strong>API Costs:</strong> GPT-4 usage scales with dataset size (consider costs for 200+ companies)</li>
                      <li>• <strong>Token Limits:</strong> Large datasets may hit InvokeLLM token limits</li>
                      <li>• <strong>Browser Compatibility:</strong> OAuth popup may be blocked by strict popup blockers</li>
                      <li>• <strong>Data Persistence:</strong> Enrichment results stored in memory, re-uploaded files need re-enrichment</li>
                      <li>• <strong>Concurrent Users:</strong> No locking mechanism for bulk operations (unlikely collision risk)</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <h3 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      Security Best Practices
                    </h3>
                    <ul className="text-sm text-red-800 space-y-2">
                      <li>• <strong>OAuth Credentials:</strong> Never commit client secrets to code - use environment variables only</li>
                      <li>• <strong>Token Storage:</strong> Outreach tokens are encrypted in database automatically</li>
                      <li>• <strong>RLS Policies:</strong> Always define RLS on new entities to prevent data leaks</li>
                      <li>• <strong>Input Validation:</strong> Backend functions validate user authentication before processing</li>
                      <li>• <strong>Error Messages:</strong> Avoid exposing sensitive system details in error responses</li>
                      <li>• <strong>File Uploads:</strong> Only accept CSV/XLSX formats, validate file size</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                    <h3 className="font-semibold text-indigo-900 mb-3 flex items-center gap-2">
                      <Zap className="w-5 h-5" />
                      Extension Points & Customization
                    </h3>
                    <div className="text-sm text-indigo-800 space-y-3">
                      <div>
                        <strong>Adding New Enrichment Sources:</strong>
                        <ul className="ml-4 mt-1 space-y-1">
                          <li>• Create new backend function to call external API</li>
                          <li>• Add button to OpsConsole to trigger enrichment</li>
                          <li>• Store results in _customField on grCompaniesRaw</li>
                          <li>• Update normalizeRow() to extract custom field</li>
                        </ul>
                      </div>
                      <div>
                        <strong>Custom Scoring Algorithms:</strong>
                        <ul className="ml-4 mt-1 space-y-1">
                          <li>• Modify scoreTargets() in analyticsHelpers.js</li>
                          <li>• Add new weight sliders in ScoringWeights component</li>
                          <li>• Update weights object in OpsConsole state</li>
                        </ul>
                      </div>
                      <div>
                        <strong>Additional Export Formats:</strong>
                        <ul className="ml-4 mt-1 space-y-1">
                          <li>• Create backend function (e.g., generatePptx exists but not wired)</li>
                          <li>• Add export button in OpsConsole</li>
                          <li>• Use Base44 UploadFile to store generated file</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      User Management
                    </h3>
                    <div className="text-sm text-slate-700 space-y-2">
                      <div><strong>User Invitation:</strong> Admins can invite users via Base44 dashboard</div>
                      <div><strong>User Roles:</strong> 'user' or 'admin' (set during invitation)</div>
                      <div><strong>Password Reset:</strong> Handled by Base44 authentication system</div>
                      <div><strong>Data Isolation:</strong> RLS ensures users only see their own targets/connections</div>
                      <div><strong>User Deletion:</strong> Admin can remove users; their data remains for audit</div>
                    </div>
                  </div>

                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <h3 className="font-semibold text-yellow-900 mb-3 flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Maintenance Checklist
                    </h3>
                    <div className="text-sm text-yellow-800 space-y-2">
                      <div className="flex items-center gap-2">
                        <input type="checkbox" className="rounded" />
                        <span>Monitor API costs (GPT-4 usage via InvokeLLM)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" className="rounded" />
                        <span>Review backend function error logs weekly</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" className="rounded" />
                        <span>Verify Outreach OAuth app status monthly</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" className="rounded" />
                        <span>Check database storage usage in Base44 dashboard</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" className="rounded" />
                        <span>Update HS sector taxonomy as new verticals emerge</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" className="rounded" />
                        <span>Test end-to-end workflow after platform updates</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="text-center text-sm text-slate-500 pt-6 border-t border-slate-200">
          <p>Deal Radar Documentation v3.0 • Last Updated: December 2024</p>
          <p className="mt-1">For technical support, contact your Base44 administrator</p>
        </div>
      </div>
    </div>
  );
}

// Helper Components
function FeatureSection({ title, icon: Icon, color, description, workflows }) {
  const colorClasses = {
    blue: { bg: 'bg-blue-50', border: 'border-blue-200', iconBg: 'bg-blue-600', title: 'text-blue-900', desc: 'text-blue-700' },
    purple: { bg: 'bg-purple-50', border: 'border-purple-200', iconBg: 'bg-purple-600', title: 'text-purple-900', desc: 'text-purple-700' },
    amber: { bg: 'bg-amber-50', border: 'border-amber-200', iconBg: 'bg-amber-600', title: 'text-amber-900', desc: 'text-amber-700' },
    green: { bg: 'bg-green-50', border: 'border-green-200', iconBg: 'bg-green-600', title: 'text-green-900', desc: 'text-green-700' },
    indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', iconBg: 'bg-indigo-600', title: 'text-indigo-900', desc: 'text-indigo-700' },
    slate: { bg: 'bg-slate-50', border: 'border-slate-200', iconBg: 'bg-slate-600', title: 'text-slate-900', desc: 'text-slate-700' }
  };
  const c = colorClasses[color] || colorClasses.blue;
  
  return (
    <div className={`p-4 ${c.bg} rounded-lg border ${c.border}`}>
      <div className="flex items-start gap-3 mb-3">
        <div className={`p-2 ${c.iconBg} rounded-lg`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h4 className={`font-semibold ${c.title}`}>{title}</h4>
          <p className={`text-sm ${c.desc} mt-1`}>{description}</p>
        </div>
      </div>
      <div className="space-y-3 ml-11">
        {workflows.map((workflow, idx) => (
          <div key={idx} className="bg-white p-3 rounded border border-slate-200">
            <h5 className="font-semibold text-sm text-slate-900 mb-2">{workflow.name}</h5>
            <ol className="text-xs text-slate-700 space-y-1">
              {workflow.steps.map((step, stepIdx) => (
                <li key={stepIdx} className="flex items-start gap-2">
                  <ChevronRight className="w-3 h-3 flex-shrink-0 mt-0.5 text-slate-400" />
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusSection({ title, items }) {
  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <div className="bg-slate-100 px-4 py-2 border-b border-slate-200">
        <h4 className="font-semibold text-slate-900">{title}</h4>
      </div>
      <div className="divide-y divide-slate-200">
        {items.map((item, idx) => (
          <div key={idx} className="px-4 py-3 hover:bg-slate-50 transition-colors">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="font-medium text-sm text-slate-900">{item.name}</div>
                {item.notes && (
                  <div className="text-xs text-slate-600 mt-1">{item.notes}</div>
                )}
              </div>
              <Badge className={
                item.status === "implemented" ? "bg-green-100 text-green-700" :
                item.status === "partial" ? "bg-yellow-100 text-yellow-700" :
                item.status === "in-progress" ? "bg-blue-100 text-blue-700" :
                "bg-slate-100 text-slate-700"
              }>
                {item.status === "implemented" ? "✅ Implemented" :
                 item.status === "partial" ? "⚠️ Partial" :
                 item.status === "in-progress" ? "🔄 In Progress" :
                 "❌ Not Implemented"}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TechnicalSection({ title, icon: Icon, color, children }) {
  const colorClasses = {
    blue: { bg: 'bg-blue-50', border: 'border-blue-200', title: 'text-blue-900' },
    purple: { bg: 'bg-purple-50', border: 'border-purple-200', title: 'text-purple-900' },
    green: { bg: 'bg-green-50', border: 'border-green-200', title: 'text-green-900' },
    red: { bg: 'bg-red-50', border: 'border-red-200', title: 'text-red-900' },
    indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', title: 'text-indigo-900' }
  };
  const c = colorClasses[color] || colorClasses.blue;
  
  return (
    <div className={`p-4 ${c.bg} rounded-lg border ${c.border}`}>
      <h3 className={`font-semibold text-lg mb-3 flex items-center gap-2 ${c.title}`}>
        <Icon className="w-5 h-5" />
        {title}
      </h3>
      {children}
    </div>
  );
}

function FunctionDoc({ name, description, inputs, outputs, notes }) {
  return (
    <div className="p-3 bg-white rounded-lg border border-slate-200">
      <div className="flex items-start justify-between mb-2">
        <code className="text-sm font-semibold text-purple-600">{name}()</code>
        <Badge variant="outline" className="text-xs">Backend Function</Badge>
      </div>
      <p className="text-xs text-slate-700 mb-2">{description}</p>
      <div className="grid md:grid-cols-2 gap-2 text-xs">
        <div>
          <strong className="text-slate-600">Inputs:</strong>
          <ul className="ml-4 mt-1 text-slate-700 space-y-0.5">
            {inputs.map((input, idx) => (
              <li key={idx}>• {input}</li>
            ))}
          </ul>
        </div>
        <div>
          <strong className="text-slate-600">Outputs:</strong>
          <ul className="ml-4 mt-1 text-slate-700 space-y-0.5">
            {outputs.map((output, idx) => (
              <li key={idx}>• {output}</li>
            ))}
          </ul>
        </div>
      </div>
      {notes && (
        <div className="mt-2 text-xs text-slate-600 bg-slate-50 p-2 rounded">
          <strong>Notes:</strong> {notes}
        </div>
      )}
    </div>
  );
}

function IntegrationDoc({ name, purpose, usage, config, notes }) {
  return (
    <div className="p-3 bg-white rounded-lg border border-slate-200">
      <div className="flex items-start justify-between mb-2">
        <div className="font-semibold text-sm text-indigo-900">{name}</div>
        <Badge variant="outline" className="text-xs">Integration</Badge>
      </div>
      <div className="space-y-1 text-xs text-slate-700">
        <div><strong>Purpose:</strong> {purpose}</div>
        <div><strong>Usage:</strong> {usage}</div>
        <div><strong>Config:</strong> {config}</div>
        {notes && (
          <div className="text-slate-600 bg-slate-50 p-2 rounded mt-2">
            <strong>Notes:</strong> {notes}
          </div>
        )}
      </div>
    </div>
  );
}