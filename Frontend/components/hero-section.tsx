"use client"

import { Button } from "@/components/ui/button"
import { TrendingUp, DollarSign, PieChart, Target } from "lucide-react"

export function HeroSection() {
  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-950 dark:to-indigo-950"
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 animate-float">
          <div className="w-16 h-16 bg-blue-200/30 rounded-full flex items-center justify-center backdrop-blur-sm">
            <TrendingUp className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="absolute top-40 right-20 animate-float-delayed">
          <div className="w-12 h-12 bg-indigo-200/30 rounded-full flex items-center justify-center backdrop-blur-sm">
            <DollarSign className="w-6 h-6 text-indigo-600" />
          </div>
        </div>
        <div className="absolute bottom-40 left-20 animate-float">
          <div className="w-14 h-14 bg-purple-200/30 rounded-full flex items-center justify-center backdrop-blur-sm">
            <PieChart className="w-7 h-7 text-purple-600" />
          </div>
        </div>
        <div className="absolute bottom-20 right-10 animate-float-delayed">
          <div className="w-10 h-10 bg-green-200/30 rounded-full flex items-center justify-center backdrop-blur-sm">
            <Target className="w-5 h-5 text-green-600" />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="text-center lg:text-left">
            <h1 className="text-5xl lg:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                WealthWise
              </span>
            </h1>
            <p className="text-2xl lg:text-3xl text-gray-600 dark:text-gray-300 mb-6 font-light">
              Track. Analyze. Grow.
            </p>
            <p className="text-lg text-gray-500 dark:text-gray-400 mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Transform your financial future with intelligent tracking, AI-powered insights, and personalized
              recommendations that help you make smarter money decisions every day.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 text-lg shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Get Started Free
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-blue-200 hover:bg-blue-50 px-8 py-4 text-lg backdrop-blur-sm bg-white/50"
              >
                Learn More
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">50K+</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Active Users</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">$2M+</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Money Tracked</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">4.9★</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">User Rating</div>
              </div>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative">
            <div className="relative z-10">
              <img
                src="/placeholder.svg?height=600&width=500"
                alt="WealthWise Dashboard"
                className="w-full max-w-lg mx-auto rounded-2xl shadow-2xl"
              />
            </div>
            {/* Decorative elements */}
            <div className="absolute -top-4 -right-4 w-72 h-72 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full opacity-20 blur-3xl"></div>
            <div className="absolute -bottom-4 -left-4 w-72 h-72 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full opacity-20 blur-3xl"></div>
          </div>
        </div>
      </div>
    </section>
  )
}
