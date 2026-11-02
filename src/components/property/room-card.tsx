"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Info, MessageCircle, Plus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatNaira } from "@/lib/domain";
import { BroadcastComposer } from "@/components/broadcasts/broadcast-composer";
import { buttonVariants } from "@/components/ui/button";
import { RentStatusPill } from "@/components/ui/status-pill";
import { Switch } from "@/components/ui/switch";
import { Tooltip } from "@/components/ui/tooltip";
import { setRoomReminderMode } from "@/lib/actions/rooms";
import type { RoomDetail } from "@/lib/db/queries";

const AUTO_REMINDERS_HELP = "Sent 3 days before, on the due date, and at 3 days late.";

export function RoomCard({
  room,
  propertyId,
  selectedBedId,
  onSelectBed,
}: {
  room: RoomDetail;
  propertyId: string;
  selectedBedId: string | null;
  onSelectBed: (bedId: string) => void;
}) {
  const tenantCount = room.beds.filter((bed) => bed.tenant).length;
  // Single-bed rooms store their bed as "Room" or "Studio"; show "Bed" everywhere for consistency.
  const bedLabel = (label: string) => (label.startsWith("Bed") ? label : "Bed");

  return (
    <section
      aria-label={room.name}
      className="overflow-hidden rounded-lg border border-border bg-surface shadow-1"
    >
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-border px-5 py-3.5">
        <div className="min-w-0">
          <h3 className="truncate text-h3 font-semibold">{room.name}</h3>
          <p className="text-meta-style tabular-nums">
            {room.beds.length} bed{room.beds.length === 1 ? "" : "s"} · {formatNaira(room.rentPerBed)}/bed
          </p>
        </div>
        <div className="flex items-center gap-1">
          <ReminderToggle room={room} propertyId={propertyId} />
          {tenantCount > 0 && (
            <BroadcastComposer
              scopeType="room"
              scopeId={room.id}
              scopeLabel={`${room.name}, ${tenantCount} tenant${tenantCount === 1 ? "" : "s"}`}
              renderTrigger={(open) => (
                <Tooltip content={`Message ${room.name}`}>
                  <button
                    type="button"
                    onClick={open}
                    aria-label={`Message everyone in ${room.name}`}
                    className={buttonVariants({ variant: "ghost", size: "icon-compact" })}
                  >
                    <MessageCircle aria-hidden />
                  </button>
                </Tooltip>
              )}
            />
          )}
        </div>
      </div>

      <ul className="divide-y divide-border">
        {room.beds.map((bed) => {
          const selected = selectedBedId === bed.id;
          return (
            <li key={bed.id}>
              <button
                type="button"
                onClick={() => onSelectBed(bed.id)}
                aria-current={selected ? "true" : undefined}
                aria-haspopup="dialog"
                className={cn(
                  "group flex min-h-12 w-full items-center gap-3 px-5 py-2 text-left transition-colors duration-(--dur-1) hover:bg-surface-sunk max-md:min-h-14",
                  selected && "bg-surface-sunk",
                )}
              >
                <span className="w-14 shrink-0 text-meta-style">{bedLabel(bed.label)}</span>
                {bed.tenant ? (
                  <span className="min-w-0 flex-1 truncate font-medium">{bed.tenant.fullName}</span>
                ) : (
                  <span className="min-w-0 flex-1">
                    <span className={cn(buttonVariants({ variant: "ghost", size: "compact" }), "-ml-3 group-hover:bg-neutral-bg")}>
                      <Plus aria-hidden /> Add tenant
                    </span>
                  </span>
                )}
                <RentStatusPill status={bed.status} />
                <ChevronRight
                  aria-hidden
                  className="size-4 shrink-0 text-muted-foreground transition-transform duration-(--dur-1) ease-out group-hover:translate-x-0.5"
                />
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Compact "Auto reminders" switch in the room header; the schedule is in a tooltip. */
function ReminderToggle({ room, propertyId }: { room: RoomDetail; propertyId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [auto, setAuto] = useState(room.reminderMode === "auto");
  const switchId = `reminders-${room.id}`;
  const helpId = useId();

  function handleChange(next: boolean) {
    setAuto(next);
    startTransition(async () => {
      const result = await setRoomReminderMode(room.id, propertyId, next ? "auto" : "manual");
      if (result.error) {
        setAuto(!next);
        toast.error(result.error);
        return;
      }
      toast.success(next ? `Automatic reminders on for ${room.name}` : `Reminders set to manual for ${room.name}`);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2 pr-1">
      <label htmlFor={switchId} className="cursor-pointer text-meta font-medium text-muted-foreground">
        Auto reminders
      </label>
      <Tooltip content={AUTO_REMINDERS_HELP}>
        <span
          tabIndex={0}
          role="note"
          aria-label={AUTO_REMINDERS_HELP}
          className="flex size-5 items-center justify-center rounded-full text-muted-foreground"
        >
          <Info aria-hidden className="size-3.5" />
        </span>
      </Tooltip>
      <span id={helpId} className="sr-only">
        {AUTO_REMINDERS_HELP}
      </span>
      <Switch
        id={switchId}
        checked={auto}
        onCheckedChange={handleChange}
        disabled={pending}
        aria-describedby={helpId}
      />
    </div>
  );
}
