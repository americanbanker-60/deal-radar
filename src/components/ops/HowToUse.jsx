import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Download, 
  Upload, 
  Search, 
  Filter, 
  Sparkles, 
  Mail, 
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  Database,
  BarChart3,
  FileSpreadsheet,
  Presentation,
  Users,
  Target,
  Settings,
  TrendingUp,
  X
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function HowToUse({ open, onClose }) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "Welcome to Your Deal Sourcing Command Center",
      icon: Target,
      color: "blue",
      content: (
        <div className="space-y-4">
          <div className="text-center py-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4">
              <Target className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-2">What This App Does</h3>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Transform raw company data from PitchBook and Grata into prioritized acquisition targets, 
              complete with scoring, analytics, and ready-to-use exports for your outreach campaigns.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mt-8">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Database className="w-5 h-5 text-blue-600" />
                <h4 className="font-semibold text-blue-900">Unified Data Platform</h4>
              </div>
              <p className="text-sm text-blue-700">
                Import company lists from multiple sources, normalize data formats, and handle ranges automatically
              </p>
            </div>

            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <h4 className="font-semibold text-purple-900">Intelligent Scoring</h4>
              </div>
              <p className="text-sm text-purple-700">
                AI-powered "Likely Seller Score" ranks targets based on revenue, EBITDA, ownership, and strategic fit
              </p>
            </div>

            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-5 h-5 text-green-600" />
                <h4 className="font-semibold text-green-900">Deal Intelligence</h4>
              </div>
              <p className="text-sm text-green-700">
                Analyze recent M&A activity with automatic valuation multiples and buyer trend analysis
              </p>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-amber-600" />
                <h4 className="font-semibold text-amber-900">Outreach Ready</h4>
              </div>
              <p className="text-sm text-amber-700">
                One-click exports to Outreach.io, Excel, and PowerPoint with custom tags and insights
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Step 1: Get Your Data from PitchBook",
      icon: Download,
      color: "blue",
      content: (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <Database className="w-5 h-5" />
              In PitchBook Platform:
            </h4>
            <ol className="space-y-3 text-sm text-blue-800">
              <li className="flex items-start gap-3">
                <Badge className="mt-0.5 bg-blue-600">1</Badge>
                <div>
                  <strong>Search for companies:</strong> Use filters like "Healthcare Services" + "Founder-owned" + "$10M-$200M Revenue"
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Badge className="mt-0.5 bg-blue-600">2</Badge>
                <div>
                  <strong>Select your targets:</strong> Choose the companies you want to analyze (tip: 50-500 companies work best)
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Badge className="mt-0.5 bg-blue-600">3</Badge>
                <div>
                  <strong>Export to Excel or CSV:</strong> Click Export → choose all relevant columns (Company Name, Revenue, EBITDA, HQ Location, Ownership, etc.)
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Badge className="mt-0.5 bg-blue-600">4</Badge>
                <div>
                  <strong>Optional - Export deals data:</strong> Search recent M&A deals in your sector, export with EV, EBITDA, Multiples, Buyer info
                </div>
              </li>
            </ol>
          </div>

          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <strong>Pro Tip:</strong> Include contact information (Email, First Name, Last Name, Job Title) if you want to create Outreach.io prospect lists directly
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-semibold mb-2 text-sm text-slate-700">Recommended PitchBook Columns:</h4>
            <div className="flex flex-wrap gap-2">
              {["Company Name", "Revenue", "EBITDA", "HQ Location", "Ownership", "Industry", "Employees", "Website", "LinkedIn", "Last Financing Year"].map(col => (
                <Badge key={col} variant="outline" className="text-xs">{col}</Badge>
              ))}
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Step 2: Get Your Data from Grata",
      icon: Download,
      color: "emerald",
      content: (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 p-6 rounded-lg border border-emerald-200">
            <h4 className="font-semibold text-emerald-900 mb-3 flex items-center gap-2">
              <Search className="w-5 h-5" />
              In Grata Platform:
            </h4>
            <ol className="space-y-3 text-sm text-emerald-800">
              <li className="flex items-start gap-3">
                <Badge className="mt-0.5 bg-emerald-600">1</Badge>
                <div>
                  <strong>Create your search:</strong> Use Grata's AI search with criteria like industry, location, revenue ranges, employee counts
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Badge className="mt-0.5 bg-emerald-600">2</Badge>
                <div>
                  <strong>Review results:</strong> Grata typically provides 100-1000+ companies with estimated ranges
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Badge className="mt-0.5 bg-emerald-600">3</Badge>
                <div>
                  <strong>Export to CSV or Excel:</strong> Download your company list with all available fields
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Badge className="mt-0.5 bg-emerald-600">4</Badge>
                <div>
                  <strong>Include contact data:</strong> If available, export decision-maker contacts for outreach campaigns
                </div>
              </li>
            </ol>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-purple-800">
                <strong>Grata Advantage:</strong> This app automatically converts Grata's revenue and employee ranges (like "$5M-$10M") to midpoints for accurate scoring
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-semibold mb-2 text-sm text-slate-700">Key Grata Fields to Include:</h4>
            <div className="flex flex-wrap gap-2">
              {["Company Name", "Revenue Range", "Employee Range", "Location", "Industry", "Website", "Email", "First Name", "Last Name"].map(col => (
                <Badge key={col} variant="outline" className="text-xs">{col}</Badge>
              ))}
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Step 3: Upload & Map Your Data",
      icon: Upload,
      color: "indigo",
      content: (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 p-6 rounded-lg border border-indigo-200">
            <h4 className="font-semibold text-indigo-900 mb-3 flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload Your Files:
            </h4>
            <ol className="space-y-3 text-sm text-indigo-800">
              <li className="flex items-start gap-3">
                <Badge className="mt-0.5 bg-indigo-600">1</Badge>
                <div>
                  <strong>Go to PitchBook or Grata tab:</strong> Choose which data source you're uploading
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Badge className="mt-0.5 bg-indigo-600">2</Badge>
                <div>
                  <strong>Click "Upload Companies":</strong> Select your CSV or XLSX file (both formats supported)
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Badge className="mt-0.5 bg-indigo-600">3</Badge>
                <div>
                  <strong>Upload Deals (optional):</strong> For PitchBook, also upload recent M&A deals to see market multiples
                </div>
              </li>
            </ol>
          </div>

          <div className="bg-gradient-to-r from-slate-50 to-slate-100 p-6 rounded-lg border border-slate-200">
            <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Map Your Columns (Settings Tab):
            </h4>
            <p className="text-sm text-slate-700 mb-3">
              Your file columns might have different names than our system expects. Map them in Settings:
            </p>
            <div className="bg-white p-4 rounded border">
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
                  <span className="text-slate-600">Our Field:</span>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600">Your Column:</span>
                </div>
                <div className="flex items-center justify-between p-2 hover:bg-slate-50 rounded">
                  <span className="font-medium">Company Name</span>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                  <Badge variant="outline">Company</Badge>
                </div>
                <div className="flex items-center justify-between p-2 hover:bg-slate-50 rounded">
                  <span className="font-medium">Revenue</span>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                  <Badge variant="outline">Total Revenue ($)</Badge>
                </div>
                <div className="flex items-center justify-between p-2 hover:bg-slate-50 rounded">
                  <span className="font-medium">HQ Location</span>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                  <Badge variant="outline">Headquarters</Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <strong>Auto-mapping:</strong> The system remembers your mappings, so you only need to do this once per data source
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Step 4: Filter & Score Your Targets",
      icon: Filter,
      color: "amber",
      content: (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-amber-50 to-amber-100 p-6 rounded-lg border border-amber-200">
            <h4 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Set Your Filters:
            </h4>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="bg-white p-3 rounded border border-amber-200">
                <strong className="text-amber-900">Region:</strong>
                <p className="text-amber-700 mt-1">Filter by location (e.g., "United States", "California", "Northeast")</p>
              </div>
              <div className="bg-white p-3 rounded border border-amber-200">
                <strong className="text-amber-900">Revenue Range:</strong>
                <p className="text-amber-700 mt-1">Set min/max revenue in millions (default: $10M-$200M)</p>
              </div>
              <div className="bg-white p-3 rounded border border-amber-200">
                <strong className="text-amber-900">EBITDA Range:</strong>
                <p className="text-amber-700 mt-1">Set min/max EBITDA in millions (default: $1M-$50M)</p>
              </div>
              <div className="bg-white p-3 rounded border border-amber-200">
                <strong className="text-amber-900">Ownership:</strong>
                <p className="text-amber-700 mt-1">Prefer "Founder-owned" or accept "Any"</p>
              </div>
              <div className="bg-white p-3 rounded border border-amber-200">
                <strong className="text-amber-900">Score Threshold:</strong>
                <p className="text-amber-700 mt-1">Set minimum score for "Priority" badge (default: 65)</p>
              </div>
              <div className="bg-white p-3 rounded border border-amber-200">
                <strong className="text-amber-900">Strategic Fit:</strong>
                <p className="text-amber-700 mt-1">Keywords for +10 bonus (e.g., "urgent care, telehealth")</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Understanding the "Likely Seller Score" (0-100):
            </h4>
            <div className="space-y-2 text-sm text-green-800">
              <div className="flex items-start gap-2">
                <Badge className="mt-0.5 bg-green-600">20</Badge>
                <div><strong>Revenue Match:</strong> How close to peer group median</div>
              </div>
              <div className="flex items-start gap-2">
                <Badge className="mt-0.5 bg-green-600">20</Badge>
                <div><strong>EBITDA Match:</strong> How close to peer group median</div>
              </div>
              <div className="flex items-start gap-2">
                <Badge className="mt-0.5 bg-green-600">20</Badge>
                <div><strong>Founder-owned:</strong> Higher likelihood of considering offers</div>
              </div>
              <div className="flex items-start gap-2">
                <Badge className="mt-0.5 bg-green-600">25</Badge>
                <div><strong>Time Since Financing:</strong> Longer = more likely to consider exit</div>
              </div>
              <div className="flex items-start gap-2">
                <Badge className="mt-0.5 bg-green-600">15</Badge>
                <div><strong>EBITDA Margin:</strong> Stronger margins = more attractive</div>
              </div>
              <div className="flex items-start gap-2">
                <Badge className="mt-0.5 bg-green-600">+10</Badge>
                <div><strong>Strategic Fit:</strong> Bonus for matching your keywords</div>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="flex items-start gap-3">
              <Target className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-purple-800">
                <strong>Pro Tip:</strong> Targets scoring 70+ are your best bets. Focus on the top 20-50 companies for initial outreach
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Step 5: Analyze & Export",
      icon: BarChart3,
      color: "purple",
      content: (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-6 rounded-lg border border-purple-200">
            <h4 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Review Your Analytics:
            </h4>
            <div className="grid md:grid-cols-3 gap-3 text-sm">
              <div className="bg-white p-4 rounded border border-purple-200 text-center">
                <div className="text-3xl font-bold text-purple-600 mb-1">247</div>
                <div className="text-purple-700">Qualified Targets</div>
              </div>
              <div className="bg-white p-4 rounded border border-purple-200 text-center">
                <div className="text-3xl font-bold text-purple-600 mb-1">23</div>
                <div className="text-purple-700">Deals (24mo)</div>
              </div>
              <div className="bg-white p-4 rounded border border-purple-200 text-center">
                <div className="text-3xl font-bold text-purple-600 mb-1">8.2x</div>
                <div className="text-purple-700">Median EV/EBITDA</div>
              </div>
            </div>
            <p className="text-sm text-purple-700 mt-3">
              Check the charts to see deal volume trends and most active buyers in your sector
            </p>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" />
              Export Options:
            </h4>
            <div className="space-y-3">
              <div className="bg-white p-3 rounded border border-blue-200">
                <div className="flex items-center gap-2 mb-1">
                  <Badge className="bg-blue-600">CSV/XLSX</Badge>
                  <strong className="text-sm text-blue-900">Full Target List</strong>
                </div>
                <p className="text-sm text-blue-700">Download all scored targets with complete data for your CRM or analysis</p>
              </div>
              
              <div className="bg-white p-3 rounded border border-blue-200">
                <div className="flex items-center gap-2 mb-1">
                  <Badge className="bg-purple-600">Outreach CSV</Badge>
                  <strong className="text-sm text-blue-900">Ready for Outreach.io</strong>
                </div>
                <p className="text-sm text-blue-700">Pre-formatted with Email, Name, Company, Title, Score, Source, Vertical, and Custom Tags</p>
              </div>
              
              <div className="bg-white p-3 rounded border border-blue-200">
                <div className="flex items-center gap-2 mb-1">
                  <Badge className="bg-green-600">PPTX</Badge>
                  <strong className="text-sm text-blue-900">Executive Presentation</strong>
                </div>
                <p className="text-sm text-blue-700">Auto-generated deck with KPIs, top targets, and insights for board meetings</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Generate Insights & Email:
            </h4>
            <ol className="space-y-2 text-sm text-green-800">
              <li className="flex items-start gap-2">
                <Badge className="mt-0.5 bg-green-600">1</Badge>
                <div>Click "Generate Insights + Email" to create AI-powered summary</div>
              </li>
              <li className="flex items-start gap-2">
                <Badge className="mt-0.5 bg-green-600">2</Badge>
                <div>Review the email draft with key metrics and top targets</div>
              </li>
              <li className="flex items-start gap-2">
                <Badge className="mt-0.5 bg-green-600">3</Badge>
                <div>Copy subject and body to send to your team or investors</div>
              </li>
              <li className="flex items-start gap-2">
                <Badge className="mt-0.5 bg-green-600">4</Badge>
                <div>Optional: Post insights directly to Slack via webhook</div>
              </li>
            </ol>
          </div>
        </div>
      )
    },
    {
      title: "Complete Workflow Example",
      icon: CheckCircle2,
      color: "green",
      content: (
        <div className="space-y-6">
          <div className="text-center py-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl mb-3">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2">Putting It All Together</h3>
            <p className="text-slate-600">Here's a real-world example from start to finish</p>
          </div>

          <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-xl border-2 border-slate-200">
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">1</div>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">Monday Morning: Gather Data</h4>
                  <p className="text-sm text-slate-600">Export 300 healthcare services companies from PitchBook ($10M-$200M revenue, founder-owned). Export 50 recent deals with multiples.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">2</div>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">Upload & Map (5 minutes)</h4>
                  <p className="text-sm text-slate-600">Upload both files to PitchBook tab. Map columns in Settings (one-time setup). System processes and scores all companies.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-amber-600 rounded-full flex items-center justify-center text-white font-bold">3</div>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">Filter & Prioritize (2 minutes)</h4>
                  <p className="text-sm text-slate-600">Set filters to "Northeast" region, adjust EBITDA range to $2M-$30M, add strategic keywords "urgent care, telehealth". Results: 87 qualified targets, 34 scored 70+.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">4</div>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">Export & Share (3 minutes)</h4>
                  <p className="text-sm text-slate-600">
                    • Download Outreach CSV with top 50 targets (auto-tagged "BD-Priority")<br/>
                    • Generate PPTX for Wednesday's investment committee<br/>
                    • Create email summary and send to deal team with insights
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">5</div>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">Execute Campaign</h4>
                  <p className="text-sm text-slate-600">Import Outreach CSV to start personalized email sequences. BD team reaches out to top 20 targets by end of week. Market multiple data informs initial offer discussions.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <strong className="text-green-900">Time Saved:</strong>
                  <p className="text-green-700 mt-1">What used to take 6 hours of manual Excel work now takes 10 minutes</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <strong className="text-blue-900">Better Results:</strong>
                  <p className="text-blue-700 mt-1">Data-driven scoring means you contact the right targets first</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  const currentStepData = steps[currentStep];
  const Icon = currentStepData.icon;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3">
              <div className={`p-2 bg-${currentStepData.color}-100 rounded-lg`}>
                <Icon className={`w-6 h-6 text-${currentStepData.color}-600`} />
              </div>
              {currentStepData.title}
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="flex items-center gap-2 mb-6">
          {steps.map((step, idx) => (
            <div key={idx} className="flex items-center flex-1">
              <button
                onClick={() => setCurrentStep(idx)}
                className={`w-full h-2 rounded-full transition-all ${
                  idx === currentStep 
                    ? 'bg-blue-600' 
                    : idx < currentStep 
                    ? 'bg-green-500' 
                    : 'bg-slate-200'
                }`}
              />
              {idx < steps.length - 1 && (
                <ChevronRight className="w-4 h-4 text-slate-300 mx-1 flex-shrink-0" />
              )}
            </div>
          ))}
        </div>

        <div className="py-4">
          {currentStepData.content}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-6 border-t">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
          >
            Previous
          </Button>

          <div className="text-sm text-slate-500">
            Step {currentStep + 1} of {steps.length}
          </div>

          {currentStep < steps.length - 1 ? (
            <Button
              onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={onClose}
              className="bg-green-600 hover:bg-green-700"
            >
              Get Started <CheckCircle2 className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}