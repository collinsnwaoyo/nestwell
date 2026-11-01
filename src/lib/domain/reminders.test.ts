import { describe, expect, it } from "vitest";
import { reminderDueToday, shouldFlagForNotice } from "./reminders";

describe("reminderDueToday", () => {
  it("fires the due_soon reminder exactly 3 days before due", () => {
    expect(reminderDueToday(3)).toBe("due_soon");
  });

  it("fires the due_today reminder on the due date", () => {
    expect(reminderDueToday(0)).toBe("due_today");
  });

  it("fires the overdue reminder exactly 3 days late", () => {
    expect(reminderDueToday(-3)).toBe("overdue");
  });

  it("is silent on every other day, including inside the grace window", () => {
    expect(reminderDueToday(10)).toBeNull();
    expect(reminderDueToday(2)).toBeNull();
    expect(reminderDueToday(1)).toBeNull();
    expect(reminderDueToday(-1)).toBeNull();
    expect(reminderDueToday(-2)).toBeNull();
    expect(reminderDueToday(-10)).toBeNull();
  });
});

describe("shouldFlagForNotice", () => {
  it("doesn't flag during the grace period", () => {
    expect(shouldFlagForNotice(0)).toBe(false);
    expect(shouldFlagForNotice(2)).toBe(false);
  });

  it("flags from the late-fee day onward", () => {
    expect(shouldFlagForNotice(3)).toBe(true);
    expect(shouldFlagForNotice(30)).toBe(true);
  });
});
