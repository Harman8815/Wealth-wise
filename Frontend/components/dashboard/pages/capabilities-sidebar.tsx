"use client";

import { Sparkles, MessageSquare, BarChart3, Target, Search, FileText, AlertTriangle, Database } from "lucide-react";
import { agents } from "@/api/services/agents";
import { cn } from "@/lib/utils";

const capabilityIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  insights: Sparkles,
  report: FileText,
  chart_alert: BarChart3,
  alert: AlertTriangle,
  goal: Target,
  budget: BarChart3,
  transaction_search: Search,
};

export function CapabilitiesSidebar({ onCardClick }: { onCardClick?: (agentId: string) => void }) {
  return (
    <div className="hidden xl:flex w-80 shrink-0 border-l border-white/10 bg-[#0B0F19]/50 p-6 flex-col gap-6">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-blue-400" />
          <h2 className="text-sm font-semibold text-white">AI Capabilities</h2>
        </div>
        <div className="space-y-3">
          {agents.map((agent) => {
            const Icon = capabilityIcons[agent.id] || MessageSquare;
            return (
              <button
                key={agent.id}
                type="button"
                onClick={() => onCardClick?.(agent.id)}
                className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5 w-full text-left hover:bg-white/10 hover:border-white/10 transition-colors cursor-pointer"
              >
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 shrink-0">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{agent.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{agent.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-auto">
        <div className="p-4 rounded-xl bg-white/5 border border-white/5">
          <h3 className="text-sm font-medium text-white mb-2">Privacy First</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Your financial data is encrypted and never shared with third parties. Our AI processes information locally to ensure your privacy.
          </p>
        </div>
      </div>
    </div>
  );
}