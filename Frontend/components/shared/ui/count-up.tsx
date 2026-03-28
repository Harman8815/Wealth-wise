"use client";

import { useState, useEffect } from "react";

/**
 * CountUp Component
 * Animated number counter with easing
 * 
 * @param value - Target number to count to
 * @param prefix - String to display before the number
 * @param suffix - String to display after the number
 * @param duration - Animation duration in seconds (default: 2)
 * 
 * @example
 * <CountUp value={1000} prefix="$" suffix="+" duration={2} />
 */
interface CountUpProps {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
}

export function CountUp({ value, prefix = "", suffix = "", duration = 2 }: CountUpProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let frame = 0;
    const totalFrames = duration * 60;

    const counter = setInterval(() => {
      frame++;
      const progress = frame / totalFrames;
      // Ease out cubic
      const currentCount = Math.floor(value * (1 - Math.pow(1 - progress, 3)));
      setCount(currentCount);
      if (frame === totalFrames) clearInterval(counter);
    }, 1000 / 60);

    return () => clearInterval(counter);
  }, [value, duration]);

  return (
    <span>
      {prefix}
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}
