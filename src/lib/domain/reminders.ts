import { GRACE_DAYS, REMINDER_DAYS_BEFORE_DUE } from "@/config/rules";

export type ReminderType = "due_soon" | "due_today" | "overdue";

/**
 * Which reminder, if any, fires today for a period with this `daysUntilDue`.
 * Reminders fire on exactly three days: 3 days before due, on the due day,
 * and 3 days after (when the late fee lands) — never every day in between.
 */
export function reminderDueToday(daysUntilDue: number): ReminderType | null {
  if (daysUntilDue === REMINDER_DAYS_BEFORE_DUE) return "due_soon";
  if (daysUntilDue === 0) return "due_today";
  if (daysUntilDue === -GRACE_DAYS) return "overdue";
  return null;
}

/** Still unpaid past the late-fee day: flag the tenancy for the operator to review. */
export function shouldFlagForNotice(daysLate: number, graceDays: number = GRACE_DAYS): boolean {
  return daysLate >= graceDays;
}
