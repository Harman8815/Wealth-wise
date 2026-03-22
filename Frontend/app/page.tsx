import { Navbar } from "@/components/navbar"
import { HeroSection } from "@/components/hero-section"
import { FeaturesSection } from "@/components/features-section"
import { GallerySection } from "@/components/gallery-section"
import { TestimonialsSection } from "@/components/testimonials-section"
import { ContactSection } from "@/components/contact-section"
import { NewsletterSection } from "@/components/newsletter-section"
import { FinanceTipsSection } from "@/components/finance-tips-section"
import { PricingSection } from "@/components/pricing-section"
import { Footer } from "@/components/footer"

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <GallerySection />
      <TestimonialsSection />
      <PricingSection />
      <FinanceTipsSection />
      <ContactSection />
      <NewsletterSection />
      <Footer />
    </div>
  )
}
