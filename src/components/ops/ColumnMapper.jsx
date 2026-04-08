import React, { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, ArrowRight, Check, AlertCircle, X } from "lucide-react";

// Our internal fields that data maps into
const TARGET_FIELDS = [
  { key: "name", label: "Company Name", required: true, group: "Company" },
  { key: "website", label: "Website / Domain", required: false, group: "Company" },
  { key: "city", label: "City", required: false, group: "Location" },
  { key: "state", label: "State", required: false, group: "Location" },
  { key: "revenue", label: "Revenue", required: false, group: "Financials" },
  { key: "employees", label: "Employees", required: false, group: "Financials" },
  { key: "industry", label: "Industry", required: false, group: "Company" },
  { key: "ownership", label: "Ownership Type", required: false, group: "Company" },
  { key: "contactEmail", label: "Contact Email", required: false, group: "Contact" },
  { key: "contactFirstName", label: "Contact First Name", required: false, group: "Contact" },
  { key: "contactLastName", label: "Contact Last Name", required: false, group: "Contact" },
  { key: "contactTitle", label: "Contact Title / Role", required: false, group: "Contact" },
  { key: "contactPhone", label: "Contact Phone", required: false, group: "Contact" },
  { key: "linkedin", label: "LinkedIn URL", required: false, group: "Contact" },
  { key: "notes", label: "Notes", required: false, group: "Other" },
];

// Known column name patterns for AI-free auto-matching
const COLUMN_PATTERNS = {
  name: [/^(company\s*name|name|organization|company|account\s*name|business\s*name)$/i],
  website: [/^(website|domain|url|web|company\s*url|site)$/i],
  city: [/^(city|town|hq\s*city|location\s*city|headquarters\s*city)$/i],
  state: [/^(state|province|region|hq\s*state|st)$/i],
  revenue: [/^(revenue|revenue\s*estimate|est\.?\s*revenue|annual\s*revenue|revenue\s*range)$/i],
  employees: [/^(employees?|employee\s*estimate|employee\s*count|employee\s*range|headcount|staff|team\s*size|# employees)$/i],
  industry: [/^(industry|sector|vertical|category|subsector)$/i],
  ownership: [/^(ownership|ownership\s*type|funding|investor\s*type)$/i],
  contactEmail: [/^(email|contact\s*email|primary\s*email|executive\s*email|e-mail|prospect\s*email)$/i],
  contactFirstName: [/^(first\s*name|fname|given\s*name|contact\s*first\s*name|executive\s*first\s*name|prospect\s*first\s*name)$/i],
  contactLastName: [/^(last\s*name|lname|surname|family\s*name|contact\s*last\s*name|executive\s*last\s*name|prospect\s*last\s*name)$/i],
  contactTitle: [/^(title|job\s*title|role|position|executive\s*title|contact\s*title|prospect\s*title)$/i],
  contactPhone: [/^(phone|telephone|primary\s*phone|contact\s*phone|mobile|cell)$/i],
  linkedin: [/^(linkedin|linkedin\s*url|linkedin\s*profile|li\s*url)$/i],
  notes: [/^(notes|comments|description|memo)$/i],
};

function autoMatch(csvHeaders) {
  const mapping = {};

  for (const [fieldKey, patterns] of Object.entries(COLUMN_PATTERNS)) {
    for (const header of csvHeaders) {
      const trimmed = header.trim();
      for (const pattern of patterns) {
        if (pattern.test(trimmed)) {
          if (!mapping[fieldKey]) {
            mapping[fieldKey] = header;
          }
          break;
        }
      }
    }
  }

  return mapping;
}

const STORAGE_KEY = "deal_radar_column_mapping";

function loadSavedMapping() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

function saveMappingToStorage(mapping) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mapping));
  } catch {
    // localStorage unavailable
  }
}

