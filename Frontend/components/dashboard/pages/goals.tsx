"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Menu, Plus, Target, Calendar, TrendingUp, Edit, Trash2 } from "lucide-react"
import { useGoals, useGoalProgress, useCreateGoal, useDeleteGoal } from "@/hooks"

export function GoalsPage() {
  const { data: goalsData, isLoading: isLoadingGoals } = useGoals()
  const { data: progress, isLoading: isLoadingProgress } = useGoalProgress()
  const createGoal = useCreateGoal()
  const deleteGoal = useDeleteGoal()

  const goals = goalsData?.results || []
  
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false)
  const [newGoal, setNewGoal] = useState({
    title: "",
    description: "",
    targetAmount: "",
    targetDate: "",
    category: "",
    priority: "medium" as const,
  })

  const activeGoals = goals.filter((goal) => goal.status === "active")
  const completedGoals = goals.filter((goal) => goal.status === "completed")
  const totalTargetAmount = progress?.total_target || 0
  const totalCurrentAmount = progress?.total_saved || 0

  if (isLoadingGoals || isLoadingProgress) {
    return (
      <div className="min-h-screen p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="h-32">
              <Skeleton className="h-full" />
            </Card>
          ))}
        </div>
        <Card className="h-96">
          <Skeleton className="h-full" />
        </Card>
      </div>
    )
  }

  const handleAddGoal = () => {
    if (newGoal.title && newGoal.targetAmount && newGoal.targetDate) {
      createGoal.mutate({
        title: newGoal.title,
        description: newGoal.description,
        target_amount: Number(newGoal.targetAmount),
        target_date: newGoal.targetDate,
        category: newGoal.category as any,
        priority: newGoal.priority,
      }, {
        onSuccess: () => {
          setIsAddGoalOpen(false)
          setNewGoal({
            title: "",
            description: "",
            targetAmount: "",
            targetDate: "",
            category: "",
            priority: "medium",
          })
        }
      })
    }
  }

  const handleDeleteGoal = (id: string) => {
    deleteGoal.mutate(id)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
      case "medium":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
      case "low":
        return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300"
    }
  }

  const getTimeRemaining = (targetDate: string) => {
    const target = new Date(targetDate)
    const now = new Date()
    const diffTime = target.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return "Overdue"
    if (diffDays === 0) return "Due today"
    if (diffDays === 1) return "1 day left"
    if (diffDays < 30) return `${diffDays} days left`
    if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months left`
    return `${Math.ceil(diffDays / 365)} years left`
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="lg:hidden">
              <Menu className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Financial Goals</h1>
              <p className="text-gray-600 dark:text-gray-400">Track and achieve your financial objectives</p>
            </div>
          </div>
          <Dialog open={isAddGoalOpen} onOpenChange={setIsAddGoalOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Goal
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Goal</DialogTitle>
                <DialogDescription>Set a new financial goal to track your progress</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Goal Title</Label>
                  <Input
                    id="title"
                    value={newGoal.title}
                    onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                    placeholder="e.g., Emergency Fund"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={newGoal.description}
                    onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                    placeholder="Brief description of your goal"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Target Amount (₹)</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={newGoal.targetAmount}
                      onChange={(e) => setNewGoal({ ...newGoal, targetAmount: e.target.value })}
                      placeholder="100000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Target Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={newGoal.targetDate}
                      onChange={(e) => setNewGoal({ ...newGoal, targetDate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={newGoal.category}
                      onValueChange={(value: string) => setNewGoal({ ...newGoal, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Emergency">Emergency</SelectItem>
                        <SelectItem value="Travel">Travel</SelectItem>
                        <SelectItem value="Technology">Technology</SelectItem>
                        <SelectItem value="Transportation">Transportation</SelectItem>
                        <SelectItem value="Education">Education</SelectItem>
                        <SelectItem value="Investment">Investment</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={newGoal.priority}
                      onValueChange={(value: any) => setNewGoal({ ...newGoal, priority: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={handleAddGoal} className="w-full">
                  Create Goal
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6 space-y-6">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Active Goals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{activeGoals.length}</div>
              <p className="text-sm text-gray-600 dark:text-gray-400">In progress</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Completed Goals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{completedGoals.length}</div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Achieved</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Total Target</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">₹{totalTargetAmount.toLocaleString()}</div>
              <p className="text-sm text-gray-600 dark:text-gray-400">All active goals</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Total Saved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">₹{totalCurrentAmount.toLocaleString()}</div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {((totalCurrentAmount / totalTargetAmount) * 100).toFixed(1)}% of target
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Active Goals */}
        <Card>
          <CardHeader>
            <CardTitle>Active Goals</CardTitle>
            <CardDescription>Your current financial objectives</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {activeGoals.map((goal) => {
                const progress = (goal.current_amount / goal.target_amount) * 100
                const remaining = goal.target_amount - goal.current_amount

                return (
                  <div key={goal.id} className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold">{goal.title}</h3>
                          <Badge className={getPriorityColor(goal.priority)}>{goal.priority}</Badge>
                          <Badge variant="outline">{goal.category}</Badge>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 mb-2">{goal.description}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center">
                            <Target className="w-4 h-4 mr-1" />₹{goal.target_amount.toLocaleString()}
                          </div>
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {getTimeRemaining(goal.target_date)}
                          </div>
                        </div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">
                            Progress: ₹{goal.current_amount.toLocaleString()} / ₹{goal.target_amount.toLocaleString()}
                          </span>
                          <span>{progress.toFixed(1)}%</span>
                        </div>
                        <Progress value={progress} className="h-3" />
                        <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                          <span>Remaining: ₹{remaining.toLocaleString()}</span>
                          <span>Target: {new Date(goal.target_date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Completed Goals */}
        {completedGoals.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
                Completed Goals
              </CardTitle>
              <CardDescription>Goals you've successfully achieved</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {completedGoals.map((goal) => (
                  <div
                    key={goal.id}
                    className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-green-900 dark:text-green-100">{goal.title}</h3>
                        <p className="text-sm text-green-700 dark:text-green-300">{goal.description}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">₹{goal.target_amount.toLocaleString()}</div>
                        <Badge className="bg-green-600 text-white">Completed</Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Goal Tips */}
        <Card>
          <CardHeader>
            <CardTitle>Goal Achievement Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">🎯 Set SMART Goals</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Make your goals Specific, Measurable, Achievable, Relevant, and Time-bound for better success rates.
                </p>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">💰 Automate Savings</h4>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Set up automatic transfers to dedicated goal accounts to ensure consistent progress without manual
                  effort.
                </p>
              </div>
              <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-2">📊 Track Progress</h4>
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  Review your goals monthly and adjust your savings rate based on income changes and life events.
                </p>
              </div>
              <div className="p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
                <h4 className="font-medium text-orange-900 dark:text-orange-100 mb-2">🏆 Celebrate Milestones</h4>
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  Acknowledge progress at 25%, 50%, and 75% completion to maintain motivation throughout your journey.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
