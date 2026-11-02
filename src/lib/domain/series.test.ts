import { describe, expect, it } from "vitest";
import {
  collectedInWindow,
  cumulativeDue,
  isOccupiedOn,
  occupiedCountOn,
  rentRollOn,
  sampleDates,
} from "./series";

const today = "2026-11-02T10:00:00+01:00";

describe("sampleDates", () => {
  it("ends today and steps back evenly, oldest first", () => {
    const dates = sampleDates(today, 3, 7);
    expect(dates.map((d) => d.getDate())).toEqual([19, 26, 2]);
  });
});

describe("isOccupiedOn", () => {
  const span = { moveIn: "2026-07-15", moveOut: "2026-11-10", rent: 100 };

  it("starts on the move-in day", () => {
    expect(isOccupiedOn(span, "2026-07-14T12:00:00+01:00")).toBe(false);
    expect(isOccupiedOn(span, "2026-07-15T12:00:00+01:00")).toBe(true);
  });

  it("ends the day before move-out", () => {
    expect(isOccupiedOn(span, "2026-11-09T12:00:00+01:00")).toBe(true);
    expect(isOccupiedOn(span, "2026-11-10T12:00:00+01:00")).toBe(false);
  });

  it("stays occupied with no move-out date", () => {
    expect(isOccupiedOn({ ...span, moveOut: null }, "2030-01-01T12:00:00+01:00")).toBe(true);
  });
});

describe("occupiedCountOn and rentRollOn", () => {
  const spans = [
    { moveIn: "2026-07-01", moveOut: null, rent: 280_000 },
    { moveIn: "2026-10-01", moveOut: null, rent: 180_000 },
  ];

  it("count and sum only tenancies live on that day", () => {
    expect(occupiedCountOn(spans, "2026-08-01T12:00:00+01:00")).toBe(1);
    expect(rentRollOn(spans, "2026-08-01T12:00:00+01:00")).toBe(280_000);
    expect(rentRollOn(spans, today)).toBe(460_000);
  });
});

describe("collectedInWindow", () => {
  const payments = [
    { amount: 100, paidAt: "2026-11-02T08:00:00+01:00" },
    { amount: 200, paidAt: "2026-10-04T08:00:00+01:00" },
    { amount: 400, paidAt: "2026-10-03T08:00:00+01:00" },
  ];

  it("includes today and the previous days in the window only", () => {
    expect(collectedInWindow(payments, today, 30)).toBe(300);
  });
});

describe("cumulativeDue", () => {
  it("counts overdue from day 0 and adds each item on its due day", () => {
    const items = [
      { dueDate: "2026-10-28", amount: 290_000 },
      { dueDate: "2026-11-02", amount: 280_000 },
      { dueDate: "2026-11-05", amount: 180_000 },
    ];
    const series = cumulativeDue(items, today, 4);
    expect(series).toEqual([570_000, 570_000, 570_000, 750_000, 750_000]);
  });
});
