import React from "react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { MapPin, Loader2, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../../utils";

const TargetRow = React.memo(({ 
  target, 
  isSelected, 
  onToggle, 
  onGenerateRationale,
  isGeneratingRationale 
}) => {
  const navigate = useNavigate();

  const handleRowClick = (e) => {
    if (e.target.closest('input[type="checkbox"]') || e.target.closest('button')) {
      return;
    }
    navigate(createPageUrl('TargetDetails') + `?id=${target.id}`);
  };

  return (
    <tr 
      className="border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer"
      onClick={handleRowClick}
    >
      <td className="py-3 px-4">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggle(target.id)}
        />
      </td>
      <td className="py-3 px-4 max-w-[200px] truncate font-medium">{target.name}</td>
      <td className="py-3 px-4 text-slate-600">{target.correspondenceName || "—"}</td>
      <td className="py-3 px-4">
        {target.sectorFocus && (
          <Badge variant="outline" className="text-xs whitespace-nowrap">{target.sectorFocus}</Badge>
        )}
      </td>
      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{target.city || "—"}</td>
      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{target.state || "—"}</td>
      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{target.revenue ? `$${target.revenue}M` : "—"}</td>
      <td className="py-3 px-4 text-slate-600">{target.employees || "—"}</td>
      <td className="py-3 px-4 text-slate-600">
        {target.clinicCount ? (
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3 text-blue-600" />
            {target.clinicCount}
          </div>
        ) : "—"}
      </td>
      <td className="py-3 px-4">
        {target.websiteStatus === "working" && (
          <Badge className="bg-green-100 text-green-700 text-xs">✓</Badge>
        )}
        {target.websiteStatus === "broken" && (
          <Badge className="bg-red-100 text-red-700 text-xs">✗</Badge>
        )}
        {!target.websiteStatus && <span className="text-xs text-muted-foreground">—</span>}
      </td>
      <td className="py-3 px-4">
        {target.growthSignals && target.growthSignals.trim() ? (
          <Badge className="bg-green-100 text-green-800 border-green-300 text-xs whitespace-nowrap">
            🚀 Signals
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
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