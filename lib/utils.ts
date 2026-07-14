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

/**
 * The calendar day `date` falls on in the given IANA timezone, encoded as a
 * UTC-midnight marker Date (e.g. 11 PM July 10th in America/Los_Angeles →
 * 2026-07-10T00:00:00Z). Markers compare with differenceInCalendarDays.
 * Unknown/invalid timezones fall back to UTC.
 */
export function dayMarkerInTZ(date: Date, timeZone: string): Date {
  try {
    // en-CA formats as YYYY-MM-DD.
    const ymd = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
    const [y, m, d] = ymd.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d));
  } catch {
    return startOfDayUTC(date);
  }
}

/** True when `tz` is an IANA timezone Intl can resolve. */
export function isValidTimezone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** Monday 00:00 UTC of the week containing `now`. Weekly leaderboards reset here. */
export function weekStartUTC(now: Date = new Date()): Date {
  const d = startOfDayUTC(now);
  // getUTCDay(): Sunday = 0 … Saturday = 6; shift so Monday starts the week.
  const daysSinceMonday = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - daysSinceMonday);
  return d;
}
