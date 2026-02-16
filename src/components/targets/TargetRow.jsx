import React from "react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { MapPin, Loader2, Sparkles, Check, RefreshCw, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../../utils";

const TargetRow = React.memo(({ 
  target, 
  isSelected, 
  onToggle, 
  onGenerateRationale,
  isGeneratingRationale,
  onRefreshData,
  isRefreshingData
}) => {
  const navigate = useNavigate();

  // Calculate enrichment status
  const hasCorrespondence = target.correspondenceName && target.correspondenceName.trim();
  const hasState = target.state && target.state.trim();
  const hasRevenue = target.revenue && target.revenue > 0;
  const hasEmployees = target.employees && target.employees > 0;
  const hasContactEnrichment = target.contactPreferredName && target.contactPreferredName.trim();
  const hasGrowthSignals = target.growthSignals && target.growthSignals.trim();
  const hasRationale = target.strategicRationale && target.strategicRationale.trim();
  const hasPersonalization = target.personalization_snippet && target.personalization_snippet.trim();
  
  const enrichmentFields = [
    hasCorrespondence,
    hasState,
    hasRevenue,
    hasEmployees,
    hasContactEnrichment,
    hasGrowthSignals,
    hasRationale,
    hasPersonalization
  ];
  
  const enrichedCount = enrichmentFields.filter(Boolean).length;
  const totalFields = enrichmentFields.length;
  const enrichmentPercentage = (enrichedCount / totalFields) * 100;

  const handleRowClick = (e) => {
    if (e.target.closest('input[type="checkbox"]') || e.target.closest('button')) {
      return;
    }
    navigate(createPageUrl('TargetDetails') + `?id=${target.id}`);
  };

  return (
    <tr 
      className="border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer group"
      onClick={handleRowClick}
    >
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggle(target.id)}
          />
          {enrichmentPercentage === 100 ? (
            <Check className="w-4 h-4 text-green-600" />
          ) : (
            <RefreshCw className="w-4 h-4 text-orange-500" />
          )}
        </div>
      </td>
      <td className="py-3 px-4 max-w-[200px] truncate font-medium">
        <div className="flex items-center gap-2">
          {target.name}
          {enrichmentPercentage === 100 ? (
            <Badge className="bg-green-100 text-green-700 border-green-300 text-xs">
              Enriched
            </Badge>
          ) : (
            <Badge className="bg-orange-100 text-orange-700 border-orange-300 text-xs">
              Pending ({enrichedCount}/{totalFields})
            </Badge>
          )}
        </div>
      </td>
      <td className="py-3 px-4 text-slate-600">
        {hasCorrespondence ? (
          <span>{target.correspondenceName}</span>
        ) : (
          <span className="text-orange-500 italic">Pending</span>
        )}
      </td>
      <td className="py-3 px-4">
        {target.sectorFocus && (
          <div className="flex items-center gap-1">
            <Badge variant="outline" className="text-xs whitespace-nowrap">{target.sectorFocus}</Badge>
            {target.sectorRationale && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-3 h-3 text-slate-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-xs">{target.sectorRationale}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        )}
      </td>
      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{target.city || "—"}</td>
      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
        <div className="flex items-center gap-2">
          {hasState ? target.state : <span className="text-orange-500 italic">Pending</span>}
          {(!hasState || !hasRevenue || !hasEmployees) && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                onRefreshData(target.id);
              }}
              disabled={isRefreshingData}
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshingData ? 'animate-spin' : ''}`} />
            </Button>
          )}
        </div>
      </td>
      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
        {hasRevenue ? `$${target.revenue}M` : <span className="text-orange-500 italic">Pending</span>}
      </td>
      <td className="py-3 px-4 text-slate-600">
        {hasEmployees ? target.employees : <span className="text-orange-500 italic">Pending</span>}
      </td>
      <td className="py-3 px-4 text-slate-600">
        {target.clinicCount ? (
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3 text-blue-600" />
            {target.clinicCount}
            {target.crawlRationale && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-3 h-3 text-slate-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-xs">{target.crawlRationale}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        ) : "—"}
      </td>
      <td className="py-3 px-4 max-w-[200px]">
        {target.website ? (
          <a 
            href={target.website.startsWith('http') ? target.website : `https://${target.website}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 text-xs truncate block underline"
            onClick={(e) => e.stopPropagation()}
          >
            {target.website.replace(/^https?:\/\/(www\.)?/, '')}
          </a>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </td>
      <td className="py-3 px-4">
        {target.qualityTier ? (
          <Badge className={
            target.qualityTier === 'great' ? 'bg-green-100 text-green-800 border-green-300' :
            target.qualityTier === 'good' ? 'bg-blue-100 text-blue-800 border-blue-300' :
            'bg-red-100 text-red-800 border-red-300'
          }>
            {target.qualityTier.toUpperCase()}
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </td>
      <td className="py-3 px-4 max-w-[200px]">
        {target.contactEmail ? (
          <div className="text-xs">
            <div className="font-medium">
              {target.contactPreferredName || target.contactFirstName} {target.contactLastName}
            </div>
            <div className="text-slate-500 truncate">{target.contactEmail}</div>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </td>
      <td className="py-3 px-4 max-w-[250px]">
        {hasGrowthSignals ? (
          <p className="text-xs text-slate-600 line-clamp-2">{target.growthSignals}</p>
        ) : (
          <span className="text-orange-500 italic text-xs">Pending</span>
        )}
      </td>
      <td className="py-3 px-4 max-w-[250px]">
        {hasPersonalization ? (
          <p className="text-xs text-slate-600 line-clamp-2">{target.personalization_snippet}</p>
        ) : (
          <span className="text-orange-500 italic text-xs">Pending</span>
        )}
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <div className="w-16">
            <Progress value={target.score} className="h-2" />
          </div>
          <span className="text-xs font-medium">{target.score}</span>
        </div>
      </td>
      <td className="py-3 px-4">
        {target.score >= 75 ? (
          <Badge className="bg-green-100 text-green-700">
            {target.score}%
          </Badge>
        ) : target.score >= 50 ? (
          <Badge className="bg-yellow-100 text-yellow-700">
            {target.score}%
          </Badge>
        ) : (
          <Badge className="bg-slate-100 text-slate-600">
            {target.score}%
          </Badge>
        )}
      </td>
      <td className="py-3 px-4">
        {target.score >= 70 ? (
          <Badge className="bg-green-100 text-green-700 border-green-200">Priority</Badge>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </td>
      <td className="py-3 px-4 max-w-[300px]">
        {target.strategicRationale ? (
          <p className="text-xs text-slate-600 line-clamp-2">{target.strategicRationale}</p>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onGenerateRationale(target)}
            disabled={isGeneratingRationale}
            className="text-xs whitespace-nowrap"
          >
            {isGeneratingRationale ? (
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            ) : (
              <Sparkles className="w-3 h-3 mr-1" />
            )}
            Generate
          </Button>
        )}
      </td>
    </tr>
  );
});

TargetRow.displayName = "TargetRow";

export default TargetRow;