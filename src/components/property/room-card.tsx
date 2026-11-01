import { cn } from "cn";
import { formatNaira } from "@/lib/domain";
import type { RoomDetail } from "@/lib/db/queries";
import { BedTile } from "./bed-tile";

const ROOM_TYPE_LABELS: Record<RoomDetail["type"], string> = {
  triple: "Triple",
  shared: "Shared",
  single: "Single",
  studio: "Studio",
};

export function RoomCard({
  room,
  onSelectBed,
}: {
  room: RoomDetail;
  onSelectBed: (bedId: string) => void;
}) {
  return (
    <div className="rounded-[20px] bg-muted/50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium">{room.name}</p>
          <p className="text-sm text-muted-foreground">
            {ROOM_TYPE_LABELS[room.type]} · {formatNaira(room.rentPerBed)}/bed
          </p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-1 text-xs font-medium",
            room.reminderMode === "auto"
              ? "bg-primary/10 text-primary"
              : "border border-border/80 text-muted-foreground",
          )}
        >
          {room.reminderMode === "auto" ? "Auto" : "Manual"}
        </span>
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
