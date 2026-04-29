import { parseISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

export const TZ = 'America/New_York';

// Date-only strings ("2026-04-27") represent a calendar day, not a UTC instant.
// Anchor them at 12:00 UTC so timezone conversion never rolls the day back.
function toInstant(d: string | Date): Date {
  if (typeof d !== 'string') return d;
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
    return new Date(d + 'T12:00:00Z');
  }
  return parseISO(d);
}

export function fmtDate(d: string | Date | null | undefined): string {
  if (!d) return '';
  return formatInTimeZone(toInstant(d), TZ, 'EEE, MMM d, yyyy');
}

export function fmtShortDate(d: string | Date | null | undefined): string {
  if (!d) return '';
  return formatInTimeZone(toInstant(d), TZ, 'M/d');
}

export function fmtTime(d: string | Date | null | undefined): string {
  if (!d) return '';
  const date = typeof d === 'string' ? parseISO(d) : d;
  return formatInTimeZone(date, TZ, 'h:mma');
}

export function fmtDateTime(d: string | Date | null | undefined): string {
  if (!d) return '';
  return formatInTimeZone(toInstant(d), TZ, 'EEE M/d • h:mma');
}

export function isFuture(d: string | Date | null | undefined): boolean {
  if (!d) return false;
  return toInstant(d).getTime() >= Date.now() - 1000 * 60 * 60 * 4;
}
