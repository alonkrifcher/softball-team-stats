# Underhand Jobs (UHJ) — v2 Build Plan

This is the canonical build spec. Hand it to a coding agent (or yourself) and follow it
top-to-bottom. It's intentionally opinionated — every fork in the road is decided in
this document so the implementer doesn't have to.

---

## 0. Product summary (one paragraph)

A single-team hub for the Underhand Jobs coed softball team. Public pages show the
historical schedule + stats (2018–2025), the current-season schedule and stats, and
a player roster. Authenticated team members can RSVP Yes/No/Maybe to upcoming games.
A single admin (Alon) manages the schedule (synced from a Google Calendar iCal feed),
enters game results, and adds per-game batting stats either by typing them in or by
uploading a photo of a hand-filled paper scorebook page that Claude Sonnet parses
into a draft form for review and commit.

---

## 1. Locked decisions (do not relitigate)

| Concern | Decision |
|---|---|
| Framework | **Next.js 15 App Router + TypeScript** (Server Components + server actions; no separate API routes unless noted) |
| DB + storage + image host | **Supabase free tier** — Postgres + Storage in one project. Single vendor wins on simplicity. |
| ORM | **Drizzle** (kept from existing repo) |
| OCR / vision | **Anthropic Claude Sonnet (latest)**, tool-use with strict JSON schema, no fallback |
| Auth | **iron-session** signed httpOnly cookies. `uhj_player` (90d, set after team passphrase + roster pick), `uhj_admin` (30d, set after admin password). No PINs, no per-user accounts. Impersonation accepted. |
| Calendar | **TeamSideline iCal feed URL** is the source of truth for the current season schedule. Synced on demand via admin button + on every public schedule page request with a 10-min cache. URL provided: `https://www.teamsideline.com/Common/Calendar_ical.aspx?d=vseBS5X6j9rHlQ%2bsuRfgXWjT98vRaJGThzuqRoy47gUsEd%2fCYq1cL6tVdIfq1zdA` |
| Hosting | **Vercel Hobby** (web + server actions). Single region: `iad1`. |
| Domain | `*.vercel.app` for v1. Custom domain v2. |
| Timezone | Store UTC, render `America/New_York`. |
| Gender enum | Two values: `M`, `F`. |
| Coed lineup logic | Out of scope v1. Show RSVP counts split by gender; that's it. |
| Notifications | None in v1. |
| Stats columns shown | AVG / OBP / SLG / OPS plus raw counts. **No EqA in v1** (formula uncertainty; recompute in v2 if wanted). |
| Tests | None in v1. Manual smoke test before share. Playwright in v2 if it bites. |
| Data source | The **xlsx** at `/Users/alon/Downloads/UHJ Spring_Summer Softball Reference (Team Stats).xlsx` is canonical for historical data. Convert to checked-in CSVs as part of the import pipeline. |

---

## 2. Repo strategy

Working directory: `/Users/alon/personal code/softball-team-stats`

```bash
git checkout -b v2
git rm -rf src scripts simple-import.sql underhand-jobs-import.sql GETTING_STARTED.md
# Keep: package.json (prune deps), drizzle.config.ts, tailwind.config.js,
#       postcss.config.js, tsconfig.json, README.md (rewrite), CLAUDE.md (rewrite),
#       .gitignore, next.config.js, next-env.d.ts
git commit -m "Reset for v2 rebuild"
```

