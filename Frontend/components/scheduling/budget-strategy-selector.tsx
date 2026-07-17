"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import type { BudgetStrategy } from "@/api/services"

export const STRATEGY_LABELS: Record<BudgetStrategy, string> = {
  copy_exact: 'Copy Previous Budget Exactly',
  copy_structure: 'Copy Category Structure Only',
  reset_spent: 'Reset Spent to Zero',
  carry_forward: 'Carry Forward Remaining Budget',
  increase_percent: 'Increase Budget by Percentage',
  decrease_percent: 'Decrease Budget by Percentage',
  auto_adjust: 'Auto-Adjust from Previous Period',
}

export const STRATEGY_DESCRIPTIONS: Record<BudgetStrategy, string> = {
  copy_exact: 'Reproduce the previous allocations, keeping spent values as-is.',
  copy_structure: 'Copy only the category outline and reset all spent amounts to zero.',
  reset_spent: 'Create a fresh copy of the structure with a clean spending slate.',
  carry_forward: 'Seed each category with the leftover balance from the prior period.',
  increase_percent: 'Scale every category allocation up by a fixed percentage.',
  decrease_percent: 'Scale every category allocation down by a fixed percentage.',
  auto_adjust: 'Copy the structure and flag it for future AI-based rebalancing.',
}

const STRATEGIES: BudgetStrategy[] = [
  'copy_exact',
  'copy_structure',
  'reset_spent',
  'carry_forward',
  'increase_percent',
  'decrease_percent',
  'auto_adjust',
]

interface BudgetStrategySelectorProps {
  value: BudgetStrategy
  onChange: (value: BudgetStrategy) => void
  adjustmentPercent: number
  onAdjustmentPercentChange: (value: number) => void
  autoCarryForward: boolean
  onAutoCarryForwardChange: (value: boolean) => void
  autoAdjustPrevious: boolean
  onAutoAdjustPreviousChange: (value: boolean) => void
}

/**
 * Reusable selector for choosing how future budgets are generated. Strategy is
 * extensible; the engine maps each strategy to concrete allocation logic.
 */
export function BudgetStrategySelector({
  value,
  onChange,
  adjustmentPercent,
  onAdjustmentPercentChange,
  autoCarryForward,
  onAutoCarryForwardChange,
  autoAdjustPrevious,
  onAutoAdjustPreviousChange,
}: BudgetStrategySelectorProps) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {STRATEGIES.map((strategy) => {
          const active = strategy === value
          return (
            <button
              key={strategy}
              type="button"
              onClick={() => onChange(strategy)}
              title={STRATEGY_DESCRIPTIONS[strategy]}
              className={cn(
                "rounded-lg border px-3 py-2 text-left text-xs font-medium transition-colors",
                active
                  ? "border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400"
                  : "border-border bg-background text-muted-foreground hover:bg-muted"
              )}
            >
              {STRATEGY_LABELS[strategy]}
            </button>
          )
        })}
      </div>

      <p className="text-xs text-muted-foreground">{STRATEGY_DESCRIPTIONS[value]}</p>

      {(value === 'increase_percent' || value === 'decrease_percent') && (
        <div className="flex items-center gap-3">
          <Label className="text-sm text-muted-foreground">
            {value === 'increase_percent' ? 'Increase by' : 'Decrease by'}
          </Label>
          <div className="relative w-28">
            <Input
              type="number"
              value={adjustmentPercent}
              onChange={(e) => onAdjustmentPercentChange(Number(e.target.value) || 0)}
              className="pr-7"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              %
            </span>
          </div>
        </div>
      )}

      <div className="space-y-2 rounded-lg border border-border p-3">
        <Label className="flex cursor-pointer items-center justify-between text-sm">
          <span>Auto Carry Forward</span>
          <Switch checked={autoCarryForward} onCheckedChange={onAutoCarryForwardChange} />
        </Label>
        <p className="text-xs text-muted-foreground">
          Seed each new period with the unspent balance from the previous one.
        </p>
        <Label className="flex cursor-pointer items-center justify-between text-sm">
          <span>Auto Adjust Based on Previous Period</span>
          <Switch checked={autoAdjustPrevious} onCheckedChange={onAutoAdjustPreviousChange} />
        </Label>
        <p className="text-xs text-muted-foreground">
          Enable historical-spending analysis for future AI recommendations.
        </p>
      </div>
    </div>
  )
}
