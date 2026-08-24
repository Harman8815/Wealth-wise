"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";
import { MetricsGrid } from "./MetricsGrid";
import { DataTable } from "./DataTable";
import { TransactionTable } from "./TransactionTable";
import { ChartRenderer } from "./ChartRenderer";
import { AlertsList } from "./AlertsList";
import { InsightsList } from "./InsightsList";
import { RecommendationsList } from "./RecommendationsList";
import { ToolResultCard } from "./ToolResultCard";
import { ErrorDisplay } from "./ErrorDisplay";
import ReactMarkdown from "react-markdown";
import type { StructuredResponse } from "@/api/services/chat";

type AIResponseRendererProps = {
  response: StructuredResponse;
};

export function AIResponseRenderer({ response }: AIResponseRendererProps) {
  const { type } = response;

  if (type === "error") {
    return <ErrorDisplay data={response.error} raw={response.raw} />;
  }

  if (type === "text" && response.text) {
    return <p className="text-sm leading-relaxed text-slate-200">{response.text}</p>;
  }

  if (type === "markdown" && response.markdown) {
    return (
      <ReactMarkdown
        components={{
          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
          ul: ({ children }) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
          li: ({ children }) => <li className="mb-1">{children}</li>,
          h1: ({ children }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
          h2: ({ children }) => <h2 className="text-base font-bold mb-2">{children}</h2>,
          h3: ({ children }) => <h3 className="text-sm font-bold mb-1">{children}</h3>,
          code: ({ children }) => <code className="bg-white/10 rounded px-1 py-0.5 text-xs font-mono">{children}</code>,
          pre: ({ children }) => <pre className="bg-white/10 rounded p-2 mb-2 overflow-x-auto text-xs font-mono">{children}</pre>,
          blockquote: ({ children }) => <blockquote className="border-l-2 border-white/20 pl-2 italic mb-2">{children}</blockquote>,
          a: ({ href, children }) => <a href={href} className="text-blue-400 underline" target="_blank" rel="noopener noreferrer">{children}</a>,
          table: ({ children }) => <div className="overflow-x-auto mb-2"><table className="min-w-full text-xs border border-white/10">{children}</table></div>,
        }}
      >
        {response.markdown}
      </ReactMarkdown>
    );
  }

  return (
    <div className="space-y-4">
      {response.text && <p className="text-sm leading-relaxed text-slate-200">{response.text}</p>}
      {response.markdown && (
        <ReactMarkdown
          components={{
            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
            ul: ({ children }) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
            li: ({ children }) => <li className="mb-1">{children}</li>,
            h1: ({ children }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
            h2: ({ children }) => <h2 className="text-base font-bold mb-2">{children}</h2>,
            h3: ({ children }) => <h3 className="text-sm font-bold mb-1">{children}</h3>,
            code: ({ children }) => <code className="bg-white/10 rounded px-1 py-0.5 text-xs font-mono">{children}</code>,
            pre: ({ children }) => <pre className="bg-white/10 rounded p-2 mb-2 overflow-x-auto text-xs font-mono">{children}</pre>,
            blockquote: ({ children }) => <blockquote className="border-l-2 border-white/20 pl-2 italic mb-2">{children}</blockquote>,
            a: ({ href, children }) => <a href={href} className="text-blue-400 underline" target="_blank" rel="noopener noreferrer">{children}</a>,
            table: ({ children }) => <div className="overflow-x-auto mb-2"><table className="min-w-full text-xs border border-white/10">{children}</table></div>,
          }}
        >
          {response.markdown}
        </ReactMarkdown>
      )}
      {response.metrics && response.metrics.length > 0 && (
        <MetricsGrid metrics={response.metrics} />
      )}
      {response.table && (
        <DataTable table={response.table} />
      )}
      {response.transactions && (
        <TransactionTable table={response.transactions} />
      )}
      {response.alerts && response.alerts.length > 0 && (
        <AlertsList alerts={response.alerts} />
      )}
      {response.insights && response.insights.length > 0 && (
        <InsightsList insights={response.insights} />
      )}
      {response.recommendations && response.recommendations.length > 0 && (
        <RecommendationsList recommendations={response.recommendations} />
      )}
      {response.chart && (
        <ChartRenderer chart={response.chart} />
      )}
      {response.tool_result && (
        <ToolResultCard result={response.tool_result} />
      )}
    </div>
  );
}
