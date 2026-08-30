"use client";

import React, { useEffect, useRef } from "react";
import { DebugEvent, DebugTrace, StageStatus } from "./debug-context";
import { ChevronDown, ChevronRight, CheckCircle2, XCircle, Loader2, Clock } from "lucide-react";

const STAGE_LABEL: Record<string, string> = {
  user_request: "User Request",
  intent_detection: "Intent Detection",
  agent_selection: "Agent Selection",
  backend_request: "Backend Request",
  data_retrieval: "Data Retrieval",
  data_processing: "Data Processing",
  ollama_request: "Ollama Request",
  ollama_response: "Ollama Response",
  response_parsing: "Response Parsing",
  frontend_render: "Frontend Render",
  error: "Error",
};

function statusIcon(status: StageStatus) {
  if (status === "running") return <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-400" />;
  if (status === "success") return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />;
  if (status === "error") return <XCircle className="h-3.5 w-3.5 text-red-400" />;
  return <Clock className="h-3.5 w-3.5 text-slate-500" />;
}

function formatMs(ms?: number) {
  if (ms == null) return "";
  return `${ms.toFixed(1)} ms`;
}

function StageRow({ event, defaultExpanded }: { event: DebugEvent; defaultExpanded?: boolean }) {
  const [open, setOpen] = React.useState(Boolean(defaultExpanded));
  const hasDetail = event.input !== undefined || event.output !== undefined || event.error !== undefined;

  return (
    <div className="rounded-lg border border-white/5 bg-white/5">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left"
      >
        {hasDetail ? (
          open ? (
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
          )
        ) : (
          <span className="h-3.5 w-3.5" />
        )}
        {statusIcon(event.status)}
        <span className="flex-1 text-xs text-slate-200">{STAGE_LABEL[event.stage] ?? event.stage}</span>
        <span className="text-[11px] text-slate-400">
          {event.httpStatus ? `HTTP ${event.httpStatus}` : ""}
          {event.httpStatus && event.durationMs != null ? " · " : ""}
          {formatMs(event.durationMs)}
        </span>
      </button>
      {open && hasDetail && (
        <div className="border-t border-white/5 px-3 py-2">
          {event.service && (
            <div className="text-[11px] text-slate-400">
              Service: <span className="text-slate-200">{event.service}</span>
            </div>
          )}
          {event.route && (
            <div className="text-[11px] text-slate-400">
              Route: <span className="text-slate-200">{event.route}</span>
            </div>
          )}
          {event.input !== undefined && (
            <div className="mt-1 text-[11px] text-slate-400">
              Input:
              <pre className="mt-1 max-h-40 overflow-auto rounded-md bg-black/30 p-2 text-[11px] text-slate-200">
                {JSON.stringify(event.input, null, 2)}
              </pre>
            </div>
          )}
          {event.output !== undefined && (
            <div className="mt-1 text-[11px] text-slate-400">
              Output:
              <pre className="mt-1 max-h-40 overflow-auto rounded-md bg-black/30 p-2 text-[11px] text-slate-200">
                {JSON.stringify(event.output, null, 2)}
              </pre>
            </div>
          )}
          {event.error && (
            <div className="mt-1 text-[11px] text-red-300">
              Error: <span className="text-red-200">{event.error}</span>
              {event.errorType && (
                <span className="ml-2 text-red-400">({event.errorType})</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function DebugTimeline({ traces }: { traces: DebugTrace[] }) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const latestTraceCount = traces.reduce((sum, t) => sum + t.events.length, 0);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [latestTraceCount]);

  const sorted = [...traces].sort((a, b) => b.startedAt - a.startedAt);

  return (
    <div className="space-y-3">
      {sorted.map((trace) => (
        <div key={trace.requestId} className="rounded-xl border border-white/5 bg-white/5 p-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-white">Request {trace.requestId}</div>
              <div className="text-[11px] text-slate-400">{trace.userMessage}</div>
            </div>
            <div className="text-[11px] text-slate-400">
              {new Date(trace.startedAt).toLocaleTimeString()}
              {trace.finishedAt ? ` → ${((trace.finishedAt - trace.startedAt) / 1000).toFixed(2)}s` : ""}
            </div>
          </div>
          <div className="mt-2 space-y-1">
            {trace.events.map((event, idx) => (
              <StageRow key={event.id} event={event} defaultExpanded={event.status === "error" || idx === 0} />
            ))}
          </div>
        </div>
      ))}
      {traces.length === 0 && (
        <div className="rounded-xl border border-dashed border-white/10 p-6 text-center text-xs text-slate-400">
          No debug traces yet. Send a message from the chat pane.
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
