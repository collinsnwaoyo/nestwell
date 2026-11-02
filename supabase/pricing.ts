// How the demo portfolio's rents are set: cost-plus, the way the business runs.
// Each unit is leased from a landlord a year upfront, furnished, and let room by
// room (or bed by bed) month to month with power, internet, cleaning and
// maintenance included. The price per bed covers the unit's monthly cost at
// the target occupancy and still leaves the target margin.
//
// Inputs are October 2026 Lagos figures: annual leases from listings
// (Nigeria Property Centre, PropertyPro, Jiji), furnishing at what it costs to
// fit out each layout, and bills at Band A power tariffs plus internet and
// cleaning. See "Pricing" in docs/PRD.md.

export const PRICING = {
  /** Share of bed-months actually let; leaves room for gaps between tenants. */
  occupancy: 0.9,
  /** Profit as a share of rent collected. */
  margin: 0.2,
  /** Furniture and appliances are written off over this many months. */
  furnishingLifeMonths: 36,
  /** Agency and legal fees on the lease, 10% each, as a share of the annual rent. */
  leaseFees: 0.2,
  /** Rents are rounded to the nearest ₦5,000. */
  roundTo: 5_000,
} as const;

export type PricedRoomType = "studio" | "single" | "double" | "triple";

/** Price of one bed relative to a private room: sharing a room is cheaper per head. */
export const BED_WEIGHT: Record<PricedRoomType, number> = {
  studio: 1,
  single: 1,
  double: 0.75,
  triple: 0.6,
};

export interface Unit {
  /** Annual rent paid to the landlord. */
  leasePerYear: number;
  /** One-off cost to furnish the whole unit. */
  furnishing: number;
  /** Bills the business covers each month: power, internet, cleaning, gas, maintenance, estate charges. */
  servicesPerMonth: number;
  rooms: Record<string, { type: PricedRoomType; beds: number }>;
}

/** What the unit costs to run each month. */
export function monthlyCost(unit: Unit): number {
  return (
    (unit.leasePerYear * (1 + PRICING.leaseFees)) / 12 +
    unit.furnishing / PRICING.furnishingLifeMonths +
    unit.servicesPerMonth
  );
}

/** Monthly rent per bed for each room in the unit. */
export function priceRooms<K extends string>(unit: Unit & { rooms: Record<K, Unit["rooms"][string]> }): Record<K, number> {
  const target = monthlyCost(unit) / PRICING.occupancy / (1 - PRICING.margin);
  const rooms = Object.entries(unit.rooms) as [K, Unit["rooms"][string]][];
  const weight = rooms.reduce((sum, [, room]) => sum + BED_WEIGHT[room.type] * room.beds, 0);
  return Object.fromEntries(
    rooms.map(([key, room]) => [
      key,
      Math.round((target / weight) * BED_WEIGHT[room.type] / PRICING.roundTo) * PRICING.roundTo,
    ]),
  ) as Record<K, number>;
}

export const UNITS = {
  lekki: {
    // Studio in Lekki Phase 1: leases run ₦2.5M–₦3.5M a year; estate service charge included in bills.
    leasePerYear: 3_000_000,
    furnishing: 3_000_000,
    servicesPerMonth: 190_000,
    rooms: { studio: { type: "studio", beds: 1 } },
  },
  yaba: {
    // Self-contain in Akoka: about ₦1.2M–₦1.3M a year.
    leasePerYear: 1_300_000,
    furnishing: 2_000_000,
    servicesPerMonth: 120_000,
    rooms: { selfCon: { type: "single", beds: 1 } },
  },
  surulere: {
    // 3-bedroom flat, six beds across three rooms.
    leasePerYear: 4_000_000,
    furnishing: 5_000_000,
    servicesPerMonth: 345_000,
    rooms: {
      triple: { type: "triple", beds: 3 },
      double: { type: "double", beds: 2 },
      single: { type: "single", beds: 1 },
    },
  },
  ikota: {
    // 2-bedroom flat in Ikota GRA, three beds; includes the estate's ₦65,000 monthly service charge.
    leasePerYear: 4_500_000,
    furnishing: 4_500_000,
    servicesPerMonth: 305_000,
    rooms: {
      double: { type: "double", beds: 2 },
      single: { type: "single", beds: 1 },
    },
  },
} satisfies Record<string, Unit>;
