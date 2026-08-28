"use client";

import React, { createContext, useContext } from "react";

export type DebugStage =
  | "user_request"
  | "intent_detection"
  | "agent_selection"
  | "backend_request"
  | "data_retrieval"
  | "data_processing"
  | "ollama_request"
  | "ollama_response"
  | "response_parsing"
  | "frontend_render"
  | "error";

export type StageStatus = "pending" | "running" | "success" | "error";

export interface DebugEvent {
  id: string;
  requestId: string;
  stage: DebugStage;
  status: StageStatus;
  service?: string;
  route?: string;
  method?: string;
  httpStatus?: number;
  durationMs?: number;
  timestamp: number;
  input?: unknown;
  output?: unknown;
  error?: string;
  errorType?: string;
}

export interface DebugTrace {
  requestId: string;
  userMessage: string;
  startedAt: number;
  events: DebugEvent[];
  finishedAt?: number;
}

interface DebugContextValue {
  enabled: boolean;
  toggle: () => void;
  traces: DebugTrace[];
  currentRequestId: string | null;
  startTrace: (userMessage: string) => string;
  appendEvent: (event: Omit<DebugEvent, "id" | "requestId" | "timestamp">) => void;
  finishTrace: () => void;
  clearTraces: () => void;
}

const DebugContext = createContext<DebugContextValue | null>(null);

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function DebugProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabled] = React.useState(false);
  const [traces, setTraces] = React.useState<DebugTrace[]>([]);
  const [currentRequestId, setCurrentRequestId] = React.useState<string | null>(null);

  const toggle = React.useCallback(() => setEnabled((prev) => !prev), []);
  const clearTraces = React.useCallback(() => setTraces([]), []);

  const startTrace = React.useCallback((userMessage: string) => {
    const requestId = uid();
    setCurrentRequestId(requestId);
    setTraces((prev) => [
      ...prev,
      {
        requestId,
        userMessage,
        startedAt: Date.now(),
        events: [
          {
            id: uid(),
            requestId,
            stage: "user_request",
            status: "success",
            service: "frontend",
            timestamp: Date.now(),
            input: { message: userMessage },
          },
        ],
      },
    ]);
    return requestId;
  }, []);

  const appendEvent = React.useCallback(
    (event: Omit<DebugEvent, "id" | "requestId" | "timestamp">) => {
      setTraces((prev) =>
        prev.map((trace) =>
          trace.requestId === currentRequestId
            ? {
                ...trace,
                events: [
                  ...trace.events,
                  {
                    ...event,
                    id: uid(),
                    requestId: trace.requestId,
                    timestamp: Date.now(),
                  } as DebugEvent,
                ],
              }
            : trace,
        ),
      );
    },
    [currentRequestId],
  );

  const finishTrace = React.useCallback(() => {
    setTraces((prev) =>
      prev.map((trace) =>
        trace.requestId === currentRequestId ? { ...trace, finishedAt: Date.now() } : trace,
      ),
    );
    setCurrentRequestId(null);
  }, [currentRequestId]);

  return (
    <DebugContext.Provider
      value={{ enabled, toggle, traces, currentRequestId, startTrace, appendEvent, finishTrace, clearTraces }}
    >
      {children}
    </DebugContext.Provider>
  );
}

export function useDebug() {
  const ctx = useContext(DebugContext);
  if (!ctx) throw new Error("useDebug must be used within a DebugProvider");
  return ctx;
}
