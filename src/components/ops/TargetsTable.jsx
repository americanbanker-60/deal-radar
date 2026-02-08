import React from "react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { MapPin, Calendar, AlertTriangle } from "lucide-react";

export default function TargetsTable({ targets, selectedTargets, onToggleTarget, onToggleAll, scoreThreshold }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm min-w-[1200px]">
        <thead>
          <tr className="text-left border-b-2 border-slate-200 bg-slate-50">
            <th className="py-3 px-4 font-semibold w-12">
              <Checkbox
                checked={selectedTargets.size === targets.length && targets.length > 0}
                onCheckedChange={onToggleAll}
              />
            </th>
            <th className="py-3 px-4 font-semibold whitespace-nowrap">Name</th>
            <th className="py-3 px-4 font-semibold whitespace-nowrap">Short Name</th>
            <th className="py-3 px-4 font-semibold whitespace-nowrap">Sector</th>
            <th className="py-3 px-4 font-semibold whitespace-nowrap">City</th>
            <th className="py-3 px-4 font-semibold whitespace-nowrap">State</th>
            <th className="py-3 px-4 font-semibold whitespace-nowrap">Revenue</th>
            <th className="py-3 px-4 font-semibold">Employees</th>
            <th className="py-3 px-4 font-semibold">Clinics</th>
            <th className="py-3 px-4 font-semibold whitespace-nowrap">Website</th>
            <th className="py-3 px-4 font-semibold whitespace-nowrap">Last Active</th>
            <th className="py-3 px-4 font-semibold whitespace-nowrap">Growth Alerts</th>
            <th className="py-3 px-4 font-semibold whitespace-nowrap">Score</th>
            <th className="py-3 px-4 font-semibold">Fit</th>
            <th className="py-3 px-4 font-semibold">Priority</th>
            <th className="py-3 px-4 font-semibold">Strategic Rationale</th>
          </tr>
        </thead>
        <tbody>
          {targets.map((t, i) => (
            <tr key={i} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
              <td className="py-3 px-4">
                <Checkbox
                  checked={selectedTargets.has(i)}
                  onCheckedChange={() => onToggleTarget(i)}
                />
              </td>
              <td className="py-3 px-4 max-w-[200px] truncate font-medium">{t.name}</td>
              <td className="py-3 px-4 text-slate-600">{t.companyShortName || "—"}</td>
              <td className="py-3 px-4">
                {t.sectorFocus && (
                  <Badge variant="outline" className="text-xs whitespace-nowrap">{t.sectorFocus}</Badge>
                )}
              </td>
              <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{t.city || "—"}</td>
              <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{t.state || "—"}</td>
              <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{isNaN(t.revenue) ? "—" : `$${t.revenue}M`}</td>
              <td className="py-3 px-4 text-slate-600">{isNaN(t.employees) ? "—" : Math.round(t.employees)}</td>
              <td className="py-3 px-4 text-slate-600">
                {t.clinicCount ? (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-blue-600" />
                    {t.clinicCount}
                  </div>
                ) : "—"}
              </td>
              <td className="py-3 px-4">
                {t.websiteStatus === "working" && (
                  <Badge className="bg-green-100 text-green-700 text-xs">✓</Badge>
                )}
                {t.websiteStatus === "broken" && (
                  <Badge className="bg-red-100 text-red-700 text-xs">✗</Badge>
                )}
                {!t.websiteStatus && <span className="text-xs text-muted-foreground">—</span>}
              </td>
              <td className="py-3 px-4">
                {t.dormancyFlag ? (
                  <div className="flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-orange-600" />
                    <span className="text-xs text-orange-700 font-medium">Dormant</span>
                  </div>
                ) : t.lastActive ? (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-blue-600" />
                    <span className="text-xs text-slate-600">{t.lastActive}</span>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </td>
              <td className="py-3 px-4">
                {t.growthSignals && t.growthSignals.length > 0 ? (
                  <div className="flex items-start gap-1">
                    <Badge className="bg-green-100 text-green-800 border-green-300 text-xs whitespace-nowrap">
                      🚀 {t.growthSignals.length}
                    </Badge>
                    <div className="text-xs text-slate-600 max-w-[200px]">
                      {t.growthSignals[0]}
                      {t.growthSignals.length > 1 && (
                        <div className="text-muted-foreground mt-0.5">
                          +{t.growthSignals.length - 1} more
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <div className="w-16">
                    <Progress value={t.score} className="h-2" />
                  </div>
                  <span className="text-xs font-medium">{t.score}</span>
                </div>
              </td>
              <td className="py-3 px-4">
                {t.fitScore !== undefined && (
                  <Badge 
                    className={
                      t.fitScore >= 75 ? "bg-green-100 text-green-700" :
                      t.fitScore >= 50 ? "bg-yellow-100 text-yellow-700" :
                      "bg-slate-100 text-slate-600"
                    }
                  >
                    {t.fitScore}%
                  </Badge>
                )}
              </td>
              <td className="py-3 px-4">
                {t.score >= scoreThreshold ? (
                  <Badge className="bg-green-100 text-green-700 border-green-200">Priority</Badge>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </td>
              <td className="py-3 px-4 max-w-[300px]">
                {t.notes ? (
                  <span className="text-xs text-slate-600 italic">{t.notes}</span>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}