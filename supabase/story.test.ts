import { describe, expect, it } from "vitest";
import { addDays } from "date-fns";
import {
  deriveStatus,
  getDaysUntilDue,
  getNextDueDate,
  getUnpaidPeriods,
  lateFeesOwed,
  moveInForNextDue,
  type RentStatus,
} from "../src/lib/domain";
import { STORY, type StoryTenant } from "./story";

// Expected headline status per PRD; Emeka's tenancy is on notice.
const EXPECTED: Record<StoryTenant, RentStatus> = {
  "Tolulope Adebayo": "paid",
  "Babatunde Lawal": "due_today",
  "Ifeoma Nwosu": "paid",
  "Halima Bello": "overdue",
  "Kelechi Eze": "paid",
  "Damilola Ogunleye": "due_soon",
  "Emeka Obi": "notice",
  "Zainab Yusuf": "paid",
  "Funmilayo Ajayi": "paid",
};

// Every day of two years, which covers every month-end and both Februaries.
const DAYS = Array.from({ length: 731 }, (_, i) => addDays(new Date("2026-01-01T12:00:00Z"), i));

describe("demo story", () => {
  for (const [name, beat] of Object.entries(STORY) as [StoryTenant, (typeof STORY)[StoryTenant]][]) {
    it(`${name} is ${EXPECTED[name]} whatever the date`, () => {
      for (const today of DAYS) {
        const { moveIn, paymentsCount } = moveInForNextDue(today, beat.nextDueInDays, beat.paidMonths);
        const daysUntilDue = getDaysUntilDue(getNextDueDate(moveIn, paymentsCount), today);
        const tenancyStatus = name === "Emeka Obi" ? "notice" : "active";

        expect(daysUntilDue).toBe(beat.nextDueInDays);
        expect(deriveStatus({ tenancyStatus, daysUntilDue })).toBe(EXPECTED[name]);
        expect(Math.abs(paymentsCount - beat.paidMonths)).toBeLessThanOrEqual(1);
      }
    });
  }

  it("Halima owes exactly one month and one late fee", () => {
    for (const today of DAYS) {
      const { moveIn, paymentsCount } = moveInForNextDue(today, STORY["Halima Bello"].nextDueInDays, 3);
      const unpaid = getUnpaidPeriods(moveIn, today, paymentsCount);
      expect(unpaid).toHaveLength(1);
      expect(lateFeesOwed(unpaid, 0)).toBe(1);
    }
  });

  it("Emeka is more than 30 days behind with a late fee for each missed month", () => {
    for (const today of DAYS) {
      const { moveIn, paymentsCount } = moveInForNextDue(today, STORY["Emeka Obi"].nextDueInDays, 3);
      const unpaid = getUnpaidPeriods(moveIn, today, paymentsCount);
      expect(unpaid[0].daysLate).toBeGreaterThan(30);
      expect(unpaid).toHaveLength(2);
      expect(lateFeesOwed(unpaid, 0)).toBe(2);
    }
  });
});
