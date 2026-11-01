"use client";

import { useState } from "react";
import type { RoomDetail } from "@/lib/db/queries";
import { AddRoomButton } from "./add-room-button";
import { RoomCard } from "./room-card";
import { TenantDrawer } from "./tenant-drawer";

export function PropertyRooms({ propertyId, rooms }: { propertyId: string; rooms: RoomDetail[] }) {
  const [selectedBedId, setSelectedBedId] = useState<string | null>(null);

  const selected = rooms
    .flatMap((room) => room.beds.map((bed) => ({ room, bed })))
    .find(({ bed }) => bed.id === selectedBedId);

  return (
    <>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground">Rooms</h2>
        <AddRoomButton propertyId={propertyId} />
      </div>

      {rooms.length === 0 ? (
        <p className="text-sm text-muted-foreground">No rooms yet. Add one to get started.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {rooms.map((room) => (
            <RoomCard key={room.id} room={room} onSelectBed={setSelectedBedId} />
          ))}
        </div>
      )}

      <TenantDrawer
        bed={selected?.bed ?? null}
        roomName={selected?.room.name ?? ""}
        onClose={() => setSelectedBedId(null)}
      />
    </>
  );
}
