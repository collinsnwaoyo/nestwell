import { GRACE_DAYS, LATE_FEE_AMOUNT } from "@/config/rules";
import type { UnpaidPeriod } from "./balance";

/** True once a period is far enough past due to earn a late fee. */
export function isPastGrace(daysLate: number, graceDays: number = GRACE_DAYS): boolean {
  return daysLate >= graceDays;
}

/**
 * How many new ₦10,000 late-fee charges are owed: one per missed month,
 * added once only. `existingLateFeeCount` is how many late-fee charges
 * already exist for this tenancy.
 */
export function lateFeesOwed(
  unpaidPeriods: UnpaidPeriod[],
  existingLateFeeCount: number,
  graceDays: number = GRACE_DAYS,
): number {
  const missedPeriods = unpaidPeriods.filter((period) => isPastGrace(period.daysLate, graceDays)).length;
  return Math.max(0, missedPeriods - existingLateFeeCount);
}

export function lateFeeChargeAmount(count: number, amount: number = LATE_FEE_AMOUNT): number {
  return count * amount;
}
