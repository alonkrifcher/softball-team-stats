'use client';

import { useState, useTransition } from 'react';
import { commitScoresheet, parseUpload, rejectScoresheet } from '@/app/_actions/admin';
import type { ParsedScoresheet } from '@/lib/ocr';

type Player = { id: string; slug: string; displayName: string; gender: 'M' | 'F' };
type Status = 'pending' | 'parsed' | 'committed' | 'rejected' | 'failed';

const COLS: { k: keyof ParsedScoresheet['players'][number]; label: string }[] = [
  { k: 'ab', label: 'AB' },
  { k: 'r', label: 'R' },
  { k: 'h', label: 'H' },
  { k: 'singles', label: '1B' },
  { k: 'doubles', label: '2B' },
  { k: 'triples', label: '3B' },
  { k: 'hr', label: 'HR' },
  { k: 'rbi', label: 'RBI' },
  { k: 'bb', label: 'BB' },
  { k: 'k', label: 'K' },
  { k: 'sac', label: 'SAC' },
];

export function ScoresheetReview({
  uploadId,
  gameId: _gameId,
  status,
  errorMessage,
  imageUrl,
  initialParsed,
  initialMeta,
  roster,
}: {
  uploadId: string;
  gameId: string;
  status: Status;
  errorMessage: string | null;
  imageUrl: string;
  initialParsed: ParsedScoresheet | null;
  initialMeta: { opponent: string; uhjRuns: number | null; oppRuns: number | null };
  roster: Player[];
}) {
  const [parsed, setParsed] = useState<ParsedScoresheet | null>(initialParsed);
  const [meta, setMeta] = useState(initialMeta);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function row(i: number) {
    return parsed?.players[i];
  }

  function setRow(i: number, patch: Partial<ParsedScoresheet['players'][number]>) {
    setParsed((p) => {
      if (!p) return p;
      const next = { ...p, players: p.players.map((r, idx) => (idx === i ? { ...r, ...patch } : r)) };
      return next;
    });
  }

  function rowIssues(i: number) {
    const r = row(i);
    if (!r) return [];
    const issues: string[] = [];
    if (r.h !== r.singles + r.doubles + r.triples + r.hr) issues.push('h≠1+2+3+HR');
    if (r.ab < r.h + r.k) issues.push('ab<h+k');
    if (!r.matched_player_slug) issues.push('unmatched');
    return issues;
  }

  function reparse() {
    setMsg(null);
    start(async () => {
      try {
        await parseUpload(uploadId);
        setMsg('Re-parsed. Refresh to see latest.');
      } catch (e) {
        setMsg(`Error: ${(e as Error).message}`);
      }
    });
  }

  function commit() {
    if (!parsed) return;
    setMsg(null);
    start(async () => {
      try {
        await commitScoresheet(uploadId, parsed, {
          opponent: meta.opponent || null,
          uhj_runs: meta.uhjRuns ?? null,
          opp_runs: meta.oppRuns ?? null,
        });
        setMsg('Committed.');
      } catch (e) {
        setMsg(`Error: ${(e as Error).message}`);
      }
    });
  }

  function reject() {
    setMsg(null);
    start(async () => {
      await rejectScoresheet(uploadId);
      setMsg('Rejected.');
    });
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <h1 className="text-xl font-bold">Scoresheet review</h1>
        <p className="text-xs text-slate-500">Status: {status}</p>
        {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}
        <a href={imageUrl} target="_blank" rel="noreferrer">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt="scoresheet" className="w-full rounded-md border border-slate-200" />
        </a>
        <div className="flex gap-2">
          <button type="button" className="btn-secondary" onClick={reparse} disabled={pending}>
            Re-parse
          </button>
          <button type="button" className="btn-secondary" onClick={reject} disabled={pending}>
            Reject
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="card space-y-2">
          <h2 className="text-sm font-semibold uppercase text-slate-600">Game meta</h2>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="label">Opponent</label>
              <input
                className="input"
                value={meta.opponent}
                onChange={(e) => setMeta({ ...meta, opponent: e.target.value })}
              />
            </div>
            <div>
              <label className="label">UHJ runs</label>
              <input
                className="input"
                type="number"
                value={meta.uhjRuns ?? ''}
                onChange={(e) => setMeta({ ...meta, uhjRuns: e.target.value === '' ? null : Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="label">Opp runs</label>
              <input
                className="input"
                type="number"
                value={meta.oppRuns ?? ''}
                onChange={(e) => setMeta({ ...meta, oppRuns: e.target.value === '' ? null : Number(e.target.value) })}
              />
            </div>
          </div>
        </div>

        {parsed ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead className="border-b">
                <tr>
                  <th className="px-1 py-2 text-left">Player</th>
                  {COLS.map((c) => (
                    <th key={c.k} className="px-1 py-2 text-right">
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {parsed.players.map((p, i) => {
                  const issues = rowIssues(i);
                  return (
                    <tr key={i} className={issues.length ? 'border-b border-slate-100 bg-red-50' : 'border-b border-slate-100'}>
                      <td className="px-1 py-1 whitespace-nowrap">
                        <div className="text-xs text-slate-500">{p.name_as_written}</div>
                        <select
                          className="input"
                          value={p.matched_player_slug ?? ''}
                          onChange={(e) =>
                            setRow(i, { matched_player_slug: e.target.value || null })
                          }
                        >
                          <option value="">— pick —</option>
                          {roster.map((r) => (
                            <option key={r.slug} value={r.slug}>
                              {r.displayName}
                            </option>
                          ))}
                        </select>
                      </td>
                      {COLS.map((c) => {
                        const lowConf = p.confidence < 0.7;
                        return (
                          <td key={c.k} className="px-1 py-1">
                            <input
                              type="number"
                              min={0}
                              className={
                                'input w-14 px-1 py-1 text-right tabular-nums ' +
                                (lowConf ? 'bg-amber-50' : '')
                              }
                              value={(p[c.k] as number) ?? 0}
                              onChange={(e) => setRow(i, { [c.k]: parseInt(e.target.value || '0', 10) || 0 })}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-500">No parsed data yet. {status === 'pending' ? 'Parsing…' : null}</p>
        )}

        <div className="flex items-center gap-3">
          <button type="button" className="btn" onClick={commit} disabled={pending || !parsed}>
            Commit
          </button>
          {msg ? <span className="text-sm">{msg}</span> : null}
        </div>
      </div>
    </div>
  );
}
