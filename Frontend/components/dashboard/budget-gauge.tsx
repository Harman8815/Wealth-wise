"use client"

import { useMemo } from "react"

interface BudgetGaugeProps {
  totalBudget: number
  spent: number
  remaining: number
  percentage: number
  size?: number
}

type GaugeStatus = {
  label: string
  color: string
}

const STATUS_COLORS = {
  healthy: "#10b981",
  near: "#f59e0b",
  over: "#ef4444",
} as const

function getStatus(percentage: number): GaugeStatus {
  if (percentage > 100) {
    return { label: "Budget Exceeded", color: STATUS_COLORS.over }
  }
  if (percentage >= 80) {
    return { label: "Near Budget Limit", color: STATUS_COLORS.near }
  }
  return { label: "On Track", color: STATUS_COLORS.healthy }
}

function formatCurrency(value: number): string {
  return `₹${Math.round(value).toLocaleString()}`
}

function polarToCartesian(
  cx: number,
  cy: number,
  radius: number,
  angleDeg: number
): { x: number; y: number } {
  const rad = (angleDeg * Math.PI) / 180
  return {
    x: cx + radius * Math.cos(rad),
    y: cy - radius * Math.sin(rad),
  }
}

export function BudgetGauge({
  totalBudget,
  spent,
  remaining,
  percentage,
  size = 300,
}: BudgetGaugeProps) {
  const status = getStatus(percentage)
  const clamped = Math.min(Math.max(percentage, 0), 100)
  const pctFraction = clamped / 100

  const geometry = useMemo(() => {
    const strokeWidth = size * 0.07
    const radius = size * 0.4
    const cx = size / 2
    const cy = size * 0.8

    const startAngle = 180
    const endAngle = 180 * (1 - pctFraction)

    const startPoint = polarToCartesian(cx, cy, radius, startAngle)
    const endPoint = polarToCartesian(cx, cy, radius, endAngle)

    const largeArc = pctFraction > 0.5 ? 1 : 0

    const trackPath = `M ${startPoint.x} ${startPoint.y} A ${radius} ${radius} 0 0 1 ${polarToCartesian(cx, cy, radius, 0).x} ${polarToCartesian(cx, cy, radius, 0).y}`

    const fillPath =
      pctFraction <= 0
        ? ""
        : `M ${startPoint.x} ${startPoint.y} A ${radius} ${radius} 0 ${largeArc} 1 ${endPoint.x} ${endPoint.y}`

    const needleLength = radius - strokeWidth / 2 - size * 0.02
    const needleTip = polarToCartesian(cx, cy, needleLength, endAngle)

    return {
      strokeWidth,
      radius,
      cx,
      cy,
      needleTip,
      trackPath,
      fillPath,
    }
  }, [size, pctFraction])

  const centerX = geometry.cx
  const centerY = geometry.cy - geometry.radius * 0.55

  return (
    <div className="flex flex-col items-center" style={{ width: size }}>
      <svg
        width={size}
        height={size * 0.7}
        viewBox={`0 0 ${size} ${size * 0.7}`}
        className="overflow-visible"
        role="img"
        aria-label={`Budget usage gauge showing ${percentage.toFixed(1)} percent used`}
      >
        {/* Track */}
        <path
          d={geometry.trackPath}
          fill="none"
          stroke="currentColor"
          strokeWidth={geometry.strokeWidth}
          strokeLinecap="round"
          className="text-muted-foreground/20"
        />

        {/* Fill */}
        {geometry.fillPath && (
          <path
            d={geometry.fillPath}
            fill="none"
            stroke={status.color}
            strokeWidth={geometry.strokeWidth}
            strokeLinecap="round"
            style={{ transition: "all 0.6s ease-out" }}
          />
        )}

        {/* Needle */}
        <line
          x1={geometry.cx}
          y1={geometry.cy}
          x2={geometry.needleTip.x}
          y2={geometry.needleTip.y}
          stroke={status.color}
          strokeWidth={size * 0.018}
          strokeLinecap="round"
          style={{ transition: "all 0.6s ease-out" }}
        />

        {/* Center hub */}
        <circle
          cx={geometry.cx}
          cy={geometry.cy}
          r={size * 0.035}
          fill={status.color}
        />

        {/* Percentage */}
        <text
          x={centerX}
          y={centerY}
          textAnchor="middle"
          className="fill-foreground font-bold"
          style={{ fontSize: size * 0.16 }}
        >
          {percentage.toFixed(0)}%
        </text>

        {/* Status text */}
        <text
          x={centerX}
          y={centerY + size * 0.1}
          textAnchor="middle"
          style={{ fontSize: size * 0.06, fill: status.color, fontWeight: 600 }}
        >
          {status.label}
        </text>
      </svg>

      {/* Center stats */}
      <div className="w-full mt-2 grid grid-cols-3 gap-3 text-center">
        <div className="rounded-lg bg-muted/40 p-3">
          <div className="text-xs text-muted-foreground">Total Budget</div>
          <div className="text-sm font-semibold">{formatCurrency(totalBudget)}</div>
        </div>
        <div className="rounded-lg bg-muted/40 p-3">
          <div className="text-xs text-muted-foreground">Spent</div>
          <div className="text-sm font-semibold text-red-600">
            {formatCurrency(spent)}
          </div>
        </div>
        <div className="rounded-lg bg-muted/40 p-3">
          <div className="text-xs text-muted-foreground">Remaining</div>
          <div
            className={`text-sm font-semibold ${
              remaining >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {formatCurrency(remaining)}
          </div>
        </div>
      </div>
    </div>
  )
}
