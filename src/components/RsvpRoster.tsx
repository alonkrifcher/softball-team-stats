type Row = { playerId: string; displayName: string; gender: 'M' | 'F'; status: 'yes' | 'no' | 'maybe' };

function group(rows: Row[], status: Row['status']) {
  const m = rows.filter((r) => r.status === status && r.gender === 'M');
  const f = rows.filter((r) => r.status === status && r.gender === 'F');
  return { m, f, count: m.length + f.length };
}

const TONE: Record<Row['status'], string> = {
  yes: 'bg-green-50 border-green-200',
  maybe: 'bg-amber-50 border-amber-200',
  no: 'bg-slate-50 border-slate-200',
};

export function RsvpRoster({ rsvps }: { rsvps: Row[] }) {
  const sections: { key: Row['status']; label: string }[] = [
    { key: 'yes', label: 'In' },
    { key: 'maybe', label: 'Maybe' },
    { key: 'no', label: 'Out' },
  ];
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {sections.map(({ key, label }) => {
        const g = group(rsvps, key);
        return (
          <div key={key} className={`rounded-md border p-3 ${TONE[key]}`}>
            <div className="mb-2 flex justify-between text-sm font-semibold">
              <span>{label}</span>
              <span className="text-slate-500">
                {g.m.length}M / {g.f.length}F
              </span>
            </div>
            <ul className="space-y-1 text-sm">
              {[...g.m, ...g.f].map((r) => (
                <li key={r.playerId}>
                  {r.displayName} <span className="text-xs text-slate-400">{r.gender}</span>
                </li>
              ))}
              {g.count === 0 ? <li className="text-slate-400">—</li> : null}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
