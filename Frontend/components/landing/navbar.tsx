"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Search, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { MagneticButton } from "@/components/shared/ui/magnetic-button";
import { LiveClock } from "@/components/shared/ui/live-clock";
import confetti from "canvas-confetti";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleGetStarted = () => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#6366f1", "#06b6d4", "#a855f7"],
    });
  };

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500 px-6 py-4",
        isScrolled
          ? "bg-[#020617]/80 backdrop-blur-xl border-b border-white/5 py-3"
          : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-display font-bold tracking-tighter text-white">
            WealthWise<span className="text-cyan-400">.</span>
          </span>
        </motion.div>

        <div className="hidden lg:flex items-center gap-10">
          {["Markets", "Portfolio", "AI Insights", "Pricing"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(" ", "-")}`}
              className="text-sm font-medium text-slate-400 hover:text-white transition-colors relative group"
            >
              {item}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-cyan-400 transition-all duration-300 group-hover:w-full" />
            </a>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden xl:block mr-4">
            <LiveClock />
          </div>
          <button className="p-2 text-slate-400 hover:text-white transition-colors">
            <Search className="w-5 h-5" />
          </button>
          <button className="p-2 text-slate-400 hover:text-white transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-cyan-500 rounded-full border-2 border-[#020617]" />
          </button>
          <MagneticButton
            onClick={handleGetStarted}
            className="hidden md:block px-6 py-2.5 bg-white text-slate-900 rounded-full text-sm font-bold hover:bg-cyan-400 hover:text-white transition-colors"
          >
            Launch App
          </MagneticButton>
        </div>
      </div>
    </nav>
  );
}
