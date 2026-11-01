import { describe, expect, it } from "vitest";
import { formatNaira } from "./money";

describe("formatNaira", () => {
  it("formats with the naira sign and thousands separators", () => {
    expect(formatNaira(280_000)).toBe("₦280,000");
    expect(formatNaira(2_010_000)).toBe("₦2,010,000");
    expect(formatNaira(0)).toBe("₦0");
  });
});
