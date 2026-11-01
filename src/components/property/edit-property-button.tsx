"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FormField, inputClass } from "@/components/ui/form";
import { Sheet } from "@/components/ui/sheet";
import { deleteProperty, updateProperty } from "@/lib/actions/properties";

export function EditPropertyButton({
  propertyId,
  name,
  area,
  address,
}: {
  propertyId: string;
  name: string;
  area: string;
  address: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function close() {
    setOpen(false);
    setError(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await updateProperty({
        propertyId,
        name: String(formData.get("name") ?? ""),
        area: String(formData.get("area") ?? ""),
        address: String(formData.get("address") ?? ""),
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      toast.success("Property updated");
      close();
      router.refresh();
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteProperty(propertyId);
      if (result.error) {
        setError(result.error);
        return;
      }
      toast.success("Property deleted");
      router.push("/properties");
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
        aria-label="Edit property"
      >
        <Pencil className="size-4" />
      </button>
      <Sheet open={open} onClose={close} title="Edit property">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FormField label="Name" htmlFor="edit-property-name">
            <input id="edit-property-name" name="name" className={inputClass} defaultValue={name} required />
          </FormField>
          <FormField label="Area" htmlFor="edit-property-area">
            <input id="edit-property-area" name="area" className={inputClass} defaultValue={area} required />
          </FormField>
          <FormField label="Address" htmlFor="edit-property-address">
            <input
              id="edit-property-address"
              name="address"
              className={inputClass}
              defaultValue={address}
              required
            />
          </FormField>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex items-center justify-between">
            <Button type="submit" disabled={pending} className="rounded-full">
              {pending ? "Saving…" : "Save changes"}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={pending}
              onClick={handleDelete}
              className="rounded-full"
            >
              Delete property
            </Button>
          </div>
        </form>
      </Sheet>
    </>
  );
}
