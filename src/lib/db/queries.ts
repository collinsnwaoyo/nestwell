import "server-only";
import { getSupabaseClient } from "./client";
import {
  computeBalance,
  deriveStatus,
  getDaysUntilDue,
  getNextDueDate,
  getUnpaidPeriods,
  collectedInWindow,
  cumulativeDue,
  occupiedCountOn,
  rentRollOn,
  sampleDates,
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

export interface VacantBed {
  bedId: string;
  propertyId: string;
  propertyName: string;
  roomName: string;
  bedLabel: string;
  rentPerBed: number;
}

/** History is sampled every SERIES_STEP_DAYS over roughly six months; the due outlook runs DUE_HORIZON_DAYS ahead. */
export const SERIES_POINTS = 14;
export const SERIES_STEP_DAYS = 14;
export const DUE_HORIZON_DAYS = 30;
export const COLLECTED_WINDOW_DAYS = 30;

export interface DashboardData {
  propertiesCount: number;
  bedsTotal: number;
  bedsFilled: number;
  expectedRevenue: number;
  collectedLast30Days: number;
  paymentsDueCount: number;
  overdueCount: number;
  /** ISO date of the first history sample. */
  seriesStart: string;
  series: {
    collected: number[];
    vacant: number[];
    rentRoll: number[];
    /** Cumulative rent falling due, one point per day from today. */
    due: number[];
  };
  properties: PropertySummary[];
  overdue: OverdueTenancy[];
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
  const dueItems: { dueDate: Date; amount: number }[] = [];

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

    if (status === "due_soon" || status === "due_today" || status === "overdue") paymentsDueCount++;
    if (status === "overdue") {
      overdue.push({
        bedId: tenancy.bed_id,
        propertyId: property.id,
        propertyName: property.name,
        roomName: room.name,
        tenantName: tenantNameById.get(tenancy.tenant_id) ?? "Tenant",
        balance,
        daysLate: -daysUntilDue,
      });
    }

    const leavesBeforeDue = tenancy.move_out !== null && getDaysUntilDue(nextDue, tenancy.move_out) >= 0;
    if (!leavesBeforeDue) {
      dueItems.push({ dueDate: nextDue, amount: unpaidPeriods.length > 0 ? balance : tenancy.rent });
    }
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

  const spans = allTenancies.map((t) => ({ moveIn: t.move_in, moveOut: t.move_out, rent: t.rent }));
  const paidPayments = payments.map((p) => ({ amount: p.amount, paidAt: p.paid_at }));
  const samples = sampleDates(today, SERIES_POINTS, SERIES_STEP_DAYS);

  return {
    propertiesCount: properties.length,
    bedsTotal: beds.length,
    bedsFilled: tenancies.length,
    expectedRevenue,
    collectedLast30Days: collectedInWindow(paidPayments, today, COLLECTED_WINDOW_DAYS),
    paymentsDueCount,
    overdueCount: overdue.length,
    seriesStart: samples[0].toISOString(),
    series: {
      collected: samples.map((date) => collectedInWindow(paidPayments, date, COLLECTED_WINDOW_DAYS)),
      vacant: samples.map((date) => beds.length - occupiedCountOn(spans, date)),
      rentRoll: samples.map((date) => rentRollOn(spans, date)),
      due: cumulativeDue(dueItems, today, DUE_HORIZON_DAYS),
    },
    properties: properties.map((property) => ({
      id: property.id,
      name: property.name,
      area: property.area,
      bedsTotal: bedsTotalByProperty.get(property.id) ?? 0,
      bedsFilled: bedsFilledByProperty.get(property.id) ?? 0,
      rentRoll: rentRollByProperty.get(property.id) ?? 0,
    })),
    overdue: overdue.sort((a, b) => b.daysLate - a.daysLate),
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
  /** Earliest move-in on any of its beds, else when the property was added. */
  activeSince: string;
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

  // Includes checked-out tenancies: the property was active from its first move-in.
  const firstTenancyRes = bedIds.length
    ? await supabase.from("tenancies").select("move_in").in("bed_id", bedIds).order("move_in").limit(1)
    : { data: [], error: null };
  if (firstTenancyRes.error) throw new Error(firstTenancyRes.error.message);

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
    activeSince: firstTenancyRes.data?.[0]?.move_in ?? property.created_at,
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
  waLink: string;
}

export async function getMessages(): Promise<MessageRow[]> {
  const supabase = getSupabaseClient();

  const messagesRes = await supabase.from("messages").select("*").order("created_at", { ascending: false });
  if (messagesRes.error) throw new Error(messagesRes.error.message);
  const messages = messagesRes.data ?? [];

  const tenancyIds = [...new Set(messages.map((m) => m.tenancy_id).filter((id): id is string => !!id))];
  const tenanciesRes = tenancyIds.length
    ? await supabase.from("tenancies").select("id, tenant_id, bed_id").in("id", tenancyIds)
    : { data: [], error: null };
  if (tenanciesRes.error) throw new Error(tenanciesRes.error.message);
  const tenancies = tenanciesRes.data ?? [];

  const tenantIds = [...new Set(tenancies.map((t) => t.tenant_id))];
  const bedIds = [...new Set(tenancies.map((t) => t.bed_id))];

  const [tenantsRes, bedsRes] = await Promise.all([
    tenantIds.length
      ? supabase.from("tenants").select("id, full_name").in("id", tenantIds)
      : Promise.resolve({ data: [], error: null }),
    bedIds.length
      ? supabase.from("beds").select("id, room_id").in("id", bedIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (tenantsRes.error) throw new Error(tenantsRes.error.message);
  if (bedsRes.error) throw new Error(bedsRes.error.message);

  const roomIds = [...new Set((bedsRes.data ?? []).map((b) => b.room_id))];
  const roomsRes = roomIds.length
    ? await supabase.from("rooms").select("id, name, property_id").in("id", roomIds)
    : { data: [], error: null };
  if (roomsRes.error) throw new Error(roomsRes.error.message);

  const propertyIds = [...new Set((roomsRes.data ?? []).map((r) => r.property_id))];
  const propertiesRes = propertyIds.length
    ? await supabase.from("properties").select("id, name").in("id", propertyIds)
    : { data: [], error: null };
  if (propertiesRes.error) throw new Error(propertiesRes.error.message);

  const tenancyById = new Map(tenancies.map((t) => [t.id, t]));
  const tenantById = new Map((tenantsRes.data ?? []).map((t) => [t.id, t]));
  const bedById = new Map((bedsRes.data ?? []).map((b) => [b.id, b]));
  const roomById = new Map((roomsRes.data ?? []).map((r) => [r.id, r]));
  const propertyById = new Map((propertiesRes.data ?? []).map((p) => [p.id, p]));

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
      waLink: message.wa_link,
    };
  });
}
