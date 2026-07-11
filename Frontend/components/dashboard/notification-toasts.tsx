"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { AlertTriangle, Info, CheckCircle2, XCircle } from "lucide-react";
import { useAlerts } from "@/hooks";
import type { Alert } from "@/api/services";

const SHOWN_ALERTS_KEY = "wealthwise_shown_alerts";

const ALERT_ICON: Record<Alert["type"], React.ReactNode> = {
  warning: <AlertTriangle className="h-5 w-5 text-amber-500" />,
  info: <Info className="h-5 w-5 text-blue-500" />,
  success: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
  error: <XCircle className="h-5 w-5 text-red-500" />,
};

function getShownAlerts(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(SHOWN_ALERTS_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function markAlertShown(id: string): void {
  if (typeof window === "undefined") return;
  const shown = getShownAlerts();
  if (!shown.includes(id)) {
    shown.push(id);
    window.sessionStorage.setItem(SHOWN_ALERTS_KEY, JSON.stringify(shown));
  }
}

export function NotificationToasts() {
  const { data } = useAlerts({ read: false }, 1, 5);
  const processedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const timeout = setTimeout(() => {
      const alerts: Alert[] = data?.results ?? [];
      const shown = getShownAlerts();

      alerts.forEach((alert) => {
        if (processedRef.current.has(alert.id)) return;
        processedRef.current.add(alert.id);

        if (shown.includes(alert.id)) return;

        toast(alert.title, {
          description: alert.message,
          icon: ALERT_ICON[alert.type],
        });

        markAlertShown(alert.id);
      });
    }, 600);

    return () => clearTimeout(timeout);
  }, [data]);

  return null;
}
