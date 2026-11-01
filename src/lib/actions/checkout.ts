"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseClient } from "@/lib/db/client";
import type { DepositOutcome } from "@/lib/db/types";
import type { ActionResult } from "./properties";

export async function checkOutTenant(
  tenancyId: string,
  moveOutDate: string,
  depositOutcome: DepositOutcome,
  deductionReason: string,
): Promise<ActionResult<{ tenancyId: string }>> {
  if (!moveOutDate) return { error: "A move-out date is required." };
  if (depositOutcome === "partial" && !deductionReason.trim()) {
    return { error: "A reason is required for a partial deposit deduction." };
  }

  const supabase = getSupabaseClient();

  const { data: tenancy, error: tenancyError } = await supabase
    .from("tenancies")
    .select("*")
    .eq("id", tenancyId)
    .maybeSingle();
  if (tenancyError) return { error: tenancyError.message };
  if (!tenancy) return { error: "Tenancy not found." };
  if (tenancy.status === "checked_out") return { error: "This tenant is already checked out." };

  const { error: updateError } = await supabase
    .from("tenancies")
    .update({ status: "checked_out", move_out: moveOutDate, deposit_outcome: depositOutcome })
    .eq("id", tenancyId);
  if (updateError) return { error: updateError.message };

  const { error: eventError } = await supabase.from("events").insert({
    tenancy_id: tenancyId,
    type: "tenant_checked_out",
    payload: {
      move_out: moveOutDate,
      deposit_outcome: depositOutcome,
      ...(depositOutcome === "partial" ? { deduction_reason: deductionReason.trim() } : {}),
    },
  });
  if (eventError) return { error: eventError.message };

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
  revalidatePath("/properties");

  return { data: { tenancyId } };
}