**Prune from package.json**: `googleapis`, `xlsx`, `recharts`, `react-hook-form`,
`bcryptjs` (we'll re-add for admin password hash), `jsonwebtoken`,
`@hookform/resolvers`, `@types/jsonwebtoken`, `@types/bcryptjs`.

**Add**:
- `iron-session` (auth cookies)
- `bcryptjs` + `@types/bcryptjs` (admin password)
- `@anthropic-ai/sdk` (OCR)
- `@supabase/supabase-js` (storage uploads + signed URLs only — DB still goes through Drizzle/postgres-js)
- `node-ical` (parse iCal feed)
- `zod` (kept; runtime validation)
- `react-day-picker` + `date-fns` (date inputs; date-fns kept)
- `@radix-ui/react-select`, `@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu` (lightweight primitives — skip full shadcn/ui to keep deps small)

Old `main` branch stays as reference; never delete it.

---

## 3. Operating principles (apply throughout)

1. **De-risk first.** Phase 0 has two spikes with hard kill-gates. If OCR fails the
   gate, ship without it.
2. **Manual entry is the fallback that always works.** Build the manual stat-entry
   form before the OCR pipeline. OCR's job is to pre-fill it.
3. **Read-only public pages ship before auth.** Validates deploy + DB + import end-
   to-end without any auth or OCR risk.
4. **Aggregates live in SQL views**, not app code. One source of truth for AVG/OBP/
   SLG/OPS across historical and current seasons.
5. **Importer fails loud.** Any unmapped name is an error; the importer writes the
   failures to a file and exits non-zero. No silent data loss.
6. **Idempotent imports.** Re-running `npm run import:historical` produces the same
   DB state. Use upserts keyed by stable identifiers.
7. **No premature abstractions.** Three similar pages aren't a framework. One
   `<StatsTable>` component, one `<RsvpControl>`, that's enough.

---

## 4. Final data model

Single migration `0000_init.sql` (generated from Drizzle schema). All IDs are `uuid`.

```sql
-- Enums
CREATE TYPE gender AS ENUM ('M','F');
CREATE TYPE game_status AS ENUM ('scheduled','final','historical','cancelled');
CREATE TYPE game_result AS ENUM ('W','L','T');
CREATE TYPE rsvp_status AS ENUM ('yes','no','maybe');
CREATE TYPE stat_source AS ENUM ('xlsx','manual','ocr');
CREATE TYPE upload_status AS ENUM ('pending','parsed','committed','rejected','failed');

-- Players (canonical roster)
CREATE TABLE players (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name  text NOT NULL,                      -- "Alon Krifcher"
  slug          text NOT NULL UNIQUE,               -- "alon-krifcher"
  gender        gender NOT NULL,
  active        boolean NOT NULL DEFAULT true,
  jersey_number int,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Aliases (every name string the importer might encounter)
CREATE TABLE player_aliases (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  alias     text NOT NULL UNIQUE                    -- "Halperin", "Tracy Jolson", etc.
);

-- Seasons
CREATE TABLE seasons (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year         int NOT NULL,
  label        text NOT NULL,                       -- "2026 Spring/Summer"
  ical_url     text,                                -- only set on the current season
  is_current   boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE(year)
);
CREATE UNIQUE INDEX seasons_one_current ON seasons(is_current) WHERE is_current = true;

-- Games
CREATE TABLE games (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id       uuid NOT NULL REFERENCES seasons(id),
  game_number     int,                              -- nullable; assigned in order
  played_on       date NOT NULL,
  start_time      timestamptz,                      -- from iCal if available
  location        text,
  opponent        text,                             -- nullable for some historical
  uhj_runs        int,
  opp_runs        int,
  result          game_result,                      -- derived; nullable until final
  status          game_status NOT NULL DEFAULT 'scheduled',
  notes           text,
  ical_uid        text UNIQUE,                      -- iCal sync key for current season
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX games_season ON games(season_id, played_on);

-- Per-game batting stats
CREATE TABLE batting_lines (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id       uuid NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  player_id     uuid NOT NULL REFERENCES players(id),
  ab            int NOT NULL DEFAULT 0,
  r             int NOT NULL DEFAULT 0,
  h             int NOT NULL DEFAULT 0,
  singles       int NOT NULL DEFAULT 0,
  doubles       int NOT NULL DEFAULT 0,
  triples       int NOT NULL DEFAULT 0,
  hr            int NOT NULL DEFAULT 0,
  rbi           int NOT NULL DEFAULT 0,
  bb            int NOT NULL DEFAULT 0,
  k             int NOT NULL DEFAULT 0,
  sac           int NOT NULL DEFAULT 0,
  source        stat_source NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE(game_id, player_id),
  CHECK (h = singles + doubles + triples + hr),
  CHECK (ab >= h + k)
);

-- RSVPs
CREATE TABLE rsvps (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id     uuid NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  player_id   uuid NOT NULL REFERENCES players(id),
  status      rsvp_status NOT NULL,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(game_id, player_id)
);

-- Scoresheet uploads
CREATE TABLE scoresheet_uploads (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id       uuid REFERENCES games(id) ON DELETE SET NULL,
  storage_key   text NOT NULL,                      -- supabase storage path
  parsed_json   jsonb,
  status        upload_status NOT NULL DEFAULT 'pending',
  error_message text,
  uploaded_at   timestamptz NOT NULL DEFAULT now(),
  committed_at  timestamptz
);

-- Audit log (lightweight; admin actions only)
CREATE TABLE audit_log (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor       text NOT NULL,                        -- 'admin' or player slug
  action      text NOT NULL,                        -- 'commit_stats', 'sync_ical', etc.
  target      text,                                 -- e.g., game_id
  details     jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);
```

### SQL Views (`0001_views.sql`)

```sql
CREATE OR REPLACE VIEW v_batting_with_derived AS
SELECT
  bl.*,
  (bl.h + bl.bb)::numeric / NULLIF(bl.ab + bl.bb, 0) AS obp,
  (bl.singles + 2*bl.doubles + 3*bl.triples + 4*bl.hr)::numeric / NULLIF(bl.ab, 0) AS slg,
  bl.h::numeric / NULLIF(bl.ab, 0) AS avg
FROM batting_lines bl;

CREATE OR REPLACE VIEW v_player_season_stats AS
SELECT
  p.id AS player_id,
  p.display_name,
  p.gender,
  s.id AS season_id,
  s.year,
  s.label AS season_label,
  COUNT(DISTINCT bl.game_id) AS games,
  SUM(bl.ab) AS ab,
  SUM(bl.r) AS r,
  SUM(bl.h) AS h,
  SUM(bl.singles) AS singles,
  SUM(bl.doubles) AS doubles,
  SUM(bl.triples) AS triples,
  SUM(bl.hr) AS hr,
  SUM(bl.rbi) AS rbi,
  SUM(bl.bb) AS bb,
  SUM(bl.k) AS k,
  SUM(bl.sac) AS sac,
  SUM(bl.h)::numeric / NULLIF(SUM(bl.ab), 0) AS avg,
  (SUM(bl.h)+SUM(bl.bb))::numeric / NULLIF(SUM(bl.ab)+SUM(bl.bb), 0) AS obp,
  (SUM(bl.singles)+2*SUM(bl.doubles)+3*SUM(bl.triples)+4*SUM(bl.hr))::numeric
    / NULLIF(SUM(bl.ab), 0) AS slg
FROM players p
JOIN batting_lines bl ON bl.player_id = p.id
JOIN games g ON g.id = bl.game_id
JOIN seasons s ON s.id = g.season_id
GROUP BY p.id, p.display_name, p.gender, s.id, s.year, s.label;

CREATE OR REPLACE VIEW v_player_career_stats AS
SELECT
  player_id, display_name, gender,
  SUM(games) AS games,
  SUM(ab) AS ab, SUM(r) AS r, SUM(h) AS h,
  SUM(singles) AS singles, SUM(doubles) AS doubles, SUM(triples) AS triples,
  SUM(hr) AS hr, SUM(rbi) AS rbi, SUM(bb) AS bb, SUM(k) AS k, SUM(sac) AS sac,
  SUM(h)::numeric / NULLIF(SUM(ab), 0) AS avg,
  (SUM(h)+SUM(bb))::numeric / NULLIF(SUM(ab)+SUM(bb), 0) AS obp,
  (SUM(singles)+2*SUM(doubles)+3*SUM(triples)+4*SUM(hr))::numeric / NULLIF(SUM(ab), 0) AS slg
FROM v_player_season_stats
GROUP BY player_id, display_name, gender;

-- OPS = OBP + SLG, computed in SELECT or in app — not stored.

CREATE OR REPLACE VIEW v_team_season_record AS
SELECT
  s.id AS season_id, s.year, s.label,
  COUNT(*) FILTER (WHERE g.result = 'W') AS wins,
  COUNT(*) FILTER (WHERE g.result = 'L') AS losses,
  COUNT(*) FILTER (WHERE g.result = 'T') AS ties,
  SUM(g.uhj_runs) AS runs_for,
  SUM(g.opp_runs) AS runs_against
FROM seasons s
JOIN games g ON g.season_id = s.id
WHERE g.status IN ('final','historical')
GROUP BY s.id, s.year, s.label;
```

---

## 5. Calendar (iCal) integration

The current season's schedule is sourced from a **TeamSideline iCal URL** (the
league publishes it as a calendar subscription link). The URL is committed to the
seed for the current season; admin can also edit it from `/admin/seasons/[id]`
and click Sync.

