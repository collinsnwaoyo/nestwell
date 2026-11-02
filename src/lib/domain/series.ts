import { differenceInCalendarDays, format, subDays } from "date-fns";
import { toLagosDate } from "./due-date";

type Paid = { amount: number; paidAt: string };

/** Total paid in the `days` days ending on `date` (inclusive). */
export function collectedInWindow(payments: Paid[], date: Date | string, days: number): number {
  const end = toLagosDate(date);
  return payments.reduce((sum, payment) => {
    const age = differenceInCalendarDays(end, toLagosDate(payment.paidAt));
    return age >= 0 && age < days ? sum + payment.amount : sum;
  }, 0);
}

/**
 * Running total collected across the `days` days ending today, one point per
 * Lagos calendar day, oldest first. The last point equals collectedInWindow.
 */
export function dailyCumulativeCollected(
  payments: Paid[],
  today: Date | string,
  days: number,
): { date: string; total: number }[] {
  const end = toLagosDate(today);
  const perDay = new Array<number>(days).fill(0);
  for (const payment of payments) {
    const age = differenceInCalendarDays(end, toLagosDate(payment.paidAt));
    if (age >= 0 && age < days) perDay[days - 1 - age] += payment.amount;
  }
  let running = 0;
  return perDay.map((amount, i) => {
    running += amount;
    return { date: format(subDays(end, days - 1 - i), "yyyy-MM-dd"), total: running };
  });
}
