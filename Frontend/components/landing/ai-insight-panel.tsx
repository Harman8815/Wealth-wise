"use client";

import { motion } from "framer-motion";
import { Cpu } from "lucide-react";
import { useState, useEffect } from "react";

export function AIInsightPanel() {
  const [text, setText] = useState("");
  const fullText =
    "Based on your current spending, you could save an additional $450 this month by optimizing your recurring subscriptions. Would you like me to analyze your Netflix and Spotify plans?";

  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      setText(fullText.slice(0, i));
      i++;
      if (i > fullText.length) clearInterval(timer);
    }, 30);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
            <Cpu className="w-5 h-5 text-indigo-400" />
          </div>
          <motion.div
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 bg-indigo-500/30 rounded-full"
          />
        </div>
        <div>
          <h3 className="text-white font-bold text-sm">WealthWise AI</h3>
          <p className="text-[10px] text-emerald-400 font-mono uppercase tracking-widest">Analyzing Live Data...</p>
        </div>
      </div>
      <p className="text-slate-300 font-light leading-relaxed min-h-[80px] font-mono text-sm">
        {text}
        <span className="inline-block w-1 h-4 bg-indigo-400 ml-1 animate-pulse" />
      </p>
    </div>
  );
}
