"use client";

import { useAccountSummary, useBudgetOverview, useGoalProgress } from "@/hooks";
import { useSWRTransactionSummary } from "@/hooks/use-transactions-swr";
import { GlassCard } from "@/shared/components";
import { ProgressBar } from "@/shared/components/progress";
import { AnimatedNumber } from "@/shared/components/animated-number";
import { Wallet, Target, TrendingDown, PiggyBank, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AccountSummary, TransactionSummary, BudgetOverview, GoalProgress } from "@/api/services";

interface StatCardProps {
  title: string;
  value: number;
  prefix?: string;
  subtitle?: string;
  trend?: number;
  icon: React.ReactNode;
  loading?: boolean;
  variant?: "default" | "income" | "expense" | "savings";
}

function StatCard({
  title,
  value,
  prefix = "₹",
  subtitle,
  trend,
  icon,
  loading,
  variant = "default",
}: StatCardProps) {
  const variantStyles = {
    default: "from-primary/20 to-primary/5 text-primary",
    income: "from-emerald-500/20 to-emerald-500/5 text-emerald-500",
    expense: "from-red-500/20 to-red-500/5 text-red-500",
    savings: "from-purple-500/20 to-purple-500/5 text-purple-500",
  };

  if (loading) {
    return (
      <GlassCard className="h-32 animate-pulse">
        <div className="h-full bg-muted/50 rounded-lg" />
      </GlassCard>
    );
  }

  return (
    <GlassCard hover className="relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight">
              <AnimatedNumber value={value} prefix={prefix} />
            </span>
            {trend !== undefined && (
              <span
                className={cn(
                  "flex items-center text-sm font-medium",
                  trend >= 0 ? "text-emerald-500" : "text-red-500"
                )}
              >
                {trend >= 0 ? (
                  <ArrowUpRight className="h-4 w-4" />
                ) : (
                  <ArrowDownRight className="h-4 w-4" />
                )}
                {Math.abs(trend)}%
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div
          className={cn(
            "p-2.5 rounded-xl bg-gradient-to-br",
            variantStyles[variant]
          )}
        >
          {icon}
        </div>
      </div>
    </GlassCard>
  );
}

export function OverviewCards() {
  const { data: accountSummary, isLoading: isLoadingAccounts } = useAccountSummary() as { data: AccountSummary | undefined; isLoading: boolean };
  const { data: transactionSummary, isLoading: isLoadingTransactions } = useSWRTransactionSummary() as { data: TransactionSummary | undefined; isLoading: boolean };
  const { data: budgetOverview, isLoading: isLoadingBudget } = useBudgetOverview() as { data: BudgetOverview | undefined; isLoading: boolean };
  const { data: goalProgress, isLoading: isLoadingGoals } = useGoalProgress() as { data: GoalProgress | undefined; isLoading: boolean };

  const isLoading = isLoadingAccounts || isLoadingTransactions || isLoadingBudget || isLoadingGoals;

  const totalBalance = accountSummary?.total_balance ?? 0;
  const totalBudgeted = budgetOverview?.total_budgeted ?? 0;
  const totalSpent = budgetOverview?.total_spent ?? 0;
  const budgetPercentage = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;
  const monthlyExpense = transactionSummary?.expense ?? 0;
  const monthlyIncome = transactionSummary?.income ?? 0;
  const totalSaved = goalProgress?.total_saved ?? 0;
  const totalTarget = goalProgress?.total_target ?? 0;
  const goalPercentage = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;
  const activeGoals = goalProgress?.active_goals ?? 0;

  return (
    <div className="space-y-6">
      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Net Worth"
          value={totalBalance}
          trend={12.5}
          icon={<Wallet className="h-5 w-5" />}
          loading={isLoading}
          variant="default"
        />
        <StatCard
          title="Monthly Income"
          value={monthlyIncome}
          trend={8.2}
          icon={<TrendingDown className="h-5 w-5 rotate-180" />}
          loading={isLoading}
          variant="income"
        />
        <StatCard
          title="Monthly Spending"
          value={monthlyExpense}
          trend={-5.3}
          icon={<TrendingDown className="h-5 w-5" />}
          loading={isLoading}
          variant="expense"
        />
        <StatCard
          title="Savings Rate"
          value={totalSaved}
          subtitle={`${goalPercentage.toFixed(0)}% of goals`}
          icon={<PiggyBank className="h-5 w-5" />}
          loading={isLoading}
          variant="savings"
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Budget Usage Card */}
        <GlassCard hover>
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Budget Usage</p>
              <p className="text-2xl font-bold mt-1">{budgetPercentage.toFixed(0)}%</p>
            </div>
            <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-500/5 text-orange-500">
              <Target className="h-5 w-5" />
            </div>
          </div>
          <ProgressBar
            value={totalSpent}
            max={totalBudgeted}
            showLabel
            variant={budgetPercentage > 90 ? "danger" : budgetPercentage > 75 ? "warning" : "success"}
          />
          <p className="text-xs text-muted-foreground mt-3">
            ₹{totalSpent.toLocaleString("en-IN")} of ₹{totalBudgeted.toLocaleString("en-IN")} spent
          </p>
        </GlassCard>

        {/* Goal Progress Card */}
        <GlassCard hover>
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Goal Progress</p>
              <p className="text-2xl font-bold mt-1">
                <AnimatedNumber value={goalPercentage} suffix="%" decimals={0} />
              </p>
            </div>
            <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-500/5 text-purple-500">
              <PiggyBank className="h-5 w-5" />
            </div>
          </div>
          <ProgressBar
            value={totalSaved}
            max={totalTarget}
            showLabel
            variant={goalPercentage >= 100 ? "success" : "default"}
          />
          <p className="text-xs text-muted-foreground mt-3">
            {activeGoals} active goals · ₹{(totalTarget - totalSaved).toLocaleString("en-IN")} remaining
          </p>
        </GlassCard>
      </div>
    </div>
  );
}
