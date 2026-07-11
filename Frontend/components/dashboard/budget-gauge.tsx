"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { RotateCcw } from "lucide-react";

interface BudgetGaugeProps {
  totalBudget: number;
  spent: number;
  remaining: number;
  percentage: number;
  /** Optional cap on how large the gauge is allowed to grow. Defaults to 420px. */
  maxSize?: number;
  /** Optional floor on how small the gauge is allowed to shrink. Defaults to 200px. */
  minSize?: number;
  /** Animation duration in ms. Defaults to 1100. */
  animationMs?: number;
}

type GaugeStatus = {
  label: string;
  color: string;
  colorLight: string;
};

const STATUS: Record<"healthy" | "near" | "over", GaugeStatus> = {
  healthy: { label: "On Track", color: "#10b981", colorLight: "#6ee7b7" },
  near: { label: "Near Budget Limit", color: "#f59e0b", colorLight: "#fcd34d" },
  over: { label: "Budget Exceeded", color: "#ef4444", colorLight: "#fca5a5" },
};

function getStatus(percentage: number): GaugeStatus {
  if (percentage > 100) return STATUS.over;
  if (percentage >= 80) return STATUS.near;
  return STATUS.healthy;
}

function formatCurrency(value: number): string {
  const rounded = Math.round(value);
  const sign = rounded < 0 ? "-" : "";
  return `${sign}₹${Math.abs(rounded).toLocaleString()}`;
}

function polarToCartesian(
  cx: number,
  cy: number,
  radius: number,
  angleDeg: number,
) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + radius * Math.cos(rad), y: cy - radius * Math.sin(rad) };
}

