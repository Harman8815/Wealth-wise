"use client";

import { TrendingUp } from "lucide-react";

export function Footer() {
  return (
    <footer className="py-20 border-t border-white/5 bg-black/40 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-16 mb-20">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-cyan-500 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-display font-bold text-white tracking-tighter">
                WealthWise<span className="text-cyan-400">.</span>
              </span>
            </div>
            <p className="text-slate-500 leading-relaxed">
              The future of personal finance. Intelligent, secure, and beautifully designed for the modern
              investor.
            </p>
          </div>

          {["Product", "Resources", "Company"].map((title, i) => (
            <div key={i}>
              <h4 className="text-white font-bold mb-8">{title}</h4>
              <ul className="space-y-4">
                {["Features", "Security", "Pricing", "API Docs"].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-slate-500 hover:text-cyan-400 transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
          <p className="text-slate-500 text-sm font-mono">© 2026 WEALTHWISE PRO. ALL SYSTEMS OPERATIONAL.</p>
          <div className="flex gap-8">
            {["Twitter", "GitHub", "Discord", "LinkedIn"].map((social) => (
              <a
                key={social}
                href="#"
                className="text-slate-500 hover:text-white transition-colors text-sm font-medium"
              >
                {social}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
