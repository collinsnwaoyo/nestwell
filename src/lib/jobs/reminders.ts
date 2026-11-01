import "server-only";
import { format } from "date-fns";
import { getSupabaseClient } from "@/lib/db/client";
import {
  fillTemplate,
  formatNaira,
  getDaysUntilDue,
  getNextDueDate,
  getUnpaidPeriods,
  reminderDueToday,
} from "@/lib/domain";
import { MESSAGE_TEMPLATES, PAYMENT_ACCOUNT_DETAILS } from "@/config/rules";

export interface ReminderJobResult {
  sent: number;
  skipped: number;
}

/**
 * The daily reminder job for rooms on automatic mode: for each active
 * tenancy whose next due date is exactly 3 days out, due today, or 3 days
 * late, prepares the matching reminder (ready to send) if one hasn't
 * already gone out today. Runs from the cron route and the "Run today's
 * reminders" button alike.
 */
export async function runReminderJob(): Promise<ReminderJobResult> {
  const supabase = getSupabaseClient();
  const today = new Date();
  const todayStart = new Date(today);
  todayStart.setHours(0, 0, 0, 0);

  const { data: autoRooms, error: roomsError } = await supabase
    .from("rooms")
    .select("id")
    .eq("reminder_mode", "auto");
  if (roomsError) throw new Error(roomsError.message);
  const roomIds = (autoRooms ?? []).map((room) => room.id);
  if (!roomIds.length) return { sent: 0, skipped: 0 };

  const { data: beds, error: bedsError } = await supabase.from("beds").select("id").in("room_id", roomIds);
  if (bedsError) throw new Error(bedsError.message);
  const bedIds = (beds ?? []).map((bed) => bed.id);
  if (!bedIds.length) return { sent: 0, skipped: 0 };

  const { data: tenancies, error: tenanciesError } = await supabase
    .from("tenancies")
    .select("*")
    .in("bed_id", bedIds)
    .eq("status", "active");
  if (tenanciesError) throw new Error(tenanciesError.message);
  if (!tenancies?.length) return { sent: 0, skipped: 0 };

  let sent = 0;
  let skipped = 0;

  for (const tenancy of tenancies) {
    const { count, error: countError } = await supabase
      .from("payments")
      .select("id", { count: "exact", head: true })
      .eq("tenancy_id", tenancy.id);
    if (countError) throw new Error(countError.message);
    const paymentsCount = count ?? 0;

    const nextDue = getNextDueDate(tenancy.move_in, paymentsCount);
    const daysUntilDue = getDaysUntilDue(nextDue, today);
    const reminderType = reminderDueToday(daysUntilDue);
    if (!reminderType) continue;

    const { data: existing, error: existingError } = await supabase
      .from("messages")
      .select("id")
      .eq("tenancy_id", tenancy.id)
      .eq("trigger", "auto")
      .eq("template", reminderType)
      .gte("created_at", todayStart.toISOString());
    if (existingError) throw new Error(existingError.message);
    if (existing && existing.length > 0) {
      skipped++;
      continue;
    }

    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .select("full_name, phone")
      .eq("id", tenancy.tenant_id)
      .maybeSingle();
    if (tenantError) throw new Error(tenantError.message);
    if (!tenant) continue;

    const { data: bed } = await supabase.from("beds").select("room_id").eq("id", tenancy.bed_id).maybeSingle();
    let roomName = "";
    if (bed) {
      const { data: room } = await supabase.from("rooms").select("name").eq("id", bed.room_id).maybeSingle();
      roomName = room?.name ?? "";
    }

    const firstName = tenant.full_name.split(" ")[0];
    let body: string;

    if (reminderType === "due_soon") {
      body = fillTemplate(MESSAGE_TEMPLATES.dueSoon, {
        firstName,
        amount: formatNaira(tenancy.rent),
        room: roomName,
        dueDate: format(nextDue, "d MMM yyyy"),
      });
    } else if (reminderType === "due_today") {
      body = fillTemplate(MESSAGE_TEMPLATES.dueToday, {
        firstName,
        amount: formatNaira(tenancy.rent),
        accountDetails: PAYMENT_ACCOUNT_DETAILS,
      });
    } else {
      const { data: charges, error: chargesError } = await supabase
        .from("charges")
        .select("amount")
        .eq("tenancy_id", tenancy.id);
      if (chargesError) throw new Error(chargesError.message);

      const unpaidPeriods = getUnpaidPeriods(tenancy.move_in, today, paymentsCount);
      const daysLate = unpaidPeriods[0]?.daysLate ?? 0;
      const totalLateFees = (charges ?? []).reduce((sum, charge) => sum + charge.amount, 0);
      const balance = unpaidPeriods.length * tenancy.rent + totalLateFees;

      body = fillTemplate(MESSAGE_TEMPLATES.overdue, {
        firstName,
        days: String(daysLate),
        fee: formatNaira(totalLateFees),
        total: formatNaira(balance),
      });
    }

    const phoneDigits = tenant.phone.replace(/\D/g, "");
    const waLink = `https://wa.me/${phoneDigits}?text=${encodeURIComponent(body)}`;

    const { error: messageError } = await supabase.from("messages").insert({
      tenancy_id: tenancy.id,
      phone: tenant.phone,
      template: reminderType,
      body,
      trigger: "auto",
      status: "ready",
      wa_link: waLink,
    });
    if (messageError) throw new Error(messageError.message);

    const { error: eventError } = await supabase.from("events").insert({
      tenancy_id: tenancy.id,
      type: "reminder_sent",
      payload: { template: reminderType, trigger: "auto" },
    });
    if (eventError) throw new Error(eventError.message);

    sent++;
  }

  return { sent, skipped };
}
