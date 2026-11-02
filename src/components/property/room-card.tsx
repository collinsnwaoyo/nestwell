"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ChevronRight, Plus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";
import { formatNaira } from "@/lib/domain";
import { BroadcastComposer } from "@/components/broadcasts/broadcast-composer";
import { StatusChip } from "@/components/status-chip";
import { Switch } from "@/components/ui/switch";
import { setRoomReminderMode } from "@/lib/actions/rooms";
import type { RoomDetail } from "@/lib/db/queries";

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

  return (
    <div className="overflow-hidden rounded-lg bg-card">
      <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3">
        <div className="min-w-0">
          <p className="truncate font-semibold">{room.name}</p>
          <p className="text-sm text-muted-foreground tabular-nums">
            {room.beds.length} bed{room.beds.length === 1 ? "" : "s"} · {formatNaira(room.rentPerBed)}/bed
          </p>
        </div>
        {tenantCount > 0 && (
          <BroadcastComposer
            scopeType="room"
            scopeId={room.id}
            scopeLabel={`${room.name}, ${tenantCount} tenant${tenantCount === 1 ? "" : "s"}`}
            iconOnly
            triggerClassName="size-8 shrink-0 rounded-md p-0 text-muted-foreground hover:text-foreground"
          />
        )}
      </div>

      <ul className="divide-y divide-border border-y border-border">
        {room.beds.map((bed) => (
          <li key={bed.id}>
            <button
              type="button"
              onClick={() => onSelectBed(bed.id)}
              aria-current={selectedBedId === bed.id ? "true" : undefined}
              className={cn(
                "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent",
                selectedBedId === bed.id && "bg-accent",
              )}
            >
              <span className="w-12 shrink-0 text-xs text-muted-foreground">{bed.label}</span>
              {bed.tenant ? (
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{bed.tenant.fullName}</span>
              ) : (
                <span className="flex min-w-0 flex-1 items-center gap-1.5 text-sm font-medium text-muted-foreground">
                  <Plus className="size-3.5" /> Add tenant
                </span>
              )}
              <StatusChip status={bed.status} />
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </button>
          </li>
        ))}
      </ul>

      <ReminderToggle room={room} propertyId={propertyId} />
    </div>
  );
}

function ReminderToggle({ room, propertyId }: { room: RoomDetail; propertyId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [auto, setAuto] = useState(room.reminderMode === "auto");
  const switchId = `reminders-${room.id}`;

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
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <label htmlFor={switchId} className="min-w-0 cursor-pointer">
        <span className="block text-sm font-medium">
          Reminders: {auto ? "Automatic" : "Manual"}
        </span>
        <span className="block text-xs text-muted-foreground">
          {auto ? "Sent 3 days before, on the due date, and at 3 days late" : "You send reminders yourself"}
        </span>
      </label>
      <Switch id={switchId} checked={auto} onCheckedChange={handleChange} disabled={pending} />
    </div>
  );
}
