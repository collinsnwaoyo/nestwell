"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { FormField, inputClass } from "@/components/ui/form";
import { BROADCAST_TEMPLATES, BROADCAST_TEMPLATE_LABELS } from "@/config/rules";
import { fillTemplate, formatNaira } from "@/lib/domain";
import {
  createBroadcast,
  previewBroadcastRecipients,
  type BroadcastMessage,
  type BroadcastRecipientPreview,
} from "@/lib/actions/broadcasts";
import { markMessageOpened } from "@/lib/actions/messages";
import type { BroadcastScopeType, BroadcastTemplate } from "@/lib/db/types";

const TEMPLATE_OPTIONS: BroadcastTemplate[] = ["general", "rent_increase", "maintenance", "house_rules", "blank"];

function formatDueDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function BroadcastComposer({
  scopeType,
  scopeId,
  scopeLabel,
  triggerClassName,
  triggerLabel = "Message",
  iconOnly,
  renderTrigger,
}: {
  scopeType: BroadcastScopeType;
  scopeId: string | null;
  scopeLabel: string;
  triggerClassName?: string;
  triggerLabel?: string;
  iconOnly?: boolean;
  /** Replaces the default button, e.g. a dashboard quick-action card. */
  renderTrigger?: (open: () => void) => ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recipients, setRecipients] = useState<BroadcastRecipientPreview[] | null>(null);
  const [included, setIncluded] = useState<Set<string>>(new Set());
  const [template, setTemplate] = useState<BroadcastTemplate>("general");
  const [body, setBody] = useState<string>(BROADCAST_TEMPLATES.general);
  const [newRent, setNewRent] = useState("");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const [queue, setQueue] = useState<BroadcastMessage[] | null>(null);
  const [queueIndex, setQueueIndex] = useState(0);
  const [queueOpened, setQueueOpened] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    previewBroadcastRecipients(scopeType, scopeId).then((result) => {
      setLoading(false);
      if (result.error) {
        setError(result.error);
        return;
      }
      const data = result.data ?? [];
      setRecipients(data);
      setIncluded(new Set(data.map((r) => r.tenancyId)));
    });
  }, [open, scopeType, scopeId]);

  function close() {
    setOpen(false);
    setRecipients(null);
    setIncluded(new Set());
    setTemplate("general");
    setBody(BROADCAST_TEMPLATES.general);
    setNewRent("");
    setEffectiveDate("");
    setError(null);
    setQueue(null);
    setQueueIndex(0);
    setQueueOpened(false);
  }

  function handleTemplateChange(next: BroadcastTemplate) {
    setTemplate(next);
    setBody(next === "blank" ? "" : BROADCAST_TEMPLATES[next]);
  }

  function toggleIncluded(tenancyId: string) {
    setIncluded((prev) => {
      const next = new Set(prev);
      if (next.has(tenancyId)) next.delete(tenancyId);
      else next.add(tenancyId);
      return next;
    });
  }

  function previewFor(recipient: BroadcastRecipientPreview) {
    const firstName = recipient.fullName.split(" ")[0];
    return fillTemplate(body, {
      firstName,
      room: recipient.roomName,
      property: recipient.propertyName,
      rent: formatNaira(recipient.rent),
      newRent: newRent || "{newRent}",
      effectiveDate: effectiveDate || "{effectiveDate}",
      dueDate: formatDueDate(recipient.dueDate),
    });
  }

  async function handleSend() {
    setSending(true);
    setError(null);
    const result = await createBroadcast({
      scopeType,
      scopeId,
      template,
      bodyTemplate: body,
      newRent,
      effectiveDate,
      includedTenancyIds: [...included],
    });
    setSending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.data) {
      setQueue(result.data.messages);
      setQueueIndex(0);
      setQueueOpened(false);
      toast.success(
        `Broadcast ready for ${result.data.messages.length} ${result.data.messages.length === 1 ? "person" : "people"}`,
      );
      router.refresh();
    }
  }

  function handleOpenCurrent() {
    const current = queue?.[queueIndex];
    if (!current) return;
    window.open(current.waLink, "_blank", "noopener,noreferrer");
    setQueueOpened(true);
    void markMessageOpened(current.messageId);
  }

  function handleNext() {
    if (!queue) return;
    if (queueIndex + 1 < queue.length) {
      setQueueIndex((i) => i + 1);
      setQueueOpened(false);
    } else {
      close();
    }
  }

  const firstIncluded = recipients?.find((r) => included.has(r.tenancyId));

  return (
    <>
      {renderTrigger ? (
        renderTrigger(() => setOpen(true))
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={() => setOpen(true)}
          aria-label={iconOnly ? triggerLabel : undefined}
          className={triggerClassName ?? "gap-1.5"}
        >
          <MessageCircle className="size-4" /> {!iconOnly && triggerLabel}
        </Button>
      )}
      <Sheet
        open={open}
        onClose={close}
        title={queue ? "Sending" : "Message"}
        description={queue ? undefined : scopeLabel}
      >
        {queue ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              {queueIndex + 1} of {queue.length}
            </p>
            <div className="rounded-lg bg-muted/50 p-4">
              <p className="font-medium">{queue[queueIndex].recipientName}</p>
              <p className="mt-2 text-sm">{queue[queueIndex].body}</p>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={handleOpenCurrent} className="rounded-md">
                Open WhatsApp
              </Button>
              <Button type="button" disabled={!queueOpened} onClick={handleNext} className="rounded-md">
                {queueIndex + 1 < queue.length ? "Next" : "Done"}
              </Button>
            </div>
          </div>
        ) : loading ? (
          <p className="text-sm text-muted-foreground">Loading recipients…</p>
        ) : (
          <div className="flex flex-col gap-4">
            <FormField label="Template" htmlFor="broadcast-template">
              <select
                id="broadcast-template"
                className={inputClass}
                value={template}
                onChange={(event) => handleTemplateChange(event.target.value as BroadcastTemplate)}
              >
                {TEMPLATE_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    {BROADCAST_TEMPLATE_LABELS[value]}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField
              label="Message"
              htmlFor="broadcast-body"
              hint="Merge fields: {firstName} {room} {property} {rent} {newRent} {effectiveDate} {dueDate}"
            >
              <textarea
                id="broadcast-body"
                className={inputClass}
                rows={4}
                value={body}
                onChange={(event) => setBody(event.target.value)}
              />
            </FormField>

            {(template === "rent_increase" || body.includes("{newRent}")) && (
              <FormField label="New rent" htmlFor="broadcast-new-rent">
                <input
                  id="broadcast-new-rent"
                  className={inputClass}
                  value={newRent}
                  onChange={(event) => setNewRent(event.target.value)}
                  placeholder="₦320,000"
                />
              </FormField>
            )}
            {body.includes("{effectiveDate}") && (
              <FormField label="Effective date" htmlFor="broadcast-effective-date">
                <input
                  id="broadcast-effective-date"
                  className={inputClass}
                  value={effectiveDate}
                  onChange={(event) => setEffectiveDate(event.target.value)}
                  placeholder="1 December 2026"
                />
              </FormField>
            )}

            {firstIncluded && (
              <div>
                <p className="mb-1.5 text-sm font-medium text-muted-foreground">Preview — {firstIncluded.fullName}</p>
                <div className="rounded-lg bg-muted/50 p-3 text-sm">{previewFor(firstIncluded)}</div>
              </div>
            )}

            <div>
              <p className="mb-2 text-sm font-medium text-muted-foreground">
                Recipients ({included.size} of {recipients?.length ?? 0})
              </p>
              {!recipients || recipients.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tenants in this scope.</p>
              ) : (
                <div className="flex max-h-48 flex-col gap-1.5 overflow-y-auto">
                  {recipients.map((recipient) => (
                    <label key={recipient.tenancyId} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={included.has(recipient.tenancyId)}
                        onChange={() => toggleIncluded(recipient.tenancyId)}
                        className="size-4 rounded border-input"
                      />
                      {recipient.fullName}
                    </label>
                  ))}
                </div>
              )}
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="button" disabled={sending || included.size === 0} onClick={handleSend} className="rounded-md">
              {sending ? "Sending…" : `Send to ${included.size}`}
            </Button>
          </div>
        )}
      </Sheet>
    </>
  );
}
