import Link from 'next/link';
import { listSeasons } from '@/lib/seasons';
import { setCurrentSeason } from '@/app/_actions/admin';

export const dynamic = 'force-dynamic';

export default async function AdminSeasonsPage() {
  const seasons = await listSeasons();
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Seasons</h1>
      <table className="w-full text-sm">
        <thead className="border-b">
          <tr className="text-left">
            <th className="px-2 py-2">Year</th>
            <th className="px-2 py-2">Label</th>
            <th className="px-2 py-2">Current</th>
            <th className="px-2 py-2">iCal</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {seasons.map((s) => (
            <tr key={s.id} className="border-b border-slate-100">
              <td className="px-2 py-2">{s.year}</td>
              <td className="px-2 py-2">{s.label}</td>
              <td className="px-2 py-2">{s.isCurrent ? '✓' : ''}</td>
              <td className="px-2 py-2 text-xs">{s.icalUrl ? 'set' : '—'}</td>
              <td className="px-2 py-2 text-right">
                <Link className="text-team underline" href={`/admin/seasons/${s.id}`}>
                  edit
                </Link>{' '}
                {!s.isCurrent ? (
                  <form
                    className="inline"
                    action={async () => {
                      'use server';
                      await setCurrentSeason(s.id);
                    }}
                  >
                    <button type="submit" className="text-team underline">make current</button>
                  </form>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
