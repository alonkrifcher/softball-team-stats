import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { PlayerGameStats } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(dateObj);
}

export function formatDateTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(dateObj);
}

export function formatDateForInput(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toISOString().split('T')[0];
}

export function calculateBattingAverage(hits: number, atBats: number): number {
  if (atBats === 0) return 0;
  return Math.round((hits / atBats) * 1000) / 1000;
}

export function calculateOnBasePercentage(hits: number, walks: number, atBats: number): number {
  const plateAppearances = atBats + walks;
  if (plateAppearances === 0) return 0;
  return Math.round(((hits + walks) / plateAppearances) * 1000) / 1000;
}

export function calculateSluggingPercentage(stats: PlayerGameStats): number {
  if (stats.atBats === 0) return 0;
  const totalBases = stats.singles + (stats.doubles * 2) + (stats.triples * 3) + (stats.homeRuns * 4);
  return Math.round((totalBases / stats.atBats) * 1000) / 1000;
}

export function calculateOPS(
  hits: number,
  walks: number,
  atBats: number,
  singles: number,
  doubles: number,
  triples: number,
  homeRuns: number
): number {
  const obp = calculateOnBasePercentage(hits, walks, atBats);
  const totalBases = singles + (doubles * 2) + (triples * 3) + (homeRuns * 4);
  const slg = atBats === 0 ? 0 : totalBases / atBats;
  return Math.round((obp + slg) * 1000) / 1000;
}

export function aggregatePlayerStats(gameStats: PlayerGameStats[]) {
  const totals = gameStats.reduce(
    (acc, stat) => ({
      games: acc.games + 1,
      atBats: acc.atBats + stat.atBats,
      hits: acc.hits + stat.hits,
      runs: acc.runs + stat.runs,
      rbis: acc.rbis + stat.rbis,
      walks: acc.walks + stat.walks,
      strikeouts: acc.strikeouts + stat.strikeouts,
      singles: acc.singles + stat.singles,
      doubles: acc.doubles + stat.doubles,
      triples: acc.triples + stat.triples,
      homeRuns: acc.homeRuns + stat.homeRuns,
      stolenBases: acc.stolenBases + stat.stolenBases,
      errors: acc.errors + stat.errors,
      assists: acc.assists + stat.assists,
      putouts: acc.putouts + stat.putouts,
    }),
    {
      games: 0,
      atBats: 0,
      hits: 0,
      runs: 0,
      rbis: 0,
      walks: 0,
      strikeouts: 0,
      singles: 0,
      doubles: 0,
      triples: 0,
      homeRuns: 0,
      stolenBases: 0,
      errors: 0,
      assists: 0,
      putouts: 0,
    }
  );

  return {
    ...totals,
    battingAverage: calculateBattingAverage(totals.hits, totals.atBats),
    onBasePercentage: calculateOnBasePercentage(totals.hits, totals.walks, totals.atBats),
    ops: calculateOPS(
      totals.hits,
      totals.walks,
      totals.atBats,
      totals.singles,
      totals.doubles,
      totals.triples,
      totals.homeRuns
    ),
  };
}