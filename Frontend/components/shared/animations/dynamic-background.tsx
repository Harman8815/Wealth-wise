"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";

/**
 * DynamicBackground Component
 * Interactive background with mouse-following gradient orbs and animated circles
 * 
 * @example
 * <DynamicBackground />
 */
export function DynamicBackground() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 40,
        y: (e.clientY / window.innerHeight - 0.5) * 40,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
      {/* Interactive Floating Orbs */}
      <motion.div
        animate={{ x: mousePos.x * 1.5, y: mousePos.y * 1.5 }}
        transition={{ type: "spring", damping: 30, stiffness: 50 }}
        className="absolute top-[10%] left-[10%] w-[400px] h-[400px] bg-indigo-600/20 rounded-full blur-[120px]"
      />
      <motion.div
        animate={{ x: -mousePos.x * 2, y: -mousePos.y * 2 }}
        transition={{ type: "spring", damping: 30, stiffness: 50 }}
        className="absolute bottom-[10%] right-[10%] w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[150px]"
      />
      <motion.div
        animate={{ x: mousePos.x * 0.8, y: -mousePos.y * 0.8 }}
        transition={{ type: "spring", damping: 30, stiffness: 50 }}
        className="absolute top-[40%] right-[20%] w-[300px] h-[300px] bg-purple-600/15 rounded-full blur-[100px]"
      />

      {/* Subtle Animated Circles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0.1, 0.3, 0.1],
            scale: [1, 1.2, 1],
            x: [0, Math.random() * 50 - 25, 0],
            y: [0, Math.random() * 50 - 25, 0],
          }}
          transition={{
            duration: 10 + Math.random() * 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 2,
          }}
          className="absolute border border-white/5 rounded-full"
          style={{
            width: `${100 + i * 150}px`,
            height: `${100 + i * 150}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            transform: "translate(-50%, -50%)",
          }}
        />
      ))}
    </div>
  );
}
