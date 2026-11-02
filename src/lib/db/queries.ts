import "server-only";
import { subDays } from "date-fns";
import { getSupabaseClient } from "./client";
import {
  computeBalance,
  deriveStatus,
  getDaysUntilDue,
  getNextDueDate,
  getUnpaidPeriods,
  collectedInWindow,
  dailyCumulativeCollected,
  toLagosDate,
  type RentStatus,
} from "@/lib/domain";
import type { Database } from "./types";

type RoomType = Database["public"]["Tables"]["rooms"]["Row"]["type"];
type ReminderMode = Database["public"]["Tables"]["rooms"]["Row"]["reminder_mode"];

export interface PropertySummary {
  id: string;
  name: string;
  area: string;
  bedsTotal: number;
  bedsFilled: number;
  /** Monthly rent from current tenancies. */
  rentRoll: number;
}

export interface OverdueTenancy {
  bedId: string;
  propertyId: string;
  propertyName: string;
  roomName: string;
  tenantName: string;
  balance: number;
  daysLate: number;
}

/** A current tenancy someone can record rent against, soonest due first. */
export interface PayableTenancy {
  tenancyId: string;
  bedId: string;
  propertyId: string;
  propertyName: string;
  roomName: string;
  tenantName: string;
  rent: number;
  balance: number;
  status: RentStatus;
  /** ISO date of the next unpaid period. */
  nextDueDate: string;
  daysUntilDue: number;
}

export interface VacantBed {
  bedId: string;
  propertyId: string;
  propertyName: string;
  roomName: string;
  bedLabel: string;
  rentPerBed: number;
}

/** Revenue is compared across two back-to-back windows of this many days. */
export const COLLECTED_WINDOW_DAYS = 30;

export interface DashboardData {
  propertiesCount: number;
  bedsTotal: number;
  bedsFilled: number;
  expectedRevenue: number;
  collectedLast30Days: number;
  paymentsDueCount: number;
  overdueCount: number;
  collectedPrevious30Days: number;
  /** Running total collected per day over the last 30 days, for the revenue chart. */
  revenueDaily: { date: string; total: number }[];
  properties: PropertySummary[];
  overdue: OverdueTenancy[];
  payable: PayableTenancy[];
  vacantBeds: VacantBed[];
}

