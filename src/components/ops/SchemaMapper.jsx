import React, { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Save, CheckCircle2 } from "lucide-react";

export default function SchemaMapper({ headers, mapping, setMapping, internalFields }) {
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    localStorage.setItem('ops_console_gr_map', JSON.stringify(mapping));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        {internalFields.map((field) => (
          <div key={field} className="space-y-1">
            <div className="text-xs font-medium text-slate-700">{field}</div>
            <Select 
              value={mapping[field] || ""} 
              onValueChange={(v) => setMapping({ ...mapping, [field]: v })}
            >
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Select source column"/>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>(none)</SelectItem>
                {headers.map((h) => (
                  <SelectItem key={h} value={h}>{h}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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