Provided URL (current season):
```
https://www.teamsideline.com/Common/Calendar_ical.aspx?d=vseBS5X6j9rHlQ%2bsuRfgXWjT98vRaJGThzuqRoy47gUsEd%2fCYq1cL6tVdIfq1zdA
```

### Sync semantics
- `POST /api/ical/sync?seasonId=...` (admin-only)
  1. Fetch the iCal URL with `node-ical`.
  2. For each `VEVENT` whose `DTSTART` falls within the season's calendar year:
     - Use `UID` as the stable key (`games.ical_uid`).
     - Parse `SUMMARY` to extract opponent. TeamSideline format is typically
       `"<League> - <Home Team> vs <Away Team>"`. Logic: split on ` vs `, take
       the side that doesn't match `Underhand Jobs` / `UHJ`, strip any leading
       league/division prefix before " - ". Set `home_away` accordingly (this
       lives in a future column; v1 stores opponent only).
     - Upsert game: if `ical_uid` exists → update `played_on`, `start_time`,
       `location`, `opponent` (only if game is still `scheduled`); never overwrite
       runs/result.
     - If a game is missing from the feed but exists in DB with `ical_uid` and
       `status='scheduled'`, mark it `cancelled`. Final/historical games are never touched.
  3. Write `audit_log` entry with counts (added/updated/cancelled).
