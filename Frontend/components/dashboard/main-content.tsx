"use client";

import { Button } from "@/shared/components/button";
import { GlassCard, AIInsightsCard } from "@/shared/components";
import { Menu, Plus, Calendar, Sparkles } from "lucide-react";
import { OverviewCards } from "./overview-cards";
import { RecentTransactions } from "./recent-transactions";
import { MonthlyChart } from "./monthly-chart";
import { cn } from "@/lib/utils";
import { useSeedHistoricalData } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";

interface MainContentProps {
  onMenuClick: () => void;
}

// Sample AI insights data - would come from API in production
const sampleInsights = [
  {
    id: "1",
    type: "spending" as const,
    title: "Spending Alert",
    description: "You've spent 15% more on dining out this month compared to last month. Consider setting a dining budget.",
    impact: "negative" as const,
    metadata: { percentage: 15, category: "Dining" },
    action: { label: "Set Budget", onClick: () => {} },
  },
  {
    id: "2",
    type: "saving" as const,
    title: "Savings Opportunity",
    description: "You could save ₹2,500 monthly by switching to a different subscription plan for your streaming services.",
    impact: "positive" as const,
    metadata: { amount: 2500 },
    action: { label: "View Details", onClick: () => {} },
  },
  {
    id: "3",
    type: "investment" as const,
    title: "Investment Tip",
    description: "Based on your savings pattern, consider investing ₹5,000 monthly in SIP for better returns.",
    impact: "positive" as const,
    metadata: { amount: 5000 },
    action: { label: "Learn More", onClick: () => {} },
  },
];

export function MainContent({ onMenuClick }: MainContentProps) {
  const seedMutation = useSeedHistoricalData();

  const handleSeedData = async () => {
    try {
      const result = await seedMutation.mutateAsync(undefined);
      toast({
        title: "Seed data generated",
        description: result?.message || "Demo data has been populated for your account.",
      });
    } catch (err: any) {
      toast({
        title: "Failed to seed data",
        description: err.response?.data?.detail || err.message || "Please try again.",
      });
    }
  };

  return (
    <div className="flex-1 min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/80 border-b border-border/50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon-sm"
              className="lg:hidden"
              onClick={onMenuClick}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-foreground">Welcome back</h1>
              <p className="text-sm text-muted-foreground">Here's what's happening with your finances</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="hidden sm:flex">
              <Calendar className="h-4 w-4 mr-2" />
              This Month
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:flex"
              onClick={handleSeedData}
              loading={seedMutation.isPending}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Seed Demo Data
            </Button>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Transaction
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Overview Cards */}
        <section className="animate-fade-in">
          <OverviewCards />
        </section>

        {/* Charts and Insights Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Monthly Chart - Takes up 2/3 */}
          <div className="lg:col-span-2 animate-slide-up stagger-1">
            <GlassCard className="h-full">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg">Cash Flow</h3>
                  <p className="text-sm text-muted-foreground">Income vs Expenses over time</p>
                </div>
              </div>
              <MonthlyChart />
            </GlassCard>
          </div>

          {/* AI Insights - Takes up 1/3 */}
          <div className="animate-slide-up stagger-2">
            <AIInsightsCard insights={sampleInsights} />
          </div>
        </div>

        {/* Recent Transactions */}
        <section className="animate-slide-up stagger-3">
          <RecentTransactions />
        </section>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-slide-up stagger-4">
          <GlassCard hover className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Upcoming Bills</p>
              <p className="text-lg font-semibold">3 due this week</p>
            </div>
          </GlassCard>

          <GlassCard hover className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">AI Recommendations</p>
              <p className="text-lg font-semibold">5 new insights</p>
            </div>
          </GlassCard>

          <GlassCard hover className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-500">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Next Payday</p>
              <p className="text-lg font-semibold">In 5 days</p>
            </div>
          </GlassCard>
        </div>
      </main>
    </div>
  );
}
