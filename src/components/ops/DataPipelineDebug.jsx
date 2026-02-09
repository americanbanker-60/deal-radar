import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AlertTriangle, ChevronRight } from "lucide-react";

export default function DataPipelineDebug({ rawCount, normalizedCount, filteredCount, scoredCount }) {
  const [isOpen, setIsOpen] = useState(false);
  const hasIssues = (filteredCount === 0 && normalizedCount > 0) || (normalizedCount === 0 && rawCount > 0);

  return (
    <Card className="shadow-sm border-slate-200">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-3">
          <CollapsibleTrigger className="w-full">
            <CardTitle className="flex items-center gap-2 hover:text-slate-700 transition-colors">
              <ChevronRight className={`w-4 h-4 text-slate-500 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
              Data Pipeline
              {hasIssues && <AlertTriangle className="w-4 h-4 text-amber-600 ml-2" />}
              <Badge variant="outline" className="ml-auto">{scoredCount} scored</Badge>
            </CardTitle>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="space-y-4 pt-0">
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
              <Alert className="bg-amber-50 border-amber-200">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800 text-sm">
                  <strong>All rows filtered out!</strong> Your filters might be too restrictive. Try adjusting Region, Revenue, or Ownership filters below.
                </AlertDescription>
              </Alert>
            )}
            {normalizedCount === 0 && rawCount > 0 && (
              <Alert className="bg-red-50 border-red-200">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800 text-sm">
                  <strong>Column mapping issue!</strong> Go to Settings and map your columns to internal fields.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}