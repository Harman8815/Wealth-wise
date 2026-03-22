"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PiggyBank, TrendingUp, Brain, Shield, Zap, Users } from "lucide-react"

const features = [
  {
    icon: PiggyBank,
    title: "Smart Budget Planning",
    description:
      "AI-powered budgeting that adapts to your spending patterns and helps you reach financial goals faster.",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: TrendingUp,
    title: "Real-Time Tracking",
    description: "Monitor expenses instantly with automatic categorization and smart notifications for better control.",
    gradient: "from-green-500 to-emerald-500",
  },
  {
    icon: Brain,
    title: "AI Financial Insights",
    description: "Get personalized recommendations and predictive analytics to optimize your financial decisions.",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    icon: Shield,
    title: "Secure Cloud Backup",
    description: "Bank-level encryption ensures your financial data is protected and synchronized across all devices.",
    gradient: "from-orange-500 to-red-500",
  },
  {
    icon: Zap,
    title: "Instant Alerts",
    description: "Stay informed with real-time notifications about spending limits, bill reminders, and opportunities.",
    gradient: "from-yellow-500 to-orange-500",
  },
  {
    icon: Users,
    title: "Family Sharing",
    description: "Collaborate on budgets and track shared expenses with family members in a secure environment.",
    gradient: "from-indigo-500 to-purple-500",
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Powerful Features for
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {" "}
              Smart Finance
            </span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Everything you need to take control of your financial future, powered by cutting-edge technology
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="group border-0 shadow-lg hover:shadow-2xl transition-all duration-500 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm hover:-translate-y-2"
            >
              <CardHeader className="text-center pb-4">
                <div
                  className={`w-16 h-16 bg-gradient-to-r ${feature.gradient} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}
                >
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl font-semibold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors dark:text-white">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
