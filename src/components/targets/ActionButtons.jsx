import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  RefreshCw, Sparkles, Download, CheckSquare, Globe2, UserCheck, Award,
  Tag, Building2, Loader2, FileText, ChevronDown, MoreHorizontal, Zap, Trash2,
} from "lucide-react";

/**
 * Determines which enrichment operation is currently running (if any)
 * and returns a unified progress display.
 */
function getActiveOperation(props) {
  const ops = [
    { key: "enrichingAll", label: "Enriching All", progress: props.enrichAllProgress },
    { key: "cleaningNames", label: "Cleaning Names", progress: props.cleanProgress },
    { key: "extractingNames", label: "Extracting Names", progress: props.extractProgress },
    { key: "generatingShortNames", label: "Generating Names", progress: props.shortNameProgress },
    { key: "reclassifyingSectors", label: "Reclassifying", progress: props.sectorProgress },
    { key: "scoringQuality", label: "Scoring Quality", progress: props.qualityProgress },
    { key: "enrichingContacts", label: "Enriching Contacts", progress: props.enrichProgress },
    { key: "crawling", label: "Crawling Sites", progress: props.crawlProgress },
    { key: "personalizingTargets", label: "Personalizing", progress: null },
    { key: "detectingGrowth", label: "Detecting Growth", progress: null },
    { key: "generatingRationales", label: "Generating Rationales", progress: null },
    { key: "enrichingCompanyData", label: "Enriching Data", progress: props.companyDataProgress },
    { key: "rescoring", label: "Re-scoring", progress: null },
  ];

  for (const op of ops) {
    if (props[op.key]) return op;
  }
  return null;
}

export default function ActionButtons(props) {
  const {
    selectedCount, filteredCount, targetsCount,
    onRescore, onCleanNames, onExtractNames, onExportAll, onGenerateInsights,
    onGenerateShortNames, onReclassify, onAssignSector, onScoreQuality,
    onEnrichContacts, onCrawlWebsites, onBulkPersonalize, onDetectGrowth,
    onGenerateRationales, onEnrichAll, onEnrichCompanyData, onExportSelected,
    onDeleteTodayUpload, todayUploadCount,
  } = props;

  const activeOp = getActiveOperation(props);
  const isAnyRunning = !!activeOp;

  return (
    <div className="space-y-3 mt-4">
      {/* Active operation progress bar */}
      {activeOp && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-3">
          <Loader2 className="w-4 h-4 animate-spin text-blue-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-blue-900">{activeOp.label}...</span>
              {activeOp.progress?.total > 0 && (
                <span className="text-xs text-blue-600">
                  {activeOp.progress.current}/{activeOp.progress.total}
                </span>
              )}
            </div>
            {activeOp.progress?.total > 0 && (
              <Progress
                value={(activeOp.progress.current / activeOp.progress.total) * 100}
                className="h-1.5"
              />
            )}
          </div>
        </div>
      )}

      {/* Primary action bar — clean, single row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Primary CTA: Enrich All */}
        <Button
          onClick={onEnrichAll}
          disabled={isAnyRunning || selectedCount === 0}
          className="bg-purple-600 hover:bg-purple-700 text-sm"
        >
          <Zap className="w-4 h-4 mr-2" />
          Enrich Selected ({selectedCount})
        </Button>

        {/* Re-score */}
        <Button
          variant="outline"
          onClick={onRescore}
          disabled={isAnyRunning || targetsCount === 0}
          className="text-sm"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Re-score All
        </Button>

        {/* Export dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="text-sm">
              <Download className="w-4 h-4 mr-2" />
              Export
              <ChevronDown className="w-3 h-3 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={onExportAll} disabled={filteredCount === 0}>
              <Download className="w-4 h-4 mr-2" />
              Export All ({filteredCount})
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onExportSelected} disabled={selectedCount === 0}>
              <CheckSquare className="w-4 h-4 mr-2" />
              Export Selected ({selectedCount})
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Generate Insights */}
        <Button
          onClick={onGenerateInsights}
          disabled={filteredCount === 0}
          className="bg-emerald-600 hover:bg-emerald-700 text-sm"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Insights
        </Button>

        {/* Individual enrichment steps — collapsed into dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="text-sm">
              <MoreHorizontal className="w-4 h-4 mr-2" />
              More Actions
              <ChevronDown className="w-3 h-3 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            <DropdownMenuLabel className="text-xs text-slate-500">
              Name & Sector
            </DropdownMenuLabel>
            <DropdownMenuItem
              onClick={onCleanNames}
              disabled={isAnyRunning || selectedCount === 0}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Clean Names ({selectedCount})
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onExtractNames}
              disabled={isAnyRunning || selectedCount === 0}
            >
              <FileText className="w-4 h-4 mr-2" />
              Extract Names ({selectedCount})
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onGenerateShortNames}
              disabled={isAnyRunning || selectedCount === 0}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Correspondence Names ({selectedCount})
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onReclassify}
              disabled={isAnyRunning || selectedCount === 0}
            >
              <Building2 className="w-4 h-4 mr-2" />
              AI Reclassify Sector ({selectedCount})
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onAssignSector}
              disabled={selectedCount === 0}
            >
              <Tag className="w-4 h-4 mr-2" />
              Assign Sector Manually ({selectedCount})
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-slate-500">
              Data Enrichment
            </DropdownMenuLabel>
            <DropdownMenuItem
              onClick={onEnrichCompanyData}
              disabled={isAnyRunning || selectedCount === 0}
            >
              <Building2 className="w-4 h-4 mr-2" />
              State/Revenue/Employees ({selectedCount})
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onScoreQuality}
              disabled={isAnyRunning || selectedCount === 0}
            >
              <Award className="w-4 h-4 mr-2" />
              Score Quality ({selectedCount})
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onEnrichContacts}
              disabled={isAnyRunning || selectedCount === 0}
            >
              <UserCheck className="w-4 h-4 mr-2" />
              Enrich Contacts ({selectedCount})
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-slate-500">
              Intelligence
            </DropdownMenuLabel>
            <DropdownMenuItem
              onClick={onCrawlWebsites}
              disabled={isAnyRunning || selectedCount === 0}
            >
              <Globe2 className="w-4 h-4 mr-2" />
              Crawl Websites ({selectedCount})
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onBulkPersonalize}
              disabled={isAnyRunning || selectedCount === 0}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Bulk Personalize ({selectedCount})
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onDetectGrowth}
              disabled={isAnyRunning || selectedCount === 0}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Growth Signals ({selectedCount})
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onGenerateRationales}
              disabled={isAnyRunning || selectedCount === 0}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Strategic Rationales ({selectedCount})
            </DropdownMenuItem>

            {onDeleteTodayUpload && todayUploadCount > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-red-500">
                  Danger Zone
                </DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={onDeleteTodayUpload}
                  disabled={isAnyRunning}
                  className="text-red-600 focus:text-red-700 focus:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Today's Upload ({todayUploadCount})
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Selection count badge */}
        {selectedCount > 0 && (
          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
            {selectedCount} selected
          </Badge>
        )}
      </div>
    </div>
  );
}
