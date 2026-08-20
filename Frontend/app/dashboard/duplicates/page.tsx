"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import {
  AlertTriangle,
  Copy,
  Trash2,
  MoreVertical,
  RefreshCw,
  Loader2,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from "lucide-react"
import { useDashboardSidebar } from "@/components/dashboard/sidebar-context"
import { toast } from "sonner"
import { apiClient } from "@/api/client"

interface DuplicateMatch {
  id: string
  transaction_id: string
  transaction_description: string
  transaction_date: string
  transaction_amount: number
  duplicate_of_id: string
  duplicate_of_description: string
  duplicate_of_date: string
  duplicate_of_amount: number
  score: number
  confidence: number
  explanation: string
  resolution: string | null
  created_at: string
}

interface DuplicateGroup {
  id: string
  status: string
  detected_at: string
  member_count: number
  matches: DuplicateMatch[]
}

export default function DuplicatesPageRoute() {
  const { openSidebar } = useDashboardSidebar()
  const [groups, setGroups] = useState<DuplicateGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [resolving, setResolving] = useState<string | null>(null)
  const [selectedGroup, setSelectedGroup] = useState<DuplicateGroup | null>(null)

  const loadDuplicates = async () => {
    setLoading(true)
    try {
      const response = await apiClient.get<DuplicateGroup[]>('/duplicates/')
      setGroups(Array.isArray(response.data) ? response.data : (response.data as any).results ?? [])
    } catch (error) {
      console.error('Failed to load duplicates', error)
      toast.error('Failed to load duplicates')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDuplicates()
  }, [])

  const handleScan = async () => {
    setScanning(true)
    try {
      const response = await apiClient.post<{ groups_found: number; groups: DuplicateGroup[] }>('/duplicates/scan/')
      setGroups(response.data.groups)
      toast.success(`Scan complete: ${response.data.groups_found} duplicate groups found`)
    } catch (error) {
      console.error('Scan failed', error)
      toast.error('Duplicate scan failed')
    } finally {
      setScanning(false)
    }
  }

  const handleResolve = async (matchId: string, resolution: string) => {
    setResolving(matchId)
    try {
      await apiClient.post(`/duplicates/${matchId}/resolve/`, { resolution })
      toast.success('Match resolved')
      loadDuplicates()
    } catch (error) {
      console.error('Resolve failed', error)
      toast.error('Failed to resolve match')
    } finally {
      setResolving(null)
    }
  }

  const resolutionIcon = (resolution: string | null) => {
    if (resolution === 'kept') return <CheckCircle2 className="w-4 h-4 text-green-500" />
    if (resolution === 'deleted') return <Trash2 className="w-4 h-4 text-red-500" />
    if (resolution === 'not_duplicate') return <XCircle className="w-4 h-4 text-gray-500" />
    return <HelpCircle className="w-4 h-4 text-yellow-500" />
  }

  return (
    <div className="flex-1 min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6">
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={openSidebar}>
            <MoreVertical className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Duplicate Transactions</h1>
            <p className="text-gray-600 dark:text-gray-400">Review and resolve potential duplicate transactions</p>
          </div>
        </div>
        <Button onClick={handleScan} disabled={scanning}>
          {scanning ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          {scanning ? 'Scanning...' : 'Scan for Duplicates'}
        </Button>
      </header>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : groups.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle2 className="w-12 h-12 text-green-500 mb-4" />
            <p className="text-lg font-medium">No duplicates found</p>
            <p className="text-sm text-muted-foreground">Run a scan to detect potential duplicates</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <Card key={group.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      Duplicate Group
                      <Badge variant={group.status === 'open' ? 'destructive' : 'default'}>
                        {group.status}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Detected {new Date(group.detected_at).toLocaleDateString()} · {group.member_count} transactions
                    </CardDescription>
                  </div>
                  <Dialog open={selectedGroup?.id === group.id} onOpenChange={(open) => !open && setSelectedGroup(null)}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => setSelectedGroup(group)}>
                        View Details
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl">
                      <DialogHeader>
                        <DialogTitle>Duplicate Group Details</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                        {group.matches.map((match) => (
                          <div key={match.id} className="border rounded-lg p-4 space-y-3">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <p className="text-sm font-medium">Transaction A</p>
                                <p className="text-sm text-muted-foreground">{match.transaction_description}</p>
                                <p className="text-sm">₹{match.transaction_amount}</p>
                                <p className="text-xs text-muted-foreground">{match.transaction_date}</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm font-medium">Transaction B</p>
                                <p className="text-sm text-muted-foreground">{match.duplicate_of_description}</p>
                                <p className="text-sm">₹{match.duplicate_of_amount}</p>
                                <p className="text-xs text-muted-foreground">{match.duplicate_of_date}</p>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">Score:</span>
                                <span className="text-sm">{(match.score * 100).toFixed(0)}%</span>
                                <span className="text-xs text-muted-foreground">({match.confidence.toFixed(0)}% confidence)</span>
                              </div>
                              {match.resolution && (
                                <div className="flex items-center gap-1">
                                  {resolutionIcon(match.resolution)}
                                  <span className="text-sm capitalize">{match.resolution.replace('_', ' ')}</span>
                                </div>
                              )}
                            </div>
                            {match.explanation && (
                              <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                                {match.explanation}
                              </p>
                            )}
                            {!match.resolution && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => handleResolve(match.id, 'kept')}
                                  disabled={resolving === match.id}
                                >
                                  Keep
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleResolve(match.id, 'deleted')}
                                  disabled={resolving === match.id}
                                >
                                  Delete
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleResolve(match.id, 'not_duplicate')}
                                  disabled={resolving === match.id}
                                >
                                  Not Duplicate
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {group.matches.slice(0, 3).map((match) => (
                    <div key={match.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {match.transaction_description} ↔ {match.duplicate_of_description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ₹{match.transaction_amount} vs ₹{match.duplicate_of_amount} · {(match.score * 100).toFixed(0)}% match
                        </p>
                      </div>
                      {match.resolution ? (
                        <div className="flex items-center gap-1">
                          {resolutionIcon(match.resolution)}
                          <span className="text-sm capitalize">{match.resolution.replace('_', ' ')}</span>
                        </div>
                      ) : (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleResolve(match.id, 'kept')}>
                              <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
                              Keep
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleResolve(match.id, 'deleted')}>
                              <Trash2 className="w-4 h-4 mr-2 text-red-500" />
                              Delete
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleResolve(match.id, 'not_duplicate')}>
                              <XCircle className="w-4 h-4 mr-2 text-gray-500" />
                              Not Duplicate
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  ))}
                  {group.matches.length > 3 && (
                    <p className="text-sm text-muted-foreground pt-2">
                      +{group.matches.length - 3} more matches
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
