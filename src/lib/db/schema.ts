import { pgTable, serial, varchar, text, timestamp, integer, decimal, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('user_role', ['admin', 'manager', 'coach', 'player']);
export const gameStatusEnum = pgEnum('game_status', ['scheduled', 'in_progress', 'completed', 'cancelled', 'postponed']);
export const homeAwayEnum = pgEnum('home_away', ['home', 'away']);

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  role: userRoleEnum('role').notNull().default('player'),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Seasons table
export const seasons = pgTable('seasons', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  year: integer('year').notNull(),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Players table
export const players = pgTable('players', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  jerseyNumber: integer('jersey_number'),
  primaryPosition: varchar('primary_position', { length: 50 }),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Games table
export const games = pgTable('games', {
  id: serial('id').primaryKey(),
  seasonId: integer('season_id').references(() => seasons.id).notNull(),
  gameDate: timestamp('game_date').notNull(),
  opponent: varchar('opponent', { length: 100 }).notNull(),
  homeAway: homeAwayEnum('home_away').notNull(),
  location: varchar('location', { length: 200 }),
  ourScore: integer('our_score'),
  theirScore: integer('their_score'),
  status: gameStatusEnum('status').default('scheduled').notNull(),
  calendarEventId: varchar('calendar_event_id', { length: 255 }),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Player Game Stats table
export const playerGameStats = pgTable('player_game_stats', {
  id: serial('id').primaryKey(),
  playerId: integer('player_id').references(() => players.id).notNull(),
  gameId: integer('game_id').references(() => games.id).notNull(),
  battingOrder: integer('batting_order'),
  atBats: integer('at_bats').default(0).notNull(),
  hits: integer('hits').default(0).notNull(),
  runs: integer('runs').default(0).notNull(),
  rbis: integer('rbis').default(0).notNull(),
  walks: integer('walks').default(0).notNull(),
  strikeouts: integer('strikeouts').default(0).notNull(),
  singles: integer('singles').default(0).notNull(),
  doubles: integer('doubles').default(0).notNull(),
  triples: integer('triples').default(0).notNull(),
  homeRuns: integer('home_runs').default(0).notNull(),
  stolenBases: integer('stolen_bases').default(0).notNull(),
  fieldingPosition: varchar('fielding_position', { length: 50 }),
  errors: integer('errors').default(0).notNull(),
  assists: integer('assists').default(0).notNull(),
  putouts: integer('putouts').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Scoring book images table (for future OCR feature)
export const scoringBookImages = pgTable('scoring_book_images', {
  id: serial('id').primaryKey(),
  gameId: integer('game_id').references(() => games.id).notNull(),
  imageUrl: varchar('image_url', { length: 500 }).notNull(),
  isProcessed: boolean('is_processed').default(false).notNull(),
  ocrData: text('ocr_data'),
  uploadedBy: integer('uploaded_by').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  player: one(players, { fields: [users.id], references: [players.userId] }),
  uploadedImages: many(scoringBookImages),
}));

export const seasonsRelations = relations(seasons, ({ many }) => ({
  games: many(games),
}));

export const playersRelations = relations(players, ({ one, many }) => ({
  user: one(users, { fields: [players.userId], references: [users.id] }),
  gameStats: many(playerGameStats),
}));

export const gamesRelations = relations(games, ({ one, many }) => ({
  season: one(seasons, { fields: [games.seasonId], references: [seasons.id] }),
  playerStats: many(playerGameStats),
  scoringBookImages: many(scoringBookImages),
}));

export const playerGameStatsRelations = relations(playerGameStats, ({ one }) => ({
  player: one(players, { fields: [playerGameStats.playerId], references: [players.id] }),
  game: one(games, { fields: [playerGameStats.gameId], references: [games.id] }),
}));

export const scoringBookImagesRelations = relations(scoringBookImages, ({ one }) => ({
  game: one(games, { fields: [scoringBookImages.gameId], references: [games.id] }),
  uploader: one(users, { fields: [scoringBookImages.uploadedBy], references: [users.id] }),
}));