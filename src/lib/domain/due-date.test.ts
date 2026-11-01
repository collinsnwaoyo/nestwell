import { describe, expect, it } from "vitest";
import {
  dueDateForOccurrence,
  getDaysLate,
  getDaysUntilDue,
  getNextDueDate,
  occurrencesDueBy,
} from "./due-date";

describe("dueDateForOccurrence", () => {
  it("falls on the move-in day for occurrence 0", () => {
    const due = dueDateForOccurrence("2025-06-14T00:00:00Z", 0);
    expect(due.getFullYear()).toBe(2025);
    expect(due.getMonth()).toBe(5); // June
    expect(due.getDate()).toBe(14);
  });

  it("repeats on the same day of month going forward", () => {
    const due = dueDateForOccurrence("2025-06-14T00:00:00Z", 2);
    expect(due.getMonth()).toBe(7); // August
    expect(due.getDate()).toBe(14);
  });

  it("clamps to the last day of a shorter month (non-leap February)", () => {
    const due = dueDateForOccurrence("2025-01-31T00:00:00Z", 1);
    expect(due.getMonth()).toBe(1); // February
    expect(due.getDate()).toBe(28);
  });

  it("clamps to the last day of February on a leap year", () => {
    const due = dueDateForOccurrence("2024-01-31T00:00:00Z", 1);
    expect(due.getMonth()).toBe(1); // February
    expect(due.getDate()).toBe(29);
  });

  it("returns to the 31st once the target month has one again", () => {
    const due = dueDateForOccurrence("2025-01-31T00:00:00Z", 2);
    expect(due.getMonth()).toBe(2); // March
    expect(due.getDate()).toBe(31);
  });
});

describe("occurrencesDueBy", () => {
  it("is 0 before the first due date", () => {
    expect(occurrencesDueBy("2025-06-14T00:00:00Z", "2025-06-13T00:00:00Z")).toBe(0);
  });

  it("is 1 on the move-in day itself", () => {
    expect(occurrencesDueBy("2025-06-14T00:00:00Z", "2025-06-14T00:00:00Z")).toBe(1);
  });

  it("counts each monthly occurrence that has come due", () => {
    expect(occurrencesDueBy("2025-06-14T00:00:00Z", "2025-09-20T00:00:00Z")).toBe(4);
  });

  it("handles month-end clamping when counting occurrences", () => {
    // Move-in on the 31st: occurrences fall on Jan 31, Feb 28, Mar 31, Apr 30.
    expect(occurrencesDueBy("2025-01-31T00:00:00Z", "2025-04-29T00:00:00Z")).toBe(3);
    expect(occurrencesDueBy("2025-01-31T00:00:00Z", "2025-04-30T00:00:00Z")).toBe(4);
  });
});

describe("getNextDueDate", () => {
  it("is the move-in date when nothing has been paid", () => {
    const due = getNextDueDate("2025-06-14T00:00:00Z", 0);
    expect(due.getMonth()).toBe(5);
    expect(due.getDate()).toBe(14);
  });

  it("advances one occurrence per payment", () => {
    const due = getNextDueDate("2025-06-14T00:00:00Z", 3);
    expect(due.getMonth()).toBe(8); // September
    expect(due.getDate()).toBe(14);
  });
});

describe("Lagos timezone handling", () => {
  it("uses the Lagos calendar day, not the UTC day, near midnight", () => {
    // In Lagos (UTC+1): dueDate is 2024-03-15T01:00, today is 2024-03-15T00:30 — same Lagos day.
    const dueDate = "2024-03-15T00:00:00Z";
    const today = "2024-03-14T23:30:00Z";
    expect(getDaysUntilDue(dueDate, today)).toBe(0);
    expect(getDaysLate(dueDate, today)).toBe(0);
  });

  it("still reports a day late once the Lagos day has turned over", () => {
    const dueDate = "2024-03-14T23:30:00Z"; // Lagos: 2024-03-15T00:30
    const today = "2024-03-15T23:00:00Z"; // Lagos: 2024-03-16T00:00
    expect(getDaysLate(dueDate, today)).toBe(1);
  });
});

describe("getDaysUntilDue / getDaysLate", () => {
  it("is positive before the due date", () => {
    expect(getDaysUntilDue("2025-06-14T00:00:00Z", "2025-06-11T00:00:00Z")).toBe(3);
  });

  it("is zero on the due date", () => {
    expect(getDaysUntilDue("2025-06-14T00:00:00Z", "2025-06-14T00:00:00Z")).toBe(0);
  });

  it("is negative once overdue, and getDaysLate mirrors it positively", () => {
    expect(getDaysUntilDue("2025-06-14T00:00:00Z", "2025-06-17T00:00:00Z")).toBe(-3);
    expect(getDaysLate("2025-06-14T00:00:00Z", "2025-06-17T00:00:00Z")).toBe(3);
  });

  it("getDaysLate is 0 when not yet due", () => {
    expect(getDaysLate("2025-06-14T00:00:00Z", "2025-06-11T00:00:00Z")).toBe(0);
  });
});
