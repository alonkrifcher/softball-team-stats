'use client';

import { useState, useTransition } from 'react';
import { setRsvp } from '@/app/_actions/rsvp';

type Status = 'yes' | 'no' | 'maybe';

export function RsvpControl({ gameId, initial }: { gameId: string; initial: Status | null }) {
  const [cur, setCur] = useState<Status | null>(initial);
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  function pick(s: Status) {
    setErr(null);
    setCur(s);
    start(async () => {
      try {
        await setRsvp(gameId, s);
      } catch (e: unknown) {
        setErr((e as Error).message ?? 'Save failed');
      }
    });
  }

  function btn(s: Status, label: string, color: string, hint: string) {
    const active = cur === s;
    return (
      <button
        type="button"
        onClick={() => pick(s)}
        disabled={pending}
        aria-pressed={active}
        className={
          'group flex min-h-[60px] flex-1 flex-col items-center justify-center rounded-lg border-2 px-4 py-2 font-bold transition ' +
          (active ? color + ' text-white shadow-md' : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400') +
          ' disabled:opacity-50'
        }
      >
        <span className="text-base">{label}</span>
        <span className={'text-[10px] uppercase tracking-wide ' + (active ? 'opacity-80' : 'text-slate-400')}>{hint}</span>
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        {btn('yes', 'In', 'bg-green-600 border-green-700', "I'll be there")}
        {btn('maybe', 'Maybe', 'bg-amber-500 border-amber-600', 'Trying to make it')}
        {btn('no', 'Out', 'bg-slate-600 border-slate-700', "Can't make it")}
      </div>
      {err ? <div className="text-sm text-red-600">{err}</div> : null}
    </div>
  );
}
