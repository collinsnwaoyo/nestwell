"use client";

import { useCallback, useState } from "react";
import { Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidePanel } from "@/components/ui/side-panel";
import { BroadcastComposer } from "@/components/broadcasts/broadcast-composer";
import type { RoomDetail } from "@/lib/db/queries";
import { ConfigureRooms } from "./configure-rooms";
import { RoomCard } from "./room-card";
import { TenantPanelContent } from "./tenant-panel";

type Panel = { kind: "bed"; bedId: string } | { kind: "configure" } | null;

const ACTION_CLASS = "h-10 flex-1 gap-2 sm:flex-none sm:px-5";

export function PropertyRooms({
  propertyId,
  propertyName,
  rooms,
  initialBedId,
}: {
  propertyId: string;
  propertyName: string;
  rooms: RoomDetail[];
  /** Opens that bed's panel on arrival, e.g. from a dashboard quick action. */
  initialBedId?: string;
}) {
  const [panel, setPanel] = useState<Panel>(initialBedId ? { kind: "bed", bedId: initialBedId } : null);
  const close = useCallback(() => setPanel(null), []);

  const tenantCount = rooms.reduce((sum, room) => sum + room.beds.filter((bed) => bed.tenant).length, 0);
  const selected =
    panel?.kind === "bed"
      ? rooms.flatMap((room) => room.beds.map((bed) => ({ room, bed }))).find(({ bed }) => bed.id === panel.bedId)
      : undefined;

  const title =
    panel?.kind === "configure" ? "Configure rooms" : selected?.bed.tenant ? selected.bed.tenant.fullName : "Add tenant";
  const description =
    panel?.kind === "configure" ? propertyName : selected && `${selected.room.name} · ${selected.bed.label}`;

  return (
    <>
      <div className="flex gap-3">
        <BroadcastComposer
          scopeType="property"
          scopeId={propertyId}
          scopeLabel={`${propertyName}, ${tenantCount} tenant${tenantCount === 1 ? "" : "s"}`}
          triggerLabel="Send message"
          triggerClassName={ACTION_CLASS}
        />
        <Button type="button" variant="outline" onClick={() => setPanel({ kind: "configure" })} className={ACTION_CLASS}>
          <Settings2 className="size-4" /> Configure rooms
        </Button>
      </div>

      <h2 className="mt-8 mb-3 text-[1.0625rem] font-semibold">Rooms</h2>

      {rooms.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-6 text-center">
          <p className="text-sm text-muted-foreground">No rooms yet.</p>
          <Button type="button" variant="outline" onClick={() => setPanel({ kind: "configure" })} className="mt-3">
            Add the first room
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {rooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              propertyId={propertyId}
              selectedBedId={panel?.kind === "bed" ? panel.bedId : null}
              onSelectBed={(bedId) => setPanel({ kind: "bed", bedId })}
            />
          ))}
        </div>
      )}

      <SidePanel open={panel !== null} onClose={close} title={title} description={description}>
        {panel?.kind === "configure" && <ConfigureRooms propertyId={propertyId} rooms={rooms} />}
        {selected && (
          <TenantPanelContent
            key={selected.bed.id}
            bed={selected.bed}
            propertyId={propertyId}
            rentPerBed={selected.room.rentPerBed}
            onClose={close}
          />
        )}
      </SidePanel>
    </>
  );
}
