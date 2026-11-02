import { describe, expect, it } from "vitest";
import { describeDue, formatDate, formatTime, formatTimestamp } from "./format-date";

describe("date formatting", () => {
  // 10:43 UTC is 11:43am in Lagos (UTC+1).
  const instant = "2026-11-02T10:43:00Z";

  it("formats dates as day, short month, year", () => {
    expect(formatDate(instant)).toBe("2 Nov 2026");
  });

  it("uses a 12-hour clock with lowercase am/pm in Lagos time", () => {
    expect(formatTime(instant)).toBe("11:43am");
    expect(formatTime("2026-11-02T14:05:00Z")).toBe("3:05pm");
  });

  it("formats timestamps as day, month and time", () => {
    expect(formatTimestamp(instant)).toBe("2 Nov, 11:43am");
  });

  it("rolls over to the next day in Lagos after 11pm UTC", () => {
    expect(formatDate("2026-11-02T23:30:00Z")).toBe("3 Nov 2026");
  });

  it("describes where the next rent stands", () => {
    expect(describeDue(-12, "2026-10-21")).toBe("12 days late");
    expect(describeDue(-1, "2026-11-01")).toBe("1 day late");
    expect(describeDue(0, "2026-11-02")).toBe("Due today");
    expect(describeDue(3, "2026-11-05")).toBe("Due 5 Nov");
  });
});
