export const TIMEZONE = "Africa/Lagos";

export const GRACE_DAYS = 3;
export const LATE_FEE_AMOUNT = 10_000;
export const REMINDER_DAYS_BEFORE_DUE = 3;
export const REMINDER_SEND_HOUR = 9; // 9:00am Lagos time

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
