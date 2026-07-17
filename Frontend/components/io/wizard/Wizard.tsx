/**
 * Reusable, domain-independent multi-step Wizard.
 *
 * Any workflow (import, export, onboarding) can reuse this shell. It manages
 * step navigation, validation gating, loading and error states, and renders a
 * progress indicator. Steps declare their own validation via `canAdvance`.
 */
"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface WizardStep {
  id: string;
  title: string;
  description?: string;
  content: React.ReactNode;
  /** Return true when the user may advance past this step. */
  canAdvance?: () => boolean;
  /** Optional hint shown when advance is blocked. */
  blockedHint?: string;
}

interface WizardContextValue {
  currentIndex: number;
  steps: WizardStep[];
  next: () => void;
  back: () => void;
  goTo: (index: number) => void;
  isFirst: boolean;
  isLast: boolean;
  canAdvance: boolean;
  blockedHint?: string;
  loading: boolean;
  error: string | null;
  setLoading: (v: boolean) => void;
  setError: (e: string | null) => void;
}

const WizardContext = createContext<WizardContextValue | null>(null);

export function useWizard(): WizardContextValue {
  const ctx = useContext(WizardContext);
  if (!ctx) throw new Error("useWizard must be used inside <Wizard>.");
  return ctx;
}

interface WizardProps {
  steps: WizardStep[];
  onCancel?: () => void;
  onComplete?: () => void;
  className?: string;
  /** Label for the final action button. */
  completeLabel?: string;
  /** Invoked when the user clicks the final action. */
  onFinish?: () => void | Promise<void>;
}

export function Wizard({
  steps,
  onCancel,
  className,
  completeLabel = "Finish",
  onFinish,
}: WizardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const step = steps[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === steps.length - 1;

  const canAdvance = step?.canAdvance ? step.canAdvance() : true;
  const blockedHint = !canAdvance ? step?.blockedHint : undefined;

  const goTo = useCallback(
    (index: number) => {
      if (index < 0 || index >= steps.length) return;
      setError(null);
      setCurrentIndex(index);
    },
    [steps.length]
  );

  const next = useCallback(() => {
    if (!canAdvance) return;
    if (isLast) return;
    goTo(currentIndex + 1);
  }, [canAdvance, isLast, currentIndex, goTo]);

  const back = useCallback(() => goTo(currentIndex - 1), [currentIndex, goTo]);

  const handleFinish = useCallback(async () => {
    if (!onFinish) return;
    setLoading(true);
    setError(null);
    try {
      await onFinish();
    } catch (e: any) {
      setError(e?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [onFinish]);

  const ctxValue = useMemo<WizardContextValue>(
    () => ({
      currentIndex,
      steps,
      next,
      back,
      goTo,
      isFirst,
      isLast,
      canAdvance,
      blockedHint,
      loading,
      error,
      setLoading,
      setError,
    }),
    [currentIndex, steps, next, back, goTo, isFirst, isLast, canAdvance, blockedHint, loading, error]
  );

  const progress = ((currentIndex + 1) / steps.length) * 100;

  return (
    <WizardContext.Provider value={ctxValue}>
      <Card className={cn("w-full", className)}>
        <div className="px-6 pt-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">
              Step {currentIndex + 1} of {steps.length}
            </p>
            {onCancel && (
              <Button variant="ghost" size="icon" onClick={onCancel} aria-label="Cancel">
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
          <Progress value={progress} className="h-1.5" />
          <ol className="mt-4 flex flex-wrap gap-2">
            {steps.map((s, i) => (
              <li key={s.id} className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                    i < currentIndex && "bg-green-600 text-white",
                    i === currentIndex && "bg-blue-600 text-white",
                    i > currentIndex && "bg-muted text-muted-foreground"
                  )}
                >
                  {i < currentIndex ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                </span>
                <span
                  className={cn(
                    "text-xs",
                    i === currentIndex ? "text-foreground font-medium" : "text-muted-foreground"
                  )}
                >
                  {s.title}
                </span>
                {i < steps.length - 1 && <span className="mx-1 text-muted-foreground/40">›</span>}
              </li>
            ))}
          </ol>
        </div>

        <CardContent className="pt-6">
          <div className="mb-1">
            <h2 className="text-lg font-semibold">{step?.title}</h2>
            {step?.description && (
              <p className="text-sm text-muted-foreground">{step.description}</p>
            )}
          </div>

          <div className="mt-4 min-h-[260px]">{step?.content}</div>

          {error && (
            <div className="mt-4 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="mt-6 flex items-center justify-between gap-3">
            <Button variant="outline" onClick={back} disabled={isFirst || loading}>
              Back
            </Button>
            {blockedHint && !canAdvance && (
              <span className="text-xs text-amber-600 dark:text-amber-400 flex-1 text-center">
                {blockedHint}
              </span>
            )}
            <div className="flex-1" />
            {isLast ? (
              <Button onClick={handleFinish} disabled={loading || !canAdvance}>
                {loading ? "Working…" : completeLabel}
              </Button>
            ) : (
              <Button onClick={next} disabled={loading || !canAdvance}>
                Next
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </WizardContext.Provider>
  );
}
