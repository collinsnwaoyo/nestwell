import { REMINDER_DAYS_BEFORE_DUE } from "@/config/rules";

export type TenancyLifecycle = "active" | "notice" | "checked_out";
export type RentStatus = "paid" | "due_soon" | "due_today" | "overdue" | "notice" | "vacant";

export interface DeriveStatusInput {
  /** Lifecycle state of the tenancy; a vacant bed has no tenancy at all. */
  tenancyStatus: TenancyLifecycle;
  /** Days until the next unpaid period's due date (negative = days late). */
  daysUntilDue: number;
}

/** Derives the display status for an occupied bed from its tenancy lifecycle and due date. */
export function deriveStatus({ tenancyStatus, daysUntilDue }: DeriveStatusInput): RentStatus {
  if (tenancyStatus === "checked_out") return "vacant";
  if (tenancyStatus === "notice") return "notice";
  if (daysUntilDue > REMINDER_DAYS_BEFORE_DUE) return "paid";
  if (daysUntilDue > 0) return "due_soon";
  if (daysUntilDue === 0) return "due_today";
  return "overdue";
}
