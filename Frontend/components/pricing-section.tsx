"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Star } from "lucide-react"

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "/month",
    description: "Perfect for getting started",
    features: [
      "Basic expense tracking",
      "Simple budgeting tools",
      "Monthly reports",
      "Mobile app access",
      "Email support",
    ],
    buttonText: "Get Started",
    buttonVariant: "outline" as const,
    popular: false,
  },
  {
    name: "Pro",
    price: "$9",
    period: "/month",
    description: "For serious money managers",
    features: [
      "Everything in Free",
      "AI financial insights",
      "Advanced analytics",
      "Goal tracking & forecasting",
      "Priority support",
      "Bank-level security",
      "Multi-device sync",
    ],
    buttonText: "Start Pro Trial",
    buttonVariant: "default" as const,
    popular: true,
  },
  {
    name: "Premium",
    price: "$19",
    period: "/month",
    description: "For financial power users",
    features: [
      "Everything in Pro",
      "Investment portfolio tracking",
      "Tax optimization tools",
      "Custom categories & tags",
      "Family sharing (up to 5 members)",
      "White-glove onboarding",
      "Dedicated account manager",
    ],
    buttonText: "Contact Sales",
    buttonVariant: "outline" as const,
    popular: false,
  },
]

export function PricingSection() {
  return (
    <section
      id="pricing"
      className="py-20 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-950"
    >
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6">Choose Your Plan</h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Start free and upgrade as your financial goals grow. All plans include our core features.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <Card
              key={index}
              className={`relative border-2 transition-all duration-300 hover:shadow-xl dark:bg-gray-800 ${
                plan.popular
                  ? "border-blue-500 shadow-lg scale-105"
                  : "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600"
              }`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
                  <Star className="w-3 h-3 mr-1" />
                  Most Popular
                </Badge>
              )}

              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl font-bold dark:text-white">{plan.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-5xl font-bold">{plan.price}</span>
                  <span className="text-gray-500 text-lg">{plan.period}</span>
                </div>
                <CardDescription className="mt-2 text-base dark:text-gray-300">{plan.description}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center">
                      <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                    </div>
                  ))}
                </div>

                <Button
                  className={`w-full h-12 font-semibold ${
                    plan.popular
                      ? "bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white"
                      : ""
                  }`}
                  variant={plan.buttonVariant}
                >
                  {plan.buttonText}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-600 dark:text-gray-400 mb-4">All plans include a 30-day money-back guarantee</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Need a custom solution?{" "}
            <a href="#contact" className="text-blue-600 dark:text-blue-400 hover:underline">
              Contact our sales team
            </a>
          </p>
        </div>
      </div>
    </section>
  )
}
