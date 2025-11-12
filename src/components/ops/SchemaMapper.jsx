import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function SchemaMapper({ headers, mapping, setMapping, internalFields }) {
  return (
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
  );
}