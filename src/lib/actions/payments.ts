"use server";

import { revalidatePath } from "next/cache";
import { format } from "date-fns";
import { getSupabaseClient } from "@/lib/db/client";
import { fillTemplate, formatNaira, getNextDueDate } from "@/lib/domain";
import { MESSAGE_TEMPLATES } from "@/config/rules";
import type { PaymentMethod } from "@/lib/db/types";
import type { ActionResult } from "./properties";

export interface RecordPaymentResult {
  paymentId: string;
  messageId: string;
  waLink: string;
}

export async function recordPayment(
  tenancyId: string,
  method: PaymentMethod,
): Promise<ActionResult<RecordPaymentResult>> {
  const supabase = getSupabaseClient();

  const { data: tenancy, error: tenancyError } = await supabase
    .from("tenancies")
    .select("*")
    .eq("id", tenancyId)
    .maybeSingle();
  if (tenancyError) return { error: tenancyError.message };
  if (!tenancy) return { error: "Tenancy not found." };

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("full_name, phone")
    .eq("id", tenancy.tenant_id)
    .maybeSingle();
  if (tenantError) return { error: tenantError.message };
  if (!tenant) return { error: "Tenant not found." };

  const { count, error: countError } = await supabase
    .from("payments")
    .select("id", { count: "exact", head: true })
    .eq("tenancy_id", tenancyId);
  if (countError) return { error: countError.message };
  const paymentsCount = count ?? 0;

  const periodDate = getNextDueDate(tenancy.move_in, paymentsCount);
  const periodMonth = format(periodDate, "yyyy-MM-dd");

  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .insert({ tenancy_id: tenancyId, period_month: periodMonth, amount: tenancy.rent, method })
    .select()
    .single();
  if (paymentError) return { error: paymentError.message };
  if (!payment) return { error: "Failed to record payment." };

  const { error: eventError } = await supabase.from("events").insert({
    tenancy_id: tenancyId,
    type: "payment_recorded",
    payload: { amount: tenancy.rent, method, period_month: periodMonth },
  });
  if (eventError) return { error: eventError.message };

  const nextDue = getNextDueDate(tenancy.move_in, paymentsCount + 1);
  const firstName = tenant.full_name.split(" ")[0];
  const body = fillTemplate(MESSAGE_TEMPLATES.receipt, {
    firstName,
    amount: formatNaira(tenancy.rent),
    month: format(periodDate, "MMMM yyyy"),
    nextDue: format(nextDue, "d MMM yyyy"),
  });
  const phoneDigits = tenant.phone.replace(/\D/g, "");
  const waLink = `https://wa.me/${phoneDigits}?text=${encodeURIComponent(body)}`;

  const { data: message, error: messageError } = await supabase
    .from("messages")
    .insert({
      tenancy_id: tenancyId,
      phone: tenant.phone,
      template: "receipt",
      body,
      trigger: "manual",
      status: "ready",
      wa_link: waLink,
    })
    .select()
    .single();
  if (messageError) return { error: messageError.message };
  if (!message) return { error: "Failed to create receipt message." };

  const { data: bed } = await supabase.from("beds").select("room_id").eq("id", tenancy.bed_id).maybeSingle();
  if (bed) {
    const { data: room } = await supabase
      .from("rooms")
      .select("property_id")
      .eq("id", bed.room_id)
      .maybeSingle();
    if (room) revalidatePath(`/properties/${room.property_id}`);
  }
  revalidatePath("/home");
  revalidatePath("/messages");

  return { data: { paymentId: payment.id, messageId: message.id, waLink } };
}

/**
 * Undo straight after recording (from the toast). Removes the payment and
 * its unsent receipt; the events log keeps both the recording and the undo.
 */
export async function undoPayment(paymentId: string, messageId: string): Promise<ActionResult<null>> {
  const supabase = getSupabaseClient();

  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .select("tenancy_id, amount, period_month")
    .eq("id", paymentId)
    .maybeSingle();
  if (paymentError) return { error: paymentError.message };
  if (!payment) return { error: "That payment has already been removed." };

  const { error: messageError } = await supabase.from("messages").delete().eq("id", messageId);
  if (messageError) return { error: messageError.message };
  const { error: deleteError } = await supabase.from("payments").delete().eq("id", paymentId);
  if (deleteError) return { error: deleteError.message };

  const { error: eventError } = await supabase.from("events").insert({
    tenancy_id: payment.tenancy_id,
    type: "payment_undone",
    payload: { payment_id: paymentId, amount: payment.amount, period_month: payment.period_month },
  });
  if (eventError) return { error: eventError.message };

  revalidatePath("/", "layout");
  return { data: null };
}
