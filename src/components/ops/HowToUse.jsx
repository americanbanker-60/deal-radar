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
  FileSpreadsheet,
  Users,
  Target,
  Settings,
  TrendingUp,
  X,
  Globe,
  MapPin
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
      title: "Welcome to Grata Ops Console",
      icon: Target,
      color: "blue",
      content: (
        <div className="space-y-4">
          <div className="text-center py-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl mb-4">
              <Target className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Top-of-Funnel Deal Sourcing</h3>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Transform Grata company data into prioritized acquisition targets. Focus on bootstrapped, privately-held companies with intelligent scoring based on employee count, location counts, and strategic fit.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mt-8">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Database className="w-5 h-5 text-emerald-600" />
                <h4 className="font-semibold text-emerald-900">Grata Data Import</h4>
              </div>
              <p className="text-sm text-emerald-700">
                Import from Grata, automatically handle revenue/employee ranges, and normalize data formats
              </p>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="w-5 h-5 text-blue-600" />
                <h4 className="font-semibold text-blue-900">Website Intelligence</h4>
              </div>
              <p className="text-sm text-blue-700">
                AI crawls websites to extract clinic/location counts and verify site health
              </p>
            </div>

            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <h4 className="font-semibold text-purple-900">Size & Fit Scoring</h4>
              </div>
              <p className="text-sm text-purple-700">
                Scores based on employee count (primary), clinic counts, and strategic keywords
              </p>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-amber-600" />
                <h4 className="font-semibold text-amber-900">Outreach Ready</h4>
              </div>
              <p className="text-sm text-amber-700">
                One-click sync to Outreach.io or export CSV/Excel with enriched data
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Step 1: Export Data from Grata",
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
                  <strong>Create your search:</strong> Use Grata's AI search with criteria like "Healthcare Services" + "Bootstrapped" + "50-500 employees"
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Badge className="mt-0.5 bg-emerald-600">2</Badge>
                <div>
                  <strong>Review results:</strong> Grata provides estimated ranges for revenue and employees (e.g., "$5M-$10M", "50-100 employees")
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Badge className="mt-0.5 bg-emerald-600">3</Badge>
                <div>
                  <strong>Export to CSV or Excel:</strong> Download your company list with all available fields (website URLs are crucial for crawling)
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Badge className="mt-0.5 bg-emerald-600">4</Badge>
                <div>
                  <strong>Include contact data:</strong> Export decision-maker contacts (CEO, Founder) for outreach campaigns
                </div>
              </li>
            </ol>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <strong>Pro Tip:</strong> This app automatically converts ranges to midpoints, so "$5M-$10M" becomes $7.5M for accurate peer comparisons
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-semibold mb-2 text-sm text-slate-700">Key Grata Fields to Include:</h4>
            <div className="flex flex-wrap gap-2">
              {["Company Name", "Revenue Range", "Employee Range", "Location", "Industry", "Website", "Email", "First Name", "Last Name", "Job Title"].map(col => (
                <Badge key={col} variant="outline" className="text-xs">{col}</Badge>
              ))}
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Step 2: Upload & Map Your Data",
      icon: Upload,
      color: "indigo",
      content: (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 p-6 rounded-lg border border-indigo-200">
            <h4 className="font-semibold text-indigo-900 mb-3 flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload Your File:
            </h4>
            <ol className="space-y-3 text-sm text-indigo-800">
              <li className="flex items-start gap-3">
                <Badge className="mt-0.5 bg-indigo-600">1</Badge>
                <div>
                  <strong>Go to Grata Data tab:</strong> Click "Upload Grata Companies"
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Badge className="mt-0.5 bg-indigo-600">2</Badge>
                <div>
                  <strong>Select your file:</strong> CSV or XLSX formats supported
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Badge className="mt-0.5 bg-indigo-600">3</Badge>
                <div>
                  <strong>Check Debug Panel:</strong> Verify how many rows were uploaded and processed
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
              Your Grata export columns might differ from our internal fields. Map them once in Settings:
            </p>
            <div className="bg-white p-4 rounded border">
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
                  <span className="text-slate-600">Our Field:</span>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600">Your Grata Column:</span>
                </div>
                <div className="flex items-center justify-between p-2 hover:bg-slate-50 rounded">
                  <span className="font-medium">Company Name</span>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                  <Badge variant="outline">Company</Badge>
                </div>
                <div className="flex items-center justify-between p-2 hover:bg-slate-50 rounded">
                  <span className="font-medium">Revenue Range</span>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                  <Badge variant="outline">Est. Revenue</Badge>
                </div>
                <div className="flex items-center justify-between p-2 hover:bg-slate-50 rounded">
                  <span className="font-medium">Employee Range</span>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                  <Badge variant="outline">Employees</Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-green-800">
                <strong>Auto-save:</strong> Your column mappings are saved automatically. Map once, use forever!
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Step 3: Crawl Websites (Optional)",
      icon: Globe,
      color: "blue",
      content: (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Enhanced Website Intelligence:
            </h4>
            <p className="text-sm text-blue-800 mb-3">
              Click "Crawl All Websites" to automatically extract:
            </p>
            <div className="space-y-2 text-sm text-blue-800">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                <strong>Clinic/Location Counts:</strong> How many physical locations the company operates
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <strong>Website Status:</strong> Is the site working or broken? (instant disqualifier)
              </div>
            </div>
          </div>

          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <strong>Why This Matters:</strong> A broken website = immediate red flag. Clinic count helps assess operational scale beyond employee estimates.
              </div>
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="text-sm text-purple-800">
              <strong>Crawl Time:</strong> Takes ~5-10 seconds per company. For 100 companies, expect 10-15 minutes. Run this once, data is saved.
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Step 4: Filter & Score",
      icon: Filter,
      color: "amber",
      content: (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-amber-50 to-amber-100 p-6 rounded-lg border border-amber-200">
            <h4 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Apply Filters:
            </h4>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="bg-white p-3 rounded border border-amber-200">
                <strong className="text-amber-900">Region:</strong>
                <p className="text-amber-700 mt-1">Filter by location (e.g., "California", "Texas", "Northeast")</p>
              </div>
              <div className="bg-white p-3 rounded border border-amber-200">
                <strong className="text-amber-900">Revenue Range:</strong>
                <p className="text-amber-700 mt-1">Set min/max in millions (defaults wide open: $0-$100K)</p>
              </div>
              <div className="bg-white p-3 rounded border border-amber-200">
                <strong className="text-amber-900">Ownership:</strong>
                <p className="text-amber-700 mt-1">Choose "Founder/Bootstrapped Only" or "Any"</p>
              </div>
              <div className="bg-white p-3 rounded border border-amber-200">
                <strong className="text-amber-900">Score Threshold:</strong>
                <p className="text-amber-700 mt-1">Set minimum for "Priority" badge (default: 0 = show all)</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Understanding the Fit Score (0-100):
            </h4>
            <div className="space-y-2 text-sm text-green-800">
              <div className="flex items-start gap-2">
                <Badge className="mt-0.5 bg-green-600">35</Badge>
                <div><strong>Employee Count Match (PRIMARY):</strong> How close to peer group median</div>
              </div>
              <div className="flex items-start gap-2">
                <Badge className="mt-0.5 bg-green-600">25</Badge>
                <div><strong>Clinic/Location Count:</strong> Proximity to peer median (if crawled)</div>
              </div>
              <div className="flex items-start gap-2">
                <Badge className="mt-0.5 bg-green-600">15</Badge>
                <div><strong>Revenue Match (SECONDARY):</strong> Less weight since it's estimated</div>
              </div>
              <div className="flex items-start gap-2">
                <Badge className="mt-0.5 bg-green-600">15</Badge>
                <div><strong>Website Health:</strong> Working = full points, Broken = 0</div>
              </div>
              <div className="flex items-start gap-2">
                <Badge className="mt-0.5 bg-green-600">+10</Badge>
                <div><strong>Strategic Fit:</strong> Bonus for keyword matches in name/industry</div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <Target className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <strong>Pro Tip:</strong> Start with all filters open to see your full universe, then narrow by region or employee count for focused lists
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Step 5: Export & Sync",
      icon: FileSpreadsheet,
      color: "purple",
      content: (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-6 rounded-lg border border-purple-200">
            <h4 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" />
              Export Options:
            </h4>
            <div className="space-y-3">
              <div className="bg-white p-3 rounded border border-purple-200">
                <div className="flex items-center gap-2 mb-1">
                  <Badge className="bg-blue-600">CSV/XLSX</Badge>
                  <strong className="text-sm text-purple-900">Full Target List</strong>
                </div>
                <p className="text-sm text-purple-700">Download all scored targets with employee counts, clinic data, and website status</p>
              </div>
              
              <div className="bg-white p-3 rounded border border-purple-200">
                <div className="flex items-center gap-2 mb-1">
                  <Badge className="bg-green-600">Outreach CSV</Badge>
                  <strong className="text-sm text-purple-900">Ready for Outreach.io</strong>
                </div>
                <p className="text-sm text-purple-700">Pre-formatted with contacts, scores, clinics, tags, and custom fields</p>
              </div>
              
              <div className="bg-white p-3 rounded border border-purple-200">
                <div className="flex items-center gap-2 mb-1">
                  <Badge className="bg-purple-600">Direct Sync</Badge>
                  <strong className="text-sm text-purple-900">Outreach.io Integration</strong>
                </div>
                <p className="text-sm text-purple-700">Create/update prospects directly in Outreach (no sequences, safe mode)</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Generate Insights Email:
            </h4>
            <ol className="space-y-2 text-sm text-green-800">
              <li className="flex items-start gap-2">
                <Badge className="mt-0.5 bg-green-600">1</Badge>
                <div>Click "Generate Insights + Email" for AI-powered summary</div>
              </li>
              <li className="flex items-start gap-2">
                <Badge className="mt-0.5 bg-green-600">2</Badge>
                <div>Review draft with top targets and key metrics</div>
              </li>
              <li className="flex items-start gap-2">
                <Badge className="mt-0.5 bg-green-600">3</Badge>
                <div>Copy and send to your BD team or investors</div>
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
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl mb-3">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2">Real-World Workflow</h3>
            <p className="text-slate-600">From Grata export to prioritized outreach list</p>
          </div>

          <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-xl border-2 border-slate-200">
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold">1</div>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">Monday: Export from Grata</h4>
                  <p className="text-sm text-slate-600">Search for "Urgent Care" + "Bootstrapped" + "California" → Export 200 companies with estimated ranges</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">2</div>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">Upload & Map (2 minutes)</h4>
                  <p className="text-sm text-slate-600">Upload CSV, check Debug Panel shows 200 rows normalized, mappings auto-saved from last time</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">3</div>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">Crawl Websites (15 minutes)</h4>
                  <p className="text-sm text-slate-600">Click "Crawl All Websites" → Grab coffee while AI extracts clinic counts and checks site health</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-amber-600 rounded-full flex items-center justify-center text-white font-bold">4</div>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">Filter & Score (2 minutes)</h4>
                  <p className="text-sm text-slate-600">Set score threshold to 60 → Results: 47 priority targets with working websites and 5+ locations</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">5</div>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">Export & Execute</h4>
                  <p className="text-sm text-slate-600">Sync top 30 to Outreach.io → BD team starts personalized sequences by Wednesday</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <strong className="text-emerald-900">Focus on Fit:</strong>
                  <p className="text-emerald-700 mt-1">Employee and location counts give you real operational scale insights</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-start gap-3">
                <Globe className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <strong className="text-blue-900">Quality Signals:</strong>
                  <p className="text-blue-700 mt-1">Broken websites automatically get low scores — focus your time on operational companies</p>
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
                    ? 'bg-emerald-600' 
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
              className="bg-emerald-600 hover:bg-emerald-700"
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