import { db } from '@/lib/db';
import { seasons } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';

export const getCurrentSeason = unstable_cache(
  async () => {
    const rows = await db.select().from(seasons).where(eq(seasons.isCurrent, true)).limit(1);
    return rows[0] ?? null;
  },
  ['current-season'],
  { revalidate: 600, tags: ['seasons'] }
);

export const listSeasons = unstable_cache(
  async () => {
    return db.select().from(seasons).orderBy(desc(seasons.year));
  },
  ['list-seasons'],
  { revalidate: 600, tags: ['seasons'] }
);
