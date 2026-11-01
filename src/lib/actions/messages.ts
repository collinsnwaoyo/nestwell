"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseClient } from "@/lib/db/client";

/** Click-to-chat opened in WhatsApp. Never downgrades a message already marked sent. */
export async function markMessageOpened(messageId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { data: message } = await supabase
    .from("messages")
    .select("status")
    .eq("id", messageId)
    .maybeSingle();
  if (!message || message.status === "marked_sent") return;

  await supabase.from("messages").update({ status: "opened" }).eq("id", messageId);
  revalidatePath("/messages");
}

/** One tap after the operator has actually sent the message in WhatsApp. */
export async function markMessageSent(messageId: string): Promise<void> {
  const supabase = getSupabaseClient();
  await supabase.from("messages").update({ status: "marked_sent" }).eq("id", messageId);
  revalidatePath("/messages");
}
