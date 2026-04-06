import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, Users, MapPin, Globe, Sparkles, RefreshCw } from "lucide-react";

export default function ScoringWeights({ 
  weights, 
  setWeights, 
  targetMinEmp, 
  setTargetMinEmp,
  targetMaxEmp,
  setTargetMaxEmp,
  targetMinRev,
  setTargetMinRev,
  targetMaxRev,
  setTargetMaxRev,
  onRecalculate,
  previewTargets = []
}) {
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);

  const updateWeight = (key, value) => {
    setWeights(prev => ({ ...prev, [key]: value }));
  };

  // Show top 5 targets as preview
  const topPreviewTargets = previewTargets.slice(0, 5);

  return (
    <Card className="shadow-sm border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-purple-600" />
          Scoring Weights & Target Ranges
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Weight sliders */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Weight Distribution</span>
            <Badge variant={totalWeight === 100 ? "default" : "destructive"}>
              Total: {totalWeight}/100
            </Badge>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span>Employee Count</span>
                </div>
                <span className="font-medium">{weights.employees} pts</span>
              </div>
              <Slider
                value={[weights.employees]}
                onValueChange={([v]) => updateWeight('employees', v)}
                min={0}
                max={50}
                step={5}
                className="w-full"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-green-600" />
                  <span>Clinic/Location Count</span>
                </div>
                <span className="font-medium">{weights.clinics} pts</span>
              </div>
              <Slider
                value={[weights.clinics]}
                onValueChange={([v]) => updateWeight('clinics', v)}
                min={0}
                max={50}
                step={5}
                className="w-full"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-amber-600" />
                  <span>Revenue</span>
                </div>
                <span className="font-medium">{weights.revenue} pts</span>
              </div>
              <Slider
                value={[weights.revenue]}
                onValueChange={([v]) => updateWeight('revenue', v)}
                min={0}
                max={50}
                step={5}
                className="w-full"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-indigo-600" />
                  <span>Website Status</span>
                </div>
                <span className="font-medium">{weights.website} pts</span>
              </div>
              <Slider
                value={[weights.website]}
                onValueChange={([v]) => updateWeight('website', v)}
                min={0}
                max={50}
                step={5}
                className="w-full"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-pink-600" />
                  <span>Keyword Match</span>
                </div>
                <span className="font-medium">{weights.keywords} pts</span>
              </div>
              <Slider
                value={[weights.keywords]}
                onValueChange={([v]) => updateWeight('keywords', v)}
                min={0}
                max={50}
                step={5}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Target Ranges */}
        <div className="border-t pt-4 space-y-4">
          <div className="text-sm font-medium">Target Ranges (for range-based scoring)</div>
          <p className="text-xs text-slate-600">
            Set specific ranges to score companies. Companies within these ranges get full points.
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-xs font-medium text-slate-700">Employee Count Range</div>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={targetMinEmp}
                  onChange={(e) => setTargetMinEmp(e.target.value === "" ? "" : Number(e.target.value))}
                  className="h-8 text-sm"
                />
                <span className="text-slate-400 self-center">to</span>
                <Input
                  type="number"
                  placeholder="Max"
                  value={targetMaxEmp}
                  onChange={(e) => setTargetMaxEmp(e.target.value === "" ? "" : Number(e.target.value))}
                  className="h-8 text-sm"
                />
              </div>
              {targetMinEmp !== "" && targetMaxEmp !== "" && Number(targetMinEmp) > Number(targetMaxEmp) && (
                <p className="text-xs text-red-500">Min must be less than or equal to Max</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="text-xs font-medium text-slate-700">Revenue Range ($M)</div>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={targetMinRev}
                  onChange={(e) => setTargetMinRev(e.target.value === "" ? "" : Number(e.target.value))}
                  className="h-8 text-sm"
                />
                <span className="text-slate-400 self-center">to</span>
                <Input
                  type="number"
                  placeholder="Max"
                  value={targetMaxRev}
                  onChange={(e) => setTargetMaxRev(e.target.value === "" ? "" : Number(e.target.value))}
                  className="h-8 text-sm"
                />
              </div>
              {targetMinRev !== "" && targetMaxRev !== "" && Number(targetMinRev) > Number(targetMaxRev) && (
                <p className="text-xs text-red-500">Min must be less than or equal to Max</p>
              )}
            </div>
          </div>

          <div className="text-xs text-slate-500 bg-white p-2 rounded border">
            💡 Leave ranges empty to use peer-median scoring (compares against uploaded dataset)
          </div>
        </div>

        {previewTargets.length > 0 && (
          <div className="mt-6 pt-6 border-t border-slate-200">
            <div className="text-sm font-medium mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              Live Preview - Top 5 Targets
            </div>
            <div className="space-y-2">
              {topPreviewTargets.map((target, idx) => (
                <div 
                  key={idx} 
                  className="bg-white p-3 rounded border border-slate-200 hover:border-purple-300 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{target.name}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-3 mt-1">
                        {target.revenue && <span>💰 ${target.revenue}M</span>}
                        {target.employees && <span>👥 {target.employees}</span>}
                        {target.clinicCount && <span>📍 {target.clinicCount} clinics</span>}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge 
                        className={
                          (target.score || 0) >= 80 ? "bg-green-100 text-green-800" :
                          (target.score || 0) >= 60 ? "bg-yellow-100 text-yellow-800" :
                          "bg-slate-100 text-slate-800"
                        }
                      >
                        {target.score || 0}
                      </Badge>
                      <span className="text-xs text-slate-400">#{idx + 1}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-xs text-slate-500 mt-3 text-center">
              Rankings update instantly as you adjust weights
            </div>
          </div>
        )}

        {onRecalculate && (
          <div className="mt-6 pt-6 border-t border-slate-200">
            <Button onClick={onRecalculate} className="w-full bg-emerald-600 hover:bg-emerald-700">
              <RefreshCw className="w-4 h-4 mr-2" />
              Recalculate All Scores
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}