'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { fmtAvg } from '@/lib/utils';

type Row = {
  player_id: string;
  display_name: string;
  slug: string;
  gender: 'M' | 'F';
  games: number;
  ab: number;
  r: number;
  h: number;
  singles: number;
  doubles: number;
  triples: number;
  hr: number;
  rbi: number;
  bb: number;
  k: number;
  sac: number;
  avg: number | null;
  obp: number | null;
  slg: number | null;
};

type Col = {
  key: keyof Row | 'ops' | 'name';
  label: string;
  numeric?: boolean;
  fmt?: (r: Row) => string | number;
};

const NUMERIC: Col[] = [
  { key: 'games', label: 'G', numeric: true, fmt: (r) => r.games },
  { key: 'ab', label: 'AB', numeric: true, fmt: (r) => r.ab },
  { key: 'r', label: 'R', numeric: true, fmt: (r) => r.r },
  { key: 'h', label: 'H', numeric: true, fmt: (r) => r.h },
  { key: 'singles', label: '1B', numeric: true, fmt: (r) => r.singles },
  { key: 'doubles', label: '2B', numeric: true, fmt: (r) => r.doubles },
  { key: 'triples', label: '3B', numeric: true, fmt: (r) => r.triples },
  { key: 'hr', label: 'HR', numeric: true, fmt: (r) => r.hr },
  { key: 'rbi', label: 'RBI', numeric: true, fmt: (r) => r.rbi },
  { key: 'bb', label: 'BB', numeric: true, fmt: (r) => r.bb },
  { key: 'k', label: 'K', numeric: true, fmt: (r) => r.k },
  { key: 'sac', label: 'SAC', numeric: true, fmt: (r) => r.sac },
  { key: 'avg', label: 'AVG', numeric: true, fmt: (r) => fmtAvg(r.avg ?? 0) },
  { key: 'obp', label: 'OBP', numeric: true, fmt: (r) => fmtAvg(r.obp ?? 0) },
  { key: 'slg', label: 'SLG', numeric: true, fmt: (r) => fmtAvg(r.slg ?? 0) },
  {
    key: 'ops',
    label: 'OPS',
    numeric: true,
    fmt: (r) => fmtAvg((r.obp ?? 0) + (r.slg ?? 0)),
  },
];

function getSortVal(r: Row, key: Col['key']): number {
  if (key === 'name') return 0;
  if (key === 'ops') return (r.obp ?? 0) + (r.slg ?? 0);
  const v = (r as Record<string, unknown>)[key];
  return typeof v === 'number' ? v : Number(v ?? 0);
}

export function StatsTable({ rows, linkPlayer = true }: { rows: Row[]; linkPlayer?: boolean }) {
  const [sortKey, setSortKey] = useState<Col['key']>('ab');
  const [desc, setDesc] = useState(true);

  const sorted = useMemo(() => {
    const out = [...rows];
    if (sortKey === 'name') {
      out.sort((a, b) => a.display_name.localeCompare(b.display_name));
    } else {
      out.sort((a, b) => getSortVal(a, sortKey) - getSortVal(b, sortKey));
    }
    return desc ? out.reverse() : out;
  }, [rows, sortKey, desc]);

  function header(key: Col['key'], label: string) {
    const active = sortKey === key;
    return (
      <button
        type="button"
        onClick={() => {
          if (active) setDesc((d) => !d);
          else {
            setSortKey(key);
            setDesc(true);
          }
        }}
        className={'px-2 py-2 text-left ' + (active ? 'text-team font-bold' : '')}
      >
        {label}
        {active ? (desc ? ' ↓' : ' ↑') : ''}
      </button>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead className="border-b border-slate-300">
          <tr>
            <th className="text-left">{header('name', 'Player')}</th>
            {NUMERIC.map((c) => (
              <th key={String(c.key)} className="text-right">
                {header(c.key, c.label)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => (
            <tr key={r.player_id} className="border-b border-slate-100 hover:bg-slate-50">
              <td className="px-2 py-1.5">
                {linkPlayer ? (
                  <Link href={`/players/${r.slug}`} className="text-team hover:underline">
                    {r.display_name}
                  </Link>
                ) : (
                  r.display_name
                )}
                <span className="ml-1 text-xs text-slate-400">{r.gender}</span>
              </td>
              {NUMERIC.map((c) => (
                <td key={String(c.key)} className="px-2 py-1.5 text-right tabular-nums">
                  {c.fmt!(r)}
                </td>
              ))}
            </tr>
          ))}
          {sorted.length === 0 ? (
            <tr>
              <td colSpan={NUMERIC.length + 1} className="px-2 py-6 text-center text-slate-400">
                No stats yet.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
