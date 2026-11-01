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
