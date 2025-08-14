-- Simple Underhand Jobs Database Setup
-- Copy and paste this into Railway's database console

-- Clean up any existing data (if needed)
DROP TABLE IF EXISTS player_game_stats CASCADE;
DROP TABLE IF EXISTS scoring_book_images CASCADE;
DROP TABLE IF EXISTS games CASCADE;
DROP TABLE IF EXISTS players CASCADE;
DROP TABLE IF EXISTS seasons CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS game_status CASCADE;
DROP TYPE IF EXISTS home_away CASCADE;

-- Create types
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'coach', 'player');
CREATE TYPE game_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled');
CREATE TYPE home_away AS ENUM ('home', 'away');

-- Create tables
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  role user_role NOT NULL DEFAULT 'player',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE seasons (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  year INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE players (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  jersey_number INTEGER,
  primary_position VARCHAR(10),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE games (
  id SERIAL PRIMARY KEY,
  season_id INTEGER NOT NULL REFERENCES seasons(id),
  game_date DATE NOT NULL,
  opponent VARCHAR(100) NOT NULL,
  home_away home_away NOT NULL,
  our_score INTEGER,
  their_score INTEGER,
  location VARCHAR(200),
  status game_status NOT NULL DEFAULT 'completed',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE player_game_stats (
  id SERIAL PRIMARY KEY,
  player_id INTEGER NOT NULL REFERENCES players(id),
  game_id INTEGER NOT NULL REFERENCES games(id),
  batting_order INTEGER,
  at_bats INTEGER NOT NULL DEFAULT 0,
  hits INTEGER NOT NULL DEFAULT 0,
  runs INTEGER NOT NULL DEFAULT 0,
  rbis INTEGER NOT NULL DEFAULT 0,
  walks INTEGER NOT NULL DEFAULT 0,
  strikeouts INTEGER NOT NULL DEFAULT 0,
  singles INTEGER NOT NULL DEFAULT 0,
  doubles INTEGER NOT NULL DEFAULT 0,
  triples INTEGER NOT NULL DEFAULT 0,
  home_runs INTEGER NOT NULL DEFAULT 0,
  stolen_bases INTEGER NOT NULL DEFAULT 0,
  errors INTEGER NOT NULL DEFAULT 0,
  assists INTEGER NOT NULL DEFAULT 0,
  putouts INTEGER NOT NULL DEFAULT 0,
  fielding_position VARCHAR(10),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(player_id, game_id)
);

CREATE TABLE scoring_book_images (
  id SERIAL PRIMARY KEY,
  game_id INTEGER NOT NULL REFERENCES games(id),
  image_url VARCHAR(500) NOT NULL,
  uploaded_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Insert admin and manager users
INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES
  ('admin@teamstats.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin', 'User', 'admin'),
  ('manager@teamstats.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Team', 'Manager', 'manager');

-- Create 2025 season
INSERT INTO seasons (name, year, start_date, end_date, is_active) VALUES
  ('2025 Spring/Summer Season', 2025, '2025-04-01', '2025-08-31', true);

-- Insert Underhand Jobs players
INSERT INTO players (first_name, last_name, jersey_number) VALUES
  ('Chloe', 'Amarilla', 1),
  ('Alyssa', 'Andrews', 2),
  ('Lara', 'Horwitz', 3),
  ('Miranda', 'Kahn', 4),
  ('Rebecca', 'Klapper', 5),
  ('Amy', 'Koenig', 6),
  ('Dahlia', 'Krueger', 7),
  ('Zoe', 'Lichtenbaum', 8),
  ('Cynthia', 'Liu', 9),
  ('Rachel', 'Maleh', 10),
  ('Leah', 'Mendelson', 11),
  ('Shannon', 'Murphy', 12),
  ('Lindsay', 'Napoli', 13),
  ('Cady', 'Peckman', 14),
  ('Lisa', 'Piacentini', 15),
  ('Donna', 'Raftery', 16),
  ('Kira', 'Salko', 17),
  ('Sabrina', 'Schnurman', 18),
  ('Sarah', 'Shandera', 19),
  ('Julie', 'Stein', 20),
  ('Lynn', 'Urdaneta', 21),
  ('Sarah', 'Weinstein', 22),
  ('Cheryl', 'Wieselman', 23),
  ('Joan', 'Wurzel', 24);

-- Insert games
INSERT INTO games (season_id, game_date, opponent, home_away, our_score, their_score, location, status) VALUES
  (1, '2025-04-22', 'Game 1 Opponent', 'home', null, null, null, 'completed'),
  (1, '2025-04-29', 'Game 2 Opponent', 'home', null, null, null, 'completed'),
  (1, '2025-05-12', 'Game 3 Opponent', 'home', null, null, null, 'completed'),
  (1, '2025-05-21', 'Game 4 Opponent', 'home', 16, 6, null, 'completed'),
  (1, '2025-06-04', 'Game 5 Opponent', 'home', 15, 1, null, 'completed'),
  (1, '2025-06-11', 'Game 6 Opponent', 'home', null, null, null, 'completed'),
  (1, '2025-06-27', 'Game 7 Opponent', 'home', null, null, null, 'completed'),
  (1, '2025-07-16', 'Game 8 Opponent', 'home', null, null, null, 'completed'),
  (1, '2025-08-07', 'Game 9 Opponent', 'home', null, null, null, 'completed');

-- Done! You can now log in with:
-- Manager: manager@teamstats.com / password
-- Admin: admin@teamstats.com / password