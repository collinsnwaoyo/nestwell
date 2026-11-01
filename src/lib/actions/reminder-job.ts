"use server";

import { revalidatePath } from "next/cache";
import { runReminderJob } from "@/lib/jobs/reminders";
import type { ActionResult } from "./properties";

export async function runRemindersNow(): Promise<ActionResult<{ sent: number; skipped: number }>> {
  const result = await runReminderJob();
  revalidatePath("/messages");
  revalidatePath("/home");
  revalidatePath("/properties");
  return { data: result };
}