- **Auto-sync**: server actions on `/schedule` revalidate via `unstable_cache` with
  10-minute TTL keyed by `ical_url`. No cron needed; sync happens on demand.
- Manual sync from admin page for immediate updates.

### Failure modes
- iCal fetch 4xx/5xx → toast error, leave existing games untouched.
- Missing UID → fall back to `(played_on, opponent)` key. Log warning.
- Time zone: iCal events from Google are floating local; render assuming
  `America/New_York` if no TZ specified.

---

## 6. Historical import pipeline

Source: `/Users/alon/Downloads/UHJ Spring_Summer Softball Reference (Team Stats).xlsx`.

### 6.1 One-time conversion

Add a Python script `scripts/xlsx-to-csv.py` (uses openpyxl, already on the user's
machine). Output to `data/`:
- `data/player_list.csv` — from "Player List" tab (70 rows: name, gender)
- `data/game_data.csv` — from "Game DATA" tab (year, game_number, date, opponent, result, uhj_runs, opp_runs, notes)
- `data/player_data.csv` — from "Player Data" tab (823 rows of per-game batting)

These three files are **checked into the repo** so the import is reproducible
without re-running Python. Document in README that updating historical data means
re-exporting these tabs and committing.

### 6.2 Roster + alias seed

`scripts/seed-roster.ts`:
1. Read `data/player_list.csv`. Insert each row into `players` with display_name +
   gender. Slug = kebab-case of display_name (handle dupes by suffixing).
2. For every player, insert their display_name as an alias.
3. Apply hand-curated **additional aliases** from `data/aliases.json`:

```json
{
  "alon-krifcher": ["Alon Krifcher"],
  "halperin":      ["Halperin", "Mike Halperin"],
  "horenstein":    ["Horenstein"],
  "brian-jolson":  ["Brian Jolson", "B. Jolson"],
  "tracy-jolson":  ["Tracy Jolson"],
  "...":           ["..."]
}
```

The `aliases.json` is built once during Phase 0.2 by inspecting the distinct names
in `player_data.csv` and mapping any name that doesn't already match a roster
display_name to a canonical slug.

### 6.3 Historical games

`scripts/import-historical.ts`:
1. Read `data/game_data.csv`.
2. Upsert seasons for years 2018, 2019, 2021, 2022, 2023, 2024, 2025 (and 2026
   as the current season if not already present).
3. For each row, upsert a game keyed by `(season_id, game_number, played_on)`
   with `status='historical'`. Populate opponent/runs/result if present in the CSV
   (only filled for 2022–2025).
4. Derive `result` from `uhj_runs` vs `opp_runs` if NULL but runs are present.

### 6.4 Historical stats

Continue in same script:
1. Read `data/player_data.csv`.
2. For every row, look up the game by `(year, game_number)` and the player by
   alias.
3. **Fail loud**: if any name doesn't resolve, write the offending row to
   `data/unmatched.csv` and exit non-zero with a count.
4. Upsert into `batting_lines` keyed by `(game_id, player_id)` with `source='xlsx'`.
5. Coerce blanks → 0; derive `singles = h - doubles - triples - hr` if `singles` is
   blank but `h` is present.
6. Validate row-by-row: `h = singles + doubles + triples + hr` and `ab >= h + k`.
   On violation, log row + skip. Print summary at end.

### 6.5 Validation against per-season tabs

`scripts/validate-historical.ts`:
1. Read each season tab (2018–2025) from the xlsx (re-export to per-season CSVs in
   step 6.1).
2. For each (player, season) row in the spreadsheet, compare to
   `v_player_season_stats` for that player+season.
3. Print discrepancies with exact deltas. Ship even with small rounding diffs;
   block on large discrepancies.

