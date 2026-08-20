"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Menu, ArrowLeft, Sparkles } from "lucide-react"
import { useDashboardSidebar } from "@/components/dashboard/sidebar-context"
import { AIInsightsPanel } from "@/shared/components/ai-insights"
import { insightsApi, type AIInsight } from "@/api/services"
import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"

export default function AIInsightsPage() {
  const router = useRouter()
  const { openSidebar } = useDashboardSidebar()
  const [insights, setInsights] = useState<AIInsight[]>([])
  const [loading, setLoading] = useState(true)

  const loadInsights = useCallback(async () => {
    setLoading(true)
    try {
      const data = await insightsApi.list()
      const results = data.results ?? []
      if (results.length === 0) {
        const generated = await insightsApi.generate()
        setInsights(generated.results ?? [])
      } else {
        setInsights(results)
      }
    } catch {
      toast.error("Failed to load insights")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadInsights()
  }, [loadInsights])

  const uiInsights = insights.map((insight) => ({
    id: insight.id,
    type: (insight.kind === 'recurring' ? 'alert' : insight.kind) as
      'spending' | 'saving' | 'investment' | 'alert' | 'goal',
    title: insight.title,
    description: insight.description,
    impact: insight.severity,
    metadata: insight.metadata,
    action: insight.action_url
      ? {
          label: "View",
          onClick: () => {
            const url = insight.action_url!.startsWith("/")
              ? `/dashboard${insight.action_url}`
              : insight.action_url!
            router.push(url)
          },
        }
      : undefined,
  }))

  return (
    <div className="flex-1 min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/80 border-b border-border/50 px-6 py-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={openSidebar}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Insights</h1>
              <p className="text-sm text-muted-foreground">
                All your smart recommendations and financial insights
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="p-4 sm:p-6 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>All Insights</CardTitle>
                <CardDescription>
                  {insights.length} insight{insights.length !== 1 ? 's' : ''} found
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="p-4 rounded-xl bg-muted/50 animate-pulse">
                    <div className="flex gap-3">
                      <div className="h-10 w-10 rounded-lg bg-muted" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-1/3 rounded bg-muted" />
                        <div className="h-3 w-full rounded bg-muted" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <AIInsightsPanel insights={uiInsights} />
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
