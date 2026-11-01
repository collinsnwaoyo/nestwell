import "server-only";
import { getSupabaseClient } from "./client";
import {
  computeBalance,
  deriveStatus,
  getDaysUntilDue,
  getNextDueDate,
  getUnpaidPeriods,
  type RentStatus,
} from "@/lib/domain";

export interface PropertySummary {
  id: string;
  name: string;
  area: string;
  photoUrl: string | null;
  bedsTotal: number;
  bedsFilled: number;
  amountOwed: number;
  /** Highest-severity status among the property's tenancies, for the dashboard chip. */
  flag: Extract<RentStatus, "overdue" | "notice"> | null;
}

export interface DashboardData {
  propertiesCount: number;
  bedsTotal: number;
  bedsFilled: number;
  expectedRevenue: number;
  collectedSoFar: number;
  properties: PropertySummary[];
}

export async function getDashboardData(today: Date = new Date()): Promise<DashboardData> {
  const supabase = getSupabaseClient();

  const [propertiesRes, roomsRes, bedsRes, tenanciesRes, paymentsRes, chargesRes] =
    await Promise.all([
      supabase.from("properties").select("*").order("name"),
      supabase.from("rooms").select("*"),
      supabase.from("beds").select("*"),
      supabase.from("tenancies").select("*").in("status", ["active", "notice"]),
      supabase.from("payments").select("tenancy_id"),
      supabase.from("charges").select("tenancy_id, amount"),
    ]);

  for (const res of [propertiesRes, roomsRes, bedsRes, tenanciesRes, paymentsRes, chargesRes]) {
    if (res.error) throw new Error(res.error.message);
  }

  const properties = propertiesRes.data ?? [];
  const rooms = roomsRes.data ?? [];
  const beds = bedsRes.data ?? [];
  const tenancies = tenanciesRes.data ?? [];
  const payments = paymentsRes.data ?? [];
  const charges = chargesRes.data ?? [];

  const propertyIdByRoomId = new Map(rooms.map((room) => [room.id, room.property_id]));
  const propertyIdByBedId = new Map(
    beds.map((bed) => [bed.id, propertyIdByRoomId.get(bed.room_id) ?? null]),
  );

  const paymentsCountByTenancy = new Map<string, number>();
  for (const payment of payments) {
    paymentsCountByTenancy.set(
      payment.tenancy_id,
      (paymentsCountByTenancy.get(payment.tenancy_id) ?? 0) + 1,
    );
  }

  const chargeAmountsByTenancy = new Map<string, { amount: number }[]>();
  for (const charge of charges) {
    const list = chargeAmountsByTenancy.get(charge.tenancy_id) ?? [];
    list.push({ amount: charge.amount });
    chargeAmountsByTenancy.set(charge.tenancy_id, list);
  }

  const bedsTotalByProperty = new Map<string, number>();
  for (const bed of beds) {
    const propertyId = propertyIdByBedId.get(bed.id);
    if (!propertyId) continue;
    bedsTotalByProperty.set(propertyId, (bedsTotalByProperty.get(propertyId) ?? 0) + 1);
  }

  let expectedRevenue = 0;
  let collectedSoFar = 0;
  const bedsFilledByProperty = new Map<string, number>();
  const amountOwedByProperty = new Map<string, number>();
  const flagByProperty = new Map<string, Extract<RentStatus, "overdue" | "notice">>();

  for (const tenancy of tenancies) {
    const propertyId = propertyIdByBedId.get(tenancy.bed_id);
    if (!propertyId) continue;

    const paymentsCount = paymentsCountByTenancy.get(tenancy.id) ?? 0;
    const unpaidPeriods = getUnpaidPeriods(tenancy.move_in, today, paymentsCount);
    const tenancyCharges = chargeAmountsByTenancy.get(tenancy.id) ?? [];
    const balance = computeBalance({ rent: tenancy.rent, unpaidPeriods, charges: tenancyCharges });

    expectedRevenue += tenancy.rent;
    if (unpaidPeriods.length === 0) collectedSoFar += tenancy.rent;

    bedsFilledByProperty.set(propertyId, (bedsFilledByProperty.get(propertyId) ?? 0) + 1);
    amountOwedByProperty.set(propertyId, (amountOwedByProperty.get(propertyId) ?? 0) + balance);

    if (tenancy.status === "notice") {
      flagByProperty.set(propertyId, "notice");
    } else {
      const nextDue = getNextDueDate(tenancy.move_in, paymentsCount);
      const daysUntilDue = getDaysUntilDue(nextDue, today);
      const status = deriveStatus({ tenancyStatus: tenancy.status, daysUntilDue });
      if (status === "overdue" && flagByProperty.get(propertyId) !== "notice") {
        flagByProperty.set(propertyId, "overdue");
      }
    }
  }

  const propertySummaries: PropertySummary[] = properties.map((property) => ({
    id: property.id,
    name: property.name,
    area: property.area,
    photoUrl: property.photo_url,
    bedsTotal: bedsTotalByProperty.get(property.id) ?? 0,
    bedsFilled: bedsFilledByProperty.get(property.id) ?? 0,
    amountOwed: amountOwedByProperty.get(property.id) ?? 0,
    flag: flagByProperty.get(property.id) ?? null,
  }));

  return {
    propertiesCount: properties.length,
    bedsTotal: beds.length,
    bedsFilled: tenancies.length,
    expectedRevenue,
    collectedSoFar,
    properties: propertySummaries,
  };
}
