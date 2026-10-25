import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// ============================================================
// NEGM OS — Shared utilities
// ============================================================

// --- Brand constants -------------------------------------------------------

export const OS_NAME = "NEGM OS";
export const WELCOME_NAME = "DR. NEGM";
export const WELCOME_MESSAGE = `WELCOME, ${WELCOME_NAME}`;

// --- Class composition -----------------------------------------------------

/**
 * cn — merge Tailwind classes with conflict resolution.
 *
 * Combines clsx (conditional class syntax) with tailwind-merge
 * (last-write-wins for conflicting utilities). This is the only
 * sanctioned way to compose classes in NEGM OS components.
 *
 *   cn("px-4 py-2", isActive && "bg-emerald-500", "px-8")
 *   // => "py-2 bg-emerald-500 px-8"  (px-4 was overridden by px-8)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Currency --------------------------------------------------------------

/**
 * formatCurrency — Intl-based currency formatting with safe defaults.
 *
 *   formatCurrency(1250.5)              // "$1,250.50"
 *   formatCurrency(1250.5, "EGP")       // "EGP 1,250.50"
 *   formatCurrency(1250.5, "EUR")       // "€1,250.50"
 */
export function formatCurrency(
  amount: number,
  currency: string = "USD",
  options: Intl.NumberFormatOptions = {},
): string {
  if (!Number.isFinite(amount)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  }).format(amount);
}

// --- Date & time -----------------------------------------------------------

/**
 * formatDate — ISO/string/Date → human-readable date.
 *
 *   formatDate("2026-10-25")
 *   // => "Oct 25, 2026"
 *
 *   formatDate(date, { dateStyle: "full" })
 *   // => "Sunday, October 25, 2026"
 */
export function formatDate(
  input: string | number | Date,
  options: Intl.DateTimeFormatOptions = {},
): string {
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    ...options,
  }).format(d);
}

/**
 * formatTime — 12-hour clock, seconds optional.
 *
 *   formatTime(date)        // => "8:42 PM"
 *   formatTime(date, true)  // => "8:42:15 PM"
 */
export function formatTime(
  input: string | number | Date,
  withSeconds = false,
): string {
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    ...(withSeconds ? { second: "2-digit" } : {}),
    hour12: true,
  }).format(d);
}

/**
 * formatRelativeTime — "2 hours ago" / "in 3 days".
 *
 * Uses the Intl.RelativeTimeFormat API. Falls back to absolute
 * "Oct 25" format past ±30 days, since "in 45 days" stops being
 * useful as a relative phrase.
 */
export function formatRelativeTime(input: string | number | Date): string {
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return "—";

  const now = Date.now();
  const diffMs = d.getTime() - now;
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (Math.abs(diffDays) > 30) {
    return formatDate(d, { month: "short", day: "numeric" });
  }

  const rtf = new Intl.RelativeTimeFormat("en-US", { numeric: "auto" });
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.round(diffMs / (1000 * 60));

  if (Math.abs(diffDays) >= 1) return rtf.format(diffDays, "day");
  if (Math.abs(diffHours) >= 1) return rtf.format(diffHours, "hour");
  return rtf.format(diffMinutes, "minute");
}

/**
 * isToday / isTomorrow — quick day comparisons used by the home
 * view's "Upcoming schedule" list to highlight imminent items.
 */
export function isToday(input: string | number | Date): boolean {
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

export function isTomorrow(input: string | number | Date): boolean {
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return false;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return d.toDateString() === tomorrow.toDateString();
}

// --- Math ------------------------------------------------------------------

/** clamp — constrain a number to [min, max]. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// --- Async -----------------------------------------------------------------

/** sleep — promise-based delay, used for timing animation sequences. */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// --- Misc ------------------------------------------------------------------

/**
 * initials — "Ahmed Ali" → "AA". Used for avatar fallbacks in
 * the finance "money owed to me" rows where we don't have photos.
 */
export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}
