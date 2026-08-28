"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DebugTimeline } from "@/components/debug/debug-timeline";
import { useDebug } from "@/components/debug/debug-context";
import { ChatPageContent } from "@/components/dashboard/pages/chat-content";

const ML_BACKEND_URL = process.env.NEXT_PUBLIC_ML_BACKEND_URL || "http://localhost:8100";
const OLLAMA_URL = process.env.NEXT_PUBLIC_OLLAMA_URL || "http://localhost:11434";

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

async function checkOllamaHealth(): Promise<{ ok: boolean; latencyMs?: number }> {
  const start = Date.now();
  try {
    const res = await fetch(`${OLLAMA_URL}/`, { method: "GET", signal: AbortSignal.timeout(3000) });
    const latencyMs = Date.now() - start;
    return { ok: res.ok, latencyMs };
  } catch {
    return { ok: false };
  }
}

function ChatPane() {
  return <ChatPageContent />;
}

export default function DebugPage() {
  const { traces: localTraces, clearTraces: clearLocal, enabled } = useDebug();
  const queryClient = useQueryClient();
  const [selectedTraceId, setSelectedTraceId] = React.useState<string | null>(null);
  const [ollamaStatus, setOllamaStatus] = useState<{ ok: boolean; latencyMs?: number }>({ ok: false });

  const { data: backendTraces, refetch } = useQuery({
    queryKey: ["debug-traces"],
    queryFn: fetchTraces,
    enabled: true,
    refetchInterval: 2000,
  });

  const clearMutation = useMutation({
    mutationFn: clearTraces,
    onSuccess: () => {
      clearLocal();
      queryClient.invalidateQueries({ queryKey: ["debug-traces"] });
    },
  });

  useEffect(() => {
    checkOllamaHealth().then(setOllamaStatus);
    const interval = setInterval(() => {
      checkOllamaHealth().then(setOllamaStatus);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const traces = selectedTraceId
    ? localTraces.filter((t) => t.requestId === selectedTraceId)
    : localTraces;

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-[#0B0F19]">
      <div className="flex-1 min-w-0 border-r border-white/10">
        <Suspense fallback={<div className="flex h-full items-center justify-center text-xs text-slate-400">Loading chat…</div>}>
          <ChatPane />
        </Suspense>
      </div>
      <div className="hidden md:flex md:w-[420px] lg:w-[480px] flex-col shrink-0">
        <div className="shrink-0 border-b border-white/10 bg-[#0B0F19]/80 px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-semibold text-white">Debug Trace</h2>
              <p className="text-[11px] text-slate-400">
                {enabled ? "Debug mode is ON" : "Enable debug mode to capture traces."}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] ${ollamaStatus.ok ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300" : "border-red-500/40 bg-red-500/10 text-red-300"}`}>
                <span className={`h-2 w-2 rounded-full ${ollamaStatus.ok ? "bg-emerald-400" : "bg-red-400"}`} />
                Ollama {ollamaStatus.ok ? "online" : "offline"}
                {ollamaStatus.latencyMs != null && ` · ${ollamaStatus.latencyMs}ms`}
              </span>
              <button
                type="button"
                onClick={() => refetch()}
                className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] text-white hover:bg-white/10"
              >
                Refresh
              </button>
              <button
                type="button"
                onClick={() => clearMutation.mutate()}
                className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] text-white hover:bg-white/10"
              >
                Clear
              </button>
            </div>
          </div>
          {backendTraces?.traces?.length > 0 && (
            <div className="mt-2 flex gap-2 overflow-x-auto">
              {backendTraces.traces.map((trace: any) => (
                <button
                  key={trace.request_id}
                  type="button"
                  onClick={() => setSelectedTraceId(trace.request_id)}
                  className={`shrink-0 rounded-lg border px-2.5 py-1 text-left text-[11px] ${
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
        <div className="flex-1 overflow-auto px-4 py-3">
          <DebugTimeline traces={traces} />
        </div>
      </div>
    </div>
  );
}
