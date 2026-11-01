// Demo seed data for Nestwell, matching docs/PRD.md exactly: 4 properties,
// 11 beds, 9 occupied, ₦2,010,000 monthly rent roll. Dates are generated
// relative to today so the story always holds (see PRD "Public demo").
//
// Payment/charge history is computed with the real domain logic (not
// hand-typed), so it stays consistent with the statuses the app will derive
// at render time. Run with `npm run db:seed`.

import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/lib/db/types";
import {
  dueDateForOccurrence,
  getDaysLate,
  getUnpaidPeriods,
  lateFeesOwed,
  lateFeeChargeAmount,
  fillTemplate,
} from "../src/lib/domain";
import {
  ALLOWED_UPLOAD_MIME_TYPES,
  DEFAULT_DEPOSIT,
  GRACE_DAYS,
  MAX_UPLOAD_BYTES,
  MESSAGE_TEMPLATES,
  ROOM_TYPE_DEFAULTS,
  TENANT_DOCS_BUCKET,
} from "../src/config/rules";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.",
  );
}

// Standalone script, not part of the Next.js server boundary, so it talks to
// Supabase directly rather than through src/lib/db/client.ts (which imports
// "server-only" and can only load inside Next's own module graph).
const supabase = createClient<Database>(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

const PHONE = "+2347025762759";
const PHONE_DIGITS = "2347025762759";

const RENT_BY_TYPE: Record<Database["public"]["Tables"]["rooms"]["Row"]["type"], number> =
  Object.fromEntries(
    Object.entries(ROOM_TYPE_DEFAULTS).map(([type, defaults]) => [type, defaults.rentPerBed]),
  ) as Record<Database["public"]["Tables"]["rooms"]["Row"]["type"], number>;

const DEPOSIT = DEFAULT_DEPOSIT;
const today = new Date();

function waLink(body: string): string {
  return `https://wa.me/${PHONE_DIGITS}?text=${encodeURIComponent(body)}`;
}

function naira(amount: number): string {
  return `₦${new Intl.NumberFormat("en-NG").format(amount)}`;
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// --- Reset -------------------------------------------------------------

async function clearDatabase() {
  const tables = [
    "events",
    "messages",
    "broadcasts",
    "charges",
    "payments",
    "tenancies",
    "beds",
    "tenants",
    "rooms",
    "properties",
  ] as const;

  for (const table of tables) {
    const { error } = await supabase.from(table).delete().not("id", "is", null);
    if (error) throw new Error(`Failed to clear ${table}: ${error.message}`);
  }
}

// --- Storage ---------------------------------------------------------------

/**
 * The tenant-docs bucket holds onboarding uploads (photo, licence, gov ID).
 * Private, server-only access. Created on first run; emptied on every reset
 * along with the tables, per the PRD's nightly-reset behaviour.
 */
async function resetTenantDocsBucket() {
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) throw new Error(`storage.listBuckets: ${listError.message}`);

  if (!buckets?.some((bucket) => bucket.name === TENANT_DOCS_BUCKET)) {
    const { error: createError } = await supabase.storage.createBucket(TENANT_DOCS_BUCKET, {
      public: false,
      fileSizeLimit: MAX_UPLOAD_BYTES,
      allowedMimeTypes: ALLOWED_UPLOAD_MIME_TYPES,
    });
    if (createError) throw new Error(`storage.createBucket: ${createError.message}`);
    return;
  }

  const { data: folders, error: listFoldersError } = await supabase.storage
    .from(TENANT_DOCS_BUCKET)
    .list();
  if (listFoldersError) throw new Error(`storage.list: ${listFoldersError.message}`);

  for (const folder of folders ?? []) {
    const { data: files, error: listFilesError } = await supabase.storage
      .from(TENANT_DOCS_BUCKET)
      .list(folder.name);
    if (listFilesError) throw new Error(`storage.list: ${listFilesError.message}`);
    if (!files?.length) continue;

    const paths = files.map((file) => `${folder.name}/${file.name}`);
    const { error: removeError } = await supabase.storage.from(TENANT_DOCS_BUCKET).remove(paths);
    if (removeError) throw new Error(`storage.remove: ${removeError.message}`);
  }
}

// --- Insert helpers ------------------------------------------------------

async function insertProperty(row: Database["public"]["Tables"]["properties"]["Insert"]) {
  const { data, error } = await supabase.from("properties").insert(row).select().single();
  if (error) throw new Error(`properties: ${error.message}`);
  return data;
}

async function insertRoom(row: Database["public"]["Tables"]["rooms"]["Insert"]) {
  const { data, error } = await supabase.from("rooms").insert(row).select().single();
  if (error) throw new Error(`rooms: ${error.message}`);
  return data;
}

async function insertBed(row: Database["public"]["Tables"]["beds"]["Insert"]) {
  const { data, error } = await supabase.from("beds").insert(row).select().single();
  if (error) throw new Error(`beds: ${error.message}`);
  return data;
}

async function insertTenant(row: Database["public"]["Tables"]["tenants"]["Insert"]) {
  const { data, error } = await supabase.from("tenants").insert(row).select().single();
  if (error) throw new Error(`tenants: ${error.message}`);
  return data;
}

async function insertTenancy(row: Database["public"]["Tables"]["tenancies"]["Insert"]) {
  const { data, error } = await supabase.from("tenancies").insert(row).select().single();
  if (error) throw new Error(`tenancies: ${error.message}`);
  return data;
}

async function insertPayment(row: Database["public"]["Tables"]["payments"]["Insert"]) {
  const { error } = await supabase.from("payments").insert(row);
  if (error) throw new Error(`payments: ${error.message}`);
}

async function insertCharge(row: Database["public"]["Tables"]["charges"]["Insert"]) {
  const { error } = await supabase.from("charges").insert(row);
  if (error) throw new Error(`charges: ${error.message}`);
}

async function insertMessage(row: Database["public"]["Tables"]["messages"]["Insert"]) {
  const { error } = await supabase.from("messages").insert(row);
  if (error) throw new Error(`messages: ${error.message}`);
}

async function insertEvent(row: Database["public"]["Tables"]["events"]["Insert"]) {
  const { error } = await supabase.from("events").insert(row);
  if (error) throw new Error(`events: ${error.message}`);
}

// --- Tenant seeding --------------------------------------------------------

type ReminderMode = Database["public"]["Tables"]["rooms"]["Row"]["reminder_mode"];

interface TenantSeed {
  fullName: string;
  occupation: string;
  nextOfKinName: string;
  nextOfKinRelation: string;
  emergencyContact: string;
  moveInDay: number;
  paymentsCount: number;
  status: "active" | "notice";
  noticeReason?: string;
  moveOutInDays?: number;
  currentMessage?: { type: "due_today" | "due_soon" | "overdue"; status: "ready" | "opened" };
}

async function seedTenancy(
  bedId: string,
  rent: number,
  reminderMode: ReminderMode,
  seed: TenantSeed,
) {
  const tenant = await insertTenant({
    full_name: seed.fullName,
    phone: PHONE,
    email: `${seed.fullName.toLowerCase().replace(/\s+/g, ".")}@example.com`,
    occupation: seed.occupation,
    next_of_kin_name: seed.nextOfKinName,
    next_of_kin_relation: seed.nextOfKinRelation,
    next_of_kin_phone: PHONE,
    emergency_contact: `${seed.emergencyContact} — ${PHONE}`,
    verified: true,
  });

  const moveIn = new Date(Date.UTC(2026, 6, seed.moveInDay)); // July 2026, ~4 months of history
  const moveInIso = isoDate(moveIn);

  const noticeMoveOut = seed.moveOutInDays
    ? isoDate(new Date(today.getTime() + seed.moveOutInDays * 24 * 60 * 60 * 1000))
    : null;

  const tenancy = await insertTenancy({
    bed_id: bedId,
    tenant_id: tenant.id,
    move_in: moveInIso,
    rent,
    deposit: DEPOSIT,
    status: seed.status,
    notice_reason: seed.noticeReason ?? null,
    move_out: seed.status === "notice" ? noticeMoveOut : null,
  });

  await insertEvent({
    tenancy_id: tenancy.id,
    type: "tenant_checked_in",
    payload: { rent, deposit: DEPOSIT, move_in: moveInIso },
  });

  const firstName = seed.fullName.split(" ")[0];

  // Paid periods: occurrences 0..paymentsCount-1, one payment + receipt each.
  for (let i = 0; i < seed.paymentsCount; i++) {
    const dueDate = dueDateForOccurrence(moveIn, i);
    const paidAt = new Date(dueDate);
    const periodMonth = isoDate(dueDate);
    const method = i % 4 === 0 ? "cash" : "transfer";

    await insertPayment({
      tenancy_id: tenancy.id,
      period_month: periodMonth,
      amount: rent,
      method,
      paid_at: paidAt.toISOString(),
    });

    await insertEvent({
      tenancy_id: tenancy.id,
      type: "payment_recorded",
      payload: { amount: rent, period_month: periodMonth, method },
    });

    const nextDue = dueDateForOccurrence(moveIn, i + 1);
    const receiptBody = fillTemplate(MESSAGE_TEMPLATES.receipt, {
      firstName,
      amount: naira(rent),
      month: periodMonth,
      nextDue: isoDate(nextDue),
    });

    await insertMessage({
      tenancy_id: tenancy.id,
      phone: PHONE,
      template: "receipt",
      body: receiptBody,
      trigger: "manual",
      status: "marked_sent",
      wa_link: waLink(receiptBody),
      created_at: paidAt.toISOString(),
    });
  }

  // Unpaid periods so far: apply late fees past grace (mirrors the cron job).
  const unpaidPeriods = getUnpaidPeriods(moveIn, today, seed.paymentsCount);
  const lateFeeCount = lateFeesOwed(unpaidPeriods, 0);
  for (let i = 0; i < lateFeeCount; i++) {
    const period = unpaidPeriods[i];
    const chargeDate = new Date(period.dueDate);
    chargeDate.setUTCDate(chargeDate.getUTCDate() + GRACE_DAYS);

    await insertCharge({
      tenancy_id: tenancy.id,
      kind: "late_fee",
      amount: lateFeeChargeAmount(1),
      created_at: chargeDate.toISOString(),
    });

    await insertEvent({
      tenancy_id: tenancy.id,
      type: "late_fee_added",
      payload: { amount: lateFeeChargeAmount(1), period_month: isoDate(period.dueDate) },
    });
  }

  // Current reminder matching the tenant's headline status.
  if (seed.currentMessage) {
    const { type, status } = seed.currentMessage;
    const nextOccurrence = dueDateForOccurrence(moveIn, seed.paymentsCount);
    let body: string;
    let template: string;

    if (type === "due_today") {
      template = "due_today";
      body = fillTemplate(MESSAGE_TEMPLATES.dueToday, {
        firstName,
        amount: naira(rent),
      });
    } else if (type === "due_soon") {
      template = "due_soon";
      body = fillTemplate(MESSAGE_TEMPLATES.dueSoon, {
        firstName,
        amount: naira(rent),
        room: "",
        dueDate: isoDate(nextOccurrence),
      });
    } else {
      const unpaid = unpaidPeriods[0];
      const daysLate = getDaysLate(unpaid.dueDate, today);
      const fee = lateFeeChargeAmount(1);
      template = "overdue";
      body = fillTemplate(MESSAGE_TEMPLATES.overdue, {
        firstName,
        days: String(daysLate),
        fee: naira(fee),
        total: naira(rent + fee),
      });
    }

    await insertMessage({
      tenancy_id: tenancy.id,
      phone: PHONE,
      template,
      body,
      trigger: reminderMode,
      status,
      wa_link: waLink(body),
    });
  }

  if (seed.status === "notice") {
    const noticeBody = fillTemplate(MESSAGE_TEMPLATES.notice, {
      firstName,
      room: "",
      date: noticeMoveOut ?? "",
      reason: seed.noticeReason ?? "",
    });

    await insertMessage({
      tenancy_id: tenancy.id,
      phone: PHONE,
      template: "notice",
      body: noticeBody,
      trigger: "manual",
      status: "marked_sent",
      wa_link: waLink(noticeBody),
    });

    await insertEvent({
      tenancy_id: tenancy.id,
      type: "notice_issued",
      payload: { reason: seed.noticeReason, move_out: noticeMoveOut },
    });
  }
}

// --- Main ------------------------------------------------------------------

async function main() {
  console.log("Clearing existing data...");
  await clearDatabase();

  console.log("Resetting tenant-docs storage bucket...");
  await resetTenantDocsBucket();

  console.log("Seeding properties, rooms and beds...");

  const lekki = await insertProperty({
    name: "Nestwell Lekki Studio",
    area: "Lekki Phase 1",
    address: "12 Admiralty Way, Lekki Phase 1, Lagos",
  });
  const lekkiStudio = await insertRoom({
    property_id: lekki.id,
    name: "Studio",
    type: "studio",
    rent_per_bed: RENT_BY_TYPE.studio,
  });
  const lekkiStudioBed = await insertBed({ room_id: lekkiStudio.id, label: "Studio" });

  const yaba = await insertProperty({
    name: "Nestwell Yaba",
    area: "Yaba",
    address: "8 Herbert Macaulay Way, Yaba, Lagos",
  });
  const yabaSingle = await insertRoom({
    property_id: yaba.id,
    name: "Self-contained room",
    type: "single",
    rent_per_bed: RENT_BY_TYPE.single,
  });
  const yabaSingleBed = await insertBed({ room_id: yabaSingle.id, label: "Room" });

  const surulere = await insertProperty({
    name: "Nestwell Surulere",
    area: "Surulere",
    address: "23 Adeniran Ogunsanya Street, Surulere, Lagos",
  });
  const surulereTriple = await insertRoom({
    property_id: surulere.id,
    name: "Triple room",
    type: "triple",
    rent_per_bed: RENT_BY_TYPE.triple,
  });
  const [surulereTripleA, surulereTripleB, surulereTripleC] = await Promise.all([
    insertBed({ room_id: surulereTriple.id, label: "Bed 1" }),
    insertBed({ room_id: surulereTriple.id, label: "Bed 2" }),
    insertBed({ room_id: surulereTriple.id, label: "Bed 3" }),
  ]);
  const surulereShared = await insertRoom({
    property_id: surulere.id,
    name: "Shared room",
    type: "shared",
    rent_per_bed: RENT_BY_TYPE.shared,
  });
  const [surulereSharedA, surulereSharedB] = await Promise.all([
    insertBed({ room_id: surulereShared.id, label: "Bed 1" }),
    insertBed({ room_id: surulereShared.id, label: "Bed 2" }),
  ]);
  const surulereSingle = await insertRoom({
    property_id: surulere.id,
    name: "Single room",
    type: "single",
    rent_per_bed: RENT_BY_TYPE.single,
  });
  const surulereSingleBed = await insertBed({ room_id: surulereSingle.id, label: "Room" });

  const ikota = await insertProperty({
    name: "Nestwell Ikota",
    area: "Ikota GRA",
    address: "5 Ikota Shopping Complex Road, Ikota GRA, Lagos",
  });
  const ikotaShared = await insertRoom({
    property_id: ikota.id,
    name: "Shared room",
    type: "shared",
    rent_per_bed: RENT_BY_TYPE.shared,
    reminder_mode: "auto",
  });
  const [ikotaSharedA, ikotaSharedB] = await Promise.all([
    insertBed({ room_id: ikotaShared.id, label: "Bed 1" }),
    insertBed({ room_id: ikotaShared.id, label: "Bed 2" }),
  ]);
  const ikotaSingle = await insertRoom({
    property_id: ikota.id,
    name: "Single room",
    type: "single",
    rent_per_bed: RENT_BY_TYPE.single,
  });
  await insertBed({ room_id: ikotaSingle.id, label: "Room" });

  console.log("Seeding tenants and tenancies...");

  await seedTenancy(lekkiStudioBed.id, RENT_BY_TYPE.studio, "manual", {
    fullName: "Tolulope Adebayo",
    occupation: "Software Engineer",
    nextOfKinName: "Bukola Adebayo",
    nextOfKinRelation: "Sister",
    emergencyContact: "Bukola Adebayo",
    moveInDay: 15,
    paymentsCount: 4,
    status: "active",
  });

  await seedTenancy(yabaSingleBed.id, RENT_BY_TYPE.single, "manual", {
    fullName: "Babatunde Lawal",
    occupation: "Marketing Executive",
    nextOfKinName: "Rasheed Lawal",
    nextOfKinRelation: "Brother",
    emergencyContact: "Rasheed Lawal",
    moveInDay: 1,
    paymentsCount: 4,
    status: "active",
    currentMessage: { type: "due_today", status: "opened" },
  });

  await seedTenancy(surulereTripleA.id, RENT_BY_TYPE.triple, "manual", {
    fullName: "Ifeoma Nwosu",
    occupation: "Nurse",
    nextOfKinName: "Chidera Nwosu",
    nextOfKinRelation: "Mother",
    emergencyContact: "Chidera Nwosu",
    moveInDay: 10,
    paymentsCount: 4,
    status: "active",
  });

  await seedTenancy(surulereTripleB.id, RENT_BY_TYPE.triple, "manual", {
    fullName: "Halima Bello",
    occupation: "Graphic Designer",
    nextOfKinName: "Amina Bello",
    nextOfKinRelation: "Sister",
    emergencyContact: "Amina Bello",
    moveInDay: 20,
    paymentsCount: 3,
    status: "active",
    currentMessage: { type: "overdue", status: "opened" },
  });

  // surulereTripleC stays vacant.
  void surulereTripleC;

  await seedTenancy(surulereSharedA.id, RENT_BY_TYPE.shared, "manual", {
    fullName: "Kelechi Eze",
    occupation: "Civil Engineer",
    nextOfKinName: "Ugochi Eze",
    nextOfKinRelation: "Wife",
    emergencyContact: "Ugochi Eze",
    moveInDay: 12,
    paymentsCount: 4,
    status: "active",
  });

  await seedTenancy(surulereSharedB.id, RENT_BY_TYPE.shared, "manual", {
    fullName: "Damilola Ogunleye",
    occupation: "University Student",
    nextOfKinName: "Adeola Ogunleye",
    nextOfKinRelation: "Father",
    emergencyContact: "Adeola Ogunleye",
    moveInDay: 4,
    paymentsCount: 4,
    status: "active",
    currentMessage: { type: "due_soon", status: "ready" },
  });

  await seedTenancy(surulereSingleBed.id, RENT_BY_TYPE.single, "manual", {
    fullName: "Emeka Obi",
    occupation: "Logistics Manager",
    nextOfKinName: "Ngozi Obi",
    nextOfKinRelation: "Sister",
    emergencyContact: "Ngozi Obi",
    moveInDay: 8,
    paymentsCount: 2,
    status: "notice",
    noticeReason: "Rent more than 30 days overdue after repeated follow-up.",
    moveOutInDays: 14,
  });

  await seedTenancy(ikotaSharedA.id, RENT_BY_TYPE.shared, "auto", {
    fullName: "Zainab Yusuf",
    occupation: "Accountant",
    nextOfKinName: "Fatima Yusuf",
    nextOfKinRelation: "Mother",
    emergencyContact: "Fatima Yusuf",
    moveInDay: 18,
    paymentsCount: 4,
    status: "active",
  });

  await seedTenancy(ikotaSharedB.id, RENT_BY_TYPE.shared, "auto", {
    fullName: "Funmilayo Ajayi",
    occupation: "Teacher",
    nextOfKinName: "Olumide Ajayi",
    nextOfKinRelation: "Brother",
    emergencyContact: "Olumide Ajayi",
    moveInDay: 25,
    paymentsCount: 4,
    status: "active",
  });

  // ikotaSingle stays vacant.

  console.log("Seed complete.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