function arcPath(
  cx: number,
  cy: number,
  r: number,
  fromDeg: number,
  toDeg: number,
) {
  const start = polarToCartesian(cx, cy, r, fromDeg);
  const end = polarToCartesian(cx, cy, r, toDeg);
  const large = fromDeg - toDeg > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 1 ${end.x} ${end.y}`;
}

/**
 * Picks a "nice" round scale ceiling for the gauge instead of hard-
 * clamping at 100. 100% stays 100 (the common case). Above that it
 * rounds up to a clean number (150 / 200 / 300 / 500 / 600 / 1000...)
 * so the needle/arc always have real headroom, and 554% ends up on a
 * 0–600 scale instead of pinned uselessly at the end of a 0–100 one.
 */
function niceScaleMax(value: number): number {
  if (value <= 100) return 100;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const residual = value / magnitude;
  const steps = [1, 1.5, 2, 3, 4, 5, 6, 8, 10];
  const step = steps.find((s) => s >= residual) ?? 10;
  return step * magnitude;
}

function useContainerWidth(ref: React.RefObject<HTMLElement>) {
  const [width, setWidth] = useState<number | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w) setWidth(w);
    });
    observer.observe(el);
    setWidth(el.getBoundingClientRect().width);
    return () => observer.disconnect();
  }, [ref]);
  return width;
}

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

export function BudgetGauge({
  totalBudget,
  spent,
  remaining,
  percentage,
  maxSize = 420,
  minSize = 200,
  animationMs = 1100,
}: BudgetGaugeProps) {
  const uid = useId().replace(/[:]/g, "");
  const containerRef = useRef<HTMLDivElement>(null);
  const measuredWidth = useContainerWidth(containerRef);
  const fillRef = useRef<SVGPathElement>(null);
  const needleRef = useRef<SVGGElement>(null);
  const pctTextRef = useRef<SVGTextElement>(null);
  const rafRef = useRef<number | null>(null);

  const size = useMemo(() => {
    const fallback = Math.min(maxSize, 320);
    if (measuredWidth == null) return fallback;
    return Math.min(maxSize, Math.max(minSize, measuredWidth));
  }, [measuredWidth, maxSize, minSize]);

  const status = getStatus(percentage);
  const isOver = percentage > 100;
  const scaleMax = useMemo(
    () => niceScaleMax(Math.max(percentage, 0)),
    [percentage],
  );
  const clamped = Math.min(Math.max(percentage, 0), scaleMax);
  const pctFraction = clamped / scaleMax;

  // Geometry depends on `size` and `scaleMax` — NOT on the raw
  // percentage or animation progress. scaleMax only changes when the
  // underlying data changes (a real re-render), never per animation
  // frame, so this still doesn't recompute during the animation itself.
  const geometry = useMemo(() => {
    const strokeWidth = size * 0.085;
    const radius = size * 0.38;
    const cx = size / 2;
    const tickReach = strokeWidth / 2 + size * 0.06 + size * 0.04;
    const cy = radius + tickReach;
    const svgHeight = cy + strokeWidth / 2 + size * 0.03;

    const angleFor = (value: number) => 180 * (1 - value / scaleMax);

    const zoneHealthy = arcPath(
      cx,
      cy,
      radius,
      angleFor(0),
      angleFor(Math.min(80, scaleMax)),
    );
    const zoneNear = arcPath(
      cx,
      cy,
      radius,
      angleFor(Math.min(80, scaleMax)),
      angleFor(Math.min(100, scaleMax)),
    );
    // Only exists when the scale actually extends past the budget line
    const zoneOver =
      scaleMax > 100
        ? arcPath(cx, cy, radius, angleFor(100), angleFor(scaleMax))
        : null;

    const fullArc = arcPath(cx, cy, radius, 180, 0);
    const fullArcLength = radius * Math.PI;

    // Evenly spaced quarter ticks along the arc; labels show the
    // rounded scale value at each position so they read cleanly even
    // when scaleMax isn't a perfect multiple of 4 (e.g. 150, 600).
    const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => {
      const angle = 180 * (1 - f);
      const value = Math.round(scaleMax * f);
      const inner = polarToCartesian(
        cx,
        cy,
        radius - strokeWidth / 2 - size * 0.015,
        angle,
      );
      const outer = polarToCartesian(
        cx,
        cy,
        radius + strokeWidth / 2 + size * 0.015,
        angle,
      );
      const label = polarToCartesian(
        cx,
        cy,
        radius + strokeWidth / 2 + size * 0.06,
        angle,
      );
      return { value, inner, outer, label };
    });

    // Marker for the 100% budget line, only meaningful once the scale
    // extends beyond it — otherwise it's just the last regular tick.
    const budgetMarker =
      scaleMax > 100
        ? (() => {
            const angle = angleFor(100);
            const inner = polarToCartesian(
              cx,
              cy,
              radius - strokeWidth / 2 - size * 0.03,
              angle,
            );
            const outer = polarToCartesian(
              cx,
              cy,
              radius + strokeWidth / 2 + size * 0.03,
              angle,
            );
            const label = polarToCartesian(
              cx,
              cy,
              radius + strokeWidth / 2 + size * 0.1,
              angle,
            );
            return { inner, outer, label };
          })()
        : null;

    const needleLength = radius - strokeWidth / 2 - size * 0.03;
    const needleTip0 = polarToCartesian(cx, cy, needleLength, 180);
    const needleBase1 = polarToCartesian(cx, cy, size * 0.02, 270);
    const needleBase2 = polarToCartesian(cx, cy, size * 0.02, 90);

    return {
      strokeWidth,
      radius,
      cx,
      cy,
      svgHeight,
      zoneHealthy,
      zoneNear,
      zoneOver,
      fullArc,
      fullArcLength,
      ticks,
      budgetMarker,
      needleTip0,
      needleBase1,
      needleBase2,
    };
  }, [size, scaleMax]);

  const centerX = geometry.cx;
  const centerY = geometry.cy - geometry.radius * 0.48;
  const isWide = percentage >= 100;
  const pctFontSize = size * (isWide ? 0.125 : 0.155);
  const statsStacked = size < 240;

  const targetOffset = geometry.fullArcLength * (1 - pctFraction);
  const targetRotation = 180 * pctFraction;

  const play = useCallback(() => {
    const fillEl = fillRef.current;
    const needleEl = needleRef.current;
    const textEl = pctTextRef.current;
    if (!fillEl || !needleEl) return;

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion) {
      fillEl.style.transition = "none";
      needleEl.style.transition = "none";
      fillEl.style.strokeDashoffset = `${targetOffset}`;
      needleEl.style.transform = `rotate(${targetRotation}deg)`;
      if (textEl) textEl.textContent = `${percentage.toFixed(0)}%`;
      return;
    }

    fillEl.style.transition = "none";
    needleEl.style.transition = "none";
    fillEl.style.strokeDashoffset = `${geometry.fullArcLength}`;
    needleEl.style.transform = "rotate(0deg)";

    void fillEl.getBoundingClientRect();

    fillEl.style.transition = `stroke-dashoffset ${animationMs}ms ${EASE}`;
    needleEl.style.transition = `transform ${animationMs}ms ${EASE}`;
    fillEl.style.strokeDashoffset = `${targetOffset}`;
    needleEl.style.transform = `rotate(${targetRotation}deg)`;

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (textEl) {
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min((now - start) / animationMs, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        textEl.textContent = `${(percentage * eased).toFixed(0)}%`;
        if (t < 1) {
          rafRef.current = requestAnimationFrame(tick);
        } else {
          textEl.textContent = `${percentage.toFixed(0)}%`;
        }
      };
      rafRef.current = requestAnimationFrame(tick);
    }
  }, [
    animationMs,
    geometry.fullArcLength,
    targetOffset,
    targetRotation,
    percentage,
  ]);

  useLayoutEffect(() => {
    play();
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetOffset, targetRotation, geometry.fullArcLength]);

  return (
    <div
      ref={containerRef}
      role="button"
      tabIndex={0}
      aria-label="Budget gauge — click to replay animation"
      onClick={play}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          play();
        }
      }}
      className="flex w-full cursor-pointer flex-col items-center outline-none"
    >
      <div
        className="relative flex w-full flex-col items-center rounded-2xl border border-border/60 bg-gradient-to-b from-muted/30 to-transparent p-5 transition-colors hover:border-border"
        style={{ maxWidth: maxSize }}
      >
        <button
          type="button"
          aria-label="Replay animation"
          title="Replay animation"
          onClick={(e) => {
            e.stopPropagation();
            play();
          }}
          className="absolute right-3 top-3 rounded-full border border-border/60 bg-background/80 p-1.5 text-muted-foreground transition-colors hover:text-foreground"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>

        <svg
          width="100%"
          height="auto"
          viewBox={`0 0 ${size} ${geometry.svgHeight}`}
          style={{ maxWidth: size }}
          role="img"
          aria-label={`Budget usage gauge showing ${percentage.toFixed(1)} percent used`}
        >
          <defs>
            <linearGradient
              id={`fill-${uid}`}
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop offset="0%" stopColor={status.colorLight} />
              <stop offset="100%" stopColor={status.color} />
            </linearGradient>
            <filter
              id={`glow-${uid}`}
              x="-50%"
              y="-50%"
              width="200%"
              height="200%"
            >
              <feGaussianBlur stdDeviation={size * 0.012} result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Zone bands */}
          <path
            d={geometry.zoneHealthy}
            fill="none"
            stroke={STATUS.healthy.color}
            strokeOpacity={0.12}
            strokeWidth={geometry.strokeWidth}
          />
          <path
            d={geometry.zoneNear}
            fill="none"
            stroke={STATUS.near.color}
            strokeOpacity={0.12}
            strokeWidth={geometry.strokeWidth}
          />
          {geometry.zoneOver && (
            <path
              d={geometry.zoneOver}
              fill="none"
              stroke={STATUS.over.color}
              strokeOpacity={0.18}
              strokeWidth={geometry.strokeWidth}
            />
          )}

          {/* Fill — static full-arc `d` across the whole 0–scaleMax range */}
          <path
            ref={fillRef}
            d={geometry.fullArc}
            fill="none"
            stroke={`url(#fill-${uid})`}
            strokeWidth={geometry.strokeWidth}
            strokeLinecap="round"
            strokeDasharray={geometry.fullArcLength}
            strokeDashoffset={geometry.fullArcLength}
            filter={`url(#glow-${uid})`}
          />

          {/* Ticks */}
          {geometry.ticks.map((tick) => (
            <g key={tick.value}>
              <line
                x1={tick.inner.x}
                y1={tick.inner.y}
                x2={tick.outer.x}
                y2={tick.outer.y}
                stroke="currentColor"
                className="text-muted-foreground/40"
                strokeWidth={size * 0.006}
              />
              <text
                x={tick.label.x}
                y={tick.label.y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-muted-foreground"
                style={{ fontSize: size * 0.032 }}
              >
                {tick.value}
              </text>
            </g>
          ))}

          {/* Budget line marker — only drawn once the scale extends past 100 */}
          {geometry.budgetMarker && (
            <g>
              <line
                x1={geometry.budgetMarker.inner.x}
                y1={geometry.budgetMarker.inner.y}
                x2={geometry.budgetMarker.outer.x}
                y2={geometry.budgetMarker.outer.y}
                stroke={STATUS.over.color}
                strokeDasharray={`${size * 0.012} ${size * 0.012}`}
                strokeWidth={size * 0.009}
              />
              <text
                x={geometry.budgetMarker.label.x}
                y={geometry.budgetMarker.label.y}
                textAnchor="middle"
                dominantBaseline="middle"
                style={{
                  fontSize: size * 0.03,
                  fill: STATUS.over.color,
                  fontWeight: 600,
                }}
              >
                Budget
              </text>
            </g>
          )}

          {/* Needle — predrawn pointing left (0), animated with a single rotate() */}
          <g
            ref={needleRef}
            style={{
              transformOrigin: `${geometry.cx}px ${geometry.cy}px`,
              transform: "rotate(0deg)",
            }}
          >
            <polygon
              points={`${geometry.needleBase1.x},${geometry.needleBase1.y} ${geometry.needleTip0.x},${geometry.needleTip0.y} ${geometry.needleBase2.x},${geometry.needleBase2.y}`}
              fill={status.color}
            />
          </g>
          <circle
            cx={geometry.cx}
            cy={geometry.cy}
            r={size * 0.032}
            fill={status.color}
          />
          <circle
            cx={geometry.cx}
            cy={geometry.cy}
            r={size * 0.014}
            fill="white"
            fillOpacity={0.85}
          />

          <text
            ref={pctTextRef}
            x={centerX}
            y={centerY}
            textAnchor="middle"
            className="fill-foreground font-bold"
            style={{ fontSize: pctFontSize, letterSpacing: "-0.02em" }}
          >
            0%
          </text>

          <text
            x={centerX}
            y={centerY + size * 0.085}
            textAnchor="middle"
            style={{
              fontSize: size * 0.052,
              fill: status.color,
              fontWeight: 600,
            }}
          >
            {status.label}
          </text>

          {isOver && (
            <text
              x={centerX}
              y={centerY + size * 0.14}
              textAnchor="middle"
              className="fill-muted-foreground"
              style={{ fontSize: size * 0.036, fontWeight: 500 }}
            >
              {(percentage - 100).toFixed(0)}% over limit
            </text>
          )}
        </svg>

        <div
          className={
            statsStacked
              ? "mt-4 flex w-full flex-col gap-2"
              : "mt-4 grid w-full grid-cols-3 gap-2.5"
          }
        >
          <div className="rounded-xl border border-border/50 bg-card/60 px-2 py-2.5 text-center">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Budget
            </div>
            <div className="text-sm font-semibold mt-0.5">
              {formatCurrency(totalBudget)}
            </div>
          </div>
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-2 py-2.5 text-center">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Spent
            </div>
            <div className="text-sm font-semibold mt-0.5 text-red-500">
              {formatCurrency(spent)}
            </div>
          </div>
          <div
            className={`rounded-xl px-2 py-2.5 text-center border ${
              remaining >= 0
                ? "border-emerald-500/20 bg-emerald-500/5"
                : "border-red-500/20 bg-red-500/5"
            }`}
          >
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Remaining
            </div>
            <div
              className={`text-sm font-semibold mt-0.5 ${remaining >= 0 ? "text-emerald-500" : "text-red-500"}`}
            >
              {formatCurrency(remaining)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
