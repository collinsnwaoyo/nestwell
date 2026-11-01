"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseClient } from "@/lib/db/client";
import { ALLOWED_UPLOAD_MIME_TYPES, MAX_UPLOAD_BYTES, TENANT_DOCS_BUCKET } from "@/config/rules";
import type { GovIdType } from "@/lib/db/types";
import type { ActionResult } from "./properties";

const PHONE_PATTERN = /^\+234\d{10}$/;
const GOV_ID_TYPES: GovIdType[] = ["nin_slip", "international_passport", "voters_card"];

function validateFile(value: FormDataEntryValue | null, label: string): string | null {
  if (!(value instanceof File) || value.size === 0) return `${label} is required.`;
  if (value.size > MAX_UPLOAD_BYTES) return `${label} must be 5MB or smaller.`;
  if (!ALLOWED_UPLOAD_MIME_TYPES.includes(value.type)) {
    return `${label} must be a JPEG, PNG, WEBP or PDF.`;
  }
  return null;
}

export interface AddTenantMeta {
  bedId: string;
  rent: number;
}

export async function addTenant(
  meta: AddTenantMeta,
  formData: FormData,
): Promise<ActionResult<{ tenancyId: string }>> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const occupation = String(formData.get("occupation") ?? "").trim();
  const nextOfKinName = String(formData.get("nextOfKinName") ?? "").trim();
  const nextOfKinRelation = String(formData.get("nextOfKinRelation") ?? "").trim();
  const nextOfKinPhone = String(formData.get("nextOfKinPhone") ?? "").trim();
  const emergencyContact = String(formData.get("emergencyContact") ?? "").trim();
  const moveIn = String(formData.get("moveIn") ?? "").trim();
  const deposit = Number(formData.get("deposit"));
  const govIdType = String(formData.get("govIdType") ?? "") as GovIdType;

  if (
    !fullName ||
    !email ||
    !occupation ||
    !nextOfKinName ||
    !nextOfKinRelation ||
    !nextOfKinPhone ||
    !emergencyContact ||
    !moveIn
  ) {
    return { error: "All fields are required." };
  }
  if (!PHONE_PATTERN.test(phone)) {
    return { error: "WhatsApp number must be in +234 format, e.g. +2348012345678." };
  }
  if (!PHONE_PATTERN.test(nextOfKinPhone)) {
    return { error: "Next of kin phone must be in +234 format." };
  }
  if (!Number.isFinite(deposit) || deposit < 0) {
    return { error: "Deposit must be a positive number." };
  }
  if (!GOV_ID_TYPES.includes(govIdType)) {
    return { error: "Choose a government ID type." };
  }

  const photo = formData.get("photo");
  const licence = formData.get("licence");
  const govId = formData.get("govId");

  const fileError =
    validateFile(photo, "Passport photo") ??
    validateFile(licence, "Driver's licence") ??
    validateFile(govId, "Government ID");
  if (fileError) return { error: fileError };

  const supabase = getSupabaseClient();

  const { data: bed, error: bedError } = await supabase
    .from("beds")
    .select("id, room_id")
    .eq("id", meta.bedId)
    .maybeSingle();
  if (bedError) return { error: bedError.message };
  if (!bed) return { error: "Bed not found." };

  const { data: existingTenancy, error: existingError } = await supabase
    .from("tenancies")
    .select("id")
    .eq("bed_id", meta.bedId)
    .in("status", ["active", "notice"])
    .maybeSingle();
  if (existingError) return { error: existingError.message };
  if (existingTenancy) return { error: "This bed already has a tenant." };

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .insert({
      full_name: fullName,
      phone,
      email,
      occupation,
      next_of_kin_name: nextOfKinName,
      next_of_kin_relation: nextOfKinRelation,
      next_of_kin_phone: nextOfKinPhone,
      emergency_contact: emergencyContact,
      gov_id_type: govIdType,
      verified: false,
    })
    .select()
    .single();
  if (tenantError) return { error: tenantError.message };
  if (!tenant) return { error: "Failed to create tenant." };
  const tenantId = tenant.id;

  async function uploadDoc(kind: string, file: FormDataEntryValue | null): Promise<string> {
    const typedFile = file as File;
    const extension = typedFile.name.split(".").pop() || "bin";
    const path = `${tenantId}/${kind}.${extension}`;
    const { error } = await supabase.storage
      .from(TENANT_DOCS_BUCKET)
      .upload(path, typedFile, { upsert: true, contentType: typedFile.type });
    if (error) throw new Error(error.message);
    return path;
  }

  try {
    const [photoPath, licencePath, govIdPath] = await Promise.all([
      uploadDoc("photo", photo),
      uploadDoc("licence", licence),
      uploadDoc("gov-id", govId),
    ]);

    const { error: updateError } = await supabase
      .from("tenants")
      .update({ photo_url: photoPath, licence_url: licencePath, gov_id_url: govIdPath })
      .eq("id", tenantId);
    if (updateError) throw new Error(updateError.message);
  } catch (err) {
    await supabase.from("tenants").delete().eq("id", tenantId);
    return { error: err instanceof Error ? err.message : "Document upload failed." };
  }

  const { data: tenancy, error: tenancyError } = await supabase
    .from("tenancies")
    .insert({
      bed_id: meta.bedId,
      tenant_id: tenantId,
      move_in: moveIn,
      rent: meta.rent,
      deposit,
      status: "active",
    })
    .select()
    .single();
  if (tenancyError) {
    await supabase.from("tenants").delete().eq("id", tenantId);
    return { error: tenancyError.message };
  }

  const { error: eventError } = await supabase.from("events").insert({
    tenancy_id: tenancy.id,
    type: "tenant_checked_in",
    payload: { rent: meta.rent, deposit, move_in: moveIn },
  });
  if (eventError) return { error: eventError.message };

  const { data: room } = await supabase
    .from("rooms")
    .select("property_id")
    .eq("id", bed.room_id)
    .maybeSingle();
  if (room) revalidatePath(`/properties/${room.property_id}`);
  revalidatePath("/home");
  revalidatePath("/properties");

  return { data: { tenancyId: tenancy.id } };
}
