import React from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Sparkles, Download, CheckSquare, Globe2, UserCheck, Award, Tag, Building2, Loader2, FileText } from "lucide-react";

export default function ActionButtons({
  rescoring,
  cleaningNames,
  cleanProgress,
  extractingNames,
  extractProgress,
  generatingShortNames,
  shortNameProgress,
  reclassifyingSectors,
  sectorProgress,
  scoringQuality,
  qualityProgress,
  enrichingContacts,
  enrichProgress,
  crawling,
  crawlProgress,
  personalizingTargets,
  detectingGrowth,
  generatingRationales,
  selectedCount,
  filteredCount,
  targetsCount,
  onRescore,
  onCleanNames,
  onExtractNames,
  onExportAll,
  onGenerateInsights,
  onGenerateShortNames,
  onReclassify,
  onAssignSector,
  onScoreQuality,
  onEnrichContacts,
  onCrawlWebsites,
  onBulkPersonalize,
  onDetectGrowth,
  onGenerateRationales,
  onExportSelected
}) {
  return (
    <div className="flex flex-wrap gap-2 mt-4">
      <Button 
        variant="outline" 
        onClick={onRescore} 
        disabled={rescoring || targetsCount === 0}
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
        onClick={onCleanNames} 
        disabled={cleaningNames || selectedCount === 0}
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
            <span className="hidden lg:inline">Clean Names ({selectedCount})</span>
            <span className="lg:hidden">Clean ({selectedCount})</span>
          </>
        )}
      </Button>

      <Button 
        variant="outline" 
        onClick={onExtractNames} 
        disabled={extractingNames || selectedCount === 0}
        className="text-xs sm:text-sm"
      >
        {extractingNames ? (
          <>
            <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2 animate-spin" />
            <span className="hidden sm:inline">Extracting {extractProgress.current}/{extractProgress.total}</span>
            <span className="sm:hidden">Extract...</span>
          </>
        ) : (
          <>
            <FileText className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
            <span className="hidden lg:inline">Extract Names ({selectedCount})</span>
            <span className="lg:hidden">Extract ({selectedCount})</span>
          </>
        )}
      </Button>

      <Button variant="outline" onClick={onExportAll} disabled={filteredCount === 0} className="text-xs sm:text-sm">
        <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
        <span className="hidden sm:inline">Export All</span>
        <span className="sm:hidden">Export</span>
      </Button>

      <Button 
        onClick={onGenerateInsights} 
        disabled={filteredCount === 0}
        className="bg-emerald-600 hover:bg-emerald-700 text-xs sm:text-sm"
      >
        <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
        <span className="hidden sm:inline">Generate Insights</span>
        <span className="sm:hidden">Insights</span>
      </Button>

      <Button 
        variant="outline" 
        onClick={onGenerateShortNames} 
        disabled={generatingShortNames || selectedCount === 0}
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
            <span className="hidden lg:inline">Short Names ({selectedCount})</span>
            <span className="lg:hidden">Names ({selectedCount})</span>
          </>
        )}
      </Button>

      <Button 
        variant="outline" 
        onClick={onReclassify} 
        disabled={reclassifyingSectors || selectedCount === 0}
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
            <span className="hidden lg:inline">AI Reclassify ({selectedCount})</span>
            <span className="lg:hidden">AI ({selectedCount})</span>
          </>
        )}
      </Button>

      <Button 
        variant="outline" 
        onClick={onAssignSector} 
        disabled={selectedCount === 0}
        className="text-xs sm:text-sm"
      >
        <Tag className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
        <span className="hidden lg:inline">Assign Sector ({selectedCount})</span>
        <span className="lg:hidden">Assign ({selectedCount})</span>
      </Button>

      <Button 
        variant="outline" 
        onClick={onScoreQuality} 
        disabled={scoringQuality || selectedCount === 0}
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
            <span className="hidden lg:inline">Score Quality ({selectedCount})</span>
            <span className="lg:hidden">Quality ({selectedCount})</span>
          </>
        )}
      </Button>

      <Button 
        variant="outline" 
        onClick={onEnrichContacts} 
        disabled={enrichingContacts || selectedCount === 0}
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
            <span className="hidden lg:inline">Enrich Contacts ({selectedCount})</span>
            <span className="lg:hidden">Contacts ({selectedCount})</span>
          </>
        )}
      </Button>

      <Button 
        variant="outline" 
        onClick={onCrawlWebsites} 
        disabled={crawling || selectedCount === 0}
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
            <span className="hidden lg:inline">Crawl Sites ({selectedCount})</span>
            <span className="lg:hidden">Sites ({selectedCount})</span>
          </>
        )}
      </Button>

      <Button 
        variant="outline" 
        onClick={onBulkPersonalize} 
        disabled={personalizingTargets || selectedCount === 0}
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
            <span className="hidden lg:inline">Bulk Personalize ({selectedCount})</span>
            <span className="lg:hidden">Personalize ({selectedCount})</span>
          </>
        )}
      </Button>

      <Button 
        variant="outline" 
        onClick={onDetectGrowth} 
        disabled={detectingGrowth || selectedCount === 0}
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
            <span className="hidden lg:inline">Growth Signals ({selectedCount})</span>
            <span className="lg:hidden">Growth ({selectedCount})</span>
          </>
        )}
      </Button>

      <Button 
        variant="outline" 
        onClick={onGenerateRationales} 
        disabled={generatingRationales || selectedCount === 0}
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
            <span className="hidden lg:inline">Rationales ({selectedCount})</span>
            <span className="lg:hidden">Rationale ({selectedCount})</span>
          </>
        )}
      </Button>

      <Button onClick={onExportSelected} disabled={selectedCount === 0} className="text-xs sm:text-sm">
        <CheckSquare className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
        <span className="hidden sm:inline">Export Selected ({selectedCount})</span>
        <span className="sm:hidden">Sel. ({selectedCount})</span>
      </Button>
    </div>
  );
}