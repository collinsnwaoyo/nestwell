"use client";

import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RentStatus } from "@/lib/domain";
import type { MessageStatus } from "@/lib/db/types";

export type PillTone = "positive" | "warning" | "danger" | "info" | "neutral";

const TONE_CLASSES: Record<PillTone, string> = {
  positive: "bg-positive-bg text-positive-text",
  warning: "bg-warning-bg text-warning-text",
  danger: "bg-danger-bg text-danger-text",
  info: "bg-info-bg text-info-text",
  neutral: "bg-neutral-bg text-muted-foreground",
};

/**
 * The one status pill. The label swaps with a short slide and fade when it
 * changes (Due → Paid, Ready → Sent); the colours crossfade via CSS.
 */
export function StatusPill({
  tone,
  children,
  dot = false,
  icon,
  className,
}: {
  tone: PillTone;
  children: ReactNode;
  dot?: boolean;
  icon?: ReactNode;
  className?: string;
}) {
  const label = typeof children === "string" ? children : undefined;
  return (
    <span
      className={cn(
        "inline-flex h-[22px] shrink-0 items-center gap-1.5 overflow-hidden rounded-md px-2 text-meta font-medium whitespace-nowrap",
        "transition-[background-color,color] duration-(--dur-2) ease-out",
        TONE_CLASSES[tone],
        className,
      )}
    >
      {dot && <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-current" />}
      {icon}
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={label ?? "pill"}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
        >
          {children}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

const RENT_STATUS: Record<RentStatus, { tone: PillTone; label: string }> = {
  paid: { tone: "positive", label: "Paid" },
  due_soon: { tone: "warning", label: "Due soon" },
  due_today: { tone: "warning", label: "Due today" },
  overdue: { tone: "danger", label: "Overdue" },
  notice: { tone: "danger", label: "Notice issued" },
  vacant: { tone: "neutral", label: "Vacant" },
};

/** A tenant's rent status. Notice carries an icon so it never relies on colour alone. */
export function RentStatusPill({ status, className }: { status: RentStatus; className?: string }) {
  const { tone, label } = RENT_STATUS[status];
  return (
    <StatusPill
      tone={tone}
      className={className}
      icon={status === "notice" ? <AlertTriangle aria-hidden className="size-3" strokeWidth={2.25} /> : undefined}
    >
      {label}
    </StatusPill>
  );
}

const MESSAGE_STATUS: Record<MessageStatus, { tone: PillTone; label: string }> = {
  ready: { tone: "neutral", label: "Ready" },
  opened: { tone: "info", label: "Opened in WhatsApp" },
  marked_sent: { tone: "positive", label: "Sent" },
};

/** Where a WhatsApp message is in its lifecycle. Never claims delivered or read. */
export function MessageStatusPill({ status }: { status: MessageStatus }) {
  const { tone, label } = MESSAGE_STATUS[status];
  return <StatusPill tone={tone}>{label}</StatusPill>;
}

const MESSAGE_TYPE: Record<string, { tone: PillTone; label: string }> = {
  receipt: { tone: "positive", label: "Receipt" },
  due_soon: { tone: "warning", label: "Due soon" },
  due_today: { tone: "warning", label: "Due today" },
  overdue: { tone: "danger", label: "Overdue" },
  notice: { tone: "danger", label: "Notice" },
};

/** What kind of message it is, shown before the recipient's name. */
export function MessageTypePill({ template }: { template: string }) {
  const type = MESSAGE_TYPE[template] ?? { tone: "neutral" as const, label: "Broadcast" };
  return (
    <StatusPill
      tone={type.tone}
      icon={template === "notice" ? <AlertTriangle aria-hidden className="size-3" strokeWidth={2.25} /> : undefined}
    >
      {type.label}
    </StatusPill>
  );
}
