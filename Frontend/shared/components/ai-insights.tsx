"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Sparkles, TrendingUp, TrendingDown, AlertTriangle, Target } from "lucide-react";

interface AIInsight {
  id: string;
  type: "spending" | "saving" | "investment" | "alert" | "goal";
  title: string;
  description: string;
  impact?: "positive" | "negative" | "neutral";
  action?: {
    label: string;
    onClick: () => void;
  };
  metadata?: {
    amount?: number;
    percentage?: number;
    category?: string;
  };
}

interface AIInsightsPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  insights: AIInsight[];
  loading?: boolean;
  className?: string;
}

const typeConfig = {
  spending: {
    icon: TrendingUp,
    color: "text-blue-500",
    bgColor: "bg-blue-50 dark:bg-blue-950/50",
    borderColor: "border-blue-200 dark:border-blue-800",
  },
  saving: {
    icon: TrendingDown,
    color: "text-emerald-500",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/50",
    borderColor: "border-emerald-200 dark:border-emerald-800",
  },
  investment: {
    icon: Sparkles,
    color: "text-purple-500",
    bgColor: "bg-purple-50 dark:bg-purple-950/50",
    borderColor: "border-purple-200 dark:border-purple-800",
  },
  alert: {
    icon: AlertTriangle,
    color: "text-amber-500",
    bgColor: "bg-amber-50 dark:bg-amber-950/50",
    borderColor: "border-amber-200 dark:border-amber-800",
  },
  goal: {
    icon: Target,
    color: "text-pink-500",
    bgColor: "bg-pink-50 dark:bg-pink-950/50",
    borderColor: "border-pink-200 dark:border-pink-800",
  },
};

const impactConfig = {
  positive: "text-emerald-600 dark:text-emerald-400",
  negative: "text-red-600 dark:text-red-400",
  neutral: "text-muted-foreground",
};

export function AIInsightsPanel({
  insights,
  loading = false,
  className,
  ...props
}: AIInsightsPanelProps) {
  if (loading) {
    return (
      <div className={cn("space-y-3", className)} {...props}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-4 rounded-xl bg-muted/50 animate-pulse"
          >
            <div className="flex gap-3">
              <div className="h-10 w-10 rounded-lg bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-1/3 rounded bg-muted" />
                <div className="h-3 w-full rounded bg-muted" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)} {...props}>
      {insights.map((insight, index) => {
        const config = typeConfig[insight.type];
        const Icon = config.icon;
        const delayClass = `stagger-${Math.min(index + 1, 5)}`;

        return (
          <div
            key={insight.id}
            className={cn(
              "group relative p-4 rounded-xl border transition-all duration-200 animate-slide-up",
              "hover:shadow-md hover:scale-[1.01]",
              config.bgColor,
              config.borderColor,
              delayClass
            )}
          >
            <div className="flex gap-3">
              <div
                className={cn(
                  "shrink-0 h-10 w-10 rounded-lg flex items-center justify-center",
                  "bg-white/50 dark:bg-black/20",
                  config.color
                )}
              >
                <Icon className="h-5 w-5" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h4 className={cn("font-semibold text-sm", config.color)}>
                    {insight.title}
                  </h4>
                  {insight.impact && (
                    <span className={cn("text-xs font-medium", impactConfig[insight.impact])}>
                      {insight.impact === "positive" && "↑"}
                      {insight.impact === "negative" && "↓"}
                      {insight.metadata?.percentage &&
                        ` ${Math.abs(insight.metadata.percentage)}%`}
                    </span>
                  )}
                </div>

                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  {insight.description}
                </p>

                {insight.metadata?.amount && (
                  <p className={cn("text-sm font-medium mt-1", config.color)}>
                    ₹{insight.metadata.amount.toLocaleString("en-IN")}
                  </p>
                )}

                {insight.action && (
                  <button
                    onClick={insight.action.onClick}
                    className={cn(
                      "mt-2 text-sm font-medium transition-colors",
                      "hover:underline",
                      config.color
                    )}
                  >
                    {insight.action.label} →
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface AIInsightsCardProps extends React.HTMLAttributes<HTMLDivElement> {
  insights: AIInsight[];
  loading?: boolean;
  className?: string;
}

export function AIInsightsCard({
  insights,
  loading,
  className,
  ...props
}: AIInsightsCardProps) {
  return (
    <div
      className={cn(
        "glass-card p-6",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">AI Insights</h3>
          <p className="text-sm text-muted-foreground">
            Smart recommendations based on your patterns
          </p>
        </div>
      </div>

      <AIInsightsPanel insights={insights} loading={loading} />
    </div>
  );
}
