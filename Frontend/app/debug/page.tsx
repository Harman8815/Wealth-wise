"use client";

import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DebugTimeline } from "@/components/debug/debug-timeline";
import { useDebug } from "@/components/debug/debug-context";

const ML_BACKEND_URL = process.env.NEXT_PUBLIC_ML_BACKEND_URL || "http://localhost:8100";

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem("access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function fetchTraces() {
  const res = await fetch(`${ML_BACKEND_URL}/debug/traces`, {
    headers: getAuthHeader(),
  });
  if (!res.ok) throw new Error("Failed to load debug traces");
  return res.json();
}

async function fetchTrace(requestId: string) {
  const res = await fetch(`${ML_BACKEND_URL}/debug/traces/${requestId}`, {
    headers: getAuthHeader(),
  });
  if (!res.ok) throw new Error("Failed to load trace");
  return res.json();
}

async function clearTraces() {
  const res = await fetch(`${ML_BACKEND_URL}/debug/traces`, {
    method: "DELETE",
    headers: getAuthHeader(),
  });
  if (!res.ok) throw new Error("Failed to clear traces");
  return res.json();
}

export default function DebugPage() {
  const { traces: localTraces, clearTraces: clearLocal, enabled } = useDebug();
  const queryClient = useQueryClient();
  const [selectedTraceId, setSelectedTraceId] = React.useState<string | null>(null);

  const { data: backendTraces, refetch } = useQuery({
    queryKey: ["debug-traces"],
    queryFn: fetchTraces,
    enabled: false,
  });

  const clearMutation = useMutation({
    mutationFn: clearTraces,
    onSuccess: () => {
      clearLocal();
      queryClient.invalidateQueries({ queryKey: ["debug-traces"] });
    },
  });

  React.useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 2000);
    return () => clearInterval(interval);
  }, [refetch]);

  const traces = selectedTraceId
    ? localTraces.filter((t) => t.requestId === selectedTraceId)
    : localTraces;

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col bg-[#0B0F19]">
      <div className="shrink-0 border-b border-white/10 bg-[#0B0F19]/80 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-sm font-semibold text-white">AI Chat Debug</h1>
            <p className="text-xs text-slate-400">
              {enabled ? "Debug mode is ON — traces will appear here." : "Enable debug mode to capture traces."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => refetch()}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white hover:bg-white/10"
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={() => clearMutation.mutate()}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white hover:bg-white/10"
            >
              Clear Trace
            </button>
          </div>
        </div>
        {backendTraces?.traces?.length > 0 && (
          <div className="mt-3 flex gap-2 overflow-x-auto">
            {backendTraces.traces.map((trace: any) => (
              <button
                key={trace.request_id}
                type="button"
                onClick={() => setSelectedTraceId(trace.request_id)}
                className={`shrink-0 rounded-lg border px-3 py-1.5 text-left text-xs ${
                  selectedTraceId === trace.request_id
                    ? "border-blue-500 bg-blue-500/10 text-blue-300"
                    : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                }`}
              >
                <div className="font-medium">{trace.request_id}</div>
                <div className="text-slate-400">{trace.user_message}</div>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="flex-1 overflow-auto px-6 py-4">
        <DebugTimeline traces={traces} />
      </div>
    </div>
  );
}
