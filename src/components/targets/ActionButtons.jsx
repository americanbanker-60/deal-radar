import React from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Sparkles, Download, CheckSquare, Globe2, UserCheck, Award, Tag, Building2, Loader2, FileText } from "lucide-react";

const ACTION_CONFIG = [
  { key: "rescore", label: "Re-score All", shortLabel: "Re-score", icon: RefreshCw, loadingProp: "rescoring", onClick: "onRescore", disabledWhen: "targetsCount", variant: "outline" },
  { key: "clean", label: "Clean Names", shortLabel: "Clean", icon: Sparkles, loadingProp: "cleaningNames", progressProp: "cleanProgress", onClick: "onCleanNames", disabledWhen: "selectedCount", variant: "outline", showLgCount: true },
  { key: "extract", label: "Extract Names", shortLabel: "Extract", icon: FileText, loadingProp: "extractingNames", progressProp: "extractProgress", onClick: "onExtractNames", disabledWhen: "selectedCount", variant: "outline", showLgCount: true },
  { key: "exportAll", label: "Export All", shortLabel: "Export", icon: Download, onClick: "onExportAll", disabledWhen: "filteredCount", variant: "outline" },
  { key: "insights", label: "Generate Insights", shortLabel: "Insights", icon: Sparkles, onClick: "onGenerateInsights", disabledWhen: "filteredCount", className: "bg-emerald-600 hover:bg-emerald-700" },
  { key: "shortNames", label: "Correspondence Names", shortLabel: "Corresp.", icon: Sparkles, loadingProp: "generatingShortNames", progressProp: "shortNameProgress", onClick: "onGenerateShortNames", disabledWhen: "selectedCount", variant: "outline", showLgCount: true },
  { key: "reclassify", label: "AI Reclassify", shortLabel: "AI", icon: Building2, loadingProp: "reclassifyingSectors", progressProp: "sectorProgress", onClick: "onReclassify", disabledWhen: "selectedCount", variant: "outline", showLgCount: true },
  { key: "assign", label: "Assign Sector", shortLabel: "Assign", icon: Tag, onClick: "onAssignSector", disabledWhen: "selectedCount", variant: "outline", showLgCount: true },
  { key: "quality", label: "Score Quality", shortLabel: "Quality", icon: Award, loadingProp: "scoringQuality", progressProp: "qualityProgress", onClick: "onScoreQuality", disabledWhen: "selectedCount", variant: "outline", showLgCount: true },
  { key: "contacts", label: "Enrich Contacts", shortLabel: "Contacts", icon: UserCheck, loadingProp: "enrichingContacts", progressProp: "enrichProgress", onClick: "onEnrichContacts", disabledWhen: "selectedCount", variant: "outline", showLgCount: true },
  { key: "crawl", label: "Crawl Sites", shortLabel: "Sites", icon: Globe2, loadingProp: "crawling", progressProp: "crawlProgress", onClick: "onCrawlWebsites", disabledWhen: "selectedCount", variant: "outline", showLgCount: true },
  { key: "personalize", label: "Bulk Personalize", shortLabel: "Personalize", icon: Sparkles, loadingProp: "personalizingTargets", onClick: "onBulkPersonalize", disabledWhen: "selectedCount", variant: "outline", showLgCount: true, loadingLabel: "Personalizing...", shortLoadingLabel: "Pers..." },
  { key: "growth", label: "Growth Signals", shortLabel: "Growth", icon: Sparkles, loadingProp: "detectingGrowth", onClick: "onDetectGrowth", disabledWhen: "selectedCount", variant: "outline", showLgCount: true, loadingLabel: "Detecting...", shortLoadingLabel: "Detect..." },
  { key: "rationales", label: "Rationales", shortLabel: "Rationale", icon: Sparkles, loadingProp: "generatingRationales", onClick: "onGenerateRationales", disabledWhen: "selectedCount", variant: "outline", showLgCount: true, loadingLabel: "Generating...", shortLoadingLabel: "Gen..." },
  { key: "enrichAll", label: "Enrich All", shortLabel: "Enrich All", icon: Sparkles, loadingProp: "enrichingAll", progressProp: "enrichAllProgress", onClick: "onEnrichAll", disabledWhen: "selectedCount", className: "bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed", showLgCount: true },
  { key: "companyData", label: "State/Revenue/Employees", shortLabel: "Data", icon: Building2, loadingProp: "enrichingCompanyData", progressProp: "companyDataProgress", onClick: "onEnrichCompanyData", disabledWhen: "selectedCount", variant: "outline", showLgCount: true },
  { key: "exportSelected", label: "Export Selected", shortLabel: "Sel.", icon: CheckSquare, onClick: "onExportSelected", disabledWhen: "selectedCount" },
];

export default function ActionButtons(props) {
  const { selectedCount, filteredCount, targetsCount } = props;

  const getDisabledCount = (key) => {
    if (key === "targetsCount") return targetsCount;
    if (key === "filteredCount") return filteredCount;
    return selectedCount;
  };

  return (
    <div className="flex flex-wrap gap-2 mt-4">
      {ACTION_CONFIG.map((action) => {
        const Icon = action.icon;
        const isLoading = action.loadingProp ? props[action.loadingProp] : false;
        const progress = action.progressProp ? props[action.progressProp] : null;
        const count = getDisabledCount(action.disabledWhen);
        const isDisabled = isLoading || count === 0;

        const loadingLabel = action.loadingLabel || (progress ? `${progress.current}/${progress.total}` : "...");
        const shortLoadingLabel = action.shortLoadingLabel || (progress ? `${progress.current}/${progress.total}` : "...");

        return (
          <Button
            key={action.key}
            variant={action.variant}
            onClick={props[action.onClick]}
            disabled={isDisabled}
            className={`text-xs sm:text-sm ${action.className || ""}`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2 animate-spin" />
                <span className="hidden sm:inline">{action.loadingLabel ? action.loadingLabel : progress ? `${action.label.split(" ")[0]}ing ${progress.current}/${progress.total}` : `${action.label}...`}</span>
                <span className="sm:hidden">{shortLoadingLabel}</span>
              </>
            ) : (
              <>
                <Icon className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                {action.showLgCount ? (
                  <>
                    <span className="hidden lg:inline">{action.label} ({selectedCount})</span>
                    <span className="lg:hidden hidden sm:inline">{action.shortLabel} ({selectedCount})</span>
                    <span className="sm:hidden">{action.shortLabel} ({selectedCount})</span>
                  </>
                ) : (
                  <>
                    <span className="hidden sm:inline">{action.label}</span>
                    <span className="sm:hidden">{action.shortLabel}</span>
                  </>
                )}
              </>
            )}
          </Button>
        );
      })}
    </div>
  );
}
