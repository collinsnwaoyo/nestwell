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
import type { Database } from "./types";

type RoomType = Database["public"]["Tables"]["rooms"]["Row"]["type"];
type ReminderMode = Database["public"]["Tables"]["rooms"]["Row"]["reminder_mode"];

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

export interface BedDetail {
  id: string;
  label: string;
  status: RentStatus;
  tenancyId: string | null;
  tenant: {
    fullName: string;
    phone: string;
    email: string;
    occupation: string;
    nextOfKinName: string;
    nextOfKinRelation: string;
    nextOfKinPhone: string;
    emergencyContact: string;
    verified: boolean;
  } | null;
  tenancyStatus: Database["public"]["Tables"]["tenancies"]["Row"]["status"] | null;
  moveIn: string | null;
  nextDueDate: string | null;
  rent: number | null;
  balance: number;
  payments: { id: string; periodMonth: string; amount: number; method: string; paidAt: string }[];
  messages: { id: string; body: string; status: string; trigger: string; createdAt: string }[];
}

export interface RoomDetail {
  id: string;
  name: string;
  type: RoomType;
  rentPerBed: number;
  reminderMode: ReminderMode;
  beds: BedDetail[];
}

export interface PropertyDetail {
  id: string;
  name: string;
  area: string;
  address: string;
  photoUrl: string | null;
  rooms: RoomDetail[];
}

