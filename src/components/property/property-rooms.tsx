"use client";

import { useState } from "react";
import type { RoomDetail } from "@/lib/db/queries";
import { RoomCard } from "./room-card";
import { TenantDrawer } from "./tenant-drawer";

export function PropertyRooms({ rooms }: { rooms: RoomDetail[] }) {
  const [selectedBedId, setSelectedBedId] = useState<string | null>(null);

  const selected = rooms
    .flatMap((room) => room.beds.map((bed) => ({ room, bed })))
    .find(({ bed }) => bed.id === selectedBedId);

  return (
    <>
      <div className="flex flex-col gap-3">
        {rooms.map((room) => (
          <RoomCard key={room.id} room={room} onSelectBed={setSelectedBedId} />
        ))}
      </div>
      <TenantDrawer
        bed={selected?.bed ?? null}
        roomName={selected?.room.name ?? ""}
        onClose={() => setSelectedBedId(null)}
      />
    </>
  );
}
