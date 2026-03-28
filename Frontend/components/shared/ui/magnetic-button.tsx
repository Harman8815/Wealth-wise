"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { cn } from "@/lib/utils";

/**
 * MagneticButton Component
 * Button with magnetic hover effect using GSAP
 * The button follows the cursor with elastic movement
 * 
 * @param children - Button content
 * @param className - Additional CSS classes
 * @param onClick - Click handler
 * 
 * @example
 * <MagneticButton 
 *   className="px-6 py-3 bg-indigo-600 text-white rounded-lg"
 *   onClick={() => console.log('clicked')}
 * >
 *   Click Me
 * </MagneticButton>
 */
interface MagneticButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function MagneticButton({ children, className, onClick }: MagneticButtonProps) {
  const btnRef = useRef<HTMLButtonElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!btnRef.current) return;
    const { clientX, clientY } = e;
    const { left, top, width, height } = btnRef.current.getBoundingClientRect();
    const x = clientX - (left + width / 2);
    const y = clientY - (top + height / 2);

    gsap.to(btnRef.current, {
      x: x * 0.3,
      y: y * 0.3,
      duration: 0.3,
      ease: "power2.out",
    });
  };

  const handleMouseLeave = () => {
    gsap.to(btnRef.current, {
      x: 0,
      y: 0,
      duration: 0.5,
      ease: "elastic.out(1, 0.3)",
    });
  };

  return (
    <button
      ref={btnRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className={cn("relative z-10", className)}
    >
      {children}
    </button>
  );
}
