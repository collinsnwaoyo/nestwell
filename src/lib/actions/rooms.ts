"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseClient } from "@/lib/db/client";
import { ROOM_TYPE_DEFAULTS } from "@/config/rules";
import type { ReminderMode, RoomType } from "@/lib/db/types";
import type { ActionResult } from "./properties";

export interface AddRoomInput {
  propertyId: string;
  name: string;
  type: RoomType;
  rentPerBed?: number;
  reminderMode?: ReminderMode;
}

export async function addRoom(input: AddRoomInput): Promise<ActionResult<{ id: string }>> {
  const name = input.name.trim();
  if (!name) return { error: "Room name is required." };

  const defaults = ROOM_TYPE_DEFAULTS[input.type];
  const rentPerBed = input.rentPerBed && input.rentPerBed > 0 ? input.rentPerBed : defaults.rentPerBed;

  const supabase = getSupabaseClient();
  const { data: room, error } = await supabase
    .from("rooms")
    .insert({
      property_id: input.propertyId,
      name,
      type: input.type,
      rent_per_bed: rentPerBed,
      reminder_mode: input.reminderMode ?? "manual",
    })
    .select()
    .single();
  if (error) return { error: error.message };

  const bedLabels =
    defaults.beds === 1
      ? [input.type === "studio" ? "Studio" : "Room"]
      : Array.from({ length: defaults.beds }, (_, i) => `Bed ${i + 1}`);

  const { error: bedsError } = await supabase
    .from("beds")
    .insert(bedLabels.map((label) => ({ room_id: room.id, label })));
  if (bedsError) return { error: bedsError.message };

  const { error: eventError } = await supabase.from("events").insert({
    tenancy_id: null,
    type: "room_added",
    payload: { room_id: room.id, property_id: input.propertyId, name, room_type: input.type, beds: defaults.beds },
  });
  if (eventError) return { error: eventError.message };

  revalidatePath(`/properties/${input.propertyId}`);
  revalidatePath("/home");
  return { data: { id: room.id } };
}

export interface UpdateRoomInput {
  roomId: string;
  propertyId: string;
  name: string;
  rentPerBed: number;
  reminderMode: ReminderMode;
}

export async function updateRoom(input: UpdateRoomInput): Promise<ActionResult<{ id: string }>> {
  const name = input.name.trim();
  if (!name) return { error: "Room name is required." };
  if (!Number.isFinite(input.rentPerBed) || input.rentPerBed <= 0) {
    return { error: "Rent must be a positive number." };
  }

  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("rooms")
    .update({ name, rent_per_bed: input.rentPerBed, reminder_mode: input.reminderMode })
    .eq("id", input.roomId);
  if (error) return { error: error.message };

  revalidatePath(`/properties/${input.propertyId}`);
  revalidatePath("/home");
  return { data: { id: input.roomId } };
}

export async function deleteRoom(roomId: string, propertyId: string): Promise<ActionResult<null>> {
  const supabase = getSupabaseClient();

  const { data: beds, error: bedsError } = await supabase.from("beds").select("id").eq("room_id", roomId);
  if (bedsError) return { error: bedsError.message };
  const bedIds = (beds ?? []).map((bed) => bed.id);

  if (bedIds.length) {
    const { count, error: tenancyCountError } = await supabase
      .from("tenancies")
      .select("id", { count: "exact", head: true })
      .in("bed_id", bedIds);
    if (tenancyCountError) return { error: tenancyCountError.message };
    if (count && count > 0) {
      return { error: "This room has tenant history and can't be deleted." };
    }

    const { error: deleteBedsError } = await supabase.from("beds").delete().in("id", bedIds);
    if (deleteBedsError) return { error: deleteBedsError.message };
  }

  const { error: deleteRoomError } = await supabase.from("rooms").delete().eq("id", roomId);
  if (deleteRoomError) return { error: deleteRoomError.message };

  revalidatePath(`/properties/${propertyId}`);
  revalidatePath("/home");
  return { data: null };
}
