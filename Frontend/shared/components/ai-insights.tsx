"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Sparkles, TrendingUp, TrendingDown, AlertTriangle, Target, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/40",
    borderColor: "border-blue-200/60 dark:border-blue-800/40",
    dotColor: "bg-blue-500",
  },
  saving: {
    icon: TrendingDown,
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/40",
    borderColor: "border-emerald-200/60 dark:border-emerald-800/40",
    dotColor: "bg-emerald-500",
  },
  investment: {
    icon: Sparkles,
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-50 dark:bg-purple-950/40",
    borderColor: "border-purple-200/60 dark:border-purple-800/40",
    dotColor: "bg-purple-500",
  },
  alert: {
    icon: AlertTriangle,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-50 dark:bg-amber-950/40",
    borderColor: "border-amber-200/60 dark:border-amber-800/40",
    dotColor: "bg-amber-500",
  },
  goal: {
    icon: Target,
    color: "text-pink-600 dark:text-pink-400",
    bgColor: "bg-pink-50 dark:bg-pink-950/40",
    borderColor: "border-pink-200/60 dark:border-pink-800/40",
    dotColor: "bg-pink-500",
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
            className="p-4 rounded-xl border border-border/60 bg-muted/30 animate-pulse"
          >
            <div className="flex gap-3">
              <div className="h-10 w-10 rounded-lg bg-muted shrink-0" />
              <div className="flex-1 space-y-2.5">
                <div className="h-4 w-2/3 rounded bg-muted" />
                <div className="h-3 w-full rounded bg-muted" />
                <div className="h-3 w-1/2 rounded bg-muted" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!insights.length) {
    return (
      <div className={cn("text-center py-8", className)} {...props}>
        <Sparkles className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No insights yet</p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          Keep using your account to generate smart recommendations
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2.5", className)} {...props}>
      {insights.map((insight, index) => {
        const config = typeConfig[insight.type];
        const Icon = config.icon;

        return (
          <div
            key={insight.id}
            className={cn(
              "group relative p-3.5 rounded-xl border transition-all duration-200",
              "hover:shadow-sm hover:border-primary/10",
              config.bgColor,
              config.borderColor
            )}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex gap-3">
              <div
                className={cn(
                  "shrink-0 h-9 w-9 rounded-lg flex items-center justify-center",
                  "bg-white/60 dark:bg-black/20",
                  config.color
                )}
              >
                <Icon className="h-4 w-4" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", config.dotColor)} />
                    <h4 className={cn("font-semibold text-sm leading-tight", config.color)}>
                      {insight.title}
                    </h4>
                  </div>
                  {insight.impact && (
                    <span className={cn("text-xs font-medium shrink-0", impactConfig[insight.impact])}>
                      {insight.impact === "positive" && "↑"}
                      {insight.impact === "negative" && "↓"}
                      {insight.metadata?.percentage &&
                        ` ${Math.abs(insight.metadata.percentage)}%`}
                    </span>
                  )}
                </div>

                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed line-clamp-2">
                  {insight.description}
                </p>

                {insight.metadata?.amount && (
                  <p className={cn("text-xs font-medium mt-1.5", config.color)}>
                    ₹{insight.metadata.amount.toLocaleString("en-IN")}
                  </p>
                )}

                {insight.action && (
                  <button
                    onClick={insight.action.onClick}
                    className={cn(
                      "mt-2 text-xs font-medium transition-colors inline-flex items-center gap-1",
                      "hover:underline",
                      config.color
                    )}
                  >
                    {insight.action.label}
                    <span aria-hidden="true">→</span>
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
        "rounded-2xl border border-border/60 bg-background/80 backdrop-blur-sm p-5",
        "shadow-sm",
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500/15 to-blue-500/15">
            <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-foreground">AI Insights</h3>
            <p className="text-xs text-muted-foreground">
              {loading ? "Analyzing..." : `${insights.length} recommendation${insights.length !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
        {!loading && insights.length > 0 && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground"
            onClick={() => {}}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        )}
      </div>

      <AIInsightsPanel insights={insights} loading={loading} />
    </div>
  );
}
