import { careerStats } from '@/lib/queries';
import { StatsTable } from '@/components/StatsTable';

export const dynamic = 'force-dynamic';

export default async function CareerStatsPage() {
  const rows = await careerStats();
  // Add empty season fields so the StatsTable type matches
  const padded = rows.map((r) => ({
    ...r,
    season_id: '',
    year: 0,
    season_label: '',
  }));
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Career batting (2018–present)</h1>
      <StatsTable rows={padded} />
    </div>
  );
}
