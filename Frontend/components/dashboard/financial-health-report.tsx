"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  ShieldCheck,
  AlertTriangle,
  Lightbulb,
} from "lucide-react"
import { useFinancialHealthReport, useRecomputeHealth } from "@/hooks"
import { type HealthDimension } from "@/api/services"

function DimensionRow({ dim }: { dim: HealthDimension }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{dim.label}</span>
        <span className="text-muted-foreground">
          {Number(dim.normalized_score).toFixed(0)}/100
        </span>
      </div>
      <Progress value={Number(dim.normalized_score)} className="h-2" />
      <p className="text-xs text-muted-foreground">{dim.explanation}</p>
    </div>
  )
}

export function FinancialHealthReport() {
  const { data, isLoading, isError } = useFinancialHealthReport()
  const recompute = useRecomputeHealth()

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Financial Health Report</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-24 w-40" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (isError || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Financial Health Report</CardTitle>
          <CardDescription>We couldn&apos;t generate a report yet.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => recompute.mutate()} disabled={recompute.isPending}>
            <RefreshCw className={recompute.isPending ? "w-4 h-4 mr-2 animate-spin" : "w-4 h-4 mr-2"} />
            Generate report
          </Button>
        </CardContent>
      </Card>
    )
  }

  const { snapshot, recommendations, estimated_improvement, previous_score } = data
  const sortedDims = [...snapshot.dimensions].sort(
    (a, b) => Number(b.normalized_score) - Number(a.normalized_score)
  )

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Financial Health Report</CardTitle>
            <CardDescription>Explainable, weighted score computed from your financial data</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => recompute.mutate()} disabled={recompute.isPending}>
            <RefreshCw className={recompute.isPending ? "w-4 h-4 mr-2 animate-spin" : "w-4 h-4 mr-2"} />
            Recalculate
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col items-center justify-center">
              <div className="text-7xl font-bold text-foreground">{Number(snapshot.score).toFixed(1)}</div>
              <Badge variant="outline" className="mt-2">
                {snapshot.grade} · {snapshot.grade_label}
              </Badge>
              <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                {snapshot.trend === "up" ? (
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                ) : snapshot.trend === "down" ? (
                  <TrendingDown className="w-4 h-4 text-red-500" />
                ) : (
                  <Minus className="w-4 h-4" />
                )}
                {previous_score != null ? (
                  <span>vs {Number(previous_score).toFixed(1)}</span>
                ) : (
                  <span>First snapshot</span>
                )}
              </div>
            </div>

            <div className="md:col-span-2 space-y-3">
              <div>
                <p className="text-sm font-medium mb-2 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" /> Top strengths
                </p>
                {snapshot.strengths.length ? (
                  <div className="space-y-2">
                    {snapshot.strengths.map((s) => (
                      <div key={s.dimension} className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 p-2">
                        <p className="text-xs font-medium text-emerald-900 dark:text-emerald-100">
                          {s.label} · {Number(s.score).toFixed(0)}/100
                        </p>
                        <p className="text-xs text-emerald-700 dark:text-emerald-300">{s.explanation}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No strong areas identified yet.</p>
                )}
              </div>

              <div>
                <p className="text-sm font-medium mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" /> Highest impact risks
                </p>
                {snapshot.risks.length ? (
                  <div className="space-y-2">
                    {snapshot.risks.map((r) => (
                      <div key={r.dimension} className="rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 p-2">
                        <p className="text-xs font-medium text-red-900 dark:text-red-100">
                          {r.label} · {Number(r.score).toFixed(0)}/100
                        </p>
                        <p className="text-xs text-red-700 dark:text-red-300">{r.explanation}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No major risks detected.</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="breakdown">
        <TabsList>
          <TabsTrigger value="breakdown">Category breakdown</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="breakdown">
          <Card>
            <CardHeader>
              <CardTitle>Contribution by dimension</CardTitle>
              <CardDescription>
                Each dimension is weighted; the bar shows its normalized sub-score.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[420px] pr-3">
                <div className="space-y-4">
                  {sortedDims.map((dim) => (
                    <DimensionRow key={dim.key} dim={dim} />
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-amber-500" /> Actionable recommendations
              </CardTitle>
              <CardDescription>
                Following these could improve your score by up to{" "}
                <span className="font-semibold text-foreground">+{Number(estimated_improvement).toFixed(1)}</span> points.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recommendations.length ? (
                <div className="space-y-3">
                  {recommendations.map((rec) => (
                    <div key={rec.id} className="flex items-start gap-3 rounded-lg border p-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium">{rec.title}</p>
                          <Badge variant="outline" className="text-xs">
                            +{Number(rec.estimated_improvement).toFixed(0)} pts
                          </Badge>
                          <Badge
                            variant="secondary"
                            className={
                              rec.priority === "high"
                                ? "text-red-600"
                                : rec.priority === "medium"
                                ? "text-yellow-600"
                                : "text-muted-foreground"
                            }
                          >
                            {rec.priority}
                          </Badge>
                        </div>
                        {rec.detail && (
                          <p className="text-xs text-muted-foreground mt-1">{rec.detail}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No recommendations right now — your finances are in great shape.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
