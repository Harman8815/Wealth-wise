"use client";

import { motion } from "framer-motion";
import { MagneticButton } from "@/components/shared/ui/magnetic-button";
import confetti from "canvas-confetti";

export function CTASection() {
  const handleGetStarted = () => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#6366f1", "#06b6d4", "#a855f7"],
    });
  };

  return (
    <section className="py-40 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl lg:text-7xl font-display font-bold text-white mb-10 tracking-tighter">
            Ready for the <br /> <span className="gradient-text-futuristic">Next Level?</span>
          </h2>
          <p className="text-xl text-slate-400 mb-16 leading-relaxed font-light max-w-2xl mx-auto">
            Join 100,000+ smart investors who have already upgraded their financial life. Start your journey
            with WealthWise Pro today.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <MagneticButton
              onClick={handleGetStarted}
              className="px-12 py-6 bg-white text-slate-900 rounded-2xl text-xl font-bold hover:bg-cyan-400 hover:text-white transition-all shadow-2xl shadow-white/10"
            >
              Get Started Free
            </MagneticButton>
            <button className="px-12 py-6 bg-white/5 text-white border border-white/10 rounded-2xl text-xl font-bold hover:bg-white/10 transition-all backdrop-blur-md">
              Contact Support
            </button>
          </div>
          <p className="mt-10 text-slate-500 text-sm">
            No credit card required. 14-day free trial of Pro features.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
