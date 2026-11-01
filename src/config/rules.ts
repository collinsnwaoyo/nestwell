import type { BroadcastTemplate, RoomType } from "@/lib/db/types";

export const TIMEZONE = "Africa/Lagos";

export const GRACE_DAYS = 3;
export const LATE_FEE_AMOUNT = 10_000;
export const REMINDER_DAYS_BEFORE_DUE = 3;
export const REMINDER_SEND_HOUR = 9; // 9:00am Lagos time

/** Bed count and default rent/bed for a new room, by type. Either can be overridden per room. */
export const ROOM_TYPE_DEFAULTS: Record<RoomType, { beds: number; rentPerBed: number }> = {
  triple: { beds: 3, rentPerBed: 140_000 },
  shared: { beds: 2, rentPerBed: 180_000 },
  single: { beds: 1, rentPerBed: 280_000 },
  studio: { beds: 1, rentPerBed: 450_000 },
};

export const DEFAULT_DEPOSIT = 100_000;

/** Fictional, for demo reminder messages only. */
export const PAYMENT_ACCOUNT_DETAILS = "Nestwell Properties — GTBank 0123456789";

export const TENANT_DOCS_BUCKET = "tenant-docs";
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5MB, per the PRD's public-demo abuse limit
export const ALLOWED_UPLOAD_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

export const MESSAGE_TEMPLATES = {
  dueSoon:
    "Hi {firstName}, a reminder that your Nestwell rent of {amount} for {room} is due on {dueDate}. Thank you!",
  dueToday:
    "Hi {firstName}, your rent of {amount} is due today. Please pay to {accountDetails} and send proof here.",
  overdue:
    "Hi {firstName}, your rent is now {days} days overdue and a late fee of {fee} has been added. Total due: {total}.",
  receipt:
    "Thanks {firstName}, we've received {amount} for {month}. Next due date: {nextDue}.",
  notice:
    "Hi {firstName}, this is formal notice to vacate {room} by {date}. Reason: {reason}.",
} as const;

export type MessageTemplateKey = keyof typeof MESSAGE_TEMPLATES;

export const BROADCAST_TEMPLATES: Record<Exclude<BroadcastTemplate, "blank">, string> = {
  rent_increase:
    "Hi {firstName}, rent for {room} at {property} will increase from {rent} to {newRent}, effective {effectiveDate}. Thank you for your understanding.",
  maintenance:
    "Hi {firstName}, we'll be carrying out maintenance work at {property} on {effectiveDate}. Sorry for any inconvenience.",
  house_rules:
    "Hi {firstName}, a quick reminder of house rules at {property}: please keep common areas clean and be considerate of other residents. Thanks for your cooperation.",
  general: "Hi {firstName}, this is a quick update from Nestwell regarding {property}.",
};

export const BROADCAST_TEMPLATE_LABELS: Record<BroadcastTemplate, string> = {
  rent_increase: "Rent increase",
  maintenance: "Maintenance / plumbing work",
  house_rules: "House rules reminder",
  general: "General update",
  blank: "Blank message",
};
