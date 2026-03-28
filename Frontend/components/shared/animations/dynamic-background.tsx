"use client";

import { motion } from "framer-motion";
import { useState, useEffect, useMemo } from "react";

/**
 * DynamicBackground Component
 * Interactive background with mouse-following gradient orbs and animated circles
 * 
 * @example
 * <DynamicBackground />
 */
export function DynamicBackground() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);

  // Generate random positions only on client to avoid hydration mismatch
  const circles = useMemo(() => {
    return [...Array(6)].map((_, i) => ({
      id: i,
      width: 100 + i * 150,
      left: Math.random() * 100,
      top: Math.random() * 100,
    }));
  }, []);

  useEffect(() => {
    setMounted(true);
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 40,
        y: (e.clientY / window.innerHeight - 0.5) * 40,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Don't render animated circles until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
        {/* Static orbs for SSR */}
        <div className="absolute top-[10%] left-[10%] w-[400px] h-[400px] bg-indigo-600 rounded-full blur-[120px]" />
        <div className="absolute bottom-[10%] right-[10%] w-[500px] h-[500px] bg-cyan-500 rounded-full blur-[150px]" />
        <div className="absolute top-[40%] right-[20%] w-[300px] h-[300px] bg-purple-600 rounded-full blur-[100px]" />
        <div className="absolute top-[20%] left-[20%] w-[350px] h-[350px] bg-blue-600 rounded-full blur-[100px]" />
        <div className="absolute bottom-[30%] left-[60%] w-[450px] h-[450px] bg-blue-500 rounded-full blur-[120px]" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
      {/* Interactive Floating Orbs */}
      <motion.div
        animate={{ x: mousePos.x * 1.5, y: mousePos.y * 1.5 }}
        transition={{ type: "spring", damping: 30, stiffness: 50 }}
        className="absolute top-[10%] left-[10%] w-[400px] h-[400px] bg-indigo-600 rounded-full blur-[120px]"
      />
      <motion.div
        animate={{ x: -mousePos.x * 2, y: -mousePos.y * 2 }}
        transition={{ type: "spring", damping: 30, stiffness: 50 }}
        className="absolute bottom-[10%] right-[10%] w-[500px] h-[500px] bg-cyan-500 rounded-full blur-[150px]"
      />
      <motion.div
        animate={{ x: mousePos.x * 0.8, y: -mousePos.y * 0.8 }}
        transition={{ type: "spring", damping: 30, stiffness: 50 }}
        className="absolute top-[40%] right-[20%] w-[300px] h-[300px] bg-purple-600 rounded-full blur-[100px]"
      />

      {/* Blue Gradient Orbs with Floating Animation */}
      <motion.div
        animate={{
          y: [0, -30, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute top-[10%] left-[10%] w-[650px] h-[650px] bg-sky-500 rounded-full blur-[200px]"
      />
      <motion.div
        animate={{
          y: [0, 40, 0],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2
        }}
        className="absolute bottom-[20%] left-[70%] w-[550px] h-[550px] bg-blue-500 rounded-full blur-[160px]"
      />


    </div>
  );
}
