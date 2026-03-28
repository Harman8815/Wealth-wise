"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

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

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  glow?: boolean;
}

export function GlassCard({ children, className = "", delay = 0, glow = false }: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
      className={`glass-card rounded-3xl p-6 group transition-all duration-500 ${
        glow ? "hover:shadow-[0_0_40px_rgba(99,102,241,0.15)]" : ""
      } ${className}`}
    >
      {children}
    </motion.div>
  );
}
