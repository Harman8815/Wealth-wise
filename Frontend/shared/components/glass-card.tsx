"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hover?: boolean;
  gradient?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

const paddingMap = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export function GlassCard({
  children,
  className,
  hover = false,
  gradient = false,
  padding = "md",
  ...props
}: GlassCardProps) {
  return (
    <div
      className={cn(
        "relative bg-card/80 backdrop-blur-xl border border-border/50 shadow-sm",
        "rounded-2xl overflow-hidden",
        paddingMap[padding],
        hover && [
          "transition-all duration-300 ease-out",
          "hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20",
          "hover:-translate-y-0.5",
        ],
        gradient && "gradient-border",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface MetricCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    positive: boolean;
  };
  icon?: React.ReactNode;
  loading?: boolean;
  children?: React.ReactNode;
}

export function MetricCard({
  title,
  value,
  subtitle,
  trend,
  icon,
  loading = false,
  children,
  className,
  ...props
}: MetricCardProps) {
  if (loading) {
    return (
      <GlassCard className={cn("h-40 flex items-center justify-center", className)} {...props}>
        <div className="animate-pulse-soft flex flex-col items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-muted" />
          <div className="h-4 w-24 rounded bg-muted" />
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard hover className={className} {...props}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold tracking-tight text-foreground">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span
                className={cn(
                  "text-xs font-medium",
                  trend.positive ? "text-success" : "text-destructive"
                )}
              >
                {trend.positive ? "+" : ""}
                {trend.value}%
              </span>
              <span className="text-xs text-muted-foreground">from last month</span>
            </div>
          )}
        </div>
        {icon && (
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            {icon}
          </div>
        )}
      </div>
      {children}
    </GlassCard>
  );
}

interface InsightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description: string;
  type?: "info" | "success" | "warning" | "tip";
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const typeStyles = {
  info: {
    bg: "bg-info/10 border-info/20",
    text: "text-info",
    title: "text-info-foreground",
  },
  success: {
    bg: "bg-success/10 border-success/20",
    text: "text-success",
    title: "text-success-foreground",
  },
  warning: {
    bg: "bg-warning/10 border-warning/20",
    text: "text-warning",
    title: "text-warning-foreground",
  },
  tip: {
    bg: "bg-accent/10 border-accent/20",
    text: "text-accent",
    title: "text-accent-foreground",
  },
};

export function InsightCard({
  title,
  description,
  type = "info",
  icon,
  action,
  className,
  ...props
}: InsightCardProps) {
  const styles = typeStyles[type];

  return (
    <div
      className={cn(
        "relative p-4 rounded-xl border",
        styles.bg,
        "transition-all duration-200",
        "hover:shadow-md",
        className
      )}
      {...props}
    >
      <div className="flex gap-3">
        {icon && (
          <div className={cn("shrink-0 mt-0.5", styles.text)}>
            {icon}
          </div>
        )}
        <div className="flex-1 space-y-1">
          <h4 className={cn("font-medium text-sm", styles.title)}>
            {title}
          </h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
          {action && (
            <button
              onClick={action.onClick}
              className={cn(
                "text-sm font-medium mt-2 hover:underline",
                styles.text
              )}
            >
              {action.label} →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
