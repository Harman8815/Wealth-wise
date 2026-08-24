"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { formatCurrency, formatCompactNumber, formatNumber } from "@/lib/format";

type DataTableProps = {
  columns: Array<{ key: string; label: string; format?: string; align?: string }>;
  rows: Array<Record<string, unknown>>;
  caption?: string;
  empty_message?: string;
};

function formatCell(value: unknown, format?: string) {
  if (value === null || value === undefined) return "—";
  if (typeof value === "number") {
    if (format === "currency") return formatCurrency(value);
    if (format === "compact") return formatCompactNumber(value);
    if (format === "percent") return `${value.toFixed(1)}%`;
    return formatNumber(value);
  }
  return String(value);
}

export function TransactionTable({ columns, rows, caption, empty_message }: DataTableProps) {
  return (
    <Card className="overflow-hidden bg-white/5 border-white/10">
      {caption && (
        <div className="px-4 py-2 border-b border-white/10 text-xs text-slate-400">{caption}</div>
      )}
      <div className="overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead>
            <tr className="bg-white/5">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-3 py-2 text-left text-slate-400 font-medium ${col.align === "right" ? "text-right" : ""}`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-3 py-6 text-center text-slate-500">
                  {empty_message || "No transactions"}
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => (
                <tr key={idx} className="border-t border-white/5">
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-3 py-2 text-slate-200 ${col.align === "right" ? "text-right" : ""}`}
                    >
                      {formatCell(row[col.key], col.format)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
