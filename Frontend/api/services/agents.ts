import { Sparkles, FileText, BarChart3, AlertTriangle, Target, PiggyBank, Search } from "lucide-react";

export type AgentId = "insights" | "report" | "chart_alert" | "alert" | "goal" | "budget" | "transaction_search";

export interface Agent {
  id: AgentId;
  name: string;
  description: string;
  slashCommand: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const agents: Agent[] = [
  {
    id: "insights",
    name: "Insights",
    description: "Generate insights for your budget and spending",
    slashCommand: "/insights",
    icon: Sparkles,
  },
  {
    id: "report",
    name: "Report",
    description: "Generate a financial report",
    slashCommand: "/report",
    icon: FileText,
  },
  {
    id: "chart_alert",
    name: "Chart & Alerts",
    description: "Explain charts, alerts, or financial visualizations",
    slashCommand: "/explain",
    icon: BarChart3,
  },
  {
    id: "alert",
    name: "Alerts",
    description: "Explain financial alerts",
    slashCommand: "/alert",
    icon: AlertTriangle,
  },
  {
    id: "goal",
    name: "Goal",
    description: "Plan your financial goals",
    slashCommand: "/goal",
    icon: Target,
  },
  {
    id: "budget",
    name: "Budget",
    description: "Get budget recommendations",
    slashCommand: "/budget",
    icon: PiggyBank,
  },
  {
    id: "transaction_search",
    name: "Search",
    description: "Search transactions naturally",
    slashCommand: "/search",
    icon: Search,
  },
];

export function getAgentById(id: AgentId): Agent | undefined {
  return agents.find((a) => a.id === id);
}

export function getAgentBySlash(slash: string): Agent | undefined {
  return agents.find((a) => a.slashCommand === slash);
}

export function getAgentName(agentId?: string): string {
  if (!agentId) return "";
  return getAgentById(agentId as AgentId)?.name ?? agentId;
}
