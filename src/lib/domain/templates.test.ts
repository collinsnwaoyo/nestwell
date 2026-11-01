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
});