### 6.6 Acceptance

- `select count(*) from batting_lines` ≈ 823 (some rows may legitimately collapse
  if Halperin and Mike Halperin merge).
- `select count(*) from games where status='historical' and result is not null` = 51
  (W/L for 2022–2025).
- Validation script reports zero "large" discrepancies.

Run order:
```bash
npm run db:migrate
npm run seed:roster      # players + aliases
npm run import:historical # seasons + games + batting_lines
npm run validate:historical
```

---

## 7. OCR pipeline

### 7.1 Goal

Given a phone photo of a hand-filled paper softball scorebook page, produce a draft
batting-lines table for review. Admin reviews, edits, commits.

### 7.2 Flow

1. **Upload** — admin drag/drops or shoots a photo on `/admin/games/[gameId]/scoresheet`.
   - Client-side resize to max 2048px long edge (use a `<canvas>`).
   - Upload directly to Supabase Storage via signed URL.
     `storageKey = scoresheets/{gameId}/{uuid}.jpg`
   - On success, server action records a `scoresheet_uploads` row with `status='pending'`.
2. **Parse** — server action calls Anthropic `messages.create`:
   - Model: `claude-sonnet-4-5` (or whatever the latest stable Sonnet is at build time).
   - System prompt (cached): structured instructions + the active roster (~70 names)
     with gender. `cache_control: { type: 'ephemeral' }` on the system block to
     amortize across calls.
   - User content: the image + a short instruction.
   - Tools: a single tool `submit_scoresheet` whose JSON schema mirrors a Zod schema:

```ts
const ScoresheetSchema = z.object({
  game_meta: z.object({
    date_iso: z.string().optional(),
    opponent: z.string().optional(),
    uhj_runs: z.number().int().nonnegative().optional(),
    opp_runs: z.number().int().nonnegative().optional(),
  }),
  players: z.array(z.object({
    name_as_written: z.string(),
    matched_player_slug: z.string().nullable(), // null = no roster match
    ab: z.number().int().nonnegative(),
    r:  z.number().int().nonnegative(),
    h:  z.number().int().nonnegative(),
    singles: z.number().int().nonnegative(),
    doubles: z.number().int().nonnegative(),
    triples: z.number().int().nonnegative(),
    hr: z.number().int().nonnegative(),
    rbi: z.number().int().nonnegative(),
    bb: z.number().int().nonnegative(),
    k:  z.number().int().nonnegative(),
    sac: z.number().int().nonnegative(),
    confidence: z.number().min(0).max(1),
  })),
  inning_runs: z.array(z.number().int().nonnegative()).optional(),
  page_quality: z.enum(['good','marginal','poor']),
  parser_notes: z.string().optional(),
});
```

   - `tool_choice: { type: 'tool', name: 'submit_scoresheet' }` to force structured output.
   - Validate with Zod. On failure: store raw response in `error_message`,
     status `failed`, surface to admin.
3. **Sanity-check** in code, before storing: per row, enforce
   `h == singles+doubles+triples+hr` and `ab >= h+k`. Rows that fail are flagged
   `needs_review: true` in the parsed JSON (kept, not dropped).
4. **Store** parsed JSON on the upload row, status `parsed`.
5. **Review UI** at `/admin/games/[gameId]/scoresheet/[uploadId]`:
   - Left half: the image, zoomable.
   - Right half: a table form pre-filled from parsed JSON. Cells with
     `confidence < 0.7` highlighted yellow. Rows that failed the sanity check
     highlighted red. Unmatched names show a `<select>` of roster players + an
     "Add new player" button.
   - Game meta editable above the table.
   - **Commit** button:
     - Validates entire form via the same Zod schema.
     - Upserts `batting_lines source='ocr'` for each player row.
     - Updates `games` opponent/runs/result.
     - Marks upload `status='committed'` with `committed_at`.
   - **Reject** button → status `rejected`. Image stays in storage.

### 7.3 Cost & limits

Anthropic image input ~1500 input tokens/image at 1MP. ~20 sheets/season ≈ 50k input
tokens/year. With prompt caching on the roster block, marginal cost is well under
$1/season. Log token usage on every call to `audit_log.details`.

### 7.4 Phase 0 kill-gate

Before building this UI, run `spikes/ocr/run.ts` against 3 real photos. Hand-grade
cells. If correct-cell rate < 70%, **drop OCR from v1**: `/admin/games/[gameId]/scoresheet`
becomes a 404 and the manual entry form (Section 9.4.2) is the only path.
Photos pending — Alon will provide later. OCR development is gated on photos arriving.

