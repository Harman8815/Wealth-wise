"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useMemo } from "react";
import { ArrowRight, ArrowUpRight, CreditCard, Globe, Activity, Zap, ShieldCheck } from "lucide-react";
import { AreaChart, Area, Tooltip, ResponsiveContainer } from "recharts";
import { GlassCard, CountUp } from "@/components/shared/ui";
import { MagneticButton } from "@/components/shared/ui";
import { DataStream } from "@/components/shared/animations";

const chartData = [
  { name: "Mon", value: 4200, expense: 2100 },
  { name: "Tue", value: 3800, expense: 1800 },
  { name: "Wed", value: 5100, expense: 2400 },
  { name: "Thu", value: 4600, expense: 1900 },
  { name: "Fri", value: 6200, expense: 2800 },
  { name: "Sat", value: 5800, expense: 1500 },
  { name: "Sun", value: 7400, expense: 1200 },
];

export function HeroSection() {
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.9]);

  return (
    <section className="relative pt-32 pb-20 lg:pt-56 lg:pb-40 overflow-hidden">
      <DataStream />
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-12 gap-16 items-center">
          <motion.div style={{ opacity, scale }} className="lg:col-span-7">
            <h1 className="text-4xl lg:text-7xl font-display font-bold text-white leading-[1.1] tracking-tighter mb-8">
              The future of <br />
              <span className="gradient-text-futuristic">Financial Intelligence</span>
            </h1>
            <p className="text-lg lg:text-xl text-slate-400 mb-12 leading-relaxed max-w-xl font-light">
              Experience a new era of wealth management. Real-time tracking, AI-driven predictions, and
              institutional-grade security, all in one fluid interface.
            </p>
            <div className="flex flex-wrap gap-6">
              <MagneticButton className="px-10 py-5 bg-gradient-to-r from-indigo-600 to-cyan-500 text-white rounded-2xl text-lg font-bold shadow-2xl shadow-indigo-500/20 flex items-center gap-3 group">
                Get Started <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </MagneticButton>
              <button className="px-10 py-5 bg-white/5 text-white border border-white/10 rounded-2xl text-lg font-bold hover:bg-white/10 transition-all backdrop-blur-md">
                Watch Demo
              </button>
            </div>

            <div className="mt-16 grid grid-cols-3 gap-8 border-t border-white/5 pt-12">
              <div>
                <p className="text-3xl font-display font-bold text-white tracking-tighter">
                  <CountUp value={240} suffix="K+" />
                </p>
                <p className="text-[11px] text-slate-500 mt-1 uppercase tracking-widest font-medium">
                  Active Investors
                </p>
              </div>
              <div>
                <p className="text-3xl font-display font-bold text-white tracking-tighter">
                  <CountUp value={12} suffix="B+" prefix="$" />
                </p>
                <p className="text-[11px] text-slate-500 mt-1 uppercase tracking-widest font-medium">
                  Assets Managed
                </p>
              </div>
              <div>
                <p className="text-3xl font-display font-bold text-white tracking-tighter">
                  <CountUp value={99} suffix=".9%" />
                </p>
                <p className="text-[11px] text-slate-500 mt-1 uppercase tracking-widest font-medium">
                  Uptime SLA
                </p>
              </div>
            </div>
          </motion.div>

          <div className="lg:col-span-5 relative">
            <motion.div
              initial={{ opacity: 0, rotateY: 20, x: 50 }}
              animate={{ opacity: 1, rotateY: 0, x: 0 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="perspective-1000"
            >
              <GlassCard className="relative z-10 border-white/20" glow>
                <div className="flex items-center justify-between mb-10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Main Portfolio</p>
                      <h3 className="text-2xl font-bold text-white">$124,580.42</h3>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-emerald-400 font-bold flex items-center gap-1 justify-end">
                      <ArrowUpRight className="w-3 h-3" /> +4.2%
                    </p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-tighter">Last 24h</p>
                  </div>
                </div>

                <div className="h-[200px] w-full mb-8">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="heroGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0f172a",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "12px",
                        }}
                        itemStyle={{ color: "#fff" }}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#6366f1"
                        strokeWidth={4}
                        fillOpacity={1}
                        fill="url(#heroGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center">
                        <Globe className="w-4 h-4 text-orange-400" />
                      </div>
                      <span className="text-sm font-medium text-white">Bitcoin</span>
                    </div>
                    <span className="text-sm font-bold text-white">$64,210.00</span>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <Activity className="w-4 h-4 text-blue-400" />
                      </div>
                      <span className="text-sm font-medium text-white">Ethereum</span>
                    </div>
                    <span className="text-sm font-bold text-white">$3,450.12</span>
                  </div>
                </div>
              </GlassCard>
            </motion.div>

            {/* Floating Elements */}
            <motion.div
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-10 -right-10 z-20 p-4 glass-card rounded-2xl border-cyan-500/30"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase">Auto-Invest</p>
                  <p className="text-xs font-bold text-white">Active</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [0, 20, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute -bottom-10 -left-10 z-20 p-4 glass-card rounded-2xl border-purple-500/30"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase">Security</p>
                  <p className="text-xs font-bold text-white">Encrypted</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
