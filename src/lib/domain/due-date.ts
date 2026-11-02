import { TZDate } from "@date-fns/tz";
import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  differenceInCalendarMonths,
  format,
  subMonths,
} from "date-fns";
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

/**
 * Works backwards from where a tenant should stand today: picks a move-in date
 * so that, after `paymentsCount` paid months, the next unpaid due date falls
 * exactly `daysFromToday` from today (negative = that many days late). Used by
 * the demo seed so the story holds on any date.
 *
 * Month-end clamping can make an exact match impossible for one count (a due
 * date on the 31st can't follow four months after a 30-day month), so nearby
 * counts are tried too; the returned `paymentsCount` is the one that fits.
 */
export function moveInForNextDue(
  today: Date | string,
  daysFromToday: number,
  paymentsCount: number,
): { moveIn: string; paymentsCount: number } {
  const target = addDays(toLagosDate(today), daysFromToday);
  const targetIso = format(target, "yyyy-MM-dd");

  for (const count of [paymentsCount, paymentsCount + 1, paymentsCount - 1, paymentsCount + 2]) {
    if (count < 0) continue;
    const candidate = subMonths(target, count);
    // Clamping can only pull the move-in day earlier, so look a few days later as well.
    for (let shift = 0; shift <= 3; shift++) {
      const moveIn = format(addDays(candidate, shift), "yyyy-MM-dd");
      if (format(dueDateForOccurrence(moveIn, count), "yyyy-MM-dd") === targetIso) {
        return { moveIn, paymentsCount: count };
      }
    }
  }
  throw new Error(`No move-in date puts the next due date on ${targetIso}.`);
}

/** Days until due (positive = upcoming, 0 = today, negative = days late). */
export function getDaysUntilDue(dueDate: Date | string, today: Date | string): number {
  return differenceInCalendarDays(toLagosDate(dueDate), toLagosDate(today));
}

/** Days late for a given due date (0 if not yet due). */
export function getDaysLate(dueDate: Date | string, today: Date | string): number {
  return Math.max(0, -getDaysUntilDue(dueDate, today));
}
