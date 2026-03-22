"use client"

import { useState } from "react"

const screenshots = [
  { id: 1, title: "Dashboard Overview", category: "dashboard" },
  { id: 2, title: "Budget Planning", category: "budgeting" },
  { id: 3, title: "Expense Tracking", category: "tracking" },
  { id: 4, title: "Analytics Report", category: "analytics" },
  { id: 5, title: "Goal Setting", category: "goals" },
  { id: 6, title: "Investment Portfolio", category: "investments" },
]

const categories = ["all", "dashboard", "budgeting", "tracking", "analytics", "goals", "investments"]

export function GallerySection() {
  const [activeCategory, setActiveCategory] = useState("all")

  const filteredScreenshots =
    activeCategory === "all" ? screenshots : screenshots.filter((item) => item.category === activeCategory)

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-950">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            See WealthWise in Action
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Explore our intuitive interface and powerful features through these app screenshots
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                activeCategory === category
                  ? "bg-blue-600 text-white shadow-lg"
                  : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
              }`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>

        {/* Gallery Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredScreenshots.map((screenshot, index) => (
            <div
              key={screenshot.id}
              className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500"
            >
              <img
                src={`/placeholder.svg?height=400&width=300&text=${screenshot.title}`}
                alt={screenshot.title}
                className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-4 left-4 text-white">
                  <h3 className="text-lg font-semibold">{screenshot.title}</h3>
                  <p className="text-sm text-gray-200 capitalize">{screenshot.category}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
