# CLAUDE.md

Guidance for Claude Code when working on the UHJ softball repo.

## Canonical spec

`BUILD_PLAN.md` is the source of truth for product decisions. Re-read it before any
substantial change.

## Stack at a glance

- Next.js 15 (App Router, React 19, TypeScript)
- Drizzle ORM + Postgres (Supabase). Aggregates live in SQL views (`migrations/9001_views.sql`).
- iron-session cookies: `uhj_player` (90d) and `uhj_admin` (30d). No accounts; team passphrase + roster pick.
- Anthropic Claude Sonnet for scoresheet OCR, with prompt caching on the roster block.
- Supabase Storage for scoresheet photos.
- TeamSideline iCal feed for current-season schedule, parsed via `node-ical`.

## Commands

```bash
npm run dev                  # local server (requires .env.local)
npm run type-check
npm run db:generate          # regen migrations from src/lib/db/schema.ts
npm run db:migrate           # apply Drizzle migrations + 9xxx_*.sql views
npm run seed:roster
npm run import:historical    # idempotent
npm run validate:historical
npm run hash:password -- 'pwd'
```

## Code map

- `src/app/` — App Router pages. Public + `/admin/*`. Server actions live in `src/app/_actions/`.
- `src/components/` — React components.
- `src/lib/db/` — Drizzle schema, client, migrate runner.
- `src/lib/auth/` — iron-session + guards (`getPlayer`, `requirePlayer`, `getAdmin`, `requireAdmin`).
- `src/lib/ocr.ts` — Anthropic vision tool-use wrapper + Zod schema.
- `src/lib/storage.ts` — Supabase Storage helpers.
- `src/lib/ical*.ts` — iCal parse + sync (with `unstable_cache` 10-min TTL).
- `migrations/` — `0000_init.sql` (Drizzle) + `9001_views.sql` (manual views).
- `scripts/` — xlsx → CSVs, seed roster, import historical, validate, password hash.
- `data/` — checked-in CSVs (`player_list.csv`, `game_data.csv`, `player_data.csv`, `season_<year>.csv`) and `aliases.json`.

## House rules

- Aggregates: `v_player_season_stats`, `v_player_career_stats`, `v_team_season_record`. Don't
  duplicate the formulas in app code.
- Importer is idempotent and fails loud on unmatched names → writes `data/unmatched.csv`.
- New player aliases: edit `data/aliases.json` and re-run `npm run seed:roster`.
- All times stored UTC; render `America/New_York` via `src/lib/format.ts`.
- Don't reintroduce the old User / role tables — auth is just two cookies.
