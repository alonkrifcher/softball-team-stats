import 'dotenv/config';
import postgres from 'postgres';

async function main() {
  const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL required');
  if (!process.env.ALLOW_DB_RESET) {
    console.error('Set ALLOW_DB_RESET=1 to confirm destructive reset.');
    process.exit(1);
  }
  const sql = postgres(url, { max: 1 });
  console.log('Dropping schema...');
  await sql`DROP SCHEMA IF EXISTS public CASCADE`;
  await sql`CREATE SCHEMA public`;
  await sql`GRANT ALL ON SCHEMA public TO public`;
  console.log('Schema reset. Run npm run db:migrate next.');
  await sql.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
