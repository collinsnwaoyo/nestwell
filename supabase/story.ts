// Where each seeded tenant stands relative to the day the seed runs. The seed
// works backwards from these to move-in dates (see moveInForNextDue), so the
// PRD's demo story holds whatever the date: Babatunde due today, Damilola due
// in 3 days, Halima overdue with a late fee, Emeka on notice.

export interface StoryBeat {
  /** Days from today to the next unpaid due date. Negative = that many days late. */
  nextDueInDays: number;
  /** Months already paid, about four for everyone (may shift by one at month-ends). */
  paidMonths: number;
}

export const STORY = {
  "Tolulope Adebayo": { nextDueInDays: 13, paidMonths: 4 },
  "Babatunde Lawal": { nextDueInDays: 0, paidMonths: 4 },
  "Ifeoma Nwosu": { nextDueInDays: 8, paidMonths: 4 },
  // Past the 3-day grace, so one late fee; the following month isn't due yet.
  "Halima Bello": { nextDueInDays: -12, paidMonths: 3 },
  "Kelechi Eze": { nextDueInDays: 10, paidMonths: 4 },
  "Damilola Ogunleye": { nextDueInDays: 3, paidMonths: 4 },
  // More than 30 days behind, which is why notice was issued.
  "Emeka Obi": { nextDueInDays: -34, paidMonths: 3 },
  "Zainab Yusuf": { nextDueInDays: 16, paidMonths: 4 },
  "Funmilayo Ajayi": { nextDueInDays: 23, paidMonths: 4 },
} satisfies Record<string, StoryBeat>;

export type StoryTenant = keyof typeof STORY;