export async function getDashboardData(today: Date = new Date()): Promise<DashboardData> {
  const supabase = getSupabaseClient();

  const [propertiesRes, roomsRes, bedsRes, tenanciesRes, tenantsRes, paymentsRes, chargesRes] =
    await Promise.all([
      supabase.from("properties").select("*").order("name"),
      supabase.from("rooms").select("*"),
      supabase.from("beds").select("*").order("label"),
      supabase.from("tenancies").select("*"),
      supabase.from("tenants").select("id, full_name"),
      supabase.from("payments").select("tenancy_id, amount, paid_at"),
      supabase.from("charges").select("tenancy_id, amount"),
    ]);

  for (const res of [propertiesRes, roomsRes, bedsRes, tenanciesRes, tenantsRes, paymentsRes, chargesRes]) {
    if (res.error) throw new Error(res.error.message);
  }

  const properties = propertiesRes.data ?? [];
  const rooms = roomsRes.data ?? [];
  const beds = bedsRes.data ?? [];
  const allTenancies = tenanciesRes.data ?? [];
  const payments = paymentsRes.data ?? [];
  const charges = chargesRes.data ?? [];

  const tenancies = allTenancies.filter((t) => t.status === "active" || t.status === "notice");
  const tenantNameById = new Map((tenantsRes.data ?? []).map((t) => [t.id, t.full_name]));
  const propertyById = new Map(properties.map((p) => [p.id, p]));
  const roomById = new Map(rooms.map((room) => [room.id, room]));
  const roomByBedId = new Map(beds.map((bed) => [bed.id, roomById.get(bed.room_id)]));

  const paymentsCountByTenancy = new Map<string, number>();
  for (const payment of payments) {
    paymentsCountByTenancy.set(payment.tenancy_id, (paymentsCountByTenancy.get(payment.tenancy_id) ?? 0) + 1);
  }

  const chargesByTenancy = new Map<string, { amount: number }[]>();
  for (const charge of charges) {
    const list = chargesByTenancy.get(charge.tenancy_id) ?? [];
    list.push({ amount: charge.amount });
    chargesByTenancy.set(charge.tenancy_id, list);
  }

  const bedsTotalByProperty = new Map<string, number>();
  for (const bed of beds) {
    const propertyId = roomById.get(bed.room_id)?.property_id;
    if (propertyId) bedsTotalByProperty.set(propertyId, (bedsTotalByProperty.get(propertyId) ?? 0) + 1);
  }

  let expectedRevenue = 0;
  let paymentsDueCount = 0;
  const bedsFilledByProperty = new Map<string, number>();
  const rentRollByProperty = new Map<string, number>();
  const occupiedBedIds = new Set<string>();
  const overdue: OverdueTenancy[] = [];
  const payable: PayableTenancy[] = [];

  for (const tenancy of tenancies) {
    const room = roomByBedId.get(tenancy.bed_id);
    const property = room ? propertyById.get(room.property_id) : undefined;
    if (!room || !property) continue;

    occupiedBedIds.add(tenancy.bed_id);
    expectedRevenue += tenancy.rent;
    bedsFilledByProperty.set(property.id, (bedsFilledByProperty.get(property.id) ?? 0) + 1);
    rentRollByProperty.set(property.id, (rentRollByProperty.get(property.id) ?? 0) + tenancy.rent);

    const paymentsCount = paymentsCountByTenancy.get(tenancy.id) ?? 0;
    const unpaidPeriods = getUnpaidPeriods(tenancy.move_in, today, paymentsCount);
    const balance = computeBalance({
      rent: tenancy.rent,
      unpaidPeriods,
      charges: chargesByTenancy.get(tenancy.id) ?? [],
    });
    const nextDue = getNextDueDate(tenancy.move_in, paymentsCount);
    const daysUntilDue = getDaysUntilDue(nextDue, today);
    const status = deriveStatus({ tenancyStatus: tenancy.status, daysUntilDue });

    const tenantName = tenantNameById.get(tenancy.tenant_id) ?? "Tenant";
    if (status === "due_soon" || status === "due_today" || status === "overdue") paymentsDueCount++;
    if (status === "overdue") {
      overdue.push({
        bedId: tenancy.bed_id,
        propertyId: property.id,
        propertyName: property.name,
        roomName: room.name,
        tenantName,
        balance,
        daysLate: -daysUntilDue,
      });
    }
    payable.push({
      tenancyId: tenancy.id,
      bedId: tenancy.bed_id,
      propertyId: property.id,
      propertyName: property.name,
      roomName: room.name,
      tenantName,
      rent: tenancy.rent,
      balance,
      status,
      nextDueDate: nextDue.toISOString(),
      daysUntilDue,
    });
  }

  const vacantBeds: VacantBed[] = beds.flatMap((bed) => {
    const room = roomById.get(bed.room_id);
    const property = room ? propertyById.get(room.property_id) : undefined;
    if (!room || !property || occupiedBedIds.has(bed.id)) return [];
    return [
      {
        bedId: bed.id,
        propertyId: property.id,
        propertyName: property.name,
        roomName: room.name,
        bedLabel: bed.label,
        rentPerBed: room.rent_per_bed,
      },
    ];
  });

  const paidPayments = payments.map((p) => ({ amount: p.amount, paidAt: p.paid_at }));

  return {
    propertiesCount: properties.length,
    bedsTotal: beds.length,
    bedsFilled: tenancies.length,
    expectedRevenue,
    collectedLast30Days: collectedInWindow(paidPayments, today, COLLECTED_WINDOW_DAYS),
    collectedPrevious30Days: collectedInWindow(
      paidPayments,
      subDays(toLagosDate(today), COLLECTED_WINDOW_DAYS),
      COLLECTED_WINDOW_DAYS,
    ),
    revenueDaily: dailyCumulativeCollected(paidPayments, today, COLLECTED_WINDOW_DAYS),
    paymentsDueCount,
    overdueCount: overdue.length,
    properties: properties.map((property) => ({
      id: property.id,
      name: property.name,
      area: property.area,
      bedsTotal: bedsTotalByProperty.get(property.id) ?? 0,
      bedsFilled: bedsFilledByProperty.get(property.id) ?? 0,
      rentRoll: rentRollByProperty.get(property.id) ?? 0,
    })),
    overdue: overdue.sort((a, b) => b.daysLate - a.daysLate),
    payable: payable.sort(
      (a, b) => a.daysUntilDue - b.daysUntilDue || a.tenantName.localeCompare(b.tenantName),
    ),
    vacantBeds,
  };
}

