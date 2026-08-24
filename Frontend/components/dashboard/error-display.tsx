"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

type ErrorDisplayProps = {
  data?: Record<string, unknown>;
  raw?: Record<string, unknown>;
};

export function ErrorDisplay({ data, raw }: ErrorDisplayProps) {
  const message = String(data?.message || data?.error || raw?.error || "Something went wrong.");
  const stage = data?.stage ? String(data.stage) : undefined;
  return (
    <Card className="p-3 bg-red-950/30 border-red-800/50">
      <div className="flex items-start gap-2">
        <AlertCircle className="h-4 w-4 text-red-400 mt-0.5" />
        <div className="flex-1">
          <div className="text-xs font-medium text-red-200">{message}</div>
          {stage && <div className="text-[11px] text-red-300/80 mt-0.5">Stage: {stage}</div>}
          {raw && (
            <details className="mt-2">
              <summary className="text-[11px] text-red-300 cursor-pointer">Raw payload</summary>
              <pre className="mt-1 text-[10px] text-red-200/80 whitespace-pre-wrap">
                {JSON.stringify(raw, null, 2)}
              </pre>
            </details>
          )}
        </div>
      </div>
    </Card>
  );
}
