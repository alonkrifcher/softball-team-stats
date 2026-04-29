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
  fmt?: (r: Row) => string | number;
  width?: string;
};

const NUMERIC: Col[] = [
  { key: 'games', label: 'G', fmt: (r) => r.games },
  { key: 'ab', label: 'AB', fmt: (r) => r.ab },
  { key: 'r', label: 'R', fmt: (r) => r.r },
  { key: 'h', label: 'H', fmt: (r) => r.h },
  { key: 'singles', label: '1B', fmt: (r) => r.singles },
  { key: 'doubles', label: '2B', fmt: (r) => r.doubles },
  { key: 'triples', label: '3B', fmt: (r) => r.triples },
  { key: 'hr', label: 'HR', fmt: (r) => r.hr },
  { key: 'rbi', label: 'RBI', fmt: (r) => r.rbi },
  { key: 'bb', label: 'BB', fmt: (r) => r.bb },
  { key: 'k', label: 'K', fmt: (r) => r.k },
  { key: 'sac', label: 'SAC', fmt: (r) => r.sac },
  { key: 'avg', label: 'AVG', fmt: (r) => fmtAvg(r.avg ?? 0) },
  { key: 'obp', label: 'OBP', fmt: (r) => fmtAvg(r.obp ?? 0) },
  { key: 'slg', label: 'SLG', fmt: (r) => fmtAvg(r.slg ?? 0) },
  { key: 'ops', label: 'OPS', fmt: (r) => fmtAvg((r.obp ?? 0) + (r.slg ?? 0)) },
];

function getSortVal(r: Row, key: Col['key']): number {
  if (key === 'name') return 0;
  if (key === 'ops') return (r.obp ?? 0) + (r.slg ?? 0);
  const v = (r as Record<string, unknown>)[key];
  return typeof v === 'number' ? v : Number(v ?? 0);
}

export function StatsTable({ rows, linkPlayer = true }: { rows: Row[]; linkPlayer?: boolean }) {
  const [sortKey, setSortKey] = useState<Col['key']>('avg');
  const [desc, setDesc] = useState(true);
  const [filter, setFilter] = useState<'all' | 'M' | 'F'>('all');

  const filtered = useMemo(() => rows.filter((r) => filter === 'all' || r.gender === filter), [rows, filter]);

  const sorted = useMemo(() => {
    const out = [...filtered];
    if (sortKey === 'name') {
      out.sort((a, b) => a.display_name.localeCompare(b.display_name));
    } else {
      out.sort((a, b) => getSortVal(a, sortKey) - getSortVal(b, sortKey));
    }
    return desc ? out.reverse() : out;
  }, [filtered, sortKey, desc]);

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
        className={
          'w-full px-2 py-2 text-xs font-bold uppercase tracking-wide ' +
          (active ? 'text-team' : 'text-slate-500 hover:text-slate-700')
        }
      >
        {label}
        {active ? <span className="ml-0.5 text-[10px]">{desc ? '▼' : '▲'}</span> : null}
      </button>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex overflow-hidden rounded-md border border-slate-300 text-sm w-fit">
        {(['all', 'M', 'F'] as const).map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => setFilter(g)}
            className={'px-3 py-1.5 ' + (filter === g ? 'bg-team text-white' : 'bg-white text-slate-700 hover:bg-slate-50')}
          >
            {g === 'all' ? 'All' : g === 'M' ? 'Men' : 'Women'}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full border-collapse text-sm">
          <thead className="border-b-2 border-slate-200 bg-slate-50">
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
            {sorted.map((r, i) => (
              <tr
                key={r.player_id}
                className={
                  'border-b border-slate-100 last:border-0 ' +
                  (i % 2 === 1 ? 'bg-slate-50/40 ' : '') +
                  'hover:bg-team/5'
                }
              >
                <td className="px-2 py-1.5 whitespace-nowrap">
                  <span className="mr-2 text-xs text-slate-400 tabular-nums">{i + 1}.</span>
                  {linkPlayer ? (
                    <Link href={`/players/${r.slug}`} className="font-medium text-team hover:underline">
                      {r.display_name}
                    </Link>
                  ) : (
                    <span className="font-medium">{r.display_name}</span>
                  )}
                  <span className="ml-1 text-xs text-slate-400">{r.gender}</span>
                </td>
                {NUMERIC.map((c) => {
                  const isRate = c.key === 'avg' || c.key === 'obp' || c.key === 'slg' || c.key === 'ops';
                  return (
                    <td
                      key={String(c.key)}
                      className={
                        'px-2 py-1.5 text-right tabular-nums ' +
                        (isRate ? 'font-semibold' : '') +
                        (sortKey === c.key ? ' text-team' : '')
                      }
                    >
                      {c.fmt!(r)}
                    </td>
                  );
                })}
              </tr>
            ))}
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={NUMERIC.length + 1} className="px-2 py-8 text-center text-slate-400">
                  No stats yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
