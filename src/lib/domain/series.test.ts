import { describe, expect, it } from "vitest";
import { collectedInWindow, dailyCumulativeCollected } from "./series";

const today = "2026-11-02T10:00:00Z";
const payments = [
  { amount: 100_000, paidAt: "2026-11-02T08:00:00Z" }, // today
  { amount: 50_000, paidAt: "2026-10-20T08:00:00Z" }, // 13 days ago
  { amount: 70_000, paidAt: "2026-10-04T08:00:00Z" }, // 29 days ago, last day in the window
  { amount: 90_000, paidAt: "2026-10-03T08:00:00Z" }, // 30 days ago, just outside
  { amount: 10_000, paidAt: "2026-11-03T08:00:00Z" }, // tomorrow, ignored
];

describe("collectedInWindow", () => {
  it("sums payments in the window ending today, inclusive", () => {
    expect(collectedInWindow(payments, today, 30)).toBe(220_000);
  });

  it("counts by Lagos calendar day", () => {
    // 23:30 UTC on 1 Nov is 00:30 on 2 Nov in Lagos.
    expect(collectedInWindow([{ amount: 5, paidAt: "2026-11-01T23:30:00Z" }], today, 1)).toBe(5);
  });
});

describe("dailyCumulativeCollected", () => {
  const series = dailyCumulativeCollected(payments, today, 30);

  it("has one point per day, oldest first, ending today", () => {
    expect(series).toHaveLength(30);
    expect(series[0].date).toBe("2026-10-04");
    expect(series[29].date).toBe("2026-11-02");
  });

  it("is a running total that ends at the window total", () => {
    expect(series[0].total).toBe(70_000);
    expect(series[16].total).toBe(120_000); // 20 Oct
    expect(series[29].total).toBe(collectedInWindow(payments, today, 30));
  });

  it("never goes down", () => {
    for (let i = 1; i < series.length; i++) expect(series[i].total).toBeGreaterThanOrEqual(series[i - 1].total);
  });
});
