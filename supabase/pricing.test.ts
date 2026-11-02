import { describe, expect, it } from "vitest";
import { BED_WEIGHT, PRICING, UNITS, monthlyCost, priceRooms, type Unit } from "./pricing";

function fullRent(unit: Unit, prices: Record<string, number>) {
  return Object.entries(unit.rooms).reduce((sum, [key, room]) => sum + prices[key] * room.beds, 0);
}

describe("pricing model", () => {
  it("costs a unit as lease with fees, furnishing written off, and bills", () => {
    const unit: Unit = {
      leasePerYear: 1_200_000,
      furnishing: 3_600_000,
      servicesPerMonth: 50_000,
      rooms: { a: { type: "single", beds: 1 } },
    };
    // 1.2M x 1.2 / 12 = 120k, 3.6M / 36 = 100k, plus 50k.
    expect(monthlyCost(unit)).toBe(270_000);
  });

  for (const [name, unit] of Object.entries(UNITS) as [string, Unit][]) {
    it(`${name}: at the target occupancy, rent covers cost and leaves the margin`, () => {
      const prices = priceRooms(unit);
      const collected = fullRent(unit, prices) * PRICING.occupancy;
      const profit = collected - monthlyCost(unit);
      // Rounding to ₦5,000 can move the margin by a fraction of a point.
      expect(profit / collected).toBeGreaterThan(PRICING.margin - 0.02);
      for (const price of Object.values(prices)) expect(price % PRICING.roundTo).toBe(0);
    });
  }

  it("charges less per bed the more people share a room", () => {
    const prices = priceRooms(UNITS.surulere);
    expect(prices.single).toBeGreaterThan(prices.double);
    expect(prices.double).toBeGreaterThan(prices.triple);
    expect(BED_WEIGHT.triple).toBeLessThan(BED_WEIGHT.double);
  });

  it("produces the rents the demo story is told with", () => {
    expect(priceRooms(UNITS.lekki)).toEqual({ studio: 795_000 });
    expect(priceRooms(UNITS.yaba)).toEqual({ selfCon: 425_000 });
    expect(priceRooms(UNITS.surulere)).toEqual({ triple: 170_000, double: 215_000, single: 285_000 });
    expect(priceRooms(UNITS.ikota)).toEqual({ double: 365_000, single: 490_000 });
  });
});
