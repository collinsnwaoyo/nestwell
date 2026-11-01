import { describe, expect, it } from "vitest";
import { computeBalance, getUnpaidPeriods } from "./balance";

describe("getUnpaidPeriods", () => {
  it("is empty once every due period has been paid", () => {
    const periods = getUnpaidPeriods("2025-06-14T00:00:00Z", "2025-06-14T00:00:00Z", 1);
    expect(periods).toEqual([]);
  });

  it("lists one unpaid period on the due day with nothing paid yet", () => {
    const periods = getUnpaidPeriods("2025-06-14T00:00:00Z", "2025-06-14T00:00:00Z", 0);
    expect(periods).toHaveLength(1);
    expect(periods[0].occurrenceIndex).toBe(0);
    expect(periods[0].daysLate).toBe(0);
  });

  it("stacks up multiple missed months of arrears", () => {
    const periods = getUnpaidPeriods("2025-06-14T00:00:00Z", "2025-09-14T00:00:00Z", 0);
    expect(periods.map((p) => p.occurrenceIndex)).toEqual([0, 1, 2, 3]);
    // The oldest period (June) is the most days late; the newest (Sept) is due today.
    expect(periods[0].daysLate).toBe(92);
    expect(periods[3].daysLate).toBe(0);
  });
});

describe("computeBalance", () => {
  it("is 0 when nothing is unpaid and there are no charges", () => {
    expect(computeBalance({ rent: 280_000, unpaidPeriods: [], charges: [] })).toBe(0);
  });

  it("owes one month's rent for one unpaid period", () => {
    const balance = computeBalance({
      rent: 280_000,
      unpaidPeriods: [{ occurrenceIndex: 0, dueDate: new Date(), daysLate: 3 }],
      charges: [],
    });
    expect(balance).toBe(280_000);
  });

  it("adds charges (e.g. a late fee) on top of unpaid rent", () => {
    const balance = computeBalance({
      rent: 280_000,
      unpaidPeriods: [{ occurrenceIndex: 0, dueDate: new Date(), daysLate: 3 }],
      charges: [{ amount: 10_000 }],
    });
    expect(balance).toBe(290_000);
  });
});
