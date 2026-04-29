'use client';

import { useMemo, useState, useTransition } from 'react';
import { bulkSetPlayerActive, setPlayerActive } from '@/app/_actions/admin';

type Player = {
  id: string;
  displayName: string;
  slug: string;
  gender: 'M' | 'F';
  active: boolean;
  jerseyNumber: number | null;
  aliases: string[];
};

export function RosterAdminTable({
  players,
  addAlias,
}: {
  players: Player[];
  addAlias: (playerId: string, alias: string) => Promise<void>;
}) {
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  const visible = useMemo(() => {
    return players.filter((p) => {
      if (filter === 'active' && !p.active) return false;
      if (filter === 'inactive' && p.active) return false;
      if (search && !p.displayName.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [players, filter, search]);

  function toggleSel(id: string) {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }
  function selectAll() {
    setSelected(new Set(visible.map((p) => p.id)));
  }
  function clearSel() {
    setSelected(new Set());
  }

  function bulk(active: boolean) {
    const ids = [...selected];
    if (!ids.length) return;
    setMsg(null);
    start(async () => {
      await bulkSetPlayerActive(ids, active);
      setMsg(`${active ? 'Activated' : 'Deactivated'} ${ids.length} player${ids.length === 1 ? '' : 's'}.`);
      clearSel();
    });
  }

  function toggleOne(id: string, active: boolean) {
    setMsg(null);
    start(async () => {
      await setPlayerActive(id, active);
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          className="input w-56"
          placeholder="Search…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex overflow-hidden rounded-md border border-slate-300 text-sm">
          {(['all', 'active', 'inactive'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={
                'px-3 py-2 ' + (filter === f ? 'bg-team text-white' : 'bg-white text-slate-700 hover:bg-slate-50')
              }
            >
              {f === 'all' ? 'All' : f === 'active' ? 'Active' : 'Alumni'}
            </button>
          ))}
        </div>
        <span className="text-sm text-slate-500">
          Showing {visible.length} · Selected {selected.size}
        </span>
        {msg ? <span className="text-sm text-team">{msg}</span> : null}
      </div>

      {selected.size > 0 ? (
        <div className="flex items-center gap-2 rounded-md bg-slate-100 px-3 py-2 text-sm">
          <span>{selected.size} selected</span>
          <button type="button" onClick={() => bulk(true)} disabled={pending} className="btn-secondary px-2 py-1 text-xs">
            Mark active
          </button>
          <button type="button" onClick={() => bulk(false)} disabled={pending} className="btn-secondary px-2 py-1 text-xs">
            Mark alumni
          </button>
          <button type="button" onClick={clearSel} className="ml-auto text-xs text-slate-500 hover:underline">
            Clear
          </button>
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-md border border-slate-200">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-slate-50">
            <tr className="text-left">
              <th className="px-2 py-2">
                <input
                  type="checkbox"
                  checked={visible.length > 0 && visible.every((p) => selected.has(p.id))}
                  onChange={(e) => (e.target.checked ? selectAll() : clearSel())}
                />
              </th>
              <th className="px-2 py-2">Player</th>
              <th className="px-2 py-2">G</th>
              <th className="px-2 py-2 w-20">#</th>
              <th className="px-2 py-2 w-24 text-center">Active</th>
              <th className="px-2 py-2">Aliases</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((p) => (
              <tr key={p.id} className={selected.has(p.id) ? 'bg-team/5' : 'hover:bg-slate-50'}>
                <td className="border-t border-slate-100 px-2 py-2">
                  <input
                    type="checkbox"
                    checked={selected.has(p.id)}
                    onChange={() => toggleSel(p.id)}
                  />
                </td>
                <td className="border-t border-slate-100 px-2 py-2">
                  <div className="font-medium">{p.displayName}</div>
                </td>
                <td className="border-t border-slate-100 px-2 py-2 text-slate-500">{p.gender}</td>
                <td className="border-t border-slate-100 px-2 py-2 tabular-nums text-slate-500">
                  {p.jerseyNumber ?? '—'}
                </td>
                <td className="border-t border-slate-100 px-2 py-2 text-center">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => toggleOne(p.id, !p.active)}
                    className={
                      'rounded px-3 py-1 text-xs font-medium ' +
                      (p.active
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-slate-200 text-slate-600 hover:bg-slate-300')
                    }
                  >
                    {p.active ? 'On roster' : 'Alumni'}
                  </button>
                </td>
                <td className="border-t border-slate-100 px-2 py-2">
                  <details className="text-xs">
                    <summary className="cursor-pointer text-slate-500 hover:text-team">
                      {p.aliases.length} alias{p.aliases.length === 1 ? '' : 'es'}
                    </summary>
                    <div className="mt-1">
                      <div className="text-slate-600">{p.aliases.join(', ')}</div>
                      <AliasAdder playerId={p.id} addAlias={addAlias} />
                    </div>
                  </details>
                </td>
              </tr>
            ))}
            {visible.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-2 py-6 text-center text-slate-400">
                  No players match.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AliasAdder({
  playerId,
  addAlias,
}: {
  playerId: string;
  addAlias: (playerId: string, alias: string) => Promise<void>;
}) {
  const [val, setVal] = useState('');
  const [pending, start] = useTransition();
  function submit(e: React.FormEvent) {
    e.preventDefault();
    const v = val.trim();
    if (!v) return;
    start(async () => {
      await addAlias(playerId, v);
      setVal('');
    });
  }
  return (
    <form onSubmit={submit} className="mt-1 flex gap-1">
      <input
        className="input text-xs"
        placeholder="add alias"
        value={val}
        onChange={(e) => setVal(e.target.value)}
      />
      <button className="btn-secondary px-2 py-1 text-xs" disabled={pending}>
        +
      </button>
    </form>
  );
}
