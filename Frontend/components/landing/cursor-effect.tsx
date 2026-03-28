"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

export function CursorEffect() {
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const id = Date.now();
      setRipples((prev) => [...prev, { x: e.clientX, y: e.clientY, id }]);
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id));
      }, 1000);
    };

    window.addEventListener("mousedown", handleClick);
    return () => window.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <AnimatePresence>
      {ripples.map((ripple) => (
        <motion.div
          key={ripple.id}
          initial={{ scale: 0, opacity: 0.5 }}
          animate={{ scale: 4, opacity: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="fixed z-[9998] w-10 h-10 border-2 border-cyan-400 rounded-full pointer-events-none"
          style={{ left: ripple.x - 20, top: ripple.y - 20 }}
        />
      ))}
    </AnimatePresence>
  );
}
