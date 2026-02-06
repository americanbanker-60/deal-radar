import React from "react";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Sparkles } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function SchemaMapper({ headers }) {
  return (
    <div className="space-y-4">
      <Alert className="bg-green-50 border-green-200">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800 text-sm">
          <strong>AI-Powered Extraction:</strong> Your files are automatically processed using intelligent column mapping. 
          The system understands variations like "Company URL" → "Domain" or "Rev" → "Revenue Estimate".
        </AlertDescription>
      </Alert>

      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-purple-600" />
        <span className="text-sm font-medium text-slate-700">Detected Columns</span>
      </div>

      <div className="grid md:grid-cols-3 gap-2">
        {headers.map((field) => (
          <Badge key={field} variant="outline" className="justify-center py-1.5 text-xs">
            {field}
          </Badge>
        ))}
      </div>

      {headers.length === 0 && (
        <p className="text-sm text-slate-500 text-center py-4">
          Upload a file to see detected columns
        </p>
      )}
    </div>
  );
}