---

## 8. Auth design

### 8.1 Cookies (`src/lib/auth/session.ts`)

```ts
import { getIronSession } from 'iron-session';

export type PlayerSession = { playerId: string; expiresAt: number };
export type AdminSession  = { admin: true; expiresAt: number };

export const PLAYER_COOKIE = 'uhj_player';
export const ADMIN_COOKIE  = 'uhj_admin';

const playerOpts = {
  password: process.env.PLAYER_SESSION_SECRET!,    // 32+ chars
  cookieName: PLAYER_COOKIE,
  cookieOptions: { secure: true, sameSite: 'lax', maxAge: 60*60*24*90 },
};

const adminOpts = {
  password: process.env.ADMIN_SESSION_SECRET!,
  cookieName: ADMIN_COOKIE,
  cookieOptions: { secure: true, sameSite: 'lax', maxAge: 60*60*24*30 },
};
```

### 8.2 Login flows

**Team login** (`/login`):
- Form: `<select>` of active roster players + password input ("team passphrase").
- Server action: compare password to `TEAM_PASSPHRASE` env (constant-time compare).
- Sets `uhj_player` cookie with the chosen player's id.
- Redirect to `?next=` or `/`.

**Admin login** (`/admin/login`):
- Form: single password input.
- Compare against `ADMIN_PASSWORD_HASH` (bcrypt, generated once with `node scripts/hash-password.ts`).
- Sets `uhj_admin` cookie.
- Rate limit: 5 attempts/minute per IP via in-memory `LRUCache`.

**Logout**: `/logout` clears both cookies → home.

### 8.3 Authorization helpers

```ts
// src/lib/auth/guards.ts
export async function getPlayer(): Promise<PlayerSession | null>;
export async function getAdmin():  Promise<AdminSession  | null>;
export async function requirePlayer(): Promise<PlayerSession>;  // throws redirect to /login
export async function requireAdmin():  Promise<AdminSession>;   // throws redirect to /admin/login
```

### 8.4 Middleware (`src/middleware.ts`)

- `/admin/*` (except `/admin/login`) → require admin cookie or redirect.
- All other paths are public; server actions inside RSVP pages call `requirePlayer()`.

---

## 9. Pages, components, server actions

All paths are App Router. Server components by default; client components only where
interaction demands.

### 9.1 Public read-only

| Path | Purpose | Components |
|---|---|---|
| `/` | Landing: team name, current-season W-L record, next 1–2 games card with RSVP link | `<RecordCard>`, `<NextGameCard>` |
| `/schedule` | Current-season schedule (defaults), season picker → historical seasons | `<SeasonPicker>`, `<GamesTable>`, `<RsvpControl>` (gated to logged-in) |
| `/schedule/[gameId]` | Single game: meta, batting lines if final, RSVP roster grouped by status × gender | `<GameHeader>`, `<BattingTable>`, `<RsvpRoster>` |
| `/stats` | Current season aggregate batting (sortable) + per-game grid toggle | `<StatsTable>`, `<ViewToggle>` |
| `/stats/career` | Career stats aggregated 2018→present | `<StatsTable>` |
| `/history` | Per-season summary cards (2018–2025) with W-L if known | `<SeasonCard[]>` |
| `/history/[year]` | Schedule + stats for a historical season | `<GamesTable>`, `<StatsTable>` |
| `/players/[slug]` | Career splits + per-season + recent games | `<PlayerHeader>`, `<StatsTable>`, `<GameList>` |
| `/roster` | Active + alumni players, gender badge | `<RosterGrid>` |
| `/login` / `/admin/login` / `/logout` | Auth | (client form) |

### 9.2 Admin (gated by middleware)

| Path | Purpose |
|---|---|
| `/admin` | Dashboard: counts, recent uploads, "Sync calendar", "Add game", "Enter stats" |
| `/admin/seasons` | List seasons; mark current; set iCal URL |
| `/admin/seasons/[id]` | Edit season; **Sync iCal** button |
| `/admin/games` | List all games; filter by season |
| `/admin/games/new` | Create one-off game (rare; usually from iCal sync) |
| `/admin/games/[gameId]` | Edit game meta (opponent, runs, result, status, notes) |
| `/admin/games/[gameId]/stats` | **Manual stat entry form** for the game (table-style) |
| `/admin/games/[gameId]/scoresheet` | Upload + parse (only present if OCR survives Phase 0.1) |
| `/admin/games/[gameId]/scoresheet/[uploadId]` | Review parsed scoresheet, edit, commit |
| `/admin/players` | Roster CRUD: add player, edit gender/active, manage aliases |
| `/admin/history/games` | Backfill helper: list historical games with missing opponent/result, edit inline |

