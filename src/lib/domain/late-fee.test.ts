import { describe, expect, it } from "vitest";
import { isPastGrace, lateFeeChargeAmount, lateFeesOwed } from "./late-fee";
import type { UnpaidPeriod } from "./balance";

const period = (daysLate: number): UnpaidPeriod => ({
  occurrenceIndex: 0,
  dueDate: new Date(),
  daysLate,
});

describe("isPastGrace", () => {
  it("is false during the grace window", () => {
    expect(isPastGrace(0)).toBe(false);
    expect(isPastGrace(2)).toBe(false);
  });

  it("is true once the grace period is up", () => {
    expect(isPastGrace(3)).toBe(true);
    expect(isPastGrace(10)).toBe(true);
  });
});

describe("lateFeesOwed", () => {
  it("owes nothing within the grace period", () => {
    expect(lateFeesOwed([period(0), period(2)], 0)).toBe(0);
  });

  it("owes one fee for a single missed month, once only", () => {
    expect(lateFeesOwed([period(3)], 0)).toBe(1);
    // The fee has already been charged — don't charge it again.
    expect(lateFeesOwed([period(3)], 1)).toBe(0);
    expect(lateFeesOwed([period(10)], 1)).toBe(0);
  });

  it("owes one fee per missed month when arrears span several months", () => {
    expect(lateFeesOwed([period(92), period(61), period(31), period(0)], 0)).toBe(3);
    // Two of the three have already been charged.
    expect(lateFeesOwed([period(92), period(61), period(31), period(0)], 2)).toBe(1);
  });
});

describe("lateFeeChargeAmount", () => {
  it("multiplies the per-fee amount by the count owed", () => {
    expect(lateFeeChargeAmount(1)).toBe(10_000);
    expect(lateFeeChargeAmount(3)).toBe(30_000);
    expect(lateFeeChargeAmount(0)).toBe(0);
  });
});
