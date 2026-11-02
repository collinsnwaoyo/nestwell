import { describe, expect, it } from "vitest";
import { fillTemplate } from "./templates";
import { MESSAGE_TEMPLATES } from "@/config/rules";

describe("fillTemplate", () => {
  it("replaces every known field", () => {
    const result = fillTemplate(MESSAGE_TEMPLATES.dueSoon, {
      firstName: "Damilola",
      amount: "₦180,000",
      room: "Surulere, Shared",
      dueDate: "4 Nov",
    });
    expect(result).toBe(
      "Hi Damilola, a reminder that your Nestwell rent of ₦180,000 for Surulere, Shared is due on 4 Nov. Thank you!",
    );
  });

  it("leaves unknown placeholders untouched", () => {
    expect(fillTemplate("Hi {firstName}, {mystery}", { firstName: "Collins" })).toBe(
      "Hi Collins, {mystery}",
    );
  });

  it("doesn't double the full stop when a value already ends a sentence", () => {
    const result = fillTemplate(MESSAGE_TEMPLATES.notice, {
      firstName: "Emeka",
      room: "Single room",
      date: "16 Nov 2026",
      reason: "Rent more than 30 days overdue after repeated follow-up.",
    });
    expect(result).toBe(
      "Hi Emeka, this is formal notice to vacate Single room by 16 Nov 2026. Reason: Rent more than 30 days overdue after repeated follow-up.",
    );
    expect(fillTemplate("Reason: {reason}.", { reason: "Damage to the room" })).toBe("Reason: Damage to the room.");
  });

  it("templates contain no em dashes", () => {
    for (const template of Object.values(MESSAGE_TEMPLATES)) expect(template).not.toContain("—");
  });
});
