"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition, type FormEvent } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FormField, inputClass } from "@/components/ui/form";
import { DEFAULT_DEPOSIT } from "@/config/rules";
import { addTenant } from "@/lib/actions/tenants";
import type { GovIdType } from "@/lib/db/types";

const fileInputClass = `${inputClass} file:mr-3 file:rounded-md file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary`;

const GOV_ID_OPTIONS: { value: GovIdType; label: string }[] = [
  { value: "nin_slip", label: "NIN slip" },
  { value: "international_passport", label: "International passport" },
  { value: "voters_card", label: "Voter's card" },
];

export function AddTenantForm({
  bedId,
  rentPerBed,
  onDone,
}: {
  bedId: string;
  rentPerBed: number;
  onDone: () => void;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await addTenant({ bedId, rent: rentPerBed }, formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      toast.success("Tenant added — verification pending");
      onDone();
      router.refresh();
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-4">
        <FormField label="Full name" htmlFor="fullName">
          <input id="fullName" name="fullName" className={inputClass} required />
        </FormField>
        <FormField label="WhatsApp number" htmlFor="phone" hint="+234 format, e.g. +2348012345678">
          <input id="phone" name="phone" className={inputClass} placeholder="+2348012345678" required />
        </FormField>
        <FormField label="Email" htmlFor="email">
          <input id="email" name="email" type="email" className={inputClass} required />
        </FormField>
        <FormField label="Occupation / employer" htmlFor="occupation">
          <input id="occupation" name="occupation" className={inputClass} required />
        </FormField>
      </div>

      <div className="flex flex-col gap-4 border-t border-border pt-5">
        <h3 className="text-sm font-medium text-muted-foreground">Next of kin</h3>
        <FormField label="Name" htmlFor="nextOfKinName">
          <input id="nextOfKinName" name="nextOfKinName" className={inputClass} required />
        </FormField>
        <FormField label="Relationship" htmlFor="nextOfKinRelation">
          <input id="nextOfKinRelation" name="nextOfKinRelation" className={inputClass} placeholder="Sister" required />
        </FormField>
        <FormField label="Phone" htmlFor="nextOfKinPhone" hint="+234 format">
          <input id="nextOfKinPhone" name="nextOfKinPhone" className={inputClass} placeholder="+2348012345678" required />
        </FormField>
        <FormField label="Emergency contact" htmlFor="emergencyContact" hint="Name and phone">
          <input
            id="emergencyContact"
            name="emergencyContact"
            className={inputClass}
            placeholder="Amina Bello — +2348012345678"
            required
          />
        </FormField>
      </div>

      <div className="flex flex-col gap-4 border-t border-border pt-5">
        <h3 className="text-sm font-medium text-muted-foreground">Documents</h3>
        <FormField label="Passport photo" htmlFor="photo">
          <input id="photo" name="photo" type="file" accept="image/jpeg,image/png,image/webp" className={fileInputClass} required />
        </FormField>
        <FormField label="Driver's licence" htmlFor="licence">
          <input
            id="licence"
            name="licence"
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className={fileInputClass}
            required
          />
        </FormField>
        <FormField label="Government ID type" htmlFor="govIdType">
          <select id="govIdType" name="govIdType" className={inputClass} defaultValue="nin_slip" required>
            {GOV_ID_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Government ID" htmlFor="govId">
          <input
            id="govId"
            name="govId"
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className={fileInputClass}
            required
          />
        </FormField>
        <p className="text-xs text-muted-foreground">
          Demo only, please don&apos;t upload real ID documents. 5MB max, images or PDF.
        </p>
      </div>

      <div className="flex flex-col gap-4 border-t border-border pt-5">
        <h3 className="text-sm font-medium text-muted-foreground">Tenancy</h3>
        <FormField label="Move-in date" htmlFor="moveIn">
          <input
            id="moveIn"
            name="moveIn"
            type="date"
            className={inputClass}
            defaultValue={format(new Date(), "yyyy-MM-dd")}
            required
          />
        </FormField>
        <FormField label="Rent (₦/month)" htmlFor="rent">
          <input id="rent" className={inputClass} value={rentPerBed} disabled readOnly />
        </FormField>
        <FormField label="Deposit (₦)" htmlFor="deposit">
          <input
            id="deposit"
            name="deposit"
            type="number"
            min={0}
            className={inputClass}
            defaultValue={DEFAULT_DEPOSIT}
            required
          />
        </FormField>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={pending} className="rounded-md">
        {pending ? "Adding tenant…" : "Add tenant"}
      </Button>
    </form>
  );
}
