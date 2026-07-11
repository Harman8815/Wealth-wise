"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import {
  CalendarPlus,
  Trash2,
  Play,
  Plus,
  Loader2,
  Clock,
  AlertTriangle,
} from "lucide-react"
import { toast } from "sonner"
import { reportsApi, type ScheduledReport, type CreateScheduledReportInput, type ReportType, type ReportFrequency } from "@/api/services"

const REPORT_TYPES: { value: ReportType; label: string }[] = [
  { value: 'budget_summary', label: 'Budget Summary' },
  { value: 'monthly_report', label: 'Monthly Report' },
  { value: 'category_analysis', label: 'Category Analysis' },
  { value: 'spending_trends', label: 'Spending Trends' },
  { value: 'complete', label: 'Complete Financial Report' },
]

const FREQUENCIES: { value: ReportFrequency; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
]

export function ScheduledReportsPage() {
  const [reports, setReports] = useState<ScheduledReport[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formName, setFormName] = useState('')
  const [formReportType, setFormReportType] = useState<ReportType>('complete')
  const [formFrequency, setFormFrequency] = useState<ReportFrequency>('monthly')
  const [formEnabled, setFormEnabled] = useState(true)

  const loadReports = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await reportsApi.listScheduledReports()
      setReports(data.results || data)
    } catch (e) {
      setError('Failed to load scheduled reports')
      toast.error('Failed to load scheduled reports')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadReports()
  }, [loadReports])

  const handleCreate = async () => {
    if (!formName.trim()) {
      toast.error('Please enter a report name')
      return
    }
    setIsCreating(true)
    try {
      const payload: CreateScheduledReportInput = {
        name: formName.trim(),
        report_type: formReportType,
        frequency: formFrequency,
        enabled: formEnabled,
      }
      await reportsApi.createScheduledReport(payload)
      toast.success('Scheduled report created')
      setIsDialogOpen(false)
      setFormName('')
      setFormReportType('complete')
      setFormFrequency('monthly')
      setFormEnabled(true)
      loadReports()
    } catch (e) {
      toast.error('Failed to create scheduled report')
    } finally {
      setIsCreating(false)
    }
  }

  const handleToggle = async (id: string, enabled: boolean) => {
    try {
      await reportsApi.updateScheduledReport(id, { enabled })
      setReports((prev) => prev.map((r) => (r.id === id ? { ...r, enabled } : r)))
      toast.success(enabled ? 'Report enabled' : 'Report disabled')
    } catch (e) {
      toast.error('Failed to update scheduled report')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await reportsApi.deleteScheduledReport(id)
      setReports((prev) => prev.filter((r) => r.id !== id))
      toast.success('Scheduled report deleted')
    } catch (e) {
      toast.error('Failed to delete scheduled report')
    }
  }

  const handleTrigger = async (report: ScheduledReport) => {
    try {
      const pdfBytes = await reportsApi.triggerScheduledReport(report.id)
      const blob = new Blob([pdfBytes], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${report.name.replace(/\s+/g, '_')}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      toast.success('Report generated and downloaded')
    } catch (e) {
      toast.error('Failed to generate report')
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never'
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (isLoading) {
    return (
      <div className="flex-1 min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="h-48">
              <Skeleton className="h-full" />
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Scheduled Reports</h1>
          <p className="text-gray-600 dark:text-gray-400">Automate your financial reports delivery</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Schedule
            </Button>
          </DialogTrigger>
          <DialogContent aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle>Create Scheduled Report</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Report Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Weekly Expense Summary"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Report Type</Label>
                <Select value={formReportType} onValueChange={(v) => setFormReportType(v as ReportType)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {REPORT_TYPES.map((rt) => (
                      <SelectItem key={rt.value} value={rt.value}>
                        {rt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Frequency</Label>
                <Select value={formFrequency} onValueChange={(v) => setFormFrequency(v as ReportFrequency)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    {FREQUENCIES.map((f) => (
                      <SelectItem key={f.value} value={f.value}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="enabled">Enabled</Label>
                <Switch id="enabled" checked={formEnabled} onCheckedChange={setFormEnabled} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isCreating}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={isCreating}>
                {isCreating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create Schedule
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      {error && (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
          <CardContent className="p-4 flex items-center gap-2 text-red-700 dark:text-red-300">
            <AlertTriangle className="w-5 h-5" />
            <span>{error}</span>
          </CardContent>
        </Card>
      )}

      {reports.length === 0 && !isLoading ? (
        <Card>
          <CardContent className="p-12 text-center">
            <CalendarPlus className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-1">No scheduled reports</h3>
            <p className="text-muted-foreground mb-4">Create a schedule to receive automated financial reports.</p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Schedule
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.map((report) => {
            const reportTypeLabel = REPORT_TYPES.find((rt) => rt.value === report.report_type)?.label || report.report_type
            const frequencyLabel = FREQUENCIES.find((f) => f.value === report.frequency)?.label || report.frequency
            return (
              <Card key={report.id} className={!report.enabled ? 'opacity-70' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base font-semibold">{report.name}</CardTitle>
                      <CardDescription className="mt-1">
                        <Badge variant={report.enabled ? 'default' : 'secondary'}>
                          {reportTypeLabel}
                        </Badge>
                        <span className="ml-2 text-xs">· {frequencyLabel}</span>
                      </CardDescription>
                    </div>
                    <Switch
                      checked={report.enabled}
                      onCheckedChange={(checked) => handleToggle(report.id, checked)}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Last run: {formatDate(report.last_run)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CalendarPlus className="w-3.5 h-3.5" />
                    <span>Next run: {formatDate(report.next_run)}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleTrigger(report)}
                    >
                      <Play className="w-3.5 h-3.5 mr-2" />
                      Generate Now
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-red-500 hover:text-red-600"
                      onClick={() => handleDelete(report.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
