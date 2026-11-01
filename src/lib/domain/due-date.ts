import { TZDate } from "@date-fns/tz";
import { addMonths, differenceInCalendarDays, differenceInCalendarMonths } from "date-fns";
import { TIMEZONE } from "@/config/rules";

/** Interprets an absolute date/string as a calendar date in Africa/Lagos. */
export function toLagosDate(date: Date | string): TZDate {
  return typeof date === "string" ? new TZDate(date, TIMEZONE) : new TZDate(date, TIMEZONE);
}

/**
 * The due date for the nth rent period (0-indexed) of a tenancy, where
 * period 0 falls on the move-in date itself. If the move-in day of month
 * doesn't exist in the target month, the due date clamps to that month's
 * last day (date-fns' addMonths does this natively).
 */
export function dueDateForOccurrence(
  moveIn: Date | string,
  occurrenceIndex: number,
): TZDate {
  return addMonths(toLagosDate(moveIn), occurrenceIndex);
}

/** How many rent periods have become due (due date <= asOf), inclusive. */
export function occurrencesDueBy(moveIn: Date | string, asOf: Date | string): number {
  const moveInLagos = toLagosDate(moveIn);
  const asOfLagos = toLagosDate(asOf);

  let guess = differenceInCalendarMonths(asOfLagos, moveInLagos);
  if (guess < 0) return 0;

  // Correct the guess for day-of-month clamping at month boundaries.
  while (guess >= 0 && dueDateForOccurrence(moveInLagos, guess) > asOfLagos) {
    guess--;
  }
  while (dueDateForOccurrence(moveInLagos, guess + 1) <= asOfLagos) {
    guess++;
  }

  return guess < 0 ? 0 : guess + 1;
}

/** The next due date for a tenancy, given how many periods have been paid. */
export function getNextDueDate(moveIn: Date | string, paymentsCount: number): TZDate {
  return dueDateForOccurrence(moveIn, paymentsCount);
}

/** Days until due (positive = upcoming, 0 = today, negative = days late). */
export function getDaysUntilDue(dueDate: Date | string, today: Date | string): number {
  return differenceInCalendarDays(toLagosDate(dueDate), toLagosDate(today));
}

/** Days late for a given due date (0 if not yet due). */
export function getDaysLate(dueDate: Date | string, today: Date | string): number {
  return Math.max(0, -getDaysUntilDue(dueDate, today));
}
