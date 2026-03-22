"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Mail, Shield } from "lucide-react"

export function NewsletterSection() {
  const [email, setEmail] = useState("")
  const [isSubscribed, setIsSubscribed] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle newsletter subscription
    setIsSubscribed(true)
    setEmail("")
  }

  return (
    <section className="relative py-20 overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <img
          src="/placeholder.svg?height=400&width=1200&text=Newsletter+Background"
          alt="Newsletter background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 to-indigo-900/90"></div>
      </div>

      <div className="relative container mx-auto px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
            <Mail className="w-8 h-8 text-white" />
          </div>

          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">Stay Updated with Financial Tips</h2>
          <p className="text-xl text-blue-100 mb-8 leading-relaxed">
            Get weekly insights, market updates, and exclusive tips to boost your financial knowledge. Join 25,000+
            subscribers who trust our expertise.
          </p>

          {!isSubscribed ? (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 bg-white/10 border-white/30 text-white placeholder:text-white/70 backdrop-blur-sm"
                required
              />
              <Button type="submit" className="h-12 bg-white text-blue-600 hover:bg-blue-50 font-semibold px-8">
                Subscribe
              </Button>
            </form>
          ) : (
            <div className="bg-green-500/20 border border-green-400/30 rounded-lg p-4 max-w-md mx-auto backdrop-blur-sm">
              <p className="text-green-100 font-medium">
                ✓ Thank you for subscribing! Check your email for confirmation.
              </p>
            </div>
          )}

          <div className="flex items-center justify-center mt-6 text-blue-200 text-sm">
            <Shield className="w-4 h-4 mr-2" />
            We never spam, unsubscribe anytime. Your privacy is protected.
          </div>
        </div>
      </div>
    </section>
  )
}
