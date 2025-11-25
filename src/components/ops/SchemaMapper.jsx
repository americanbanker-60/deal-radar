import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Save, CheckCircle2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function SchemaMapper({ headers, mapping, setMapping, internalFields }) {
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    localStorage.setItem('ops_console_gr_map', JSON.stringify(mapping));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // Check if mapping has values
  const mappedCount = Object.values(mapping).filter(v => v && v.trim()).length;

  return (
    <div className="space-y-4">
      <Alert className="bg-blue-50 border-blue-200">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800 text-sm">
          <strong>How it works:</strong> Type the exact column header names from your Grata export. 
          These are saved permanently and will auto-apply to all future uploads with matching columns.
        </AlertDescription>
      </Alert>

      {mappedCount > 0 && (
        <div className="flex items-center gap-2">
          <Badge className="bg-green-100 text-green-700">{mappedCount} columns mapped</Badge>
          {headers.length > 0 && (
            <Badge variant="outline">{headers.length} columns in current file</Badge>
          )}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {internalFields.map((field) => (
          <div key={field} className="space-y-1">
            <div className="text-xs font-medium text-slate-700">{field}</div>
            <Input
              value={mapping[field] || ""}
              onChange={(e) => setMapping({ ...mapping, [field]: e.target.value })}
              placeholder={`e.g., ${field}`}
              className="bg-white text-sm"
            />
          </div>
        ))}
      </div>
      <div className="flex justify-end">
        <Button 
          onClick={handleSave}
          className={saved ? "bg-green-600 hover:bg-green-700" : "bg-emerald-600 hover:bg-emerald-700"}
        >
          {saved ? (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Saved!
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Mapping
            </>
          )}
        </Button>
      </div>
    </div>
  );
}