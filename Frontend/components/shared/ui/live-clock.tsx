"use client";

import { useState, useEffect } from "react";

/**
 * LiveClock Component
 * Displays current system time with live updates every second
 * Shows a pulsing indicator to indicate it's live
 * 
 * @example
 * <LiveClock />
 */
export function LiveClock() {
  const [time, setTime] = useState<string>("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTime(new Date().toLocaleTimeString());
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="flex items-center gap-2 font-mono text-[10px] text-slate-500 tracking-widest uppercase">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span>System Time: --:--:--</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 font-mono text-[10px] text-slate-500 tracking-widest uppercase">
      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
      <span>System Time: {time}</span>
    </div>
  );
}
