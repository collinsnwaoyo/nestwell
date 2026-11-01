import { toLagosDate } from "./due-date";

export type TimeOfDay = "morning" | "afternoon" | "evening";

export function getTimeOfDay(date: Date | string = new Date()): TimeOfDay {
  const hour = toLagosDate(date).getHours();
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

export function getGreeting(name: string, date: Date | string = new Date()): string {
  const timeOfDay = getTimeOfDay(date);
  const label = timeOfDay === "morning" ? "Good morning" : timeOfDay === "afternoon" ? "Good afternoon" : "Good evening";
  return `${label}, ${name}`;
}
