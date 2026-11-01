"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseClient } from "@/lib/db/client";
import type { ActionResult } from "./properties";

const PHONE_PATTERN = /^\+234\d{10}$/;

export interface EditTenantInput {
  tenantId: string;
  propertyId: string;
  fullName: string;
  phone: string;
  email: string;
  occupation: string;
  nextOfKinName: string;
  nextOfKinRelation: string;
  nextOfKinPhone: string;
  emergencyContact: string;
  verified: boolean;
}

export async function updateTenant(input: EditTenantInput): Promise<ActionResult<{ id: string }>> {
  const fullName = input.fullName.trim();
  const phone = input.phone.trim();
  const email = input.email.trim();
  const occupation = input.occupation.trim();
  const nextOfKinName = input.nextOfKinName.trim();
  const nextOfKinRelation = input.nextOfKinRelation.trim();
  const nextOfKinPhone = input.nextOfKinPhone.trim();
  const emergencyContact = input.emergencyContact.trim();

  if (!fullName || !email || !occupation || !nextOfKinName || !nextOfKinRelation || !emergencyContact) {
    return { error: "All fields are required." };
  }
  if (!PHONE_PATTERN.test(phone)) {
    return { error: "WhatsApp number must be in +234 format, e.g. +2348012345678." };
  }
  if (!PHONE_PATTERN.test(nextOfKinPhone)) {
    return { error: "Next of kin phone must be in +234 format." };
  }

  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("tenants")
    .update({
      full_name: fullName,
      phone,
      email,
      occupation,
      next_of_kin_name: nextOfKinName,
      next_of_kin_relation: nextOfKinRelation,
      next_of_kin_phone: nextOfKinPhone,
      emergency_contact: emergencyContact,
      verified: input.verified,
    })
    .eq("id", input.tenantId);
  if (error) return { error: error.message };

  revalidatePath(`/properties/${input.propertyId}`);
  revalidatePath("/home");

  return { data: { id: input.tenantId } };
}
