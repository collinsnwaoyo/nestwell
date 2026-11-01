"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseClient } from "@/lib/db/client";

export interface AddPropertyInput {
  name: string;
  area: string;
  address: string;
}

export interface ActionResult<T> {
  data?: T;
  error?: string;
}

export async function addProperty(input: AddPropertyInput): Promise<ActionResult<{ id: string }>> {
  const name = input.name.trim();
  const area = input.area.trim();
  const address = input.address.trim();
  if (!name || !area || !address) {
    return { error: "Name, area and address are required." };
  }

  const supabase = getSupabaseClient();
  const { data: property, error } = await supabase
    .from("properties")
    .insert({ name, area, address })
    .select()
    .single();
  if (error) return { error: error.message };

  const { error: eventError } = await supabase.from("events").insert({
    tenancy_id: null,
    type: "property_added",
    payload: { property_id: property.id, name },
  });
  if (eventError) return { error: eventError.message };

  revalidatePath("/home");
  revalidatePath("/properties");
  return { data: { id: property.id } };
}

export interface UpdatePropertyInput {
  propertyId: string;
  name: string;
  area: string;
  address: string;
}

export async function updateProperty(input: UpdatePropertyInput): Promise<ActionResult<{ id: string }>> {
  const name = input.name.trim();
  const area = input.area.trim();
  const address = input.address.trim();
  if (!name || !area || !address) {
    return { error: "Name, area and address are required." };
  }

  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("properties")
    .update({ name, area, address })
    .eq("id", input.propertyId);
  if (error) return { error: error.message };

  revalidatePath(`/properties/${input.propertyId}`);
  revalidatePath("/home");
  revalidatePath("/properties");
  return { data: { id: input.propertyId } };
}

export async function deleteProperty(propertyId: string): Promise<ActionResult<null>> {
  const supabase = getSupabaseClient();

  const { data: rooms, error: roomsError } = await supabase
    .from("rooms")
    .select("id")
    .eq("property_id", propertyId);
  if (roomsError) return { error: roomsError.message };
  const roomIds = (rooms ?? []).map((room) => room.id);

  let bedIds: string[] = [];
  if (roomIds.length) {
    const { data: beds, error: bedsError } = await supabase.from("beds").select("id").in("room_id", roomIds);
    if (bedsError) return { error: bedsError.message };
    bedIds = (beds ?? []).map((bed) => bed.id);
  }

  if (bedIds.length) {
    const { count, error: tenancyCountError } = await supabase
      .from("tenancies")
      .select("id", { count: "exact", head: true })
      .in("bed_id", bedIds);
    if (tenancyCountError) return { error: tenancyCountError.message };
    if (count && count > 0) {
      return { error: "This property has tenant history and can't be deleted." };
    }

    const { error: deleteBedsError } = await supabase.from("beds").delete().in("id", bedIds);
    if (deleteBedsError) return { error: deleteBedsError.message };
  }

  if (roomIds.length) {
    const { error: deleteRoomsError } = await supabase.from("rooms").delete().in("id", roomIds);
    if (deleteRoomsError) return { error: deleteRoomsError.message };
  }

  const { error: deletePropertyError } = await supabase.from("properties").delete().eq("id", propertyId);
  if (deletePropertyError) return { error: deletePropertyError.message };

  revalidatePath("/home");
  revalidatePath("/properties");
  return { data: null };
}
