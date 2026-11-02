"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FormField, inputClass } from "@/components/ui/form";
import { ROOM_TYPE_DEFAULTS } from "@/config/rules";
import { formatNaira } from "@/lib/domain";
import { addRoom, deleteRoom, updateRoom } from "@/lib/actions/rooms";
import type { ReminderMode, RoomType } from "@/lib/db/types";
import type { RoomDetail } from "@/lib/db/queries";

const ROOM_TYPE_OPTIONS: { value: RoomType; label: string }[] = [
  { value: "single", label: "Single (1 bed)" },
  { value: "shared", label: "Double (2 beds)" },
  { value: "triple", label: "Triple (3 beds)" },
  { value: "studio", label: "Studio (1 bed)" },
];

function bedCountLabel(count: number) {
  return `${count} bed${count === 1 ? "" : "s"}`;
}

export function ConfigureRooms({ propertyId, rooms }: { propertyId: string; rooms: RoomDetail[] }) {
  const [editing, setEditing] = useState<string | "new" | null>(null);

  return (
    <div className="flex flex-col gap-3">
      {rooms.length === 0 && editing !== "new" && (
        <p className="text-sm text-muted-foreground">No rooms yet. Add the first one below.</p>
      )}

      {rooms.map((room) =>
        editing === room.id ? (
          <EditRoomForm key={room.id} room={room} propertyId={propertyId} onDone={() => setEditing(null)} />
        ) : (
          <div key={room.id} className="flex items-center gap-3 rounded-lg border border-border bg-background p-4">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{room.name}</p>
              <p className="truncate text-sm text-muted-foreground tabular-nums">
                {bedCountLabel(room.beds.length)} · {formatNaira(room.rentPerBed)}/bed
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setEditing(room.id)}
              className="gap-1.5"
            >
              <Pencil className="size-3.5" /> Edit
            </Button>
          </div>
        ),
      )}

      {editing === "new" ? (
        <AddRoomForm propertyId={propertyId} onDone={() => setEditing(null)} />
      ) : (
        <Button type="button" variant="outline" onClick={() => setEditing("new")} className="gap-1.5 self-start">
          <Plus /> Add room
        </Button>
      )}
    </div>
  );
}

function AddRoomForm({ propertyId, onDone }: { propertyId: string; onDone: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [type, setType] = useState<RoomType>("single");
  const [rentPerBed, setRentPerBed] = useState(String(ROOM_TYPE_DEFAULTS.single.rentPerBed));
  const [reminderMode, setReminderMode] = useState<ReminderMode>("manual");
  const [error, setError] = useState<string | null>(null);

  function handleTypeChange(nextType: RoomType) {
    setType(nextType);
    setRentPerBed(String(ROOM_TYPE_DEFAULTS[nextType].rentPerBed));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const result = await addRoom({ propertyId, name, type, rentPerBed: Number(rentPerBed), reminderMode });
      if (result.error) {
        setError(result.error);
        return;
      }
      toast.success(`${name} added`);
      onDone();
      router.refresh();
    });
  }

  const beds = ROOM_TYPE_DEFAULTS[type].beds;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-lg border border-border bg-background p-4">
      <p className="font-medium">New room</p>
      <FormField label="Name" htmlFor="room-name">
        <input
          id="room-name"
          className={inputClass}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Double room"
          required
        />
      </FormField>
      <FormField label="Type" htmlFor="room-type" hint={`${bedCountLabel(beds)} will be created.`}>
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
      <FormField label="Reminders" htmlFor="room-reminder">
        <select
          id="room-reminder"
          className={inputClass}
          value={reminderMode}
          onChange={(event) => setReminderMode(event.target.value as ReminderMode)}
        >
          <option value="manual">Manual, I send them myself</option>
          <option value="auto">Automatic</option>
        </select>
      </FormField>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Adding…" : "Add room"}
        </Button>
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function EditRoomForm({ room, propertyId, onDone }: { room: RoomDetail; propertyId: string; onDone: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await updateRoom({
        roomId: room.id,
        propertyId,
        name: String(formData.get("name") ?? ""),
        rentPerBed: Number(formData.get("rentPerBed")),
        reminderMode: room.reminderMode,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      toast.success("Room updated");
      onDone();
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
      toast.success(`${room.name} deleted`);
      onDone();
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-lg border border-border bg-background p-4">
      <FormField label="Name" htmlFor={`edit-room-name-${room.id}`}>
        <input
          id={`edit-room-name-${room.id}`}
          name="name"
          className={inputClass}
          defaultValue={room.name}
          required
        />
      </FormField>
      <FormField label="Rent per bed (₦/month)" htmlFor={`edit-room-rent-${room.id}`}>
        <input
          id={`edit-room-rent-${room.id}`}
          name="rentPerBed"
          type="number"
          min={1}
          className={inputClass}
          defaultValue={room.rentPerBed}
          required
        />
      </FormField>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save"}
          </Button>
          <Button type="button" variant="ghost" onClick={onDone}>
            Cancel
          </Button>
        </div>
        <Button type="button" variant="ghost" disabled={pending} onClick={handleDelete} className="text-destructive">
          Delete room
        </Button>
      </div>
    </form>
  );
}