### 9.3 Server actions (in `src/app/_actions/`)

```ts
// auth.ts
loginPlayer(formData)
loginAdmin(formData)
logout()

// rsvp.ts
setRsvp(gameId, status: 'yes'|'no'|'maybe')   // requirePlayer

// admin.ts
createGame(...)
updateGame(...)
markGameFinal(gameId, uhjRuns, oppRuns, notes?)
saveBattingLines(gameId, lines: BattingLine[]) // upsert all rows for a game
upsertPlayer(...)
addAlias(playerId, alias)
syncSeasonIcal(seasonId)
parseScoresheet(uploadId)
commitScoresheet(uploadId, finalLines)
```

### 9.4 Components (in `src/components/`)

- `<StatsTable players={rows} columns={...} sortable />` — single source for all
  stats display (current season, historical season, career, player page).
- `<GamesTable games={...} showResult />` — schedule/results table; reused everywhere.
- `<BattingForm initial={...} onSave={action}/>` — table form for manual stat entry
  AND scoresheet review. **Same component**.
- `<RsvpControl gameId playerId initial /> ` — Yes/No/Maybe segmented, optimistic.
- `<RsvpRoster rsvps={...} />` — list grouped by status, split by M/F.
- `<SeasonPicker seasons selected />` — dropdown + URL state.

### 9.5 Styling rules

- Tailwind. No CSS modules.
- Mobile-first. Min tap target 56px. 16px input font (no iOS zoom).
- Sticky table headers. `position: sticky; top: 0;`.
- Color palette: a single `tailwind.config.js` extension with team colors (TBD).

---

## 10. Phased rollout

Day estimates assume one solo developer working in focused sessions.

### Phase 0 — De-risk (1–2 days)

**0.1 OCR spike** (gated: photos required from Alon)
- `spikes/ocr/run.ts`: takes a JPG path, returns parsed JSON.
- Run on 3 real photos, hand-grade cell accuracy.
- Decide ≥90% / 70-90% / <70%.
- **If photos aren't yet available**, skip Phase 0.1 and build everything else.
  Slot OCR as the last Phase 4 task.

**0.2 CSV inspect spike**
- `spikes/csv/inspect.ts`: reads `data/player_data.csv` after running
  `scripts/xlsx-to-csv.py`. Outputs distinct names, year span, gender(s) seen.
- Hand-build `data/aliases.json` mapping all non-trivial variants to roster slugs.
- Done when distinct-name count = roster size + known aliases.

### Phase 1 — Schema + import (2–3 days)

- Drizzle schema, `0000_init.sql`, `0001_views.sql`.
- `scripts/xlsx-to-csv.py` produces the three CSVs.
- `scripts/seed-roster.ts` + `scripts/import-historical.ts` + `scripts/validate-historical.ts`.
- Acceptance: `npm run db:reset && npm run import:historical && npm run validate:historical`
  exits 0 with no large discrepancies.

### Phase 2 — Public read-only (2 days)

- Build all `/`, `/schedule`, `/stats`, `/history`, `/players`, `/roster` pages
  against historical data only (current season has no games yet).
- Deploy to Vercel preview at end of phase.
- Smoke test on a phone.

### Phase 3 — Auth + RSVP (1–2 days)

- iron-session setup, `/login`, `/admin/login`, `/logout`.
- Middleware.
- `<RsvpControl>` + `setRsvp` action.
- `<RsvpRoster>` on game detail page.
- Acceptance: Alon and one teammate (test from a different device) can log in,
  RSVP, and see each other's responses within 10 seconds.

### Phase 4 — Admin (3–4 days)

In this order:
1. **Schedule admin** (`/admin/games`, `/admin/games/new`, `/admin/games/[id]`)
2. **iCal sync** (`/admin/seasons/[id]` + `/api/ical/sync`). Test against Alon's
   real Google Calendar share link.
3. **Manual stat entry** (`/admin/games/[id]/stats`). The non-OCR happy path must
   work end-to-end before OCR.
4. **Roster admin** (`/admin/players`)
5. **Historical backfill** (`/admin/history/games`) — small; just edit-in-place.
6. **OCR pipeline** (Phase 0.1 outcome dependent):
   a. Supabase Storage bucket `scoresheets`, signed-URL upload.
   b. `parseScoresheet` server action (Anthropic SDK + Zod + sanity check).
   c. Review UI.
   d. Commit flow.

