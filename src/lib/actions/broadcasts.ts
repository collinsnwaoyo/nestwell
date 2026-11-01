"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseClient } from "@/lib/db/client";
import { fillTemplate, formatNaira, getNextDueDate } from "@/lib/domain";
import type { BroadcastScopeType, BroadcastTemplate } from "@/lib/db/types";
import type { ActionResult } from "./properties";

interface ScopedTenancy {
  id: string;
  tenant_id: string;
  move_in: string;
  rent: number;
}

async function resolveScopeTenancies(
  scopeType: BroadcastScopeType,
  scopeId: string | null,
): Promise<ScopedTenancy[] | { error: string }> {
  const supabase = getSupabaseClient();
  const base = () =>
    supabase.from("tenancies").select("id, tenant_id, move_in, rent, bed_id").in("status", ["active", "notice"]);

  if (scopeType === "portfolio") {
    const { data, error } = await base();
    if (error) return { error: error.message };
    return data ?? [];
  }

  if (scopeType === "tenant") {
    if (!scopeId) return { error: "Missing tenancy." };
    const { data, error } = await base().eq("id", scopeId);
    if (error) return { error: error.message };
    return data ?? [];
  }

  if (scopeType === "room") {
    if (!scopeId) return { error: "Missing room." };
    const { data: beds, error: bedsError } = await supabase.from("beds").select("id").eq("room_id", scopeId);
    if (bedsError) return { error: bedsError.message };
    const bedIds = (beds ?? []).map((b) => b.id);
    if (!bedIds.length) return [];
    const { data, error } = await base().in("bed_id", bedIds);
    if (error) return { error: error.message };
    return data ?? [];
  }

  if (scopeType === "property") {
    if (!scopeId) return { error: "Missing property." };
    const { data: rooms, error: roomsError } = await supabase.from("rooms").select("id").eq("property_id", scopeId);
    if (roomsError) return { error: roomsError.message };
    const roomIds = (rooms ?? []).map((r) => r.id);
    if (!roomIds.length) return [];
    const { data: beds, error: bedsError } = await supabase.from("beds").select("id").in("room_id", roomIds);
    if (bedsError) return { error: bedsError.message };
    const bedIds = (beds ?? []).map((b) => b.id);
    if (!bedIds.length) return [];
    const { data, error } = await base().in("bed_id", bedIds);
    if (error) return { error: error.message };
    return data ?? [];
  }

  return { error: "Unknown scope." };
}

export interface BroadcastRecipientPreview {
  tenancyId: string;
  fullName: string;
  roomName: string;
  propertyName: string;
  rent: number;
  dueDate: string;
}

export async function previewBroadcastRecipients(
  scopeType: BroadcastScopeType,
  scopeId: string | null,
): Promise<ActionResult<BroadcastRecipientPreview[]>> {
  const supabase = getSupabaseClient();
  const result = await resolveScopeTenancies(scopeType, scopeId);
  if ("error" in result) return { error: result.error };
  const tenancies = result;
  if (!tenancies.length) return { data: [] };

  const { data: fullTenancies, error: tenanciesError } = await supabase
    .from("tenancies")
    .select("id, tenant_id, bed_id, rent, move_in")
    .in(
      "id",
      tenancies.map((t) => t.id),
    );
  if (tenanciesError) return { error: tenanciesError.message };

  const tenantIds = [...new Set((fullTenancies ?? []).map((t) => t.tenant_id))];
  const bedIds = [...new Set((fullTenancies ?? []).map((t) => t.bed_id))];

  const [tenantsRes, bedsRes, paymentsRes] = await Promise.all([
    supabase.from("tenants").select("id, full_name").in("id", tenantIds),
    supabase.from("beds").select("id, room_id").in("id", bedIds),
    supabase
      .from("payments")
      .select("tenancy_id")
      .in(
        "tenancy_id",
        tenancies.map((t) => t.id),
      ),
  ]);
  if (tenantsRes.error) return { error: tenantsRes.error.message };
  if (bedsRes.error) return { error: bedsRes.error.message };
  if (paymentsRes.error) return { error: paymentsRes.error.message };

  const roomIds = [...new Set((bedsRes.data ?? []).map((b) => b.room_id))];
  const roomsRes = roomIds.length
    ? await supabase.from("rooms").select("id, name, property_id").in("id", roomIds)
    : { data: [], error: null };
  if (roomsRes.error) return { error: roomsRes.error.message };

  const propertyIds = [...new Set((roomsRes.data ?? []).map((r) => r.property_id))];
  const propertiesRes = propertyIds.length
    ? await supabase.from("properties").select("id, name").in("id", propertyIds)
    : { data: [], error: null };
  if (propertiesRes.error) return { error: propertiesRes.error.message };

  const tenantById = new Map((tenantsRes.data ?? []).map((t) => [t.id, t]));
  const bedById = new Map((bedsRes.data ?? []).map((b) => [b.id, b]));
  const roomById = new Map((roomsRes.data ?? []).map((r) => [r.id, r]));
  const propertyById = new Map((propertiesRes.data ?? []).map((p) => [p.id, p]));

  const paymentsCountByTenancy = new Map<string, number>();
  for (const payment of paymentsRes.data ?? []) {
    paymentsCountByTenancy.set(payment.tenancy_id, (paymentsCountByTenancy.get(payment.tenancy_id) ?? 0) + 1);
  }

  const recipients: BroadcastRecipientPreview[] = [];
  for (const tenancy of fullTenancies ?? []) {
    const tenant = tenantById.get(tenancy.tenant_id);
    if (!tenant) continue;
    const bed = bedById.get(tenancy.bed_id);
    const room = bed ? roomById.get(bed.room_id) : undefined;
    const property = room ? propertyById.get(room.property_id) : undefined;
    const paymentsCount = paymentsCountByTenancy.get(tenancy.id) ?? 0;
    const dueDate = getNextDueDate(tenancy.move_in, paymentsCount);

    recipients.push({
      tenancyId: tenancy.id,
      fullName: tenant.full_name,
      roomName: room?.name ?? "",
      propertyName: property?.name ?? "",
      rent: tenancy.rent,
      dueDate: dueDate.toISOString(),
    });
  }

  recipients.sort((a, b) => a.fullName.localeCompare(b.fullName));
  return { data: recipients };
}

