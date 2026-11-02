"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatTimestamp } from "@/lib/domain";
import { markMessageOpened, markMessageSent } from "@/lib/actions/messages";
import type { MessageStatus } from "@/lib/db/types";

/**
 * Opens a click-to-chat WhatsApp link and tracks what the app can honestly
 * know: ready → opened (on click) → sent (one more tap, after the operator
 * has actually sent it). Every stage always offers the same actions:
 * Ready: Send + Mark sent. Opened: Mark sent + Resend. Sent: a check and the time.
 */
export function WhatsAppSendButton({
  messageId,
  waLink,
  label = "Send",
  initialStatus = "ready",
  sentAt = null,
  onStatusChange,
}: {
  messageId: string;
  waLink: string;
  label?: string;
  initialStatus?: MessageStatus;
  sentAt?: string | null;
  onStatusChange?: (status: MessageStatus) => void;
}) {
  const [status, setStatus] = useState<MessageStatus>(initialStatus);
  const [markedAt, setMarkedAt] = useState<string | null>(sentAt);
  const [, startTransition] = useTransition();

  function update(next: MessageStatus) {
    setStatus(next);
    onStatusChange?.(next);
  }

  function handleOpen() {
    window.open(waLink, "_blank", "noopener,noreferrer");
    if (status === "ready") {
      update("opened");
      startTransition(() => {
        void markMessageOpened(messageId);
      });
    }
  }

  function handleMarkSent() {
    update("marked_sent");
    setMarkedAt(new Date().toISOString());
    startTransition(async () => {
      const result = await markMessageSent(messageId);
      setMarkedAt(result.sentAt);
    });
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      {status === "marked_sent" ? (
        <motion.span
          key="sent"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="inline-flex items-center gap-1.5 text-meta-style"
        >
          <motion.span
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
            className="inline-flex"
          >
            <Check aria-hidden className="size-4 text-positive" />
          </motion.span>
          Sent{markedAt ? ` ${formatTimestamp(markedAt)}` : ""}
        </motion.span>
      ) : (
        <motion.div
          key="actions"
          exit={{ opacity: 0, transition: { duration: 0.1 } }}
          className="flex flex-wrap items-center gap-2"
        >
          {status === "ready" ? (
            <>
              <Button type="button" variant="secondary" size="compact" onClick={handleOpen}>
                <MessageCircle aria-hidden /> {label}
              </Button>
              <Button type="button" variant="ghost" size="compact" onClick={handleMarkSent}>
                Mark sent
              </Button>
            </>
          ) : (
            <>
              <Button type="button" variant="secondary" size="compact" onClick={handleMarkSent}>
                <Check aria-hidden /> Mark sent
              </Button>
              <Button type="button" variant="ghost" size="compact" onClick={handleOpen}>
                Resend
              </Button>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
