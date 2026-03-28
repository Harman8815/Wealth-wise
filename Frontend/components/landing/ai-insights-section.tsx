"use client";

import { motion } from "framer-motion";
import { Activity, PieChart, Globe } from "lucide-react";
import { GlassCard } from "@/components/shared/ui/glass-card";
import { AIInsightPanel } from "./ai-insight-panel";

const features = [
  { icon: Activity, title: "Predictive Analytics", desc: "Forecast your net worth 5 years into the future." },
  { icon: PieChart, title: "Tax Optimization", desc: "Automatically identify tax-saving opportunities." },
  { icon: Globe, title: "Global Markets", desc: "Real-time tracking of 50+ international exchanges." },
];

export function AIInsightsSection() {
  return (
    <section className="py-24 relative">
      <div className="max-w-7xl mx-auto px-6">
        <GlassCard className="p-10 md:p-16 border-indigo-500/20">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl lg:text-5xl font-display font-bold text-white mb-6 tracking-tight">
                Intelligent Insights <br /> <span className="text-indigo-400">Powered by AI</span>
              </h2>
              <p className="text-lg text-slate-400 mb-10 font-light leading-relaxed">
                Our advanced algorithms analyze thousands of data points to provide you with actionable
                financial advice tailored to your goals.
              </p>

              <div className="space-y-6">
                {features.map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                      <item.icon className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                      <h4 className="text-white font-bold">{item.title}</h4>
                      <p className="text-sm text-slate-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-black/40 rounded-3xl p-8 border border-white/5 shadow-inner">
              <AIInsightPanel />
              <div className="mt-10 pt-10 border-t border-white/5">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-sm font-bold text-white">Subscription Analysis</span>
                  <span className="text-xs text-slate-500">Updated 2m ago</span>
                </div>
                <div className="space-y-4">
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: "75%" }}
                      className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500"
                    />
                  </div>
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-indigo-400">Optimized: 75%</span>
                    <span className="text-slate-500">Target: 100%</span>
                  </div>
                </div>
                <button className="w-full mt-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-sm font-bold transition-all text-white">
                  Apply Recommendations
                </button>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    </section>
  );
}
