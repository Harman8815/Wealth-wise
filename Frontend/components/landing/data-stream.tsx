"use client";

import { motion } from "framer-motion";

export function DataStream() {
  return (
    <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none overflow-hidden select-none">
      <div className="flex justify-around w-full h-full">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ y: -1000 }}
            animate={{ y: 1000 }}
            transition={{
              duration: 15 + Math.random() * 20,
              repeat: Infinity,
              ease: "linear",
              delay: Math.random() * 10,
            }}
            className="text-[10px] font-mono text-cyan-400 writing-vertical-rl"
          >
            {Array(50)
              .fill(0)
              .map(() => Math.random().toString(36).substring(2, 4))
              .join(" ")}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
