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
