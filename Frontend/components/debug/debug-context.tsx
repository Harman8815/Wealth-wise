"use client";

import React, { createContext, useContext, useEffect, useRef } from "react";

const ML_BACKEND_URL = process.env.NEXT_PUBLIC_ML_BACKEND_URL || "http://localhost:8100";

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem("access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

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
  connectStream: (requestId: string) => void;
}

const DebugContext = createContext<DebugContextValue | null>(null);

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function DebugProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabled] = React.useState(false);
  const [traces, setTraces] = React.useState<DebugTrace[]>([]);
  const [currentRequestId, setCurrentRequestId] = React.useState<string | null>(null);
  const streamsRef = useRef<Map<string, EventSource>>(new Map());

  const toggle = React.useCallback(() => setEnabled((prev) => !prev), []);
  const clearTraces = React.useCallback(() => {
    setTraces([]);
    streamsRef.current.forEach((es) => es.close());
    streamsRef.current.clear();
  }, []);

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

  const connectStream = React.useCallback((requestId: string) => {
    if (!enabled) return;
    if (streamsRef.current.has(requestId)) return;
    const es = new EventSource(`${ML_BACKEND_URL}/debug/stream?request_id=${encodeURIComponent(requestId)}`, {
      withCredentials: false,
    });
    es.addEventListener("debug", (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        setTraces((prev) =>
          prev.map((trace) =>
            trace.requestId === requestId
              ? {
                  ...trace,
                  events: [
                    ...trace.events,
                    {
                      ...data,
                      id: data.id || uid(),
                      requestId: data.request_id || requestId,
                      timestamp: data.timestamp || Date.now(),
                    } as DebugEvent,
                  ],
                }
              : trace,
          ),
        );
      } catch {
        // ignore malformed debug event
      }
    });
    es.onerror = () => {
      es.close();
      streamsRef.current.delete(requestId);
    };
    streamsRef.current.set(requestId, es);
  }, [enabled]);

  useEffect(() => {
    return () => {
      streamsRef.current.forEach((es) => es.close());
      streamsRef.current.clear();
    };
  }, []);

  return (
    <DebugContext.Provider
      value={{ enabled, toggle, traces, currentRequestId, startTrace, appendEvent, finishTrace, clearTraces, connectStream }}
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
