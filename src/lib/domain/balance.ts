import { dueDateForOccurrence, getDaysLate, occurrencesDueBy } from "./due-date";

export interface UnpaidPeriod {
  occurrenceIndex: number;
  dueDate: Date;
  /** 0 if this period isn't due yet. */
  daysLate: number;
}

/** The rent periods that are due but not yet paid, oldest first. */
export function getUnpaidPeriods(
  moveIn: Date | string,
  today: Date | string,
  paymentsCount: number,
): UnpaidPeriod[] {
  const dueCount = occurrencesDueBy(moveIn, today);
  const unpaidCount = Math.max(0, dueCount - paymentsCount);

  const periods: UnpaidPeriod[] = [];
  for (let i = 0; i < unpaidCount; i++) {
    const occurrenceIndex = paymentsCount + i;
    const dueDate = dueDateForOccurrence(moveIn, occurrenceIndex);
    periods.push({ occurrenceIndex, dueDate, daysLate: getDaysLate(dueDate, today) });
  }
  return periods;
}

export interface Charge {
  amount: number;
}

/** Outstanding balance: unpaid rent for periods already due, plus any charges. */
export function computeBalance({
  rent,
  unpaidPeriods,
  charges,
}: {
  rent: number;
  unpaidPeriods: UnpaidPeriod[];
  charges: Charge[];
}): number {
  const rentOwed = unpaidPeriods.length * rent;
  const chargesOwed = charges.reduce((sum, charge) => sum + charge.amount, 0);
  return rentOwed + chargesOwed;
}
