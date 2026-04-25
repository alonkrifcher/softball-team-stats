type Props = {
  label: string;
  wins: number;
  losses: number;
  ties: number;
  runsFor?: number | null;
  runsAgainst?: number | null;
};

export function RecordCard({ label, wins, losses, ties, runsFor, runsAgainst }: Props) {
  return (
    <div className="card flex items-center gap-6">
      <div>
        <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
        <div className="text-3xl font-bold tabular-nums">
          {wins}-{losses}
          {ties ? `-${ties}` : ''}
        </div>
      </div>
      {runsFor != null && runsAgainst != null ? (
        <div className="text-sm text-slate-600">
          <div>RF: {runsFor}</div>
          <div>RA: {runsAgainst}</div>
          <div>Diff: {(runsFor ?? 0) - (runsAgainst ?? 0)}</div>
        </div>
      ) : null}
    </div>
  );
}
