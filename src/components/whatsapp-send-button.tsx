"use client";

import { useState, useTransition } from "react";
import { Check, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { markMessageOpened, markMessageSent } from "@/lib/actions/messages";
import type { MessageStatus } from "@/lib/db/types";

/**
 * Opens a click-to-chat WhatsApp link and tracks what the app can honestly
 * know about it: ready → opened (on click) → marked sent (one more tap,
 * after the operator has actually sent it in WhatsApp).
 */
export function WhatsAppSendButton({
  messageId,
  waLink,
  label = "Send on WhatsApp",
  initialStatus = "ready",
}: {
  messageId: string;
  waLink: string;
  label?: string;
  initialStatus?: MessageStatus;
}) {
  const [status, setStatus] = useState<MessageStatus>(initialStatus);
  const [, startTransition] = useTransition();

  function handleOpen() {
    window.open(waLink, "_blank", "noopener,noreferrer");
    if (status === "ready") {
      setStatus("opened");
      startTransition(() => {
        void markMessageOpened(messageId);
      });
    }
  }

  function handleMarkSent() {
    setStatus("marked_sent");
    startTransition(() => {
      void markMessageSent(messageId);
    });
  }

  if (status === "marked_sent") {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
        <Check className="size-4" /> Marked sent
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button type="button" variant="outline" onClick={handleOpen} className="gap-1.5 rounded-md">
        <MessageCircle className="size-4" /> {label}
      </Button>
      {status === "opened" && (
        <Button type="button" variant="ghost" size="sm" onClick={handleMarkSent} className="rounded-md">
          Mark sent
        </Button>
      )}
    </div>
  );
}
