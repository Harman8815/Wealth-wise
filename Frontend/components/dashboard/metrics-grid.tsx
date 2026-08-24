"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";

type Metric = {
  label: string;
  value: unknown;
  format?: string;
  metadata?: Record<string, unknown>;
};

type MetricsGridProps = {
  metrics: Metric[];
};

export function MetricsGrid({ metrics }: MetricsGridProps) {
  if (!metrics.length) return null;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
      {metrics.map((metric, idx) => (
        <Card key={idx} className="p-3 bg-white/5 border-white/10">
          <div className="text-[11px] text-slate-400 mb-1">{metric.label}</div>
          <div className="text-sm sm:text-base font-semibold text-white">
            {typeof metric.value === "number" && metric.format === "currency"
              ? formatCurrency(metric.value)
              : String(metric.value ?? "—")}
          </div>
          {metric.metadata && (
            <div className="text-[11px] text-slate-500 mt-1">
              {Object.entries(metric.metadata)
                .map(([k, v]) => `${k}: ${v}`)
                .join(" · ")}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
