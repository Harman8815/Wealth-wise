"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Star, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

const testimonials = [
  {
    id: 1,
    name: "Sarah Johnson",
    role: "Marketing Manager",
    company: "TechCorp",
    image: "/placeholder.svg?height=80&width=80",
    rating: 5,
    quote:
      "WealthWise completely transformed how I manage my finances. The AI insights helped me save over $3,000 in just four months. It's like having a personal financial advisor in my pocket!",
  },
  {
    id: 2,
    name: "Michael Chen",
    role: "Software Engineer",
    company: "StartupXYZ",
    image: "/placeholder.svg?height=80&width=80",
    rating: 5,
    quote:
      "The real-time tracking feature is incredible. I finally have complete visibility into my spending patterns, and the automated categorization saves me hours every month.",
  },
  {
    id: 3,
    name: "Emily Rodriguez",
    role: "Small Business Owner",
    company: "Creative Studio",
    image: "/placeholder.svg?height=80&width=80",
    rating: 5,
    quote:
      "As a business owner, managing personal and business finances was chaotic. WealthWise's family sharing and advanced analytics brought clarity to my financial life.",
  },
  {
    id: 4,
    name: "David Park",
    role: "Financial Analyst",
    company: "Investment Firm",
    image: "/placeholder.svg?height=80&width=80",
    rating: 5,
    quote:
      "Even as a finance professional, I was impressed by the depth of insights WealthWise provides. The investment tracking and goal-setting features are top-notch.",
  },
]

export function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0)

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length)
  }

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }

  return (
    <section id="testimonials" className="py-20 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">Loved by Thousands of Users</h2>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            Join our community of satisfied users who've transformed their financial lives
          </p>
        </div>

        {/* Carousel */}
        <div className="relative max-w-4xl mx-auto">
          <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
            <CardContent className="p-8 lg:p-12">
              <div className="text-center">
                {/* Stars */}
                <div className="flex justify-center mb-6">
                  {[...Array(testimonials[currentIndex].rating)].map((_, i) => (
                    <Star key={i} className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                {/* Quote */}
                <blockquote className="text-xl lg:text-2xl font-light mb-8 leading-relaxed">
                  "{testimonials[currentIndex].quote}"
                </blockquote>

                {/* Author */}
                <div className="flex items-center justify-center space-x-4">
                  <img
                    src={testimonials[currentIndex].image || "/placeholder.svg"}
                    alt={testimonials[currentIndex].name}
                    className="w-16 h-16 rounded-full border-2 border-white/30"
                  />
                  <div className="text-left">
                    <div className="font-semibold text-lg">{testimonials[currentIndex].name}</div>
                    <div className="text-blue-200">
                      {testimonials[currentIndex].role} at {testimonials[currentIndex].company}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-center items-center mt-8 space-x-4">
            <Button variant="ghost" size="icon" onClick={prevTestimonial} className="text-white hover:bg-white/20">
              <ChevronLeft className="w-6 h-6" />
            </Button>

            <div className="flex space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    index === currentIndex ? "bg-white" : "bg-white/40"
                  }`}
                />
              ))}
            </div>

            <Button variant="ghost" size="icon" onClick={nextTestimonial} className="text-white hover:bg-white/20">
              <ChevronRight className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
