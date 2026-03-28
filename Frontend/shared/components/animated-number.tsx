"use client";

import * as React from "react";
import { useEffect, useState, useRef } from "react";

interface AnimatedNumberProps {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  duration?: number;
  className?: string;
}

export function AnimatedNumber({
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  duration = 1000,
  className,
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const startValueRef = useRef(0);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const startValue = displayValue;
    const endValue = value;
    const diff = endValue - startValue;

    if (diff === 0) return;

    startValueRef.current = startValue;
    startTimeRef.current = null;

    const animate = (currentTime: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = currentTime;
      }

      const elapsed = currentTime - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function - easeOutQuart
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = startValueRef.current + diff * easeOutQuart;

      setDisplayValue(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, duration]);

  const formattedValue = displayValue.toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span className={className}>
      {prefix}
      {formattedValue}
      {suffix}
    </span>
  );
}

interface CounterBadgeProps {
  count: number;
  max?: number;
  className?: string;
}

export function CounterBadge({ count, max = 99, className }: CounterBadgeProps) {
  const displayCount = count > max ? `${max}+` : count;

  return (
    <span
      className={
        `inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium rounded-full ` +
        `bg-primary text-primary-foreground animate-scale-in ${className || ""}`
      }
    >
      {displayCount}
    </span>
  );
}

interface TrendIndicatorProps {
  value: number;
  className?: string;
}

export function TrendIndicator({ value, className }: TrendIndicatorProps) {
  const isPositive = value >= 0;
  const colorClass = isPositive ? "text-success" : "text-destructive";
  const arrow = isPositive ? "↑" : "↓";

  return (
    <span className={`flex items-center gap-1 ${colorClass} ${className || ""}`}>
      <span className="text-xs">{arrow}</span>
      <span className="text-sm font-medium">{Math.abs(value)}%</span>
    </span>
  );
}
