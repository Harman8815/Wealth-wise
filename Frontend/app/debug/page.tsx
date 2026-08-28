"use client";

import React, { Suspense, useEffect, useState } from "react";
import { DebugTimeline } from "@/components/debug/debug-timeline";
import { useDebug } from "@/components/debug/debug-context";
import { ChatPageContent } from "@/components/dashboard/pages/chat-content";

const OLLAMA_URL = process.env.NEXT_PUBLIC_OLLAMA_URL || "http://localhost:11434";

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
  const { traces, clearTraces: clearLocal, enabled, connectStream } = useDebug();
  const [selectedTraceId, setSelectedTraceId] = React.useState<string | null>(null);
  const [ollamaStatus, setOllamaStatus] = useState<{ ok: boolean; latencyMs?: number }>({ ok: false });

  useEffect(() => {
    checkOllamaHealth().then(setOllamaStatus);
    const interval = setInterval(() => {
      checkOllamaHealth().then(setOllamaStatus);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const sorted = [...traces].sort((a, b) => b.startedAt - a.startedAt);
  const tracesToShow = selectedTraceId
    ? sorted.filter((t) => t.requestId === selectedTraceId)
    : sorted;

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
                {enabled ? "Debug mode is ON — receiving live events" : "Enable debug mode to capture traces."}
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
                onClick={clearLocal}
                className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] text-white hover:bg-white/10"
              >
                Clear
              </button>
            </div>
          </div>
          {traces.length > 0 && (
            <div className="mt-2 flex gap-2 overflow-x-auto">
              {sorted.map((trace) => (
                <button
                  key={trace.requestId}
                  type="button"
                  onClick={() => setSelectedTraceId(trace.requestId)}
                  className={`shrink-0 rounded-lg border px-2.5 py-1 text-left text-[11px] ${
                    selectedTraceId === trace.requestId
                      ? "border-blue-500 bg-blue-500/10 text-blue-300"
                      : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                  }`}
                >
                  <div className="font-medium">{trace.requestId}</div>
                  <div className="text-slate-400">{trace.userMessage}</div>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex-1 overflow-auto px-4 py-3">
          <DebugTimeline traces={tracesToShow} />
        </div>
      </div>
    </div>
  );
}
