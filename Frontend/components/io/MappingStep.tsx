/**
 * Column mapping step for the Import wizard.
 * Lets the user map each standard field to a source column header.
 */
"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { STANDARD_FIELDS, STANDARD_FIELD_LABELS } from "@/lib/io/types";
import type { ColumnMapping } from "@/lib/io/types";

interface MappingStepProps {
  headers: string[];
  mapping: ColumnMapping;
  onChange: (mapping: ColumnMapping) => void;
}

export function MappingStep({ headers, mapping, onChange }: MappingStepProps) {
  const setField = (field: keyof ColumnMapping, value: string) => {
    const next = { ...mapping };
    if (value === "__none__") {
      delete next[field];
    } else {
      // Prevent the same source column from being mapped twice.
      (Object.keys(next) as (keyof ColumnMapping)[]).forEach((k) => {
        if (next[k] === value) delete next[k];
      });
      next[field] = value;
    }
    onChange(next);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Map your file&apos;s columns to the fields WealthWise understands. Date and
        Amount are required.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {STANDARD_FIELDS.map((field) => (
          <div key={field} className="space-y-1.5">
            <Label className="text-xs">{STANDARD_FIELD_LABELS[field]}</Label>
            <Select
              value={mapping[field] ?? "__none__"}
              onValueChange={(v) => setField(field, v)}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="— not mapped —" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— not mapped —</SelectItem>
                {headers.map((h) => (
                  <SelectItem key={h} value={h}>
                    {h}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
    </div>
  );
}
