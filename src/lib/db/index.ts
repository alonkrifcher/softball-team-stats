import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error('DATABASE_URL is required');
}

const globalForDb = globalThis as unknown as { __pg?: ReturnType<typeof postgres> };

const client =
  globalForDb.__pg ??
  postgres(url, {
    max: 10,
    prepare: false,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForDb.__pg = client;
}

export const db = drizzle(client, { schema });
export { schema };
export * from './schema';
