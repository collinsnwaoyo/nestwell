import { cn } from "cn";
import { formatNaira } from "@/lib/domain";
import { BroadcastComposer } from "@/components/broadcasts/broadcast-composer";
import type { RoomDetail } from "@/lib/db/queries";
import { BedTile } from "./bed-tile";
import { EditRoomButton } from "./edit-room-button";

const ROOM_TYPE_LABELS: Record<RoomDetail["type"], string> = {
  triple: "Triple",
  shared: "Shared",
  single: "Single",
  studio: "Studio",
};

export function RoomCard({
  room,
  propertyId,
  onSelectBed,
}: {
  room: RoomDetail;
  propertyId: string;
  onSelectBed: (bedId: string) => void;
}) {
  const tenantCount = room.beds.filter((bed) => bed.tenant).length;

  return (
    <div className="rounded-[20px] bg-muted/50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium">{room.name}</p>
          <p className="text-sm text-muted-foreground">
            {ROOM_TYPE_LABELS[room.type]} · {formatNaira(room.rentPerBed)}/bed
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-medium",
              room.reminderMode === "auto"
                ? "bg-primary/10 text-primary"
                : "border border-border/80 text-muted-foreground",
            )}
          >
            {room.reminderMode === "auto" ? "Auto" : "Manual"}
          </span>
          <BroadcastComposer
            scopeType="room"
            scopeId={room.id}
            scopeLabel={`${room.name}, ${tenantCount} tenant${tenantCount === 1 ? "" : "s"}`}
            iconOnly
            triggerClassName="rounded-full p-1.5 size-7 text-muted-foreground hover:bg-background hover:text-foreground"
          />
          <EditRoomButton room={room} propertyId={propertyId} />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {room.beds.map((bed) => (
          <BedTile
            key={bed.id}
            bed={{
              id: bed.id,
              label: bed.label,
              status: bed.status,
              tenantFirstName: bed.tenant ? bed.tenant.fullName.split(" ")[0] : null,
            }}
            onSelect={onSelectBed}
          />
        ))}
      </div>
    </div>
  );
}
