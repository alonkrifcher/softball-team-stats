import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function fmtAvg(x: number | null | undefined): string {
  if (x == null || Number.isNaN(x)) return '.000';
  return x.toFixed(3).replace(/^0/, '');
}

export function fmtPct(x: number | null | undefined): string {
  if (x == null || Number.isNaN(x)) return '—';
  return (x * 100).toFixed(1) + '%';
}

export function fmtInt(x: number | string | null | undefined): string {
  if (x == null || x === '') return '0';
  return String(typeof x === 'string' ? parseInt(x, 10) || 0 : Math.round(x));
}