export interface BedDetail {
  id: string;
  label: string;
  status: RentStatus;
  tenancyId: string | null;
  tenant: {
    id: string;
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
  noticeReason: string | null;
  moveOut: string | null;
  rent: number | null;
  balance: number;
  payments: { id: string; periodMonth: string; amount: number; method: string; paidAt: string }[];
  messages: {
    id: string;
    template: string;
    body: string;
    status: Database["public"]["Tables"]["messages"]["Row"]["status"];
    trigger: string;
    createdAt: string;
  }[];
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
  /** Earliest move-in on any of its beds, else when the property was added. */
  activeSince: string;
  rooms: RoomDetail[];
}

export async function getPropertyDetail(
  propertyId: string,
  today: Date = new Date(),
): Promise<PropertyDetail | null> {
  const supabase = getSupabaseClient();

  // Each Supabase round trip costs ~200ms, so fetch everything that doesn't depend on
  // tenancy ids in one go. Beds and tenancies are portfolio-wide (as on the dashboard)
  // and narrowed to this property's rooms below.
  const [propertyRes, roomsRes, allBedsRes, allTenanciesRes] = await Promise.all([
    supabase.from("properties").select("*").eq("id", propertyId).maybeSingle(),
    supabase.from("rooms").select("*").eq("property_id", propertyId).order("name"),
    supabase.from("beds").select("*").order("label"),
    supabase.from("tenancies").select("*").order("move_in"),
  ]);
  for (const res of [propertyRes, roomsRes, allBedsRes, allTenanciesRes]) {
    if (res.error) throw new Error(res.error.message);
  }
  const property = propertyRes.data;
  if (!property) return null;

  const rooms = roomsRes.data ?? [];
  const roomIds = new Set(rooms.map((room) => room.id));
  const beds = (allBedsRes.data ?? []).filter((bed) => roomIds.has(bed.room_id));
  const bedIds = new Set(beds.map((bed) => bed.id));
  // Includes checked-out tenancies: the property was active from its first move-in.
  const propertyTenancies = (allTenanciesRes.data ?? []).filter((tenancy) => bedIds.has(tenancy.bed_id));
  const firstMoveIn = propertyTenancies[0]?.move_in;
  const tenancies = propertyTenancies.filter((t) => t.status === "active" || t.status === "notice");
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
          noticeReason: null,
          moveOut: null,
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
              id: tenant.id,
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
        noticeReason: tenancy.notice_reason,
        moveOut: tenancy.move_out,
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
          template: message.template,
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
    activeSince: firstMoveIn ?? property.created_at,
    rooms: roomDetails,
  };
}

export interface MessageRow {
  id: string;
  recipientName: string;
  phone: string;
  propertyId: string | null;
  propertyName: string | null;
  roomName: string | null;
  template: string;
  body: string;
  trigger: Database["public"]["Tables"]["messages"]["Row"]["trigger"];
  status: Database["public"]["Tables"]["messages"]["Row"]["status"];
  createdAt: string;
  /** When it was marked sent, if it has been (falls back to creation for seeded history). */
  sentAt: string | null;
  waLink: string;
}

export async function getMessages(): Promise<MessageRow[]> {
  const supabase = getSupabaseClient();

  // One parallel round instead of a chain of lookups: the lookup tables are small.
  const [messagesRes, tenanciesRes, tenantsRes, bedsRes, roomsRes, propertiesRes, sentEventsRes] = await Promise.all([
    supabase.from("messages").select("*").order("created_at", { ascending: false }),
    supabase.from("tenancies").select("id, tenant_id, bed_id"),
    supabase.from("tenants").select("id, full_name"),
    supabase.from("beds").select("id, room_id"),
    supabase.from("rooms").select("id, name, property_id"),
    supabase.from("properties").select("id, name"),
    supabase.from("events").select("payload, created_at").eq("type", "message_marked_sent"),
  ]);
  for (const res of [messagesRes, tenanciesRes, tenantsRes, bedsRes, roomsRes, propertiesRes, sentEventsRes]) {
    if (res.error) throw new Error(res.error.message);
  }
  const messages = messagesRes.data ?? [];

  const tenancyById = new Map((tenanciesRes.data ?? []).map((t) => [t.id, t]));
  const tenantById = new Map((tenantsRes.data ?? []).map((t) => [t.id, t]));
  const bedById = new Map((bedsRes.data ?? []).map((b) => [b.id, b]));
  const roomById = new Map((roomsRes.data ?? []).map((r) => [r.id, r]));
  const propertyById = new Map((propertiesRes.data ?? []).map((p) => [p.id, p]));
  const sentAtById = new Map(
    (sentEventsRes.data ?? []).map((event) => [String(event.payload.message_id), event.created_at]),
  );

  return messages.map((message): MessageRow => {
    const tenancy = message.tenancy_id ? tenancyById.get(message.tenancy_id) : undefined;
    const tenant = tenancy ? tenantById.get(tenancy.tenant_id) : undefined;
    const bed = tenancy ? bedById.get(tenancy.bed_id) : undefined;
    const room = bed ? roomById.get(bed.room_id) : undefined;
    const property = room ? propertyById.get(room.property_id) : undefined;

    return {
      id: message.id,
      recipientName: tenant?.full_name ?? "Portfolio broadcast",
      phone: message.phone,
      propertyId: property?.id ?? null,
      propertyName: property?.name ?? null,
      roomName: room?.name ?? null,
      template: message.template,
      body: message.body,
      trigger: message.trigger,
      status: message.status,
      createdAt: message.created_at,
      sentAt: message.status === "marked_sent" ? (sentAtById.get(message.id) ?? message.created_at) : null,
      waLink: message.wa_link,
    };
  });
}
