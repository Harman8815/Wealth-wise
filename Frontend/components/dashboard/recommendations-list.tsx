"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { ListChecks } from "lucide-react";

type RecommendationsListProps = {
  recommendations: string[];
};

export function RecommendationsList({ recommendations }: RecommendationsListProps) {
  if (!recommendations.length) return null;
  return (
    <Card className="p-3 bg-emerald-950/20 border-emerald-500/30">
      <div className="flex items-center gap-2 mb-2">
        <ListChecks className="h-4 w-4 text-emerald-400" />
        <div className="text-xs font-medium text-emerald-100">Recommendations</div>
      </div>
      <ul className="space-y-1.5">
        {recommendations.map((item, idx) => (
          <li key={idx} className="text-xs text-emerald-100/90 flex items-start gap-2">
            <span className="mt-1 h-1 w-1 rounded-full bg-emerald-400 shrink-0" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
