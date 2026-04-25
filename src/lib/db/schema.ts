import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  date,
  jsonb,
  uniqueIndex,
  index,
  check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const genderEnum = pgEnum('gender', ['M', 'F']);
export const gameStatusEnum = pgEnum('game_status', ['scheduled', 'final', 'historical', 'cancelled']);
export const gameResultEnum = pgEnum('game_result', ['W', 'L', 'T']);
export const rsvpStatusEnum = pgEnum('rsvp_status', ['yes', 'no', 'maybe']);
export const statSourceEnum = pgEnum('stat_source', ['xlsx', 'manual', 'ocr']);
export const uploadStatusEnum = pgEnum('upload_status', ['pending', 'parsed', 'committed', 'rejected', 'failed']);

export const players = pgTable('players', {
  id: uuid('id').primaryKey().defaultRandom(),
  displayName: text('display_name').notNull(),
  slug: text('slug').notNull().unique(),
  gender: genderEnum('gender').notNull(),
  active: boolean('active').notNull().default(true),
  jerseyNumber: integer('jersey_number'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const playerAliases = pgTable('player_aliases', {
  id: uuid('id').primaryKey().defaultRandom(),
  playerId: uuid('player_id')
    .notNull()
    .references(() => players.id, { onDelete: 'cascade' }),
  alias: text('alias').notNull().unique(),
});

export const seasons = pgTable(
  'seasons',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    year: integer('year').notNull().unique(),
    label: text('label').notNull(),
    icalUrl: text('ical_url'),
    isCurrent: boolean('is_current').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    oneCurrent: uniqueIndex('seasons_one_current').on(t.isCurrent).where(sql`${t.isCurrent} = true`),
  })
);

export const games = pgTable(
  'games',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    seasonId: uuid('season_id')
      .notNull()
      .references(() => seasons.id),
    gameNumber: integer('game_number'),
    playedOn: date('played_on').notNull(),
    startTime: timestamp('start_time', { withTimezone: true }),
    location: text('location'),
    opponent: text('opponent'),
    uhjRuns: integer('uhj_runs'),
    oppRuns: integer('opp_runs'),
    result: gameResultEnum('result'),
    status: gameStatusEnum('status').notNull().default('scheduled'),
    notes: text('notes'),
    icalUid: text('ical_uid').unique(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    seasonIdx: index('games_season').on(t.seasonId, t.playedOn),
  })
);

export const battingLines = pgTable(
  'batting_lines',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    gameId: uuid('game_id')
      .notNull()
      .references(() => games.id, { onDelete: 'cascade' }),
    playerId: uuid('player_id')
      .notNull()
      .references(() => players.id),
    ab: integer('ab').notNull().default(0),
    r: integer('r').notNull().default(0),
    h: integer('h').notNull().default(0),
    singles: integer('singles').notNull().default(0),
    doubles: integer('doubles').notNull().default(0),
    triples: integer('triples').notNull().default(0),
    hr: integer('hr').notNull().default(0),
    rbi: integer('rbi').notNull().default(0),
    bb: integer('bb').notNull().default(0),
    k: integer('k').notNull().default(0),
    sac: integer('sac').notNull().default(0),
    source: statSourceEnum('source').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    gamePlayerUq: uniqueIndex('batting_lines_game_player').on(t.gameId, t.playerId),
    hitsCheck: check('batting_lines_h_check', sql`${t.h} = ${t.singles} + ${t.doubles} + ${t.triples} + ${t.hr}`),
    abCheck: check('batting_lines_ab_check', sql`${t.ab} >= ${t.h} + ${t.k}`),
  })
);

export const rsvps = pgTable(
  'rsvps',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    gameId: uuid('game_id')
      .notNull()
      .references(() => games.id, { onDelete: 'cascade' }),
    playerId: uuid('player_id')
      .notNull()
      .references(() => players.id),
    status: rsvpStatusEnum('status').notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    gamePlayerUq: uniqueIndex('rsvps_game_player').on(t.gameId, t.playerId),
  })
);

export const scoresheetUploads = pgTable('scoresheet_uploads', {
  id: uuid('id').primaryKey().defaultRandom(),
  gameId: uuid('game_id').references(() => games.id, { onDelete: 'set null' }),
  storageKey: text('storage_key').notNull(),
  parsedJson: jsonb('parsed_json'),
  status: uploadStatusEnum('status').notNull().default('pending'),
  errorMessage: text('error_message'),
  uploadedAt: timestamp('uploaded_at', { withTimezone: true }).notNull().defaultNow(),
  committedAt: timestamp('committed_at', { withTimezone: true }),
});

export const auditLog = pgTable('audit_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  actor: text('actor').notNull(),
  action: text('action').notNull(),
  target: text('target'),
  details: jsonb('details'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type Player = typeof players.$inferSelect;
export type Season = typeof seasons.$inferSelect;
export type Game = typeof games.$inferSelect;
export type BattingLine = typeof battingLines.$inferSelect;
export type Rsvp = typeof rsvps.$inferSelect;
export type ScoresheetUpload = typeof scoresheetUploads.$inferSelect;
