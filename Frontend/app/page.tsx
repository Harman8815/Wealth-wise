"use client";

import {
  CursorEffect,
  DynamicBackground,
  Navbar,
  HeroSection,
  AIInsightsSection,
  FeaturesSection,
  CTASection,
  Footer,
} from "@/components/landing";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#020617] selection:bg-indigo-500/30">
      <CursorEffect />
      <DynamicBackground />
      <Navbar />
      <main>
        <HeroSection />
        <AIInsightsSection />
        <FeaturesSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
