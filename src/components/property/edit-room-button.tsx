"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FormField, inputClass } from "@/components/ui/form";
import { Sheet } from "@/components/ui/sheet";
import { deleteRoom, updateRoom } from "@/lib/actions/rooms";
import type { ReminderMode } from "@/lib/db/types";
import type { RoomDetail } from "@/lib/db/queries";

export function EditRoomButton({ room, propertyId }: { room: RoomDetail; propertyId: string }) {
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
      const result = await updateRoom({
        roomId: room.id,
        propertyId,
        name: String(formData.get("name") ?? ""),
        rentPerBed: Number(formData.get("rentPerBed")),
        reminderMode: formData.get("reminderMode") as ReminderMode,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      toast.success("Room updated");
      close();
      router.refresh();
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteRoom(room.id, propertyId);
      if (result.error) {
        setError(result.error);
        return;
      }
      toast.success("Room deleted");
      close();
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full p-1.5 text-muted-foreground hover:bg-background hover:text-foreground"
        aria-label="Edit room"
      >
        <Pencil className="size-3.5" />
      </button>
      <Sheet open={open} onClose={close} title="Edit room" description={room.name}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FormField label="Name" htmlFor="edit-room-name">
            <input id="edit-room-name" name="name" className={inputClass} defaultValue={room.name} required />
          </FormField>
          <FormField label="Rent per bed (₦/month)" htmlFor="edit-room-rent">
            <input
              id="edit-room-rent"
              name="rentPerBed"
              type="number"
              min={1}
              className={inputClass}
              defaultValue={room.rentPerBed}
              required
            />
          </FormField>
          <FormField label="Reminder mode" htmlFor="edit-room-reminder">
            <select id="edit-room-reminder" name="reminderMode" className={inputClass} defaultValue={room.reminderMode}>
              <option value="manual">Manual</option>
              <option value="auto">Automatic</option>
            </select>
          </FormField>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex items-center justify-between">
            <Button type="submit" disabled={pending} className="rounded-full">
              {pending ? "Saving…" : "Save changes"}
            </Button>
            <Button type="button" variant="destructive" disabled={pending} onClick={handleDelete} className="rounded-full">
              Delete room
            </Button>
          </div>
        </form>
      </Sheet>
    </>
  );
}
