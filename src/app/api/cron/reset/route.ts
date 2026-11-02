import { NextResponse } from "next/server";
import { isAuthorizedCron } from "@/lib/cron-auth";
import { getSupabaseClient } from "@/lib/db/client";
import { seedDemo } from "@/lib/demo/seed";

export const dynamic = "force-dynamic";
// Hundreds of sequential inserts; give it room beyond the default timeout.
export const maxDuration = 60;

/** Nightly at 2:00am Lagos (vercel.json): wipes visitors' changes and re-runs the demo seed. */
export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const started = Date.now();
  await seedDemo(getSupabaseClient());
  return NextResponse.json({ ok: true, ms: Date.now() - started });
}
