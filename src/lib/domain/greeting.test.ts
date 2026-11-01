import { describe, expect, it } from "vitest";
import { getGreeting, getTimeOfDay } from "./greeting";

describe("getTimeOfDay", () => {
  it("is morning before noon in Lagos", () => {
    expect(getTimeOfDay("2026-11-01T06:00:00+01:00")).toBe("morning");
    expect(getTimeOfDay("2026-11-01T11:59:00+01:00")).toBe("morning");
  });

  it("is afternoon from noon to before 6pm in Lagos", () => {
    expect(getTimeOfDay("2026-11-01T12:00:00+01:00")).toBe("afternoon");
    expect(getTimeOfDay("2026-11-01T17:59:00+01:00")).toBe("afternoon");
  });

  it("is evening from 6pm in Lagos", () => {
    expect(getTimeOfDay("2026-11-01T18:00:00+01:00")).toBe("evening");
    expect(getTimeOfDay("2026-11-01T23:30:00+01:00")).toBe("evening");
  });

  it("uses the Lagos offset, not UTC", () => {
    // 23:30 UTC is already past midnight (00:30) in Lagos (+1).
    expect(getTimeOfDay("2026-11-01T23:30:00Z")).toBe("morning");
  });
});

describe("getGreeting", () => {
  it("includes the name after the time-of-day greeting", () => {
    expect(getGreeting("Collins", "2026-11-01T06:00:00+01:00")).toBe("Good morning, Collins");
    expect(getGreeting("Collins", "2026-11-01T14:00:00+01:00")).toBe("Good afternoon, Collins");
    expect(getGreeting("Collins", "2026-11-01T20:00:00+01:00")).toBe("Good evening, Collins");
  });
});
