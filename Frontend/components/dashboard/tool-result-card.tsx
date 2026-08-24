"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wrench } from "lucide-react";

type ToolResult = {
  tool: string;
  status: string;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
  latency_ms?: number;
};

type ToolResultCardProps = {
  result: ToolResult;
};

export function ToolResultCard({ result }: ToolResultCardProps) {
  const isSuccess = result.status === "success";
  return (
    <Card className={`p-3 border ${isSuccess ? "bg-white/5 border-white/10" : "bg-red-950/30 border-red-800/50"}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-xs font-medium">
          <Wrench className="h-3.5 w-3.5" />
          {result.tool}
        </div>
        <Badge variant="secondary" className={`text-[10px] border-0 ${isSuccess ? "bg-emerald-500/10 text-emerald-300" : "bg-red-500/10 text-red-300"}`}>
          {result.status}
        </Badge>
      </div>
      {result.input && (
        <div className="text-[11px] text-slate-400 mb-1">
          <span className="text-slate-500">Input:</span> {JSON.stringify(result.input)}
        </div>
      )}
      {result.output && (
        <div className="text-[11px] text-slate-400 mb-1">
          <span className="text-slate-500">Output:</span> {JSON.stringify(result.output)}
        </div>
      )}
      {result.error && (
        <div className="text-[11px] text-red-300">{result.error}</div>
      )}
      {result.latency_ms != null && (
        <div className="text-[10px] text-slate-500 mt-1">{result.latency_ms.toFixed(1)}ms</div>
      )}
    </Card>
  );
}
