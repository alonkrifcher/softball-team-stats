import { format, parseISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

export const TZ = 'America/New_York';

export function fmtDate(d: string | Date | null | undefined): string {
  if (!d) return '';
  const date = typeof d === 'string' ? parseISO(d) : d;
  return formatInTimeZone(date, TZ, 'EEE, MMM d, yyyy');
}

export function fmtShortDate(d: string | Date | null | undefined): string {
  if (!d) return '';
  const date = typeof d === 'string' ? parseISO(d) : d;
  return formatInTimeZone(date, TZ, 'M/d');
}

export function fmtTime(d: string | Date | null | undefined): string {
  if (!d) return '';
  const date = typeof d === 'string' ? parseISO(d) : d;
  return formatInTimeZone(date, TZ, 'h:mma');
}

export function fmtDateTime(d: string | Date | null | undefined): string {
  if (!d) return '';
  const date = typeof d === 'string' ? parseISO(d) : d;
  return formatInTimeZone(date, TZ, 'EEE M/d • h:mma');
}

export function isFuture(d: string | Date | null | undefined): boolean {
  if (!d) return false;
  const date = typeof d === 'string' ? parseISO(d) : d;
  return date.getTime() >= Date.now() - 1000 * 60 * 60 * 4;
}
