import React, { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { MapPin, Check, RefreshCw, Info, UserPlus, CheckCircle2, AlertTriangle, Globe } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../../utils";
import AddContactDialog from "./AddContactDialog";

const TargetRow = React.memo(({ 
  target, 
  isSelected, 
  onToggle, 
  onRowClick,
  onRefreshData,
  isRefreshingData
}) => {
  const navigate = useNavigate();
  const [showAddContact, setShowAddContact] = useState(false);

  const { enrichedCount, totalFields, enrichmentPercentage, hasCorrespondence, hasState, hasRevenue, hasEmployees } = useMemo(() => {
    const _hasCorrespondence = target.correspondenceName && target.correspondenceName.trim();
    const _hasState = target.state && target.state.trim();
    const _hasRevenue = target.revenue && target.revenue > 0;
    const _hasEmployees = target.employees && target.employees > 0;
    const _hasContactEnrichment = target.contactPreferredName && target.contactPreferredName.trim();
    const _hasGrowthSignals = target.growthSignals && target.growthSignals.trim();
    const _hasRationale = target.strategicRationale && target.strategicRationale.trim();
    const _hasPersonalization = target.personalization_snippet && target.personalization_snippet.trim();

    const fields = [
      _hasCorrespondence, _hasState, _hasRevenue, _hasEmployees,
      _hasContactEnrichment, _hasGrowthSignals, _hasRationale, _hasPersonalization
    ];

    const _enrichedCount = fields.filter(Boolean).length;
    const _totalFields = fields.length;

    return {
      enrichedCount: _enrichedCount,
      totalFields: _totalFields,
      enrichmentPercentage: (_enrichedCount / _totalFields) * 100,
      hasCorrespondence: _hasCorrespondence,
      hasState: _hasState,
      hasRevenue: _hasRevenue,
      hasEmployees: _hasEmployees,
    };
  }, [target]);

  const handleRowClick = (e) => {
    if (e.target.closest('input[type="checkbox"]') || e.target.closest('button') || e.target.closest('a')) {
      return;
    }
    if (onRowClick) onRowClick(target);
    else navigate(createPageUrl('TargetDetails') + `?id=${target.id}`);
  };

  return (
    <>
    <AddContactDialog
      open={showAddContact}
      onOpenChange={setShowAddContact}
      target={target}
    />
    <tr 
      className="border-b border-slate-100 hover:bg-blue-50/50 transition-colors cursor-pointer group"
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
        <div className="flex items-center gap-2 flex-wrap">
          {target.name}
          {target.last_synced_at && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex items-center gap-1 text-green-600 text-xs font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Synced
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Synced to Outreach on {new Date(target.last_synced_at).toLocaleDateString()}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {enrichmentPercentage === 100 ? (
            <Badge className="bg-green-100 text-green-700 border-green-300 text-xs">Enriched</Badge>
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
              onClick={(e) => { e.stopPropagation(); onRefreshData(target.id); }}
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
        {(target.websiteStatus === 'broken' || target.dormancyFlag) && !target.healthAlertDismissedAt ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex flex-col gap-1">
                  {target.websiteStatus === 'broken' && (
                    <Badge className="bg-red-100 text-red-700 border-red-200 text-[10px] gap-0.5 whitespace-nowrap">
                      <Globe className="w-2.5 h-2.5" /> Broken
                    </Badge>
                  )}
                  {target.dormancyFlag && (
                    <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px] gap-0.5 whitespace-nowrap">
                      <AlertTriangle className="w-2.5 h-2.5" /> Dormant
                    </Badge>
                  )}
                </div>
              </TooltipTrigger>
              {target.crawlRationale && (
                <TooltipContent className="max-w-xs text-xs">
                  {target.crawlRationale}
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        ) : (
          <span className="text-xs text-green-600">OK</span>
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
        <div className="flex items-center gap-1">
          {target.contactEmail ? (
            <div className="text-xs">
              <div className="font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0" />
                {target.contactPreferredName || target.contactFirstName} {target.contactLastName}
              </div>
              <div className="text-slate-500 truncate">{target.contactEmail}</div>
            </div>
          ) : (
            <button
              className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-800 transition-colors"
              onClick={(e) => { e.stopPropagation(); setShowAddContact(true); }}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span className="font-medium">Add contact</span>
            </button>
          )}
          {target.contactEmail && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
              onClick={(e) => { e.stopPropagation(); setShowAddContact(true); }}
              title="Edit Contact"
            >
              <UserPlus className="w-3 h-3 text-blue-600" />
            </Button>
          )}
        </div>
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
          <Badge className="bg-green-100 text-green-700">{target.score}%</Badge>
        ) : target.score >= 50 ? (
          <Badge className="bg-yellow-100 text-yellow-700">{target.score}%</Badge>
        ) : (
          <Badge className="bg-slate-100 text-slate-600">{target.score}%</Badge>
        )}
      </td>
      <td className="py-3 px-4">
        {target.score >= 70 ? (
          <Badge className="bg-green-100 text-green-700 border-green-200">Priority</Badge>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </td>
    </tr>
    </>
  );
});

TargetRow.displayName = "TargetRow";

export default TargetRow;