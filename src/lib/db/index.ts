import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL || 'postgresql://localhost:5432/temp';
const client = postgres(connectionString, {
  max: 1, // Limit connections during build
});
export const db = drizzle(client, { schema });

export * from './schema';