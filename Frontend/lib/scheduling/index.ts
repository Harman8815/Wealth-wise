/**
 * Frontend scheduling utilities for the recurring platform.
 *
 * A TypeScript mirror of the backend scheduling engine so the UI can show a
 * live preview of upcoming execution dates without a round-trip. Kept
 * independent of React/UI so it can be reused by future scheduling features
 * (recurring budgets, subscriptions, bill reminders, EMIs).
 */
import type { RecurringFrequency } from '@/api/services';

const MONTHS_PER_QUARTER = 3;

function addMonths(base: Date, months: number): Date {
  const monthIndex = base.getMonth() + months;
  const year = base.getFullYear() + Math.floor(monthIndex / 12);
  const month = ((monthIndex % 12) + 12) % 12;
  let day = base.getDate();
  let result = new Date(year, month, day);
  // Clamp to the last valid day of the target month.
  while (result.getMonth() !== month) {
    day -= 1;
    result = new Date(year, month, day);
  }
  return result;
}

function lastDayOfMonth(target: Date): Date {
  return new Date(target.getFullYear(), target.getMonth() + 1, 0);
}

function nextOccurrence(
  frequency: RecurringFrequency,
  startDate: Date,
  after: Date,
  interval: number = 1,
  weekdays: number[] = [],
  dayOfMonth: number | null = null,
  lastDayOfMonth = false
): Date | null {
  interval = Math.max(1, interval || 1);
  const floor = new Date(startDate);
  floor.setDate(floor.getDate() - 1);
  if (after < floor) after = floor;

  let candidate: Date | null = null;

  if (frequency === 'daily') {
    const daysSince = Math.floor((after.getTime() - startDate.getTime()) / 86400000);
    const step = (Math.floor(daysSince / interval) + 1) * interval;
    candidate = new Date(startDate);
    candidate.setDate(candidate.getDate() + step);
  } else if (frequency === 'weekly') {
    const selected = weekdays.length ? [...weekdays].sort((a, b) => a - b) : [startDate.getDay()];
    const cursor = new Date(after);
    cursor.setDate(cursor.getDate() + 1);
    for (let i = 0; i < 14; i++) {
      if (selected.includes(cursor.getDay())) {
        const weeksSince = Math.floor((cursor.getTime() - startDate.getTime()) / (7 * 86400000));
        if (weeksSince >= 0 && weeksSince % interval === 0) {
          candidate = new Date(cursor);
          break;
        }
      }
      cursor.setDate(cursor.getDate() + 1);
    }
  } else if (frequency === 'monthly' || frequency === 'custom') {
    candidate = nextMonthOccurrence(startDate, after, interval, dayOfMonth, lastDayOfMonth);
  } else if (frequency === 'quarterly') {
    candidate = nextMonthOccurrence(startDate, after, interval * MONTHS_PER_QUARTER, dayOfMonth, lastDayOfMonth);
  } else if (frequency === 'yearly') {
    const targetDay = dayOfMonth != null ? dayOfMonth : startDate.getDate();
    candidate = nextMonthOccurrence(startDate, after, interval * 12, targetDay, lastDayOfMonth);
  }

  if (!candidate || candidate < startDate) return null;
  return candidate;
}

function nextMonthOccurrence(
  startDate: Date,
  after: Date,
  monthInterval: number,
  dayOfMonth: number | null,
  lastDayOfMonth: boolean
): Date | null {
  const dayFor = (monthStart: Date): Date => {
    if (lastDayOfMonth) return lastDayOfMonthVal(monthStart);
    const target = dayOfMonth != null ? dayOfMonth : startDate.getDate();
    const last = lastDayOfMonthVal(monthStart);
    return new Date(monthStart.getFullYear(), monthStart.getMonth(), Math.min(target, last.getDate()));
  };

  const baseIndex = startDate.getFullYear() * 12 + startDate.getMonth();
  const afterIndex = after.getFullYear() * 12 + after.getMonth();
  let stepsSince = afterIndex - baseIndex;
  if (stepsSince < 0) stepsSince = 0;
  let nextStep = (Math.floor(stepsSince / monthInterval) + 1) * monthInterval;
  let monthIndex = baseIndex + nextStep;
  let candidate = dayFor(new Date(Math.floor(monthIndex / 12), monthIndex % 12, 1));
  while (candidate <= after) {
    nextStep += monthInterval;
    monthIndex = baseIndex + nextStep;
    candidate = dayFor(new Date(Math.floor(monthIndex / 12), monthIndex % 12, 1));
  }
  return candidate;
}

function lastDayOfMonthVal(target: Date): Date {
  return new Date(target.getFullYear(), target.getMonth() + 1, 0);
}

export interface ScheduleConfig {
  frequency: RecurringFrequency;
  interval: number;
  weekdays: number[];
  dayOfMonth: number | null;
  lastDayOfMonth: boolean;
  startDate: Date;
  end_date?: Date | null;
  never_ends?: boolean;
}

export function previewOccurrences(config: ScheduleConfig, count = 5): Date[] {
  const occurrences: Date[] = [];
  let cursor = new Date(config.startDate);
  cursor.setDate(cursor.getDate() - 1);
  let attempts = 0;
  const end = config.never_ends ? null : config.end_date ?? null;
  while (occurrences.length < count && attempts < count * 50 + 10) {
    const nxt = nextOccurrence(
      config.frequency,
      config.startDate,
      cursor,
      config.interval,
      config.weekdays,
      config.dayOfMonth,
      config.lastDayOfMonth
    );
    if (!nxt) break;
    if (end && nxt > end) break;
    occurrences.push(nxt);
    cursor = nxt;
    attempts += 1;
  }
  return occurrences;
}

export const FREQUENCY_LABELS: Record<RecurringFrequency, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  yearly: 'Yearly',
  custom: 'Custom',
};

export const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function formatScheduleSummary(config: ScheduleConfig): string {
  const { frequency, interval } = config;
  const every = interval > 1 ? `Every ${interval} ` : 'Every ';
  switch (frequency) {
    case 'daily':
      return `${every}${interval > 1 ? 'days' : 'day'}`;
    case 'weekly': {
      if (config.weekdays.length) {
        const days = config.weekdays
          .slice()
          .sort((a, b) => a - b)
          .map((d) => WEEKDAY_LABELS[d])
          .join(', ');
        return `${every}week on ${days}`;
      }
      return `${every}week`;
    }
    case 'monthly':
    case 'custom': {
      const day = config.lastDayOfMonth
        ? 'last day of month'
        : `day ${config.dayOfMonth ?? 'start'}`;
      return `${every}${interval > 1 ? 'months' : 'month'} on ${day}`;
    }
    case 'quarterly':
      return `${every}${interval > 1 ? 'quarters' : 'quarter'} on day ${
        config.lastDayOfMonth ? 'last' : config.dayOfMonth ?? 'start'
      }`;
    case 'yearly':
      return `${every}${interval > 1 ? 'years' : 'year'}`;
    default:
      return frequency;
  }
}
