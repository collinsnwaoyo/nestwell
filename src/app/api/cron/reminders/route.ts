import { NextResponse } from "next/server";
import { runReminderJob } from "@/lib/jobs/reminders";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runReminderJob();
  return NextResponse.json(result);
}
