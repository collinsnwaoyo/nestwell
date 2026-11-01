"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { FormField, inputClass } from "@/components/ui/form";
import { ROOM_TYPE_DEFAULTS } from "@/config/rules";
import { addRoom } from "@/lib/actions/rooms";
import type { ReminderMode, RoomType } from "@/lib/db/types";

const ROOM_TYPE_OPTIONS: { value: RoomType; label: string }[] = [
  { value: "triple", label: "Triple (3 beds)" },
  { value: "shared", label: "Shared (2 beds)" },
  { value: "single", label: "Single (1 bed)" },
  { value: "studio", label: "Studio (1 bed)" },
];

export function AddRoomButton({ propertyId }: { propertyId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [type, setType] = useState<RoomType>("single");
  const [rentPerBed, setRentPerBed] = useState(String(ROOM_TYPE_DEFAULTS.single.rentPerBed));
  const [reminderMode, setReminderMode] = useState<ReminderMode>("manual");
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setName("");
    setType("single");
    setRentPerBed(String(ROOM_TYPE_DEFAULTS.single.rentPerBed));
    setReminderMode("manual");
    setError(null);
  }

  function close() {
    setOpen(false);
    reset();
  }

  function handleTypeChange(nextType: RoomType) {
    setType(nextType);
    setRentPerBed(String(ROOM_TYPE_DEFAULTS[nextType].rentPerBed));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const result = await addRoom({
        propertyId,
        name,
        type,
        rentPerBed: Number(rentPerBed),
        reminderMode,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      toast.success(`${name} added`);
      close();
      router.refresh();
    });
  }

  return (
    <>
      <Button type="button" variant="outline" onClick={() => setOpen(true)} className="gap-1.5 rounded-full px-4">
        <Plus /> Add room
      </Button>
      <Sheet
        open={open}
        onClose={close}
        title="Add room"
        description={`Beds are created to match the room type.`}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FormField label="Name" htmlFor="room-name">
            <input
              id="room-name"
              className={inputClass}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Triple room"
              required
            />
          </FormField>
          <FormField label="Type" htmlFor="room-type" hint={`${ROOM_TYPE_DEFAULTS[type].beds} bed${ROOM_TYPE_DEFAULTS[type].beds > 1 ? "s" : ""} will be created.`}>
            <select
              id="room-type"
              className={inputClass}
              value={type}
              onChange={(event) => handleTypeChange(event.target.value as RoomType)}
            >
              {ROOM_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Rent per bed (₦/month)" htmlFor="room-rent">
            <input
              id="room-rent"
              type="number"
              min={1}
              className={inputClass}
              value={rentPerBed}
              onChange={(event) => setRentPerBed(event.target.value)}
              required
            />
          </FormField>
          <FormField label="Reminder mode" htmlFor="room-reminder">
            <select
              id="room-reminder"
              className={inputClass}
              value={reminderMode}
              onChange={(event) => setReminderMode(event.target.value as ReminderMode)}
            >
              <option value="manual">Manual</option>
              <option value="auto">Automatic</option>
            </select>
          </FormField>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={pending} className="mt-2 rounded-full">
            {pending ? "Adding…" : "Add room"}
          </Button>
        </form>
      </Sheet>
    </>
  );
}
