# Deploy to Vercel — quick path

## 1. Import on Vercel

1. Go to https://vercel.com/new
2. Sign in with GitHub.
3. Pick `alonkrifcher/softball-team-stats` from the list → **Import**.
4. Framework preset will auto-detect as **Next.js** — leave it.
5. Region: `iad1` (Washington, D.C., closest to Supabase us-east-1).

## 2. Environment variables

In the import wizard, expand **Environment Variables** and paste these (one
key per row). For Production scope, copy the values from your local
`.env.local` exactly — including the leading `\$` escapes on
`ADMIN_PASSWORD_HASH`. Vercel does NOT do dotenv-expand the way local Next
does, so for Vercel paste the **unescaped** hash starting with `$2b$10$`.

Required keys:

| Key                         | Value source                                  |
|-----------------------------|-----------------------------------------------|
| DATABASE_URL                | Supabase pooler (port 6543), full URI         |
| DIRECT_URL                  | Supabase pooler (port 5432) or direct, full URI |
| SUPABASE_URL                | https://areiqgqjjjfcishxvnwf.supabase.co      |
| SUPABASE_SERVICE_ROLE_KEY   | sb_secret_...                                 |
| SUPABASE_STORAGE_BUCKET     | scoresheets                                   |
| TEAM_PASSPHRASE             | handies                                       |
| ADMIN_PASSWORD_HASH         | `$2b$10$nui8tDDS6GrTzUTg.xQwgeBfLG8uwrNcTz5OjIV1uhK0KDeQ57Q0m` (paste literally — Vercel does not expand `$`) |
| PLAYER_SESSION_SECRET       | from .env.local                               |
| ADMIN_SESSION_SECRET        | from .env.local                               |
| NEXT_PUBLIC_SITE_URL        | will be `https://<project>.vercel.app` after deploy — set after first deploy |

Optional:

| Key                | Value                                |
|--------------------|--------------------------------------|
| ANTHROPIC_API_KEY  | only needed for OCR scoresheet upload|
| OCR_MODEL          | claude-sonnet-4-5                    |

## 3. Deploy

Click **Deploy**. First build is ~90s.

## 4. After deploy

1. Copy the production URL (e.g. `https://softball-team-stats-<hash>.vercel.app`).
2. Vercel → Project → Settings → Environment Variables → set
   `NEXT_PUBLIC_SITE_URL` to that URL → redeploy (Deployments tab → latest →
   "Redeploy").
3. Open the URL on a phone. Smoke test the public routes. Log in as a player,
   RSVP. Log in as admin (`/admin/login`, password from your hash).

## 5. (Optional) custom domain

Project → Domains → Add → point a subdomain at Vercel. They'll guide DNS.

## Notes

- **Migrations are already applied** to your Supabase DB from local dev. No
  migration step is needed in CI.
- **Roster is already seeded.** No seed step needed in production.
- The `ADMIN_PASSWORD_HASH` in your local `.env.local` has backslash-escaped
  `$` characters because of how Next's dev-time dotenv-expand works. In
  Vercel, paste the *raw* hash (no backslashes, starts with `$2b$10$`).
- If something fails at build time, check the build log in Vercel — usually
  it's a missing env var.