### Phase 5 — Cutover (1 day)

- Vercel project: link repo, add env vars, deploy.
- Run migrations + import on production DB once.
- Smoke test on a real phone for every public route.
- `noindex` on `/admin/*` and `/login`.
- README rewrite: how to run locally, how to add an alias, how to re-import.
- Share URL + passphrase to team Slack.

**Total**: ~10–13 working days.

---

## 11. Environment variables

```
# DB
DATABASE_URL=postgresql://...      # Supabase pooled connection string
DIRECT_URL=postgresql://...        # Direct (used by drizzle-kit migrate)

# Storage
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...      # server-side only
SUPABASE_STORAGE_BUCKET=scoresheets

# OCR
ANTHROPIC_API_KEY=sk-ant-...
OCR_MODEL=claude-sonnet-4-5

# Auth
TEAM_PASSPHRASE=handies            # plaintext compare; rotate by changing env + redeploying
ADMIN_PASSWORD_HASH=$2b$10$...     # generated by scripts/hash-password.ts
PLAYER_SESSION_SECRET=...          # 32+ chars, openssl rand -base64 32
ADMIN_SESSION_SECRET=...           # 32+ chars, separate from player

# App
NEXT_PUBLIC_SITE_URL=https://uhj.vercel.app
```

`.env.local` for dev, Vercel project env for prod. Never commit `.env*`.

---

## 12. Success criteria for v1

A teammate can, on their phone, in under 30 seconds:
1. Open the URL.
2. See the next game and the team's record.
3. Tap into the game, log in (passphrase + name), RSVP Yes.
4. Browse to `/stats`, see current-season batting averages.
5. Browse to `/history/2024`, see that season's W/L and individual stats.

Alon can, on a laptop, in under 5 minutes:
1. Sync the season's schedule from Google Calendar.
2. Open a finished game, click Enter Stats, type 12 batting lines, save.
3. (If OCR survived) Upload a photo, review the parsed grid, commit.

---

## 13. v2 backlog (do not touch in v1)

1. RSVP reminder emails (Vercel Cron + Resend free tier).
2. Per-cell confidence overlay improvements; OCR retraining with examples library.
3. PWA manifest + push notifications.
4. Lineup helper enforcing coed gender rules from confirmed Yes RSVPs.
5. CSV export of any stats view.
6. Custom domain + branding pass.
7. MVP voting per game (one vote per player cookie).
8. Photo gallery per game (Supabase Storage already provisioned).
9. Magic-link auth if impersonation becomes a real problem.
10. Pitching/fielding stats columns (schema-additive, low risk).
11. Public OG images for shared game URLs.

Strict rule: nothing here lands in v1.

---

## 14. Concrete first-steps checklist (start here)

```bash
cd "/Users/alon/personal code/softball-team-stats"
git checkout -b v2

# Phase 0
mkdir -p spikes/ocr spikes/csv data
python3 scripts/xlsx-to-csv.py    # produces data/player_list.csv etc.
node spikes/csv/inspect.ts        # builds data/aliases.json by hand-curation

# Phase 1
# Wipe src/, scripts/ (keep CSVs in data/), regenerate package.json deps.
# Write Drizzle schema, run db:generate + db:migrate.
# Write seed-roster + import-historical + validate-historical.

# ... follow phase plan.
```

Provided:
- **iCal feed URL** (TeamSideline, not Google Calendar):
  `https://www.teamsideline.com/Common/Calendar_ical.aspx?d=vseBS5X6j9rHlQ%2bsuRfgXWjT98vRaJGThzuqRoy47gUsEd%2fCYq1cL6tVdIfq1zdA`
  Store in `seasons.ical_url` for the current season at seed time.
- **Team passphrase**: `handies` — set as `TEAM_PASSPHRASE` env var.

Still needed before later phases:
- Admin password (we'll bcrypt-hash it).
- 3 photos of filled scoresheet pages (whenever ready — gates only OCR build).

Note on iCal source: TeamSideline (not Google Calendar). `node-ical` parses it the
same way. The `SUMMARY` field format from TeamSideline is typically
`"<League> - <Home> vs <Away>"` — adjust the opponent-extraction heuristic in
`syncSeasonIcal` accordingly: split on " vs ", pick the team that isn't UHJ,
strip league prefix.

---

End of plan. This document is canonical; if you change a decision, edit this file
and the implementing code in the same PR.
