'use client';

import { useMemo, useState, useTransition } from 'react';
import { saveBattingLines } from '@/app/_actions/admin';

type Player = { id: string; displayName: string; gender: 'M' | 'F'; slug: string };
type Line = {
  playerId: string;
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
};

const COLS: { key: keyof Omit<Line, 'playerId'>; label: string }[] = [
  { key: 'ab', label: 'AB' },
  { key: 'r', label: 'R' },
  { key: 'h', label: 'H' },
  { key: 'singles', label: '1B' },
  { key: 'doubles', label: '2B' },
  { key: 'triples', label: '3B' },
  { key: 'hr', label: 'HR' },
  { key: 'rbi', label: 'RBI' },
  { key: 'bb', label: 'BB' },
  { key: 'k', label: 'K' },
  { key: 'sac', label: 'SAC' },
];

function blankLine(playerId: string): Line {
  return { playerId, ab: 0, r: 0, h: 0, singles: 0, doubles: 0, triples: 0, hr: 0, rbi: 0, bb: 0, k: 0, sac: 0 };
}

export function BattingForm({
  gameId,
  roster,
  initial,
}: {
  gameId: string;
  roster: Player[];
  initial: Record<string, Partial<Line>>;
}) {
  const [lines, setLines] = useState<Record<string, Line>>(() => {
    const out: Record<string, Line> = {};
    for (const p of roster) out[p.id] = { ...blankLine(p.id), ...(initial[p.id] ?? {}) };
    return out;
  });
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function set(playerId: string, key: keyof Omit<Line, 'playerId'>, raw: string) {
    const n = parseInt(raw || '0', 10) || 0;
    setLines((s) => {
      const next = { ...s, [playerId]: { ...s[playerId], [key]: n } };
      // Auto-derive singles when h/2b/3b/hr change
      if (['h', 'doubles', 'triples', 'hr', 'singles'].includes(key)) {
        const l = next[playerId];
        if (key !== 'singles') {
          next[playerId] = { ...l, singles: Math.max(0, l.h - l.doubles - l.triples - l.hr) };
        }
      }
      return next;
    });
  }

  const dirty = useMemo(
    () =>
      Object.values(lines).filter(
        (l) => l.ab + l.r + l.h + l.bb + l.k + l.rbi + l.sac > 0
      ),
    [lines]
  );

  function submit() {
    setMsg(null);
    start(async () => {
      try {
        await saveBattingLines(gameId, dirty);
        setMsg(`Saved ${dirty.length} lines.`);
      } catch (e) {
        setMsg(`Error: ${(e as Error).message}`);
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="border-b">
            <tr>
              <th className="px-2 py-2 text-left">Player</th>
              {COLS.map((c) => (
                <th key={c.key} className="px-1 py-2 text-right">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {roster.map((p) => (
              <tr key={p.id} className="border-b border-slate-100">
                <td className="px-2 py-1 whitespace-nowrap">
                  {p.displayName} <span className="text-xs text-slate-400">{p.gender}</span>
                </td>
                {COLS.map((c) => (
                  <td key={c.key} className="px-1 py-1">
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      className="input w-14 px-1 py-1 text-right tabular-nums"
                      value={lines[p.id][c.key]}
                      onChange={(e) => set(p.id, c.key, e.target.value)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-3">
        <button type="button" className="btn" onClick={submit} disabled={pending}>
          Save {dirty.length} non-empty lines
        </button>
        {msg ? <span className="text-sm">{msg}</span> : null}
      </div>
    </div>
  );
}
