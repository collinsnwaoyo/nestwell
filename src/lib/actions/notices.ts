"use server";

import { revalidatePath } from "next/cache";
import { format } from "date-fns";
import { getSupabaseClient } from "@/lib/db/client";
import { fillTemplate, toLagosDate } from "@/lib/domain";
import { MESSAGE_TEMPLATES } from "@/config/rules";
import type { ActionResult } from "./properties";

export interface IssueNoticeResult {
  messageId: string;
  waLink: string;
}

export async function issueNotice(
  tenancyId: string,
  reason: string,
  moveOutDate: string,
): Promise<ActionResult<IssueNoticeResult>> {
  const trimmedReason = reason.trim();
  if (!trimmedReason) return { error: "A reason is required." };
  if (!moveOutDate) return { error: "A move-out date is required." };

  const supabase = getSupabaseClient();

  const { data: tenancy, error: tenancyError } = await supabase
    .from("tenancies")
    .select("*")
    .eq("id", tenancyId)
    .maybeSingle();
  if (tenancyError) return { error: tenancyError.message };
  if (!tenancy) return { error: "Tenancy not found." };
  if (tenancy.status !== "active") return { error: "Only an active tenancy can be put on notice." };

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

  const { error: updateError } = await supabase
    .from("tenancies")
    .update({ status: "notice", notice_reason: trimmedReason, move_out: moveOutDate })
    .eq("id", tenancyId);
  if (updateError) return { error: updateError.message };

  const { error: eventError } = await supabase.from("events").insert({
    tenancy_id: tenancyId,
    type: "notice_issued",
    payload: { reason: trimmedReason, move_out: moveOutDate },
  });
  if (eventError) return { error: eventError.message };

  const firstName = tenant.full_name.split(" ")[0];
  const body = fillTemplate(MESSAGE_TEMPLATES.notice, {
    firstName,
    room: roomName,
    date: format(toLagosDate(moveOutDate), "d MMM yyyy"),
    reason: trimmedReason,
  });
  const phoneDigits = tenant.phone.replace(/\D/g, "");
  const waLink = `https://wa.me/${phoneDigits}?text=${encodeURIComponent(body)}`;

  const { data: message, error: messageError } = await supabase
    .from("messages")
    .insert({
      tenancy_id: tenancyId,
      phone: tenant.phone,
      template: "notice",
      body,
      trigger: "manual",
      status: "ready",
      wa_link: waLink,
    })
    .select()
    .single();
  if (messageError) return { error: messageError.message };
  if (!message) return { error: "Failed to create notice message." };

  if (propertyId) revalidatePath(`/properties/${propertyId}`);
  revalidatePath("/home");
  revalidatePath("/messages");

  return { data: { messageId: message.id, waLink } };
}