export default function ColumnMapper({ headers, sampleRows, onConfirm, onCancel }) {
  const savedMapping = useMemo(() => loadSavedMapping(), []);

  // Initialize mapping: saved > auto-match > empty
  const [mapping, setMapping] = useState(() => {
    if (savedMapping) {
      // Validate saved mapping against current headers
      const valid = {};
      for (const [field, col] of Object.entries(savedMapping)) {
        if (headers.includes(col)) {
          valid[field] = col;
        }
      }
      // Fill remaining with auto-match
      const auto = autoMatch(headers);
      return { ...auto, ...valid };
    }
    return autoMatch(headers);
  });

  const setField = (fieldKey, csvColumn) => {
    setMapping(prev => {
      const next = { ...prev };
      if (csvColumn === "__none__") {
        delete next[fieldKey];
      } else {
        next[fieldKey] = csvColumn;
      }
      return next;
    });
  };

  // Check which required fields are mapped
  const requiredFields = TARGET_FIELDS.filter(f => f.required);
  const missingRequired = requiredFields.filter(f => !mapping[f.key]);
  const contactFields = TARGET_FIELDS.filter(f => f.group === "Contact");
  const mappedContactCount = contactFields.filter(f => mapping[f.key]).length;

  const handleConfirm = () => {
    saveMappingToStorage(mapping);
    onConfirm(mapping);
  };

  // Group fields for display
  const groups = ["Company", "Location", "Financials", "Contact", "Other"];

  return (
    <Card className="shadow-sm border-blue-200">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-600" />
          Map Your Columns
        </CardTitle>
        <p className="text-sm text-slate-600 mt-1">
          Match your file's columns to the fields below. We've auto-detected what we can.
        </p>
      </CardHeader>
      <CardContent className="space-y-6 pt-4">
        {/* Contact info warning */}
        {mappedContactCount === 0 && (
          <Alert className="bg-amber-50 border-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 text-sm">
              No contact columns detected. Without email and name, you won't be able to push prospects to Outreach.
              Map the Contact fields below if your file has them.
            </AlertDescription>
          </Alert>
        )}

        {/* Preview of first row */}
        {sampleRows && sampleRows.length > 0 && (
          <div className="bg-slate-50 rounded-lg border p-3">
            <div className="text-xs font-medium text-slate-500 mb-2">Preview: First row from your file</div>
            <div className="flex flex-wrap gap-2">
              {headers.slice(0, 8).map(h => (
                <div key={h} className="text-xs bg-white rounded border px-2 py-1">
                  <span className="text-slate-400">{h}:</span>{" "}
                  <span className="font-medium">{String(sampleRows[0][h] || "—").substring(0, 30)}</span>
                </div>
              ))}
              {headers.length > 8 && (
                <div className="text-xs text-slate-400 self-center">+{headers.length - 8} more</div>
              )}
            </div>
          </div>
        )}

        {/* Mapping rows grouped by category */}
        {groups.map(group => {
          const fields = TARGET_FIELDS.filter(f => f.group === group);
          return (
            <div key={group}>
              <div className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                {group}
                {group === "Contact" && (
                  <Badge variant="outline" className={mappedContactCount > 0 ? "text-green-600 border-green-300" : "text-amber-600 border-amber-300"}>
                    {mappedContactCount}/{contactFields.length} mapped
                  </Badge>
                )}
              </div>
              <div className="space-y-2">
                {fields.map(field => (
                  <div key={field.key} className="flex items-center gap-3">
                    <div className="w-48 flex items-center gap-2 text-sm">
                      {mapping[field.key] ? (
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      ) : field.required ? (
                        <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                      ) : (
                        <div className="w-4 h-4 flex-shrink-0" />
                      )}
                      <span className={field.required ? "font-medium" : ""}>
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
                    <Select
                      value={mapping[field.key] || "__none__"}
                      onValueChange={(v) => setField(field.key, v)}
                    >
                      <SelectTrigger className="flex-1 h-9 text-sm">
                        <SelectValue placeholder="Select column..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">— Not mapped —</SelectItem>
                        {headers.map(h => (
                          <SelectItem key={h} value={h}>{h}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-slate-500">
            {Object.keys(mapping).length} of {TARGET_FIELDS.length} fields mapped
            {savedMapping && " (restored from last session)"}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={missingRequired.length > 0}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Check className="w-4 h-4 mr-2" />
              Confirm Mapping & Import
            </Button>
          </div>
        </div>

        {missingRequired.length > 0 && (
          <p className="text-sm text-red-500">
            Required: {missingRequired.map(f => f.label).join(", ")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Apply a column mapping to a row of raw CSV data.
 * Returns a normalized target object.
 */
export function applyMapping(row, mapping) {
  const get = (fieldKey) => {
    const col = mapping[fieldKey];
    return col ? (row[col] || "").toString().trim() : "";
  };

  return {
    name: get("name"),
    website: get("website"),
    city: get("city"),
    state: get("state"),
    revenue: get("revenue"),
    employees: get("employees"),
    industry: get("industry") || "Healthcare Services",
    ownership: get("ownership") || "Unknown",
    notes: get("notes"),
    contact: {
      email: get("contactEmail"),
      firstName: get("contactFirstName"),
      lastName: get("contactLastName"),
      title: get("contactTitle"),
      phone: get("contactPhone"),
    },
    linkedin: get("linkedin"),
  };
}
