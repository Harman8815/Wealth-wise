"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Lightbulb } from "lucide-react";

type InsightItem = Record<string, unknown>;

type InsightsListProps = {
  insights: InsightItem[];
};

export function InsightsList({ insights }: InsightsListProps) {
  if (!insights.length) return null;
  return (
    <div className="space-y-2">
      {insights.map((insight, idx) => {
        const title = String(insight.title || insight.message || insight.description || "Insight");
        const detail = insight.detail || insight.description || insight.message;
        return (
          <Card key={idx} className="p-3 bg-indigo-950/20 border-indigo-500/30">
            <div className="flex items-start gap-2">
              <Lightbulb className="h-4 w-4 text-indigo-400 mt-0.5" />
              <div className="flex-1">
                <div className="text-xs font-medium text-indigo-100">{title}</div>
                {detail && detail !== title && (
                  <div className="text-[11px] text-indigo-200/80 mt-0.5">{String(detail)}</div>
                )}
                {insight.impact && (
                  <div className="text-[11px] text-indigo-300 mt-1">Impact: {String(insight.impact)}</div>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
