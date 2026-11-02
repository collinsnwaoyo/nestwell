import { format } from "date-fns";
import { toLagosDate } from "./due-date";

/** "18 Nov 2026": dates in details and lists. */
export function formatDate(date: Date | string): string {
  return format(toLagosDate(date), "d MMM yyyy");
}

/** "11:43am": 12-hour clock with a lowercase am/pm, Lagos time. */
export function formatTime(date: Date | string): string {
  return format(toLagosDate(date), "h:mmaaa");
}

/** "2 Nov, 11:43am": timestamps on messages and activity. */
export function formatTimestamp(date: Date | string): string {
  return `${format(toLagosDate(date), "d MMM")}, ${formatTime(date)}`;
}

/** "12 days late", "Due today" or "Due 5 Nov" for a tenant's next unpaid rent. */
export function describeDue(daysUntilDue: number, nextDueDate: Date | string): string {
  if (daysUntilDue < 0) return `${-daysUntilDue} day${daysUntilDue === -1 ? "" : "s"} late`;
  if (daysUntilDue === 0) return "Due today";
  return `Due ${format(toLagosDate(nextDueDate), "d MMM")}`;
}
