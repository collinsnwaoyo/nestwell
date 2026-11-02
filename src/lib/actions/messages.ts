"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseClient } from "@/lib/db/client";

/** Click-to-chat opened in WhatsApp. Never downgrades a message already marked sent. */
export async function markMessageOpened(messageId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { data: message } = await supabase
    .from("messages")
    .select("status, tenancy_id")
    .eq("id", messageId)
    .maybeSingle();
  if (!message || message.status === "marked_sent") return;

  await supabase.from("messages").update({ status: "opened" }).eq("id", messageId);
  await supabase.from("events").insert({
    tenancy_id: message.tenancy_id,
    type: "message_opened",
    payload: { message_id: messageId },
  });
  revalidatePath("/messages");
}

/** One tap after the operator has actually sent the message in WhatsApp. Returns when it was marked. */
export async function markMessageSent(messageId: string): Promise<{ sentAt: string }> {
  const supabase = getSupabaseClient();
  const { data: message } = await supabase.from("messages").select("tenancy_id").eq("id", messageId).maybeSingle();
  await supabase.from("messages").update({ status: "marked_sent" }).eq("id", messageId);
  const { data: event } = await supabase
    .from("events")
    .insert({ tenancy_id: message?.tenancy_id ?? null, type: "message_marked_sent", payload: { message_id: messageId } })
    .select("created_at")
    .single();
  revalidatePath("/messages");
  return { sentAt: event?.created_at ?? new Date().toISOString() };
}
