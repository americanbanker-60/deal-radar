import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { AlertCircle, Copy, FileUp, RefreshCw, Check } from "lucide-react";
import { toNumber, midpointFromRange } from "../utils/data-engine";

/**
 * Parse a revenue string to a numeric value in millions.
 * Matches the same logic used in the main import pipeline.
 */
function parseRevenue(raw) {
  if (raw === null || raw === undefined || raw === "") return undefined;
  let revenue = midpointFromRange(raw);
  if (revenue && revenue > 1_000_000) revenue = Math.round(revenue / 1_000_000);
  else if (revenue === undefined) {
    const n = toNumber(raw);
    revenue = isNaN(Number(n)) ? undefined : (Number(n) > 10000 ? Math.round(Number(n) / 1_000_000) : Number(n));
  }
  return revenue;
}

/**
 * Parse an employees string to a numeric integer.
 */
function parseEmployees(raw) {
  if (raw === null || raw === undefined || raw === "") return undefined;
  let employees = midpointFromRange(raw);
  if (employees === undefined) employees = toNumber(raw);
  return employees ? Math.round(employees) : undefined;
}

/**
 * Normalizes a URL/domain for comparison purposes.
 * "https://www.example.com/about" → "example.com"
 */
export function normalizeDomain(url) {
  if (!url) return "";
  let d = url.toString().trim().toLowerCase();
  d = d.replace(/^https?:\/\//, "");
  d = d.replace(/^www\./, "");
  d = d.replace(/\/.*$/, "");
  d = d.replace(/:\d+$/, "");
  return d;
}

/**
 * Detect duplicates between incoming rows and existing DB targets.
 * Returns { newRows, duplicateRows } where duplicateRows have .existingTarget attached.
 */
export function detectDuplicates(incomingRows, existingTargets) {
  // Build a lookup map of existing targets by normalized domain
  const existingByDomain = new Map();
  for (const target of existingTargets) {
    const domain = normalizeDomain(target.website);
    if (domain) {
      existingByDomain.set(domain, target);
    }
  }

  const newRows = [];
  const duplicateRows = [];

  for (const row of incomingRows) {
    const domain = normalizeDomain(row.website || row._mapped?.website);
    if (domain && existingByDomain.has(domain)) {
      duplicateRows.push({
        ...row,
        _existingTarget: existingByDomain.get(domain),
        _domain: domain,
      });
    } else {
      newRows.push(row);
    }
  }

  return { newRows, duplicateRows };
}

/**
 * Merge incoming data into existing target, only filling empty fields.
 */
export function mergeNewIntoExisting(existingTarget, incomingRow) {
  const mapped = incomingRow._mapped || {};
  const contact = mapped.contact || {};
  const updates = {};

  // Only fill fields that are currently empty in the existing target
  const fillIfEmpty = (targetField, newValue) => {
    if (newValue && (!existingTarget[targetField] || existingTarget[targetField].toString().trim() === "")) {
      updates[targetField] = newValue;
    }
  };

  fillIfEmpty("city", mapped.city);
  fillIfEmpty("state", mapped.state);
  fillIfEmpty("revenue", parseRevenue(mapped.revenue));
  fillIfEmpty("employees", parseEmployees(mapped.employees));
  fillIfEmpty("industry", mapped.industry);
  fillIfEmpty("ownership", mapped.ownership);
  fillIfEmpty("notes", mapped.notes);
  fillIfEmpty("linkedin", mapped.linkedin);
  fillIfEmpty("contactEmail", contact.email);
  fillIfEmpty("contactFirstName", contact.firstName);
  fillIfEmpty("contactLastName", contact.lastName);
  fillIfEmpty("contactTitle", contact.title);
  fillIfEmpty("contactPhone", contact.phone);

  return updates;
}

/**
 * Overwrite existing target with all incoming data (non-empty fields).
 */
export function overwriteWithIncoming(incomingRow) {
  const mapped = incomingRow._mapped || {};
  const contact = mapped.contact || {};
  const updates = {};

  const setIfPresent = (field, value) => {
    if (value && value.toString().trim() !== "") {
      updates[field] = value;
    }
  };

  setIfPresent("name", mapped.name);
  setIfPresent("city", mapped.city);
  setIfPresent("state", mapped.state);
  setIfPresent("revenue", parseRevenue(mapped.revenue));
  setIfPresent("employees", parseEmployees(mapped.employees));
  setIfPresent("industry", mapped.industry);
  setIfPresent("ownership", mapped.ownership);
  setIfPresent("notes", mapped.notes);
  setIfPresent("linkedin", mapped.linkedin);
  setIfPresent("contactEmail", contact.email);
  setIfPresent("contactFirstName", contact.firstName);
  setIfPresent("contactLastName", contact.lastName);
  setIfPresent("contactTitle", contact.title);
  setIfPresent("contactPhone", contact.phone);

  return updates;
}

export default function DuplicateResolver({
  newCount,
  duplicates,
  onConfirm,
  onCancel,
}) {
  const [strategy, setStrategy] = useState("fill"); // "ignore" | "fill" | "overwrite"

  // Count how many duplicates would get new data with "fill" strategy
  const fillableCount = duplicates.filter(d => {
    const updates = mergeNewIntoExisting(d._existingTarget, d);
    return Object.keys(updates).length > 0;
  }).length;

  return (
    <Card className="shadow-sm border-amber-200">
      <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50">
        <CardTitle className="flex items-center gap-2">
          <Copy className="w-5 h-5 text-amber-600" />
          Duplicates Detected
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <Alert className="bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 text-sm">
            <strong>{newCount}</strong> new companies will be imported.
            <strong className="ml-1">{duplicates.length}</strong> already exist in your database (matched by website/domain).
          </AlertDescription>
        </Alert>

        {/* Show a few example duplicates */}
        {duplicates.length > 0 && (
          <div className="bg-slate-50 rounded-lg border p-3">
            <div className="text-xs font-medium text-slate-500 mb-2">
              Example duplicates ({Math.min(5, duplicates.length)} of {duplicates.length}):
            </div>
            <div className="space-y-1">
              {duplicates.slice(0, 5).map((d, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="font-medium">{d._existingTarget.name}</span>
                  <span className="text-slate-400">{d._domain}</span>
                </div>
              ))}
              {duplicates.length > 5 && (
                <div className="text-xs text-slate-400">...and {duplicates.length - 5} more</div>
              )}
            </div>
          </div>
        )}

        <div className="space-y-3">
          <div className="text-sm font-medium">How should duplicates be handled?</div>
          <RadioGroup value={strategy} onValueChange={setStrategy} className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg border hover:bg-slate-50 transition-colors">
              <RadioGroupItem value="ignore" id="ignore" className="mt-0.5" />
              <Label htmlFor="ignore" className="cursor-pointer flex-1">
                <div className="font-medium">Skip duplicates</div>
                <div className="text-sm text-slate-500">
                  Only import the {newCount} new companies. Ignore all {duplicates.length} duplicates entirely.
                </div>
              </Label>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg border hover:bg-slate-50 transition-colors">
              <RadioGroupItem value="fill" id="fill" className="mt-0.5" />
              <Label htmlFor="fill" className="cursor-pointer flex-1">
                <div className="font-medium flex items-center gap-2">
                  Fill missing data
                  <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">Recommended</Badge>
                </div>
                <div className="text-sm text-slate-500">
                  Import {newCount} new + update {fillableCount} existing companies where data is currently empty.
                  Existing data is never overwritten.
                </div>
              </Label>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg border hover:bg-slate-50 transition-colors">
              <RadioGroupItem value="overwrite" id="overwrite" className="mt-0.5" />
              <Label htmlFor="overwrite" className="cursor-pointer flex-1">
                <div className="font-medium text-amber-700">Overwrite existing data</div>
                <div className="text-sm text-slate-500">
                  Import {newCount} new + overwrite data for all {duplicates.length} existing companies
                  with values from your file. Use with caution.
                </div>
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button
            onClick={() => onConfirm(strategy)}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Check className="w-4 h-4 mr-2" />
            {strategy === "ignore" && `Import ${newCount} New`}
            {strategy === "fill" && `Import ${newCount} New + Fill ${fillableCount} Existing`}
            {strategy === "overwrite" && `Import ${newCount} New + Overwrite ${duplicates.length} Existing`}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
