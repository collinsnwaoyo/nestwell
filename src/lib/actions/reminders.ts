"use server";

import { revalidatePath } from "next/cache";
import { format } from "date-fns";
import { getSupabaseClient } from "@/lib/db/client";
import {
  deriveStatus,
  fillTemplate,
  formatNaira,
  getDaysUntilDue,
  getNextDueDate,
  getUnpaidPeriods,
} from "@/lib/domain";
import { MESSAGE_TEMPLATES, PAYMENT_ACCOUNT_DETAILS } from "@/config/rules";
import type { ActionResult } from "./properties";

export interface PushReminderResult {
  messageId: string;
  waLink: string;
}

export async function pushReminder(tenancyId: string): Promise<ActionResult<PushReminderResult>> {
  const supabase = getSupabaseClient();

  const { data: tenancy, error: tenancyError } = await supabase
    .from("tenancies")
    .select("*")
    .eq("id", tenancyId)
    .maybeSingle();
  if (tenancyError) return { error: tenancyError.message };
  if (!tenancy) return { error: "Tenancy not found." };
  if (tenancy.status !== "active") return { error: "This tenancy isn't active." };

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("full_name, phone")
    .eq("id", tenancy.tenant_id)
    .maybeSingle();
  if (tenantError) return { error: tenantError.message };
  if (!tenant) return { error: "Tenant not found." };

  const { data: bed } = await supabase.from("beds").select("room_id").eq("id", tenancy.bed_id).maybeSingle();
  let roomName = "";
  let propertyId: string | null = null;
  if (bed) {
    const { data: room } = await supabase
      .from("rooms")
      .select("name, property_id")
      .eq("id", bed.room_id)
      .maybeSingle();
    if (room) {
      roomName = room.name;
      propertyId = room.property_id;
    }
  }

  const { count, error: countError } = await supabase
    .from("payments")
    .select("id", { count: "exact", head: true })
    .eq("tenancy_id", tenancyId);
  if (countError) return { error: countError.message };
  const paymentsCount = count ?? 0;

  const today = new Date();
  const nextDueDate = getNextDueDate(tenancy.move_in, paymentsCount);
  const daysUntilDue = getDaysUntilDue(nextDueDate, today);
  const status = deriveStatus({ tenancyStatus: tenancy.status, daysUntilDue });

  if (status !== "due_soon" && status !== "due_today" && status !== "overdue") {
    return { error: "No reminder needed right now." };
  }

  const firstName = tenant.full_name.split(" ")[0];
  let template: string;
  let body: string;

  if (status === "due_soon") {
    template = "due_soon";
    body = fillTemplate(MESSAGE_TEMPLATES.dueSoon, {
      firstName,
      amount: formatNaira(tenancy.rent),
      room: roomName,
      dueDate: format(nextDueDate, "d MMM yyyy"),
    });
  } else if (status === "due_today") {
    template = "due_today";
    body = fillTemplate(MESSAGE_TEMPLATES.dueToday, {
      firstName,
      amount: formatNaira(tenancy.rent),
      accountDetails: PAYMENT_ACCOUNT_DETAILS,
    });
  } else {
    const { data: charges, error: chargesError } = await supabase
      .from("charges")
      .select("amount")
      .eq("tenancy_id", tenancyId);
    if (chargesError) return { error: chargesError.message };

    const unpaidPeriods = getUnpaidPeriods(tenancy.move_in, today, paymentsCount);
    const daysLate = unpaidPeriods[0]?.daysLate ?? 0;
    const totalLateFees = (charges ?? []).reduce((sum, charge) => sum + charge.amount, 0);
    const balance = unpaidPeriods.length * tenancy.rent + totalLateFees;

    template = "overdue";
    body = fillTemplate(MESSAGE_TEMPLATES.overdue, {
      firstName,
      days: String(daysLate),
      fee: formatNaira(totalLateFees),
      total: formatNaira(balance),
    });
  }

  const phoneDigits = tenant.phone.replace(/\D/g, "");
  const waLink = `https://wa.me/${phoneDigits}?text=${encodeURIComponent(body)}`;

  const { data: message, error: messageError } = await supabase
    .from("messages")
    .insert({
      tenancy_id: tenancyId,
      phone: tenant.phone,
      template,
      body,
      trigger: "manual",
      status: "ready",
      wa_link: waLink,
    })
    .select()
    .single();
  if (messageError) return { error: messageError.message };
  if (!message) return { error: "Failed to create reminder message." };

  const { error: eventError } = await supabase.from("events").insert({
    tenancy_id: tenancyId,
    type: "reminder_sent",
    payload: { template, trigger: "manual" },
  });
  if (eventError) return { error: eventError.message };

  if (propertyId) revalidatePath(`/properties/${propertyId}`);
  revalidatePath("/messages");

  return { data: { messageId: message.id, waLink } };
}