export async function getPropertyDetail(
  propertyId: string,
  today: Date = new Date(),
): Promise<PropertyDetail | null> {
  const supabase = getSupabaseClient();

  const propertyRes = await supabase.from("properties").select("*").eq("id", propertyId).maybeSingle();
  if (propertyRes.error) throw new Error(propertyRes.error.message);
  const property = propertyRes.data;
  if (!property) return null;

  const roomsRes = await supabase
    .from("rooms")
    .select("*")
    .eq("property_id", propertyId)
    .order("name");
  if (roomsRes.error) throw new Error(roomsRes.error.message);
  const rooms = roomsRes.data ?? [];
  const roomIds = rooms.map((room) => room.id);

  const bedsRes = roomIds.length
    ? await supabase.from("beds").select("*").in("room_id", roomIds).order("label")
    : { data: [], error: null };
  if (bedsRes.error) throw new Error(bedsRes.error.message);
  const beds = bedsRes.data ?? [];
  const bedIds = beds.map((bed) => bed.id);

  const tenanciesRes = bedIds.length
    ? await supabase.from("tenancies").select("*").in("bed_id", bedIds).in("status", ["active", "notice"])
    : { data: [], error: null };
  if (tenanciesRes.error) throw new Error(tenanciesRes.error.message);
  const tenancies = tenanciesRes.data ?? [];
  const tenancyIds = tenancies.map((tenancy) => tenancy.id);
  const tenantIds = tenancies.map((tenancy) => tenancy.tenant_id);

  const [tenantsRes, paymentsRes, chargesRes, messagesRes] = await Promise.all([
    tenantIds.length
      ? supabase.from("tenants").select("*").in("id", tenantIds)
      : Promise.resolve({ data: [], error: null }),
    tenancyIds.length
      ? supabase.from("payments").select("*").in("tenancy_id", tenancyIds).order("period_month")
      : Promise.resolve({ data: [], error: null }),
    tenancyIds.length
      ? supabase.from("charges").select("*").in("tenancy_id", tenancyIds)
      : Promise.resolve({ data: [], error: null }),
    tenancyIds.length
      ? supabase
          .from("messages")
          .select("*")
          .in("tenancy_id", tenancyIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
  ]);
  for (const res of [tenantsRes, paymentsRes, chargesRes, messagesRes]) {
    if (res.error) throw new Error(res.error.message);
  }

  const tenantsById = new Map((tenantsRes.data ?? []).map((tenant) => [tenant.id, tenant]));
  const tenancyByBedId = new Map(tenancies.map((tenancy) => [tenancy.bed_id, tenancy]));

  type PaymentRow = Database["public"]["Tables"]["payments"]["Row"];
  type ChargeRow = Database["public"]["Tables"]["charges"]["Row"];
  type MessageRow = Database["public"]["Tables"]["messages"]["Row"];

  const payments = (paymentsRes.data ?? []) as PaymentRow[];
  const charges = (chargesRes.data ?? []) as ChargeRow[];
  const messages = (messagesRes.data ?? []) as MessageRow[];

  const paymentsByTenancy = new Map<string, PaymentRow[]>();
  for (const payment of payments) {
    const list = paymentsByTenancy.get(payment.tenancy_id) ?? [];
    list.push(payment);
    paymentsByTenancy.set(payment.tenancy_id, list);
  }

  const chargesByTenancy = new Map<string, ChargeRow[]>();
  for (const charge of charges) {
    const list = chargesByTenancy.get(charge.tenancy_id) ?? [];
    list.push(charge);
    chargesByTenancy.set(charge.tenancy_id, list);
  }

  const messagesByTenancy = new Map<string, MessageRow[]>();
  for (const message of messages) {
    if (!message.tenancy_id) continue;
    const list = messagesByTenancy.get(message.tenancy_id) ?? [];
    list.push(message);
    messagesByTenancy.set(message.tenancy_id, list);
  }

  const bedsByRoom = new Map<string, typeof beds>();
  for (const bed of beds) {
    const list = bedsByRoom.get(bed.room_id) ?? [];
    list.push(bed);
    bedsByRoom.set(bed.room_id, list);
  }

  const roomDetails: RoomDetail[] = rooms.map((room) => ({
    id: room.id,
    name: room.name,
    type: room.type,
    rentPerBed: room.rent_per_bed,
    reminderMode: room.reminder_mode,
    beds: (bedsByRoom.get(room.id) ?? []).map((bed): BedDetail => {
      const tenancy = tenancyByBedId.get(bed.id);
      if (!tenancy) {
        return {
          id: bed.id,
          label: bed.label,
          status: "vacant",
          tenancyId: null,
          tenant: null,
          tenancyStatus: null,
          moveIn: null,
          nextDueDate: null,
          rent: null,
          balance: 0,
          payments: [],
          messages: [],
        };
      }

      const tenant = tenantsById.get(tenancy.tenant_id) ?? null;
      const tenancyPayments = paymentsByTenancy.get(tenancy.id) ?? [];
      const tenancyCharges = chargesByTenancy.get(tenancy.id) ?? [];
      const unpaidPeriods = getUnpaidPeriods(tenancy.move_in, today, tenancyPayments.length);
      const balance = computeBalance({ rent: tenancy.rent, unpaidPeriods, charges: tenancyCharges });
      const nextDueDate = getNextDueDate(tenancy.move_in, tenancyPayments.length);
      const daysUntilDue = getDaysUntilDue(nextDueDate, today);
      const status = deriveStatus({ tenancyStatus: tenancy.status, daysUntilDue });

      return {
        id: bed.id,
        label: bed.label,
        status,
        tenancyId: tenancy.id,
        tenant: tenant
          ? {
              fullName: tenant.full_name,
              phone: tenant.phone,
              email: tenant.email,
              occupation: tenant.occupation,
              nextOfKinName: tenant.next_of_kin_name,
              nextOfKinRelation: tenant.next_of_kin_relation,
              nextOfKinPhone: tenant.next_of_kin_phone,
              emergencyContact: tenant.emergency_contact,
              verified: tenant.verified,
            }
          : null,
        tenancyStatus: tenancy.status,
        moveIn: tenancy.move_in,
        nextDueDate: nextDueDate.toISOString(),
        rent: tenancy.rent,
        balance,
        payments: tenancyPayments.map((payment) => ({
          id: payment.id,
          periodMonth: payment.period_month,
          amount: payment.amount,
          method: payment.method,
          paidAt: payment.paid_at,
        })),
        messages: (messagesByTenancy.get(tenancy.id) ?? []).slice(0, 5).map((message) => ({
          id: message.id,
          body: message.body,
          status: message.status,
          trigger: message.trigger,
          createdAt: message.created_at,
        })),
      };
    }),
  }));

  return {
    id: property.id,
    name: property.name,
    area: property.area,
    address: property.address,
    photoUrl: property.photo_url,
    rooms: roomDetails,
  };
}
