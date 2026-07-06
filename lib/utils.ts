import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function startOfDayUTC(date: Date): Date {
  const utc = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
  return utc;
}

/** Monday 00:00 UTC of the week containing `now`. Weekly leaderboards reset here. */
export function weekStartUTC(now: Date = new Date()): Date {
  const d = startOfDayUTC(now);
  // getUTCDay(): Sunday = 0 … Saturday = 6; shift so Monday starts the week.
  const daysSinceMonday = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - daysSinceMonday);
  return d;
}
