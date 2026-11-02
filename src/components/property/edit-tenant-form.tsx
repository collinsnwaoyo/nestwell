"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FormField, inputClass } from "@/components/ui/form";
import { updateTenant } from "@/lib/actions/edit-tenant";
import type { BedDetail } from "@/lib/db/queries";

export function EditTenantForm({
  tenant,
  propertyId,
  onDone,
  onCancel,
}: {
  tenant: NonNullable<BedDetail["tenant"]>;
  propertyId: string;
  onDone: () => void;
  onCancel: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [verified, setVerified] = useState(tenant.verified);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await updateTenant({
        tenantId: tenant.id,
        propertyId,
        fullName: String(formData.get("fullName") ?? ""),
        phone: String(formData.get("phone") ?? ""),
        email: String(formData.get("email") ?? ""),
        occupation: String(formData.get("occupation") ?? ""),
        nextOfKinName: String(formData.get("nextOfKinName") ?? ""),
        nextOfKinRelation: String(formData.get("nextOfKinRelation") ?? ""),
        nextOfKinPhone: String(formData.get("nextOfKinPhone") ?? ""),
        emergencyContact: String(formData.get("emergencyContact") ?? ""),
        verified,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      toast.success("Tenant updated");
      onDone();
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <FormField label="Full name" htmlFor="edit-fullName">
        <input id="edit-fullName" name="fullName" className={inputClass} defaultValue={tenant.fullName} required />
      </FormField>
      <FormField label="WhatsApp number" htmlFor="edit-phone" hint="+234 format">
        <input id="edit-phone" name="phone" className={inputClass} defaultValue={tenant.phone} required />
      </FormField>
      <FormField label="Email" htmlFor="edit-email">
        <input id="edit-email" name="email" type="email" className={inputClass} defaultValue={tenant.email} required />
      </FormField>
      <FormField label="Occupation / employer" htmlFor="edit-occupation">
        <input id="edit-occupation" name="occupation" className={inputClass} defaultValue={tenant.occupation} required />
      </FormField>
      <FormField label="Next of kin name" htmlFor="edit-nextOfKinName">
        <input
          id="edit-nextOfKinName"
          name="nextOfKinName"
          className={inputClass}
          defaultValue={tenant.nextOfKinName}
          required
        />
      </FormField>
      <FormField label="Relationship" htmlFor="edit-nextOfKinRelation">
        <input
          id="edit-nextOfKinRelation"
          name="nextOfKinRelation"
          className={inputClass}
          defaultValue={tenant.nextOfKinRelation}
          required
        />
      </FormField>
      <FormField label="Next of kin phone" htmlFor="edit-nextOfKinPhone" hint="+234 format">
        <input
          id="edit-nextOfKinPhone"
          name="nextOfKinPhone"
          className={inputClass}
          defaultValue={tenant.nextOfKinPhone}
          required
        />
      </FormField>
      <FormField label="Emergency contact" htmlFor="edit-emergencyContact">
        <input
          id="edit-emergencyContact"
          name="emergencyContact"
          className={inputClass}
          defaultValue={tenant.emergencyContact}
          required
        />
      </FormField>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={verified}
          onChange={(event) => setVerified(event.target.checked)}
          className="size-4 rounded-sm accent-positive"
        />
        Documents verified
      </label>

      {error && <p className="text-danger">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
