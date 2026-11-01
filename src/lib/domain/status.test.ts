import { describe, expect, it } from "vitest";
import { deriveStatus } from "./status";

describe("deriveStatus", () => {
  it("is vacant once checked out, regardless of due date", () => {
    expect(deriveStatus({ tenancyStatus: "checked_out", daysUntilDue: -10 })).toBe("vacant");
  });

  it("is notice whenever notice has been issued, regardless of due date", () => {
    expect(deriveStatus({ tenancyStatus: "notice", daysUntilDue: 10 })).toBe("notice");
  });

  it("is paid well before the due date", () => {
    expect(deriveStatus({ tenancyStatus: "active", daysUntilDue: 10 })).toBe("paid");
  });

  it("is due_soon within the 3-day reminder window", () => {
    expect(deriveStatus({ tenancyStatus: "active", daysUntilDue: 3 })).toBe("due_soon");
    expect(deriveStatus({ tenancyStatus: "active", daysUntilDue: 1 })).toBe("due_soon");
  });

  it("is due_today exactly on the due date", () => {
    expect(deriveStatus({ tenancyStatus: "active", daysUntilDue: 0 })).toBe("due_today");
  });

  it("is overdue for any days late, grace period or not", () => {
    expect(deriveStatus({ tenancyStatus: "active", daysUntilDue: -1 })).toBe("overdue");
    expect(deriveStatus({ tenancyStatus: "active", daysUntilDue: -3 })).toBe("overdue");
    expect(deriveStatus({ tenancyStatus: "active", daysUntilDue: -30 })).toBe("overdue");
  });
});
