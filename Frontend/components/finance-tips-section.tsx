"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookOpen, TrendingUp, Calculator, Target, ArrowRight } from "lucide-react"

const tips = [
  {
    icon: Calculator,
    category: "Budgeting",
    title: "The 50/30/20 Rule Explained",
    description: "Learn how to allocate your income effectively: 50% needs, 30% wants, 20% savings and debt repayment.",
    readTime: "3 min read",
    color: "bg-blue-100 text-blue-700",
  },
  {
    icon: TrendingUp,
    category: "Investing",
    title: "Dollar-Cost Averaging Strategy",
    description: "Reduce investment risk by investing fixed amounts regularly, regardless of market conditions.",
    readTime: "5 min read",
    color: "bg-green-100 text-green-700",
  },
  {
    icon: Target,
    category: "Goals",
    title: "SMART Financial Goals",
    description: "Set Specific, Measurable, Achievable, Relevant, and Time-bound financial objectives for success.",
    readTime: "4 min read",
    color: "bg-purple-100 text-purple-700",
  },
  {
    icon: BookOpen,
    category: "Education",
    title: "Emergency Fund Essentials",
    description: "Why you need 3-6 months of expenses saved and how to build your emergency fund systematically.",
    readTime: "6 min read",
    color: "bg-orange-100 text-orange-700",
  },
]

export function FinanceTipsSection() {
  return (
    <section className="py-20 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6">Financial Education Hub</h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Expand your financial knowledge with our curated tips, strategies, and insights from industry experts
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {tips.map((tip, index) => (
            <Card
              key={index}
              className="group border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 dark:bg-gray-800"
            >
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${tip.color}`}>
                    <tip.icon className="w-6 h-6" />
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {tip.readTime}
                  </Badge>
                </div>
                <Badge variant="outline" className="w-fit mb-2">
                  {tip.category}
                </Badge>
                <CardTitle className="text-lg font-semibold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors dark:text-white">
                  {tip.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                  {tip.description}
                </CardDescription>
                <Button
                  variant="ghost"
                  className="p-0 h-auto text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  Read More
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button size="lg" variant="outline" className="border-2 border-blue-200 hover:bg-blue-50 px-8 bg-transparent">
            View All Articles
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </section>
  )
}
