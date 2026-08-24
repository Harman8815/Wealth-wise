"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Info, CheckCircle, XCircle } from "lucide-react";

type AlertItem = Record<string, unknown>;

type AlertsListProps = {
  alerts: AlertItem[];
};

const TYPE_STYLES: Record<string, string> = {
  warning: "border-amber-500/40 bg-amber-950/30 text-amber-200",
  info: "border-blue-500/40 bg-blue-950/30 text-blue-200",
  success: "border-emerald-500/40 bg-emerald-950/30 text-emerald-200",
  error: "border-red-500/40 bg-red-950/30 text-red-200",
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  warning: <AlertTriangle className="h-4 w-4" />,
  info: <Info className="h-4 w-4" />,
  success: <CheckCircle className="h-4 w-4" />,
  error: <XCircle className="h-4 w-4" />,
};

export function AlertsList({ alerts }: AlertsListProps) {
  if (!alerts.length) return null;
  return (
    <div className="space-y-2">
      {alerts.map((alert, idx) => {
        const type = String(alert.type || "info").toLowerCase();
        const title = String(alert.title || alert.message || "Alert");
        return (
          <Card key={idx} className={`p-3 border ${TYPE_STYLES[type] || TYPE_STYLES.info}`}>
            <div className="flex items-start gap-2">
              <div className="mt-0.5">{TYPE_ICONS[type] || TYPE_ICONS.info}</div>
              <div className="flex-1">
                <div className="text-xs font-medium">{title}</div>
                {alert.message && alert.message !== title && (
                  <div className="text-[11px] opacity-80 mt-0.5">{String(alert.message)}</div>
                )}
                <div className="flex items-center gap-2 mt-1.5">
                  {alert.category && (
                    <Badge variant="secondary" className="text-[10px] bg-white/10 border-0">
                      {String(alert.category)}
                    </Badge>
                  )}
                  {alert.priority && (
                    <Badge variant="secondary" className="text-[10px] bg-white/10 border-0">
                      {String(alert.priority)}
                    </Badge>
                  )}
                  {alert.timestamp && (
                    <span className="text-[10px] opacity-70">{String(alert.timestamp)}</span>
                  )}
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
