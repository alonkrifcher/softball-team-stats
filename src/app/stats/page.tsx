import { getCurrentSeason } from '@/lib/seasons';
import { statsForSeason } from '@/lib/queries';
import { StatsTable } from '@/components/StatsTable';

export const dynamic = 'force-dynamic';

export default async function StatsPage() {
  const season = await getCurrentSeason();
  if (!season) return <p>No current season set.</p>;
  const rows = await statsForSeason(season.id);
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">{season.label} batting</h1>
      <StatsTable rows={rows} />
    </div>
  );
}