export interface CreateBroadcastInput {
  scopeType: BroadcastScopeType;
  scopeId: string | null;
  template: BroadcastTemplate;
  bodyTemplate: string;
  newRent: string;
  effectiveDate: string;
  includedTenancyIds: string[];
}

export interface BroadcastMessage {
  tenancyId: string;
  messageId: string;
  recipientName: string;
  body: string;
  waLink: string;
}

export async function createBroadcast(
  input: CreateBroadcastInput,
): Promise<ActionResult<{ broadcastId: string; messages: BroadcastMessage[] }>> {
  if (!input.bodyTemplate.trim()) return { error: "The message can't be empty." };
  if (!input.includedTenancyIds.length) return { error: "Select at least one recipient." };

  const previewResult = await previewBroadcastRecipients(input.scopeType, input.scopeId);
  if (previewResult.error) return { error: previewResult.error };
  const allRecipients = (previewResult.data ?? []).filter((r) => input.includedTenancyIds.includes(r.tenancyId));
  if (!allRecipients.length) return { error: "Select at least one recipient." };

  const supabase = getSupabaseClient();

  const { data: broadcast, error: broadcastError } = await supabase
    .from("broadcasts")
    .insert({
      scope_type: input.scopeType,
      scope_id: input.scopeId,
      template: input.template,
      body: input.bodyTemplate,
    })
    .select()
    .single();
  if (broadcastError) return { error: broadcastError.message };
  if (!broadcast) return { error: "Failed to create broadcast." };

  const { data: tenancyRows, error: tenancyRowsError } = await supabase
    .from("tenancies")
    .select("id, tenant_id")
    .in(
      "id",
      allRecipients.map((r) => r.tenancyId),
    );
  if (tenancyRowsError) return { error: tenancyRowsError.message };

  const { data: tenants, error: tenantsError } = await supabase
    .from("tenants")
    .select("id, phone")
    .in(
      "id",
      (tenancyRows ?? []).map((t) => t.tenant_id),
    );
  if (tenantsError) return { error: tenantsError.message };

  const tenantIdByTenancy = new Map((tenancyRows ?? []).map((t) => [t.id, t.tenant_id]));
  const phoneByTenant = new Map((tenants ?? []).map((t) => [t.id, t.phone]));

  const messages: BroadcastMessage[] = [];

  for (const recipient of allRecipients) {
    const tenantId = tenantIdByTenancy.get(recipient.tenancyId);
    const phone = tenantId ? phoneByTenant.get(tenantId) : undefined;
    if (!phone) continue;

    const firstName = recipient.fullName.split(" ")[0];
    const body = fillTemplate(input.bodyTemplate, {
      firstName,
      room: recipient.roomName,
      property: recipient.propertyName,
      rent: formatNaira(recipient.rent),
      newRent: input.newRent,
      effectiveDate: input.effectiveDate,
      dueDate: new Date(recipient.dueDate).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
    });
    const phoneDigits = phone.replace(/\D/g, "");
    const waLink = `https://wa.me/${phoneDigits}?text=${encodeURIComponent(body)}`;

    const { data: message, error: messageError } = await supabase
      .from("messages")
      .insert({
        tenancy_id: recipient.tenancyId,
        broadcast_id: broadcast.id,
        phone,
        template: input.template,
        body,
        trigger: "broadcast",
        status: "ready",
        wa_link: waLink,
      })
      .select()
      .single();
    if (messageError || !message) continue;

    messages.push({
      tenancyId: recipient.tenancyId,
      messageId: message.id,
      recipientName: recipient.fullName,
      body,
      waLink,
    });
  }

  if (messages.length) {
    await supabase.from("events").insert(
      messages.map((m) => ({
        tenancy_id: m.tenancyId,
        type: "broadcast_sent",
        payload: { broadcast_id: broadcast.id, template: input.template },
      })),
    );
  }

  revalidatePath("/messages");
  revalidatePath("/home");
  revalidatePath("/properties");

  return { data: { broadcastId: broadcast.id, messages } };
}
