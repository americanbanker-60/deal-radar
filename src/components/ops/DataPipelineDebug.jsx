import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

export default function DataPipelineDebug({ rawCount, normalizedCount, filteredCount, scoredCount }) {
  return (
    <Card className="shadow-sm border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          Data Pipeline Debug
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{rawCount}</div>
            <div className="text-xs text-slate-600 mt-1">Rows Uploaded</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">{normalizedCount}</div>
            <div className="text-xs text-slate-600 mt-1">After Mapping</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-indigo-600">{filteredCount}</div>
            <div className="text-xs text-slate-600 mt-1">After Filters</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-emerald-600">{scoredCount}</div>
            <div className="text-xs text-slate-600 mt-1">Final Scored</div>
          </div>
        </div>
        {filteredCount === 0 && normalizedCount > 0 && (
          <Alert className="mt-4 bg-amber-50 border-amber-200">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 text-sm">
              <strong>All rows filtered out!</strong> Your filters might be too restrictive. Try adjusting Region, Revenue, or Ownership filters below.
            </AlertDescription>
          </Alert>
        )}
        {normalizedCount === 0 && rawCount > 0 && (
          <Alert className="mt-4 bg-red-50 border-red-200">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800 text-sm">
              <strong>Column mapping issue!</strong> Go to Settings and map your columns to internal fields.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}