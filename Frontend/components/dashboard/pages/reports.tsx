"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Menu,
  Download,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart as LucidePieChart,
  Calendar,
  BarChart3,
  Activity,
  MoreVertical,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  GitCompare,
  FileDown,
  ChevronLeft,
  ChevronRight,
  Settings2,
  Plus,
  Trash2,
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Pie,
  PieChart as RechartsPieChart,
  Cell,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts"
import { useDashboardSidebar } from "@/components/dashboard/sidebar-context"
import { useMonthlyStats, useTransactionsByCategory, useTransactionSummary } from "@/hooks"
import { apiClient } from "@/api/client"

const COLORS = ["#ef4444", "#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ec4899", "#06b6d4", "#f97316"]

const DEFAULT_CATEGORIES = [
  "Food & Dining",
  "Transportation",
  "Shopping",
  "Entertainment",
  "Bills & Utilities",
  "Healthcare",
  "Education",
  "Home & Maintenance",
]

type TimeView = "daily" | "monthly" | "yearly"
type TrendChartType = "bar" | "line"
type RadarView = "monthly" | "yearly"

export function ReportsPage() {
  const { openSidebar } = useDashboardSidebar()
  const [timeView, setTimeView] = useState<TimeView>("monthly")
  const [trendChartType, setTrendChartType] = useState<TrendChartType>("bar")
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [compareWithPrevious, setCompareWithPrevious] = useState(false)
  const [showGrid, setShowGrid] = useState(true)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [radarView, setRadarView] = useState<RadarView>("monthly")
  const [isManageCategoriesOpen, setIsManageCategoriesOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const { data: monthlyStats, isLoading: isLoadingMonthly } = useMonthlyStats(24)
  const { data: categoryData, isLoading: isLoadingCategory } = useTransactionsByCategory()
  const { data: summary, isLoading: isLoadingSummary } = useTransactionSummary()

  const monthlyData = monthlyStats?.map((stat) => ({
    month: stat.month?.slice(5) || "",
    year: stat.month?.slice(0, 4) || "",
    income: stat.income,
    expenses: stat.expense,
    savings: stat.net,
  })) || []

  const dailyData = monthlyStats?.slice(-1).map((stat) => ({
    day: stat.month?.slice(5) || "",
    income: stat.income,
    expenses: stat.expense,
    savings: stat.net,
  })) || []

  const yearlyData = useMemo(() => {
    const yearMap = new Map<string, { year: string; income: number; expenses: number; savings: number }>()
    monthlyStats?.forEach((stat) => {
      const year = stat.month?.slice(0, 4) || ""
      if (!year) return
      const existing = yearMap.get(year)
      if (existing) {
        existing.income += stat.income
        existing.expenses += stat.expense
        existing.savings += stat.net
      } else {
        yearMap.set(year, { year, income: stat.income, expenses: stat.expense, savings: stat.net })
      }
    })
    return Array.from(yearMap.values())
  }, [monthlyStats]) || []

  const categoryChartData = useMemo(() => {
    const allCategories = categoryData?.map((cat) => ({
      name: cat.category,
      value: cat.total,
      color: COLORS[DEFAULT_CATEGORIES.indexOf(cat.category) % COLORS.length] || "#94a3b8",
    })) || []
    if (selectedCategories.length === 0) return allCategories
    return allCategories.filter((item) => selectedCategories.includes(item.name))
  }, [categoryData, selectedCategories])

  const totalCategoryAmount = categoryChartData.reduce((sum, item) => sum + item.value, 0)

  const radarData = useMemo(() => {
    if (radarView === "yearly") {
      return categoryData?.map((cat) => ({
        category: cat.category,
        budget: cat.total * 12,
        spent: cat.total * 12,
        remaining: cat.total * 12 * 0.5,
      })) || []
    }
    return categoryData?.map((cat) => ({
      category: cat.category,
      budget: cat.total * 1.5,
      spent: cat.total,
      remaining: cat.total * 0.5,
    })) || []
  }, [categoryData, radarView])

  const avgIncome = monthlyStats?.length
    ? monthlyStats.reduce((sum, m) => sum + m.income, 0) / monthlyStats.length
    : 0
  const avgExpense = monthlyStats?.length
    ? monthlyStats.reduce((sum, m) => sum + m.expense, 0) / monthlyStats.length
    : 0

  if (isLoadingMonthly || isLoadingCategory || isLoadingSummary) {
    return (
      <div className="flex-1 min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="h-32">
              <Skeleton className="h-full" />
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Card className="lg:col-span-7 h-96">
            <Skeleton className="h-full" />
          </Card>
          <Card className="lg:col-span-5 h-96">
            <Skeleton className="h-full" />
          </Card>
        </div>
        <Card className="h-80">
          <Skeleton className="h-full" />
        </Card>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Card className="lg:col-span-5 h-80">
            <Skeleton className="h-full" />
          </Card>
          <Card className="lg:col-span-7 h-80">
            <Skeleton className="h-full" />
          </Card>
        </div>
      </div>
    )
  }

  const activeTabData =
    timeView === "daily" ? dailyData : timeView === "yearly" ? yearlyData : monthlyData
  const activeXKey = timeView === "daily" ? "day" : timeView === "yearly" ? "year" : "month"
  const activeTabDataAny = activeTabData as any[]
  const radarLabelKey = radarView === "yearly" ? "year" : "category"

  const handleDownloadCSV = async () => {
    setIsExporting(true)
    try {
      const response = await apiClient.get("/transactions/export_csv/", {
        responseType: "blob",
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", "transactions.csv")
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Failed to download CSV", error)
    } finally {
      setIsExporting(false)
    }
  }

  const handleDownloadPDF = async () => {
    setIsExporting(true)
    try {
      const response = await apiClient.get("/reports/export_pdf/", {
        responseType: "blob",
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", "reports.pdf")
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Failed to download PDF", error)
    } finally {
      setIsExporting(false)
    }
  }

  const handleApplyFilters = async () => {
    try {
      const response = await apiClient.post("/reports/filter/", {
        start_date: undefined,
        end_date: undefined,
        categories: selectedCategories,
        time_view: timeView,
      })
      console.log("Filtered reports data", response.data)
    } catch (error) {
      console.error("Failed to apply filters", error)
    }
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-xl border border-border bg-background/95 backdrop-blur-sm p-3 shadow-lg">
          <p className="mb-2 text-sm font-semibold text-foreground">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground">{entry.name}:</span>
              <span className="font-semibold text-foreground">
                ₹{Number(entry.value).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0]
      const percentage = totalCategoryAmount > 0 ? ((item.value || 0) / totalCategoryAmount) * 100 : 0
      return (
        <div className="rounded-xl border border-border bg-background/95 backdrop-blur-sm p-3 shadow-lg">
          <p className="text-sm font-semibold text-foreground">{item.name}</p>
          <p className="text-sm text-muted-foreground">
            ₹{Number(item.value).toLocaleString()} ({percentage.toFixed(1)}%)
          </p>
        </div>
      )
    }
    return null
  }

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    )
  }

  return (
    <div className="flex-1 min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/80 border-b border-border/50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={openSidebar}>
              <Menu className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports & Insights</h1>
              <p className="text-gray-600 dark:text-gray-400">Analyze your financial patterns and trends</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Trend Filters</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="flex items-center justify-between">
                    <Label>Compare with previous period</Label>
                    <Switch checked={compareWithPrevious} onCheckedChange={setCompareWithPrevious} />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <Label>Show grid lines</Label>
                    <Switch checked={showGrid} onCheckedChange={setShowGrid} />
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Label>Date Range</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="justify-start"
                        onClick={handleApplyFilters}
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        This Month
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="justify-start"
                        onClick={handleApplyFilters}
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        Last 3 Months
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="justify-start"
                        onClick={handleApplyFilters}
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        This Year
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="justify-start"
                        onClick={handleApplyFilters}
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        Custom Range
                      </Button>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </header>

      <main className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Income</CardTitle>
              <DollarSign className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{Math.round(avgIncome).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Average monthly</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{Math.round(avgExpense).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Average monthly</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Net Savings</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{Math.round(avgIncome - avgExpense).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Per month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Savings Rate</CardTitle>
              <LucidePieChart className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {avgIncome > 0 ? Math.round(((avgIncome - avgExpense) / avgIncome) * 100) : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                {avgIncome > 0 && ((avgIncome - avgExpense) / avgIncome) > 0.3 ? "Excellent" : "Keep improving"}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Income & Expense Trend</CardTitle>
                    <CardDescription>
                      {timeView === "daily"
                        ? "Daily spending pattern"
                        : timeView === "monthly"
                        ? "Monthly comparison trend"
                        : "Yearly comparison trend"}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex rounded-lg border border-border p-1">
                      <Button
                        variant={timeView === "daily" ? "secondary" : "ghost"}
                        size="sm"
                        className="h-7 px-3 text-xs"
                        onClick={() => setTimeView("daily")}
                      >
                        <Activity className="w-3 h-3 mr-1" />
                        Daily
                      </Button>
                      <Button
                        variant={timeView === "monthly" ? "secondary" : "ghost"}
                        size="sm"
                        className="h-7 px-3 text-xs"
                        onClick={() => setTimeView("monthly")}
                      >
                        <Calendar className="w-3 h-3 mr-1" />
                        Monthly
                      </Button>
                      <Button
                        variant={timeView === "yearly" ? "secondary" : "ghost"}
                        size="sm"
                        className="h-7 px-3 text-xs"
                        onClick={() => setTimeView("yearly")}
                      >
                        <BarChart3 className="w-3 h-3 mr-1" />
                        Yearly
                      </Button>
                    </div>
                    <div className="flex rounded-lg border border-border p-1">
                      <Button
                        variant={trendChartType === "bar" ? "secondary" : "ghost"}
                        size="sm"
                        className="h-7 px-2.5"
                        onClick={() => setTrendChartType("bar")}
                      >
                        <BarChart3 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant={trendChartType === "line" ? "secondary" : "ghost"}
                        size="sm"
                        className="h-7 px-2.5"
                        onClick={() => setTrendChartType("line")}
                      >
                        <Activity className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Trend Options</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label>Filter by Category</Label>
                            <div className="grid grid-cols-2 gap-2">
                              {DEFAULT_CATEGORIES.map((cat) => (
                                <div key={cat} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`cat-${cat}`}
                                    checked={selectedCategories.includes(cat)}
                                    onCheckedChange={() => toggleCategory(cat)}
                                  />
                                  <label
                                    htmlFor={`cat-${cat}`}
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                  >
                                    {cat}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>
                          <Separator />
                          <Button
                            variant="outline"
                            className="w-full justify-start"
                            onClick={handleApplyFilters}
                          >
                            <GitCompare className="w-4 h-4 mr-2" />
                            Apply Filters
                          </Button>
                          <Button variant="outline" className="w-full justify-start" onClick={handleDownloadCSV}>
                            <FileDown className="w-4 h-4 mr-2" />
                            Export as CSV
                          </Button>
                          <Button variant="outline" className="w-full justify-start" onClick={handleDownloadPDF}>
                            <Download className="w-4 h-4 mr-2" />
                            Export as PDF
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={340}>
                  {trendChartType === "bar" ? (
                    <BarChart data={activeTabDataAny} barGap={4}>
                      {showGrid && (
                        <CartesianGrid stroke="currentColor" className="text-muted-foreground/20" vertical={false} />
                      )}
                      <XAxis
                        dataKey={activeXKey}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: "currentColor" }}
                        className="text-muted-foreground"
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: "currentColor" }}
                        className="text-muted-foreground"
                        tickFormatter={(value: any) => `₹${(value / 1000).toFixed(0)}k`}
                      />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: "currentColor", className: "text-muted-foreground/5" }} />
                      <Bar dataKey="income" fill="#10b981" name="Income" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="expenses" fill="#ef4444" name="Expenses" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  ) : (
                    <LineChart data={activeTabDataAny}>
                      {showGrid && (
                        <CartesianGrid stroke="currentColor" className="text-muted-foreground/20" vertical={false} />
                      )}
                      <XAxis
                        dataKey={activeXKey}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: "currentColor" }}
                        className="text-muted-foreground"
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: "currentColor" }}
                        className="text-muted-foreground"
                        tickFormatter={(value: any) => `₹${(value / 1000).toFixed(0)}k`}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Line
                        type="monotone"
                        dataKey="income"
                        stroke="#10b981"
                        strokeWidth={3}
                        name="Income"
                        dot={{ r: 4, strokeWidth: 2, fill: "#10b981" }}
                        activeDot={{ r: 6, strokeWidth: 2, fill: "#10b981" }}
                      />
                      <Line
                        type="monotone"
                        dataKey="expenses"
                        stroke="#ef4444"
                        strokeWidth={3}
                        name="Expenses"
                        dot={{ r: 4, strokeWidth: 2, fill: "#ef4444" }}
                        activeDot={{ r: 6, strokeWidth: 2, fill: "#ef4444" }}
                      />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-5">
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold">Expense Breakdown</CardTitle>
                    <CardDescription>Distribution by category</CardDescription>
                  </div>
                  <div className="flex items-center gap-1">
                    <Dialog open={isManageCategoriesOpen} onOpenChange={setIsManageCategoriesOpen}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Settings2 className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Manage Categories</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-3 py-4">
                          {DEFAULT_CATEGORIES.map((cat) => (
                            <div key={cat} className="flex items-center justify-between">
                              <span className="text-sm">{cat}</span>
                              <div className="flex items-center gap-2">
                                {!selectedCategories.includes(cat) && categoryChartData.some((c) => c.name === cat) && (
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleCategory(cat)}>
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                )}
                                {selectedCategories.includes(cat) && (
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleCategory(cat)}>
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-xs"
                      onClick={() => setIsManageCategoriesOpen(true)}
                    >
                      Manage
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleDownloadPDF}>
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="w-full md:w-1/2">
                    <ResponsiveContainer width="100%" height={260}>
                      <RechartsPieChart>
                        <Pie
                          data={categoryChartData}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          innerRadius={50}
                          fill="#8884d8"
                          dataKey="value"
                          stroke="none"
                        >
                          {categoryChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<PieTooltip />} />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="w-full md:w-1/2 space-y-2 max-h-[260px] overflow-y-auto pr-1">
                    {categoryChartData.map((item, index) => {
                      const percentage = totalCategoryAmount > 0 ? (item.value / totalCategoryAmount) * 100 : 0
                      return (
                        <div key={index} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <span
                                className="h-2.5 w-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: item.color }}
                              />
                              <span className="text-foreground truncate">{item.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">
                                ₹{item.value.toLocaleString()}
                              </span>
                              <span className="text-xs text-muted-foreground w-10 text-right">
                                {percentage.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${Math.min(percentage, 100)}%`,
                                backgroundColor: item.color,
                              }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Card className="lg:col-span-5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Budget Distribution Radar</CardTitle>
                  <CardDescription>Budgeted vs spent across categories</CardDescription>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant={radarView === "monthly" ? "secondary" : "ghost"}
                    size="sm"
                    className="h-7 px-2"
                    onClick={() => setRadarView("monthly")}
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    Monthly
                  </Button>
                  <Button
                    variant={radarView === "yearly" ? "secondary" : "ghost"}
                    size="sm"
                    className="h-7 px-2"
                    onClick={() => setRadarView("yearly")}
                  >
                    Yearly
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="currentColor" className="text-muted-foreground/20" />
                  <PolarAngleAxis
                    dataKey="category"
                    tick={{ fontSize: 11, fill: "currentColor" }}
                    className="text-muted-foreground"
                  />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, "dataMax"]}
                    tick={false}
                    className="text-muted-foreground"
                  />
                  <Radar
                    name="Budgeted"
                    dataKey="budget"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.25}
                    strokeWidth={2}
                  />
                  <Radar
                    name="Spent"
                    dataKey="spent"
                    stroke="#ef4444"
                    fill="#ef4444"
                    fillOpacity={0.25}
                    strokeWidth={2}
                  />
                  <Tooltip
                    formatter={(value: any, name: any) => [
                      `₹${Number(value).toLocaleString()}`,
                      name,
                    ]}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="lg:col-span-7">
            <CardHeader>
              <CardTitle>Financial Health Score</CardTitle>
              <CardDescription>Based on your spending and saving patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-6xl font-bold text-green-600 mb-2">8.5</div>
                  <div className="text-lg text-muted-foreground">Excellent</div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Savings Rate</span>
                    <span className="text-sm font-medium text-green-600">9/10</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Budget Adherence</span>
                    <span className="text-sm font-medium text-green-600">8/10</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Expense Control</span>
                    <span className="text-sm font-medium text-yellow-600">7/10</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Goal Progress</span>
                    <span className="text-sm font-medium text-green-600">9/10</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Key Insights</CardTitle>
            <CardDescription>AI-powered analysis of your financial behavior</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">Great Progress</h4>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Your savings rate is excellent. You are on track to meet your financial goals.
                </p>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Spending Pattern</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Food & Dining is your largest expense category. Consider meal planning to optimize costs.
                </p>
              </div>
              <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg border border-purple-200 dark:border-purple-800">
                <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-2">Recommendation</h4>
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  You could increase your emergency fund by redirecting 5% of entertainment spending.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
