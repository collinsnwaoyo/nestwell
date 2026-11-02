"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { FormField, inputClass } from "@/components/ui/form";
import { addProperty } from "@/lib/actions/properties";

export function AddPropertyButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setName("");
    setArea("");
    setAddress("");
    setError(null);
  }

  function close() {
    setOpen(false);
    reset();
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const result = await addProperty({ name, area, address });
      if (result.error) {
        setError(result.error);
        return;
      }
      toast.success(`${name} added`);
      const propertyId = result.data?.id;
      close();
      if (propertyId) router.push(`/properties/${propertyId}`);
    });
  }

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)} className="gap-1.5 rounded-md px-4">
        <Plus /> Add property
      </Button>
      <Sheet open={open} onClose={close} title="Add property" description="You can add its rooms next.">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FormField label="Name" htmlFor="property-name">
            <input
              id="property-name"
              className={inputClass}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Nestwell Victoria Island"
              required
            />
          </FormField>
          <FormField label="Area" htmlFor="property-area">
            <input
              id="property-area"
              className={inputClass}
              value={area}
              onChange={(event) => setArea(event.target.value)}
              placeholder="Victoria Island"
              required
            />
          </FormField>
          <FormField label="Address" htmlFor="property-address">
            <input
              id="property-address"
              className={inputClass}
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              placeholder="12 Adeola Odeku Street, Victoria Island, Lagos"
              required
            />
          </FormField>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={pending} className="mt-2 rounded-md">
            {pending ? "Adding…" : "Add property"}
          </Button>
        </form>
      </Sheet>
    </>
  );
}
