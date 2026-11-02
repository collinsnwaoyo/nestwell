import { differenceInCalendarDays, subDays } from "date-fns";
import { toLagosDate } from "./due-date";

/** `count` sample dates ending today, `stepDays` apart, oldest first. */
export function sampleDates(today: Date | string, count: number, stepDays: number): Date[] {
  const end = toLagosDate(today);
  return Array.from({ length: count }, (_, i) => subDays(end, (count - 1 - i) * stepDays));
}

export interface TenancySpan {
  moveIn: string;
  /** Null while the tenancy is open-ended. */
  moveOut: string | null;
  rent: number;
}

/** Occupied from the move-in day up to, but not including, the move-out day. */
export function isOccupiedOn(span: TenancySpan, date: Date | string): boolean {
  const day = toLagosDate(date);
  if (differenceInCalendarDays(day, toLagosDate(span.moveIn)) < 0) return false;
  return span.moveOut === null || differenceInCalendarDays(toLagosDate(span.moveOut), day) > 0;
}

export function occupiedCountOn(spans: TenancySpan[], date: Date | string): number {
  return spans.filter((span) => isOccupiedOn(span, date)).length;
}

export function rentRollOn(spans: TenancySpan[], date: Date | string): number {
  return spans.reduce((sum, span) => (isOccupiedOn(span, date) ? sum + span.rent : sum), 0);
}

/** Total paid in the `days` days ending on `date` (inclusive). */
export function collectedInWindow(
  payments: { amount: number; paidAt: string }[],
  date: Date | string,
  days: number,
): number {
  const end = toLagosDate(date);
  return payments.reduce((sum, payment) => {
    const age = differenceInCalendarDays(end, toLagosDate(payment.paidAt));
    return age >= 0 && age < days ? sum + payment.amount : sum;
  }, 0);
}

/**
 * Cumulative amount due by each of the next `days` days, starting today.
 * Anything already overdue counts from day 0.
 */
export function cumulativeDue(
  items: { dueDate: Date | string; amount: number }[],
  today: Date | string,
  days: number,
): number[] {
  const offsets = items.map((item) => differenceInCalendarDays(toLagosDate(item.dueDate), toLagosDate(today)));
  return Array.from({ length: days + 1 }, (_, day) =>
    items.reduce((sum, item, i) => (offsets[i] <= day ? sum + item.amount : sum), 0),
  );
}
