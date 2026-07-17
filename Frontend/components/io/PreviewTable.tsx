/**
 * Preview table that shows parsed rows, flags invalid/duplicate ones, and lets
 * the user toggle skipping individual rows.
 */
"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ParsedRow, StandardField } from "@/lib/io/types";
import { STANDARD_FIELDS, STANDARD_FIELD_LABELS } from "@/lib/io/types";

interface PreviewTableProps {
  rows: ParsedRow[];
  mapping: Record<string, string>;
  onToggleSkip: (index: number, skipped: boolean) => void;
}

export function PreviewTable({ rows, mapping, onToggleSkip }: PreviewTableProps) {
  const visibleFields = STANDARD_FIELDS.filter((f) => mapping[f]);
  const columns: StandardField[] = visibleFields.length ? visibleFields : ["date", "description", "amount"];

  return (
    <ScrollArea className="h-[340px] rounded-md border">
      <table className="w-full text-xs">
        <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800">
          <tr>
            <th className="w-10 px-2 py-2 text-left font-medium">Skip</th>
            <th className="px-2 py-2 text-left font-medium">#</th>
            {columns.map((f) => (
              <th key={f} className="px-2 py-2 text-left font-medium">
                {STANDARD_FIELD_LABELS[f]}
              </th>
            ))}
            <th className="px-2 py-2 text-left font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.index}
              className={cn(
                "border-t",
                row.valid ? "" : "bg-red-500/5",
                row.skipped && "opacity-50"
              )}
            >
              <td className="px-2 py-1.5">
                <Checkbox
                  checked={!!row.skipped}
                  onCheckedChange={(v) => onToggleSkip(row.index, !!v)}
                  aria-label={`Skip row ${row.index + 1}`}
                />
              </td>
              <td className="px-2 py-1.5 text-muted-foreground">{row.index + 1}</td>
              {columns.map((f) => (
                <td key={f} className="px-2 py-1.5 max-w-[180px] truncate">
                  {String(row.normalized[f] ?? "")}
                </td>
              ))}
              <td className="px-2 py-1.5">
                {row.valid ? (
                  <Badge variant="outline" className="text-green-600 border-green-600/40">OK</Badge>
                ) : (
                  <Badge variant="destructive" title={row.errors.join(", ")}>
                    {row.errors[0]}
                  </Badge>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </ScrollArea>
  );
}
