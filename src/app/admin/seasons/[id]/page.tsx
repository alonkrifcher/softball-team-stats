import { db } from '@/lib/db';
import { seasons } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { setSeasonIcal, syncSeason } from '@/app/_actions/admin';

export const dynamic = 'force-dynamic';

export default async function AdminSeasonEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rows = await db.select().from(seasons).where(eq(seasons.id, id)).limit(1);
  if (!rows.length) notFound();
  const s = rows[0];

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">{s.label}</h1>
      <form
        className="card space-y-3"
        action={async (fd: FormData) => {
          'use server';
          const url = String(fd.get('icalUrl') ?? '').trim();
          await setSeasonIcal(s.id, url);
        }}
      >
        <div>
          <label className="label">iCal URL</label>
          <input className="input" name="icalUrl" defaultValue={s.icalUrl ?? ''} placeholder="https://www.teamsideline.com/Common/Calendar_ical.aspx?d=..." />
        </div>
        <button className="btn">Save</button>
      </form>
      <form
        action={async () => {
          'use server';
          await syncSeason(s.id);
        }}
        className="card flex items-center justify-between"
      >
        <div className="text-sm text-slate-600">Pull latest from iCal feed (adds/updates/cancels games).</div>
        <button className="btn">Sync now</button>
      </form>
    </div>
  );
}
