"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useRegister, useLogin } from "@/hooks";
import { DynamicBackground } from "@/components/shared/animations";
import { Mail, Lock, User, UserPlus, Chrome, ArrowLeft, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const registerMutation = useRegister();
  const loginMutation = useLogin();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      // Register the user
      await registerMutation.mutateAsync({
        name,
        email,
        password,
      });

      // Auto-login after successful registration
      await loginMutation.mutateAsync({ email, password });
      router.push("/dashboard");
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail ||
        err.response?.data?.email?.[0] ||
        err.response?.data?.username?.[0] ||
        err.response?.data?.password?.[0] ||
        "Registration failed";
      setError(errorMsg);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col lg:flex-row overflow-hidden selection:bg-cyan-500/30">
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
        className="absolute top-[15%] left-[-10%] w-[650px] h-[650px] bg-sky-500/30 rounded-full blur-[200px]"
      />

      {/* Grid Lines */}
      <div className="absolute inset-0 z-0 opacity-20" style={{ backgroundImage: 'linear-gradient(rgba(6,182,212,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

      {/* Floating Geometric Shapes */}
      <motion.div
        animate={{ y: [0, -20, 0], rotate: [0, 360] }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        className="absolute top-[25%] right-[10%] w-32 h-32 border border-cyan-500/20 rotate-45"
      />
      <motion.div
        animate={{ y: [0, 30, 0], rotate: [0, -360] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-[25%] left-[10%] w-24 h-24 border border-indigo-500/20 rounded-full"
      />
      <motion.div
        animate={{ y: [0, -15, 0], x: [0, 10, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[50%] right-[8%] w-16 h-16 border-r-2 border-b-2 border-cyan-400/30"
      />

      {/* Diagonal Lines */}
      <svg className="absolute inset-0 w-full h-full z-0 opacity-10 pointer-events-none">
        <line x1="0" y1="0" x2="100%" y2="100%" stroke="url(#signupLineGrad1)" strokeWidth="1" />
        <line x1="100%" y1="0" x2="0" y2="100%" stroke="url(#signupLineGrad2)" strokeWidth="1" />
        <defs>
          <linearGradient id="signupLineGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0" />
            <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="signupLineGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0" />
            <stop offset="50%" stopColor="#6366f1" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      {/* Floating Dots */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          animate={{ y: [0, -30, 0], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3 + i * 0.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 }}
          className="absolute w-1 h-1 rounded-full bg-indigo-400/40"
          style={{ top: `${15 + i * 10}%`, right: `${15 + i * 8}%` }}
        />
      ))}

      {/* Left Side: Brand */}
      <div className="relative hidden lg:flex lg:w-1/2 flex-col justify-between p-16 overflow-hidden border-r border-white/5">
        <Link href="/" className="relative z-10 flex items-center gap-3 group">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tighter text-white">
            WealthWise<span className="text-cyan-400">.</span>
          </span>
        </Link>

        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h2 className="text-7xl xl:text-8xl font-bold text-white leading-[0.9] tracking-tighter mb-8">
              JOIN <br />
              <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                ELITE
              </span>
            </h2>
            <p className="text-xl text-slate-400 font-light max-w-md leading-relaxed">
              Begin your journey to institutional-grade wealth management and AI-powered financial intelligence.
            </p>
          </motion.div>
        </div>

        <div className="relative z-10 flex items-center gap-8">
          <div className="flex -space-x-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-10 h-10 rounded-full border-2 border-[#020617] bg-slate-800 overflow-hidden"
              >
                <img
                  src={`https://picsum.photos/seed/user${i}/100/100`}
                  alt="User"
                  referrerPolicy="no-referrer"
                />
              </div>
            ))}
          </div>
          <p className="text-sm text-slate-500 font-mono tracking-widest uppercase">
            Joined by 100K+ Investors
          </p>
        </div>
      </div>

      {/* Right Side: Form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-16 relative">
        {/* Floating Cards - Relative to Right Container */}
        <motion.div
          animate={{ y: [0, -15, 0], rotate: [0, 1, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[10%] left-[5%] w-40 p-3 rounded-xl bg-gradient-to-br from-cyan-900/40 to-blue-900/40 border border-cyan-500/20 backdrop-blur-md shadow-xl z-0"
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-medium text-white">Portfolio</span>
          </div>
          <div className="text-lg font-bold text-white">$98.2K</div>
          <div className="mt-2 h-8 flex items-end gap-1">
            {[25, 55, 40, 70].map((h, i) => (
              <div key={i} className="flex-1 bg-cyan-500/40 rounded-t" style={{ height: `${h}%` }} />
            ))}
          </div>
        </motion.div>

        <motion.div
          animate={{ y: [0, 20, 0], rotate: [0, -1, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-[8%] right-[8%] w-36 p-3 rounded-xl bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-500/20 backdrop-blur-md shadow-xl z-0"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            <span className="text-xs font-medium text-white">AI Insight</span>
          </div>
          <p className="text-[10px] text-slate-300">Diversification alert</p>
        </motion.div>

        <motion.div
          animate={{ y: [0, -10, 0], x: [0, 5, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-[10%] right-[5%] w-32 p-3 rounded-xl bg-gradient-to-br from-emerald-900/30 to-cyan-900/30 border border-emerald-500/20 backdrop-blur-md shadow-xl z-0"
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-[10px] font-bold text-emerald-400">$</div>
            <span className="text-xs font-medium text-white">Goal</span>
          </div>
          <div className="w-full bg-slate-700/50 rounded-full h-1.5 mb-1">
            <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '65%' }} />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>$650K</span>
            <span>65%</span>
          </div>
        </motion.div>

        <Link
          href="/"
          className="lg:hidden absolute top-8 left-8 flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Home</span>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.02, y: -5 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="w-full max-w-md relative z-20 bg-gradient-to-br from-cyan-900/30 to-blue-900/30 border border-cyan-500/20 ring-1 ring-cyan-400/30 backdrop-blur-xl rounded-2xl p-8 shadow-2xl hover:shadow-cyan-500/30 hover:ring-cyan-400/50 transition-all duration-300"
        >
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">
              Create Account
            </h1>
            <p className="text-slate-400 font-light">
              Start your financial journey today.
            </p>
          </div>

          <form onSubmit={handleSignup} className="space-y-5">
            <div className="grid md:grid-cols-2 gap-5">
              {/* Username - Full Width */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">
                  Username
                </label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-cyan-500/20 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-cyan-500/50 focus:bg-white/[0.08] transition-all"
                      placeholder="johndoe"
                    />
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">
                  Email
                </label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-cyan-500/20 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-cyan-500/50 focus:bg-white/[0.08] transition-all"
                      placeholder="name@example.com"
                    />
                  </div>
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-indigo-500/20 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.08] transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">
                  Confirm Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-indigo-500/20 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.08] transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="text-rose-400 text-xs font-mono bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl"
              >
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={registerMutation.isPending || loginMutation.isPending}
              className="w-full py-5 bg-white text-slate-900 rounded-2xl font-bold shadow-2xl shadow-white/5 flex items-center justify-center gap-3 hover:bg-cyan-400 hover:text-white transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {registerMutation.isPending || loginMutation.isPending ? (
                "CREATING ACCOUNT..."
              ) : (
                <>
                  <UserPlus className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  CREATE ACCOUNT
                </>
              )}
            </button>
          </form>

          <div className="relative my-10">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-[0.3em]">
              <span className="bg-[#020617] px-4 text-slate-500">Or</span>
            </div>
          </div>

          <button className="w-full py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-3 group">
            <Chrome className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
            <span className="text-sm">Continue with Google</span>
          </button>

          <p className="mt-12 text-center text-slate-500 text-sm">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-white font-bold hover:text-cyan-400 transition-colors"
            >
              Sign In
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
