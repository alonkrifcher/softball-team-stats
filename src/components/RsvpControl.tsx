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

  function btn(s: Status, label: string, color: string) {
    const active = cur === s;
    return (
      <button
        type="button"
        onClick={() => pick(s)}
        disabled={pending}
        className={`min-h-[56px] flex-1 rounded-md border px-4 py-2 font-medium ${active ? color + ' text-white' : 'bg-white text-slate-700 border-slate-300'} disabled:opacity-50`}
      >
        {label}
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        {btn('yes', 'Yes', 'bg-green-600 border-green-600')}
        {btn('maybe', 'Maybe', 'bg-amber-500 border-amber-500')}
        {btn('no', 'No', 'bg-slate-600 border-slate-600')}
      </div>
      {err ? <div className="text-sm text-red-600">{err}</div> : null}
    </div>
  );
}
