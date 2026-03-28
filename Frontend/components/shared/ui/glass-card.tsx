"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * GlassCard Component
 * Glassmorphism card with hover glow effect and entrance animation
 * 
 * @param children - Card content
 * @param className - Additional CSS classes
 * @param delay - Animation delay in seconds
 * @param glow - Whether to show glow effect on hover
 * 
 * @example
 * <GlassCard glow delay={0.2} className="p-8">
 *   <h3>Card Title</h3>
 * </GlassCard>
 */
interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  glow?: boolean;
}

export function GlassCard({ children, className = "", delay = 0, glow = false }: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "glass-card rounded-3xl p-6 group transition-all duration-500",
        glow && "hover:shadow-[0_0_40px_rgba(99,102,241,0.15)]",
        className
      )}
    >
      {children}
    </motion.div>
  );
}
