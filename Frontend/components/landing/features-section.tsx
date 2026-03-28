"use client";

import { Globe, ShieldCheck, Zap, Layers } from "lucide-react";
import { GlassCard } from "@/components/shared/ui/glass-card";
import { LineChart, Line, ResponsiveContainer } from "recharts";

const chartData = [
  { name: "Mon", value: 4200, expense: 2100 },
  { name: "Tue", value: 3800, expense: 1800 },
  { name: "Wed", value: 5100, expense: 2400 },
  { name: "Thu", value: 4600, expense: 1900 },
  { name: "Fri", value: 6200, expense: 2800 },
  { name: "Sat", value: 5800, expense: 1500 },
  { name: "Sun", value: 7400, expense: 1200 },
];

export function FeaturesSection() {
  return (
    <section className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-transparent pointer-events-none" />
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-20">
          <h2 className="text-5xl font-display font-bold text-white mb-6 tracking-tight">
            Engineered for Performance
          </h2>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto font-light">
            Built with the latest technologies to ensure your financial data is always fast, secure, and
            accessible.
          </p>
        </div>

        <div className="grid md:grid-cols-12 gap-8">
          <GlassCard className="md:col-span-8 p-10" delay={0.1}>
            <div className="flex flex-col md:flex-row gap-10 items-center">
              <div className="flex-1">
                <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 flex items-center justify-center mb-6">
                  <Globe className="w-8 h-8 text-cyan-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Global Asset Coverage</h3>
                <p className="text-slate-400 leading-relaxed">
                  Track everything from traditional stocks and bonds to crypto, real estate, and private
                  equity. One dashboard for your entire financial world.
                </p>
              </div>
              <div className="flex-1 w-full h-[200px] bg-white/5 rounded-2xl border border-white/5 p-4 overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <Line type="monotone" dataKey="value" stroke="#06b6d4" strokeWidth={3} dot={false} />
                    <Line type="monotone" dataKey="expense" stroke="#a855f7" strokeWidth={3} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="md:col-span-4 p-10" delay={0.2}>
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 flex items-center justify-center mb-6">
              <ShieldCheck className="w-8 h-8 text-indigo-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Privacy First</h3>
            <p className="text-slate-400 leading-relaxed">
              We use zero-knowledge encryption. Your data is yours alone. We can&apos;t see it, and we&apos;ll never
              sell it.
            </p>
          </GlassCard>

          <GlassCard className="md:col-span-4 p-10" delay={0.3}>
            <div className="w-14 h-14 rounded-2xl bg-purple-500/20 flex items-center justify-center mb-6">
              <Zap className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Instant Sync</h3>
            <p className="text-slate-400 leading-relaxed">
              Transactions appear in real-time. No waiting for bank statements or manual entry.
            </p>
          </GlassCard>

          <GlassCard className="md:col-span-8 p-10" delay={0.4}>
            <div className="flex flex-col md:flex-row gap-10 items-center">
              <div className="flex-1 order-2 md:order-1 w-full h-[240px] bg-white/5 rounded-2xl border border-white/5 p-6 overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-500/5 to-transparent animate-scan pointer-events-none" />
                <div className="grid grid-cols-3 gap-4 w-full h-full">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                    <div key={i} className="relative overflow-hidden bg-white/5 rounded-xl border border-white/5 p-3">
                      <div className="w-1/2 h-2 bg-white/10 rounded-full mb-2" />
                      <div className="w-full h-8 bg-white/5 rounded-lg shimmer" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex-1 order-1 md:order-2">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center mb-6">
                  <Layers className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Modular Interface</h3>
                <p className="text-slate-400 leading-relaxed">
                  Customize your dashboard with widgets that matter to you. Drag, drop, and resize to create
                  your perfect workspace.
                </p>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </section>
  );
}
