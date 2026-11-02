"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { formatTime } from "@/lib/domain";
import { MessageStatusPill, MessageTypePill } from "@/components/ui/status-pill";
import { WhatsAppSendButton } from "@/components/whatsapp-send-button";
import type { MessageRow as MessageRowData } from "@/lib/db/queries";
import type { MessageStatus } from "@/lib/db/types";

const TRIGGER_LABELS: Record<string, string> = {
  auto: "Automatic",
  manual: "Manual",
  broadcast: "Broadcast",
};

/** Tabular figures for ₦ amounts only: applied to the whole text, Inter also widens hyphens. */
function BodyWithAmounts({ body }: { body: string }) {
  return body.split(/(₦[\d,]+)/).map((part, i) =>
    i % 2 === 1 ? (
      <span key={i} className="tabular-nums">
        {part}
      </span>
    ) : (
      part
    ),
  );
}

/**
 * One outbox message: what kind it is and who it's for, where it stands,
 * the text, and the same actions for the same stage on every card.
 */
export function MessageRow({ message }: { message: MessageRowData }) {
  const [status, setStatus] = useState<MessageStatus>(message.status);
  const isNotice = message.template === "notice";
  const where = [message.propertyName, message.roomName].filter(Boolean).join(" · ") || message.phone;

  return (
    <article className="overflow-hidden rounded-lg border border-border bg-surface shadow-1">
      <div
        className={cn(
          "flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-5 pt-4 pb-2",
          isNotice && "border-b border-border bg-danger-bg pb-3",
        )}
      >
        <div className="flex min-w-0 items-center gap-2">
          <MessageTypePill template={message.template} />
          <h3 className="min-w-0 truncate text-h3 font-semibold">{message.recipientName}</h3>
        </div>
        <MessageStatusPill status={status} />
      </div>

      <div className={cn("px-5 pb-4", isNotice && "pt-3")}>
        <p className="text-meta-style">{where}</p>
        <p className="mt-2 max-w-[70ch]">
          <BodyWithAmounts body={message.body} />
        </p>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <p className="text-meta-style">
            {TRIGGER_LABELS[message.trigger] ?? message.trigger} ·{" "}
            <time dateTime={message.createdAt}>{formatTime(message.createdAt)}</time>
          </p>
          <WhatsAppSendButton
            messageId={message.id}
            waLink={message.waLink}
            initialStatus={message.status}
            sentAt={message.sentAt}
            onStatusChange={setStatus}
          />
        </div>
      </div>
    </article>
  );
}
