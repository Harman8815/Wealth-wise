"use client";

import { useState, useEffect } from "react";

export function LiveClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center gap-2 font-mono text-[10px] text-slate-500 tracking-widest uppercase">
      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
      <span>System Time: {time.toLocaleTimeString()}</span>
    </div>
  );
}
