-- Underhand Jobs Team Data Import
-- Generated from: 2025 STATS Underhand Jobs Spring_Summer.xlsx

-- Step 1: Create database tables
CREATE TYPE IF NOT EXISTS user_role AS ENUM ('admin', 'manager', 'coach', 'player');
CREATE TYPE IF NOT EXISTS game_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled');
CREATE TYPE IF NOT EXISTS home_away AS ENUM ('home', 'away');

-- Users table
CREATE TABLE IF NOT EXISTS users (
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

-- Seasons table
CREATE TABLE IF NOT EXISTS seasons (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        year INTEGER NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

-- Players table
CREATE TABLE IF NOT EXISTS players (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        jersey_number INTEGER,
        primary_position VARCHAR(10),
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

-- Games table
CREATE TABLE IF NOT EXISTS games (
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

-- Player game stats table
CREATE TABLE IF NOT EXISTS player_game_stats (
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

-- Scoring book images table
CREATE TABLE IF NOT EXISTS scoring_book_images (
        id SERIAL PRIMARY KEY,
        game_id INTEGER NOT NULL REFERENCES games(id),
        image_url VARCHAR(500) NOT NULL,
        uploaded_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

-- Step 2: Insert admin and manager users
INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES
        ('admin@teamstats.com', '$2b$10$rH8K9zYzY5ZnYfJlQjK8.e8lLJV2vWGW6K5N5sK8K8K8K8K8K8K8Km', 'Admin', 'User', 'admin'),
        ('manager@teamstats.com', '$2b$10$rH8K9zYzY5ZnYfJlQjK8.e8lLJV2vWGW6K5N5sK8K8K8K8K8K8K8Km', 'Team', 'Manager', 'manager')
      ON CONFLICT (email) DO NOTHING;

-- Step 3: Create 2025 season
INSERT INTO seasons (name, year, start_date, end_date, is_active) VALUES
        ('2025 Spring/Summer Season', 2025, '2025-04-01', '2025-08-31', true)
      ON CONFLICT DO NOTHING;

-- Step 4: Insert players
INSERT INTO players (first_name, last_name, jersey_number, primary_position) VALUES
    ('Chloe', 'Amarilla', 1, null),
    ('Alyssa', 'Andrews', 2, null),
    ('Lara', 'Horwitz', 3, null),
    ('Miranda', 'Kahn', 4, null),
    ('Rebecca', 'Klapper', 5, null),
    ('Molly', 'Socha', 6, null),
    ('Hannah', 'Tamminen', 7, null),
    ('Sam', 'Brill', 8, null),
    ('Brian', 'Epstein', 9, null),
    ('Matt', 'Ewen', 10, null),
    ('Ethan', 'Fedida', 11, null),
    ('Josh', 'Gropper', 12, null),
    ('Alon', 'Krifcher', 13, null),
    ('Wyatt', 'Lewis', 14, null),
    ('Steven', 'Loesgen', 15, null),
    ('Garrett', 'Lubniewski', 16, null),
    ('Alex', 'Math', 17, null),
    ('John', 'McCarthy', 18, null),
    ('John', 'Morrison', 19, null),
    ('Dan', 'Nelson', 20, null),
    ('CJ', 'Novogradac', 21, null),
    ('Crosby', 'Steiner', 22, null),
    ('Loren', 'Taylor-Raymond', 23, null),
    ('Mike', 'Tersigni', 24, null),
    ('Cardona', 'Cardona', 25, null),
    ('SEASON:', 'SEASON:', 26, null),
    ('Game', '1:', 27, null),
    ('Game', '2:', 28, null),
    ('Game', '3:', 29, null),
    ('Game', '4:', 30, null),
    ('Game', '5:', 31, null),
    ('Game', '6:', 32, null),
    ('Game', '7:', 33, null),
    ('Game', '8:', 34, null),
    ('Game', '9:', 35, null),
    ('Game', '10:', 36, null),
    ('Game', '11:', 37, null),
    ('Game', '12:', 38, null),
    ('Playoffs', 'Rd 1:', 39, null),
    ('Championship', 'Game 1:', 40, null),
    ('Championship', 'Game 2:', 41, null),
    ('Championship', 'Game 3:', 42, null);

-- Step 5: Insert games
INSERT INTO games (season_id, game_date, opponent, home_away, our_score, their_score, location, status) VALUES
    ((SELECT id FROM seasons WHERE year = 2025 LIMIT 1), '2025-04-22', 'Unknown Opponent', 'home', null, null, null, 'completed'),
    ((SELECT id FROM seasons WHERE year = 2025 LIMIT 1), '2025-04-29', 'Unknown Opponent', 'home', null, null, null, 'completed'),
    ((SELECT id FROM seasons WHERE year = 2025 LIMIT 1), '2025-05-12', 'Unknown Opponent', 'home', null, null, null, 'completed'),
    ((SELECT id FROM seasons WHERE year = 2025 LIMIT 1), '2025-05-21', 'Unknown Opponent', 'home', null, null, null, 'completed'),
    ((SELECT id FROM seasons WHERE year = 2025 LIMIT 1), '2025-06-04', 'Unknown Opponent', 'home', null, null, null, 'completed'),
    ((SELECT id FROM seasons WHERE year = 2025 LIMIT 1), '2025-06-11', 'Unknown Opponent', 'home', null, null, null, 'completed'),
    ((SELECT id FROM seasons WHERE year = 2025 LIMIT 1), '2025-06-27', 'Unknown Opponent', 'home', null, null, null, 'completed'),
    ((SELECT id FROM seasons WHERE year = 2025 LIMIT 1), '2025-07-16', 'Unknown Opponent', 'home', null, null, null, 'completed'),
    ((SELECT id FROM seasons WHERE year = 2025 LIMIT 1), '2025-08-07', 'Unknown Opponent', 'home', null, null, null, 'completed');

-- Step 6: Insert player game statistics
INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0
FROM players p, games g
WHERE p.first_name = 'Chloe' AND p.last_name = 'Amarilla'
  AND g.game_date = '2025-05-21' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 4, 2, 2, 2, 0, 0, 2, 0, 0, 0
FROM players p, games g
WHERE p.first_name = 'Chloe' AND p.last_name = 'Amarilla'
  AND g.game_date = '2025-06-11' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 3, 1, 0, 0, 0, 0, 1, 0, 0, 0
FROM players p, games g
WHERE p.first_name = 'Chloe' AND p.last_name = 'Amarilla'
  AND g.game_date = '2025-06-27' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 2, 1, 0, 0, 0, 0, 1, 0, 0, 0
FROM players p, games g
WHERE p.first_name = 'Alyssa' AND p.last_name = 'Andrews'
  AND g.game_date = '2025-04-22' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 3, 0, 1, 0, 0, 0, 0, 0, 0, 0
FROM players p, games g
WHERE p.first_name = 'Lara' AND p.last_name = 'Horwitz'
  AND g.game_date = '2025-04-22' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 3, 2, 0, 1, 0, 0, 2, 0, 0, 0
FROM players p, games g
WHERE p.first_name = 'Lara' AND p.last_name = 'Horwitz'
  AND g.game_date = '2025-04-29' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 2, 2, 0, 1, 0, 0, 2, 0, 0, 0
FROM players p, games g
WHERE p.first_name = 'Lara' AND p.last_name = 'Horwitz'
  AND g.game_date = '2025-05-12' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 2, 1, 1, 0, 0, 0, 1, 0, 0, 0
FROM players p, games g
WHERE p.first_name = 'Lara' AND p.last_name = 'Horwitz'
  AND g.game_date = '2025-06-04' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 4, 1, 0, 1, 0, 0, 0, 1, 0, 0
FROM players p, games g
WHERE p.first_name = 'Lara' AND p.last_name = 'Horwitz'
  AND g.game_date = '2025-06-11' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0
FROM players p, games g
WHERE p.first_name = 'Lara' AND p.last_name = 'Horwitz'
  AND g.game_date = '2025-07-16' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0
FROM players p, games g
WHERE p.first_name = 'Miranda' AND p.last_name = 'Kahn'
  AND g.game_date = '2025-04-22' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 3, 0, 0, 0, 0, 3, 0, 0, 0, 0
FROM players p, games g
WHERE p.first_name = 'Miranda' AND p.last_name = 'Kahn'
  AND g.game_date = '2025-04-29' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 2, 1, 1, 0, 0, 0, 1, 0, 0, 0
FROM players p, games g
WHERE p.first_name = 'Miranda' AND p.last_name = 'Kahn'
  AND g.game_date = '2025-05-12' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0
FROM players p, games g
WHERE p.first_name = 'Miranda' AND p.last_name = 'Kahn'
  AND g.game_date = '2025-07-16' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 2, 1, 0, 1, 0, 0, 1, 0, 0, 0
FROM players p, games g
WHERE p.first_name = 'Rebecca' AND p.last_name = 'Klapper'
  AND g.game_date = '2025-04-22' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0
FROM players p, games g
WHERE p.first_name = 'Rebecca' AND p.last_name = 'Klapper'
  AND g.game_date = '2025-04-29' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0
FROM players p, games g
WHERE p.first_name = 'Rebecca' AND p.last_name = 'Klapper'
  AND g.game_date = '2025-05-12' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 3, 1, 1, 1, 0, 0, 1, 0, 0, 0
FROM players p, games g
WHERE p.first_name = 'Rebecca' AND p.last_name = 'Klapper'
  AND g.game_date = '2025-05-21' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 2, 0, 1, 1, 0, 0, 0, 0, 0, 0
FROM players p, games g
WHERE p.first_name = 'Rebecca' AND p.last_name = 'Klapper'
  AND g.game_date = '2025-06-04' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 2, 0, 1, 0, 0, 0, 0, 0, 0, 0
FROM players p, games g
WHERE p.first_name = 'Rebecca' AND p.last_name = 'Klapper'
  AND g.game_date = '2025-07-16' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 2, 1, 0, 0, 0, 0, 1, 0, 0, 0
FROM players p, games g
WHERE p.first_name = 'Rebecca' AND p.last_name = 'Klapper'
  AND g.game_date = '2025-08-07' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 2, 1, 1, 2, 0, 0, 0, 1, 0, 0
FROM players p, games g
WHERE p.first_name = 'Molly' AND p.last_name = 'Socha'
  AND g.game_date = '2025-05-12' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 3, 1, 1, 0, 1, 0, 1, 0, 0, 0
FROM players p, games g
WHERE p.first_name = 'Molly' AND p.last_name = 'Socha'
  AND g.game_date = '2025-06-11' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0
FROM players p, games g
WHERE p.first_name = 'Molly' AND p.last_name = 'Socha'
  AND g.game_date = '2025-06-27' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0
FROM players p, games g
WHERE p.first_name = 'Molly' AND p.last_name = 'Socha'
  AND g.game_date = '2025-07-16' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 2, 0, 1, 1, 0, 0, 0, 0, 0, 0
FROM players p, games g
WHERE p.first_name = 'Molly' AND p.last_name = 'Socha'
  AND g.game_date = '2025-08-07' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 3, 2, 1, 0, 0, 0, 2, 0, 0, 0
FROM players p, games g
WHERE p.first_name = 'Hannah' AND p.last_name = 'Tamminen'
  AND g.game_date = '2025-05-21' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 4, 1, 2, 0, 0, 0, 1, 0, 0, 0
FROM players p, games g
WHERE p.first_name = 'Hannah' AND p.last_name = 'Tamminen'
  AND g.game_date = '2025-06-11' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0
FROM players p, games g
WHERE p.first_name = 'Hannah' AND p.last_name = 'Tamminen'
  AND g.game_date = '2025-06-27' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 2, 1, 1, 0, 0, 0, 1, 0, 0, 0
FROM players p, games g
WHERE p.first_name = 'Sam' AND p.last_name = 'Brill'
  AND g.game_date = '2025-07-16' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 3, 1, 0, 1, 0, 0, 1, 0, 0, 0
FROM players p, games g
WHERE p.first_name = 'Sam' AND p.last_name = 'Brill'
  AND g.game_date = '2025-08-07' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0
FROM players p, games g
WHERE p.first_name = 'Brian' AND p.last_name = 'Epstein'
  AND g.game_date = '2025-04-22' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 3, 2, 0, 0, 0, 0, 2, 0, 0, 0
FROM players p, games g
WHERE p.first_name = 'Matt' AND p.last_name = 'Ewen'
  AND g.game_date = '2025-04-22' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 4, 2, 2, 2, 0, 0, 1, 0, 0, 1
FROM players p, games g
WHERE p.first_name = 'Matt' AND p.last_name = 'Ewen'
  AND g.game_date = '2025-04-29' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 3, 3, 3, 1, 0, 0, 2, 0, 1, 0
FROM players p, games g
WHERE p.first_name = 'Matt' AND p.last_name = 'Ewen'
  AND g.game_date = '2025-05-12' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 4, 3, 1, 3, 0, 0, 3, 0, 0, 0
FROM players p, games g
WHERE p.first_name = 'Matt' AND p.last_name = 'Ewen'
  AND g.game_date = '2025-05-21' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 3, 2, 2, 2, 0, 0, 1, 0, 1, 0
FROM players p, games g
WHERE p.first_name = 'Matt' AND p.last_name = 'Ewen'
  AND g.game_date = '2025-06-04' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 4, 3, 3, 1, 0, 0, 2, 0, 1, 0
FROM players p, games g
WHERE p.first_name = 'Matt' AND p.last_name = 'Ewen'
  AND g.game_date = '2025-06-11' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 4, 2, 2, 3, 0, 0, 1, 0, 0, 1
FROM players p, games g
WHERE p.first_name = 'Matt' AND p.last_name = 'Ewen'
  AND g.game_date = '2025-06-27' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 3, 1, 0, 0, 0, 0, 1, 0, 0, 0
FROM players p, games g
WHERE p.first_name = 'Matt' AND p.last_name = 'Ewen'
  AND g.game_date = '2025-08-07' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 3, 1, 0, 0, 0, 0, 1, 0, 0, 0
FROM players p, games g
WHERE p.first_name = 'Ethan' AND p.last_name = 'Fedida'
  AND g.game_date = '2025-04-22' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 4, 3, 2, 2, 0, 0, 1, 1, 0, 1
FROM players p, games g
WHERE p.first_name = 'Ethan' AND p.last_name = 'Fedida'
  AND g.game_date = '2025-04-29' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 3, 3, 3, 4, 0, 0, 0, 2, 1, 0
FROM players p, games g
WHERE p.first_name = 'Ethan' AND p.last_name = 'Fedida'
  AND g.game_date = '2025-05-12' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 2, 1, 1, 1, 2, 0, 1, 0, 0, 0
FROM players p, games g
WHERE p.first_name = 'Ethan' AND p.last_name = 'Fedida'
  AND g.game_date = '2025-05-21' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 3, 3, 2, 2, 0, 0, 2, 1, 0, 0
FROM players p, games g
WHERE p.first_name = 'Ethan' AND p.last_name = 'Fedida'
  AND g.game_date = '2025-06-04' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0
FROM players p, games g
WHERE p.first_name = 'Ethan' AND p.last_name = 'Fedida'
  AND g.game_date = '2025-07-16' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 2, 1, 0, 1, 0, 0, 1, 0, 0, 0
FROM players p, games g
WHERE p.first_name = 'Josh' AND p.last_name = 'Gropper'
  AND g.game_date = '2025-06-04' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 3, 2, 2, 2, 1, 0, 2, 0, 0, 0
FROM players p, games g
WHERE p.first_name = 'Josh' AND p.last_name = 'Gropper'
  AND g.game_date = '2025-06-11' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0
FROM players p, games g
WHERE p.first_name = 'Josh' AND p.last_name = 'Gropper'
  AND g.game_date = '2025-06-27' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 2, 1, 0, 2, 0, 0, 1, 0, 0, 0
FROM players p, games g
WHERE p.first_name = 'Josh' AND p.last_name = 'Gropper'
  AND g.game_date = '2025-07-16' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 3, 3, 0, 1, 0, 0, 3, 0, 0, 0
FROM players p, games g
WHERE p.first_name = 'Josh' AND p.last_name = 'Gropper'
  AND g.game_date = '2025-08-07' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 2, 1, 0, 0, 0, 0, 1, 0, 0, 0
FROM players p, games g
WHERE p.first_name = 'Alon' AND p.last_name = 'Krifcher'
  AND g.game_date = '2025-04-22' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 2, 1, 1, 1, 0, 0, 0, 1, 0, 0
FROM players p, games g
WHERE p.first_name = 'Alon' AND p.last_name = 'Krifcher'
  AND g.game_date = '2025-05-12' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 3, 2, 2, 0, 1, 0, 0, 2, 0, 0
FROM players p, games g
WHERE p.first_name = 'Alon' AND p.last_name = 'Krifcher'
  AND g.game_date = '2025-05-21' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 3, 2, 1, 3, 0, 0, 1, 0, 1, 0
FROM players p, games g
WHERE p.first_name = 'Alon' AND p.last_name = 'Krifcher'
  AND g.game_date = '2025-06-04' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 3, 3, 1, 3, 2, 0, 3, 0, 0, 0
FROM players p, games g
WHERE p.first_name = 'Alon' AND p.last_name = 'Krifcher'
  AND g.game_date = '2025-06-11' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 3, 1, 1, 1, 0, 0, 0, 0, 0, 0
FROM players p, games g
WHERE p.first_name = 'Alon' AND p.last_name = 'Krifcher'
  AND g.game_date = '2025-07-16' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 2, 0, 1, 0, 0, 0, 0, 0, 0, 0
FROM players p, games g
WHERE p.first_name = 'Wyatt' AND p.last_name = 'Lewis'
  AND g.game_date = '2025-05-12' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 3, 1, 1, 1, 0, 0, 1, 0, 0, 0
FROM players p, games g
WHERE p.first_name = 'Wyatt' AND p.last_name = 'Lewis'
  AND g.game_date = '2025-05-21' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 2, 1, 1, 0, 0, 0, 1, 0, 0, 0
FROM players p, games g
WHERE p.first_name = 'Wyatt' AND p.last_name = 'Lewis'
  AND g.game_date = '2025-06-04' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 4, 1, 1, 0, 0, 0, 1, 0, 0, 0
FROM players p, games g
WHERE p.first_name = 'Wyatt' AND p.last_name = 'Lewis'
  AND g.game_date = '2025-06-11' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 3, 1, 0, 0, 0, 0, 1, 0, 0, 0
FROM players p, games g
WHERE p.first_name = 'Wyatt' AND p.last_name = 'Lewis'
  AND g.game_date = '2025-06-27' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 3, 1, 0, 0, 0, 0, 1, 0, 0, 0
FROM players p, games g
WHERE p.first_name = 'Steven' AND p.last_name = 'Loesgen'
  AND g.game_date = '2025-04-29' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 2, 1, 1, 0, 0, 0, 1, 0, 0, 0
FROM players p, games g
WHERE p.first_name = 'Steven' AND p.last_name = 'Loesgen'
  AND g.game_date = '2025-05-12' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 4, 3, 1, 2, 0, 0, 1, 1, 1, 0
FROM players p, games g
WHERE p.first_name = 'Steven' AND p.last_name = 'Loesgen'
  AND g.game_date = '2025-05-21' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 2, 2, 1, 2, 0, 0, 1, 1, 0, 0
FROM players p, games g
WHERE p.first_name = 'Steven' AND p.last_name = 'Loesgen'
  AND g.game_date = '2025-06-04' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 2, 1, 0, 1, 0, 0, 0, 1, 0, 0
FROM players p, games g
WHERE p.first_name = 'Steven' AND p.last_name = 'Loesgen'
  AND g.game_date = '2025-07-16' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0
FROM players p, games g
WHERE p.first_name = 'Steven' AND p.last_name = 'Loesgen'
  AND g.game_date = '2025-08-07' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 3, 1, 1, 0, 0, 0, 1, 0, 0, 0
FROM players p, games g
WHERE p.first_name = 'Garrett' AND p.last_name = 'Lubniewski'
  AND g.game_date = '2025-04-29' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 2, 0, 1, 0, 0, 0, 0, 0, 0, 0
FROM players p, games g
WHERE p.first_name = 'Garrett' AND p.last_name = 'Lubniewski'
  AND g.game_date = '2025-05-12' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 2, 1, 1, 0, 0, 0, 1, 0, 0, 0
FROM players p, games g
WHERE p.first_name = 'Garrett' AND p.last_name = 'Lubniewski'
  AND g.game_date = '2025-07-16' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 3, 1, 1, 0, 0, 0, 0, 1, 0, 0
FROM players p, games g
WHERE p.first_name = 'Alex' AND p.last_name = 'Math'
  AND g.game_date = '2025-04-22' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 3, 1, 2, 0, 0, 0, 0, 0, 1, 0
FROM players p, games g
WHERE p.first_name = 'Alex' AND p.last_name = 'Math'
  AND g.game_date = '2025-05-12' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 3, 2, 1, 1, 0, 0, 2, 0, 0, 0
FROM players p, games g
WHERE p.first_name = 'Alex' AND p.last_name = 'Math'
  AND g.game_date = '2025-06-04' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0
FROM players p, games g
WHERE p.first_name = 'Alex' AND p.last_name = 'Math'
  AND g.game_date = '2025-07-16' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 3, 1, 0, 0, 0, 0, 1, 0, 0, 0
FROM players p, games g
WHERE p.first_name = 'Alex' AND p.last_name = 'Math'
  AND g.game_date = '2025-08-07' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 4, 4, 2, 1, 0, 0, 3, 1, 0, 0
FROM players p, games g
WHERE p.first_name = 'John' AND p.last_name = 'McCarthy'
  AND g.game_date = '2025-04-29' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 3, 1, 0, 0, 0, 0, 1, 0, 0, 0
FROM players p, games g
WHERE p.first_name = 'John' AND p.last_name = 'Morrison'
  AND g.game_date = '2025-04-22' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 3, 1, 1, 2, 0, 0, 0, 1, 0, 0
FROM players p, games g
WHERE p.first_name = 'John' AND p.last_name = 'Morrison'
  AND g.game_date = '2025-04-29' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 3, 0, 1, 0, 0, 0, 0, 0, 0, 0
FROM players p, games g
WHERE p.first_name = 'John' AND p.last_name = 'Morrison'
  AND g.game_date = '2025-05-12' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 4, 2, 2, 1, 0, 0, 1, 0, 1, 0
FROM players p, games g
WHERE p.first_name = 'John' AND p.last_name = 'Morrison'
  AND g.game_date = '2025-05-21' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0
FROM players p, games g
WHERE p.first_name = 'John' AND p.last_name = 'Morrison'
  AND g.game_date = '2025-06-04' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 4, 3, 1, 1, 0, 0, 2, 1, 0, 0
FROM players p, games g
WHERE p.first_name = 'John' AND p.last_name = 'Morrison'
  AND g.game_date = '2025-06-11' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 4, 2, 0, 1, 0, 0, 2, 0, 0, 0
FROM players p, games g
WHERE p.first_name = 'John' AND p.last_name = 'Morrison'
  AND g.game_date = '2025-06-27' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 2, 2, 2, 0, 0, 0, 0, 1, 1, 0
FROM players p, games g
WHERE p.first_name = 'John' AND p.last_name = 'Morrison'
  AND g.game_date = '2025-07-16' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 3, 3, 1, 0, 0, 0, 2, 1, 0, 0
FROM players p, games g
WHERE p.first_name = 'John' AND p.last_name = 'Morrison'
  AND g.game_date = '2025-08-07' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 3, 2, 1, 3, 0, 0, 1, 1, 0, 0
FROM players p, games g
WHERE p.first_name = 'CJ' AND p.last_name = 'Novogradac'
  AND g.game_date = '2025-05-21' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 4, 1, 1, 2, 0, 0, 1, 0, 0, 0
FROM players p, games g
WHERE p.first_name = 'CJ' AND p.last_name = 'Novogradac'
  AND g.game_date = '2025-06-11' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 4, 2, 3, 1, 0, 0, 2, 0, 0, 0
FROM players p, games g
WHERE p.first_name = 'CJ' AND p.last_name = 'Novogradac'
  AND g.game_date = '2025-06-27' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 3, 2, 1, 0, 0, 0, 1, 1, 0, 0
FROM players p, games g
WHERE p.first_name = 'Crosby' AND p.last_name = 'Steiner'
  AND g.game_date = '2025-04-22' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 4, 3, 0, 2, 0, 0, 3, 0, 0, 0
FROM players p, games g
WHERE p.first_name = 'Crosby' AND p.last_name = 'Steiner'
  AND g.game_date = '2025-04-29' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 2, 2, 2, 1, 0, 0, 1, 1, 0, 0
FROM players p, games g
WHERE p.first_name = 'Crosby' AND p.last_name = 'Steiner'
  AND g.game_date = '2025-05-12' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 3, 3, 3, 3, 1, 0, 3, 0, 0, 0
FROM players p, games g
WHERE p.first_name = 'Crosby' AND p.last_name = 'Steiner'
  AND g.game_date = '2025-05-21' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 3, 1, 1, 0, 0, 0, 1, 0, 0, 0
FROM players p, games g
WHERE p.first_name = 'Crosby' AND p.last_name = 'Steiner'
  AND g.game_date = '2025-06-04' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 5, 3, 0, 0, 0, 0, 3, 0, 0, 0
FROM players p, games g
WHERE p.first_name = 'Crosby' AND p.last_name = 'Steiner'
  AND g.game_date = '2025-06-11' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 3, 3, 4, 1, 1, 0, 2, 0, 0, 1
FROM players p, games g
WHERE p.first_name = 'Crosby' AND p.last_name = 'Steiner'
  AND g.game_date = '2025-06-27' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 3, 1, 1, 1, 0, 0, 0, 0, 0, 0
FROM players p, games g
WHERE p.first_name = 'Crosby' AND p.last_name = 'Steiner'
  AND g.game_date = '2025-07-16' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 3, 1, 1, 1, 0, 0, 0, 0, 1, 0
FROM players p, games g
WHERE p.first_name = 'Crosby' AND p.last_name = 'Steiner'
  AND g.game_date = '2025-08-07' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 3, 2, 0, 1, 0, 0, 2, 0, 0, 0
FROM players p, games g
WHERE p.first_name = 'Loren' AND p.last_name = 'Taylor-Raymond'
  AND g.game_date = '2025-04-22' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 4, 2, 3, 1, 0, 0, 1, 1, 0, 0
FROM players p, games g
WHERE p.first_name = 'Loren' AND p.last_name = 'Taylor-Raymond'
  AND g.game_date = '2025-04-29' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 2, 1, 1, 3, 0, 0, 1, 0, 0, 0
FROM players p, games g
WHERE p.first_name = 'Loren' AND p.last_name = 'Taylor-Raymond'
  AND g.game_date = '2025-05-12' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 2, 1, 1, 1, 1, 0, 1, 0, 0, 0
FROM players p, games g
WHERE p.first_name = 'Loren' AND p.last_name = 'Taylor-Raymond'
  AND g.game_date = '2025-06-04' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0
FROM players p, games g
WHERE p.first_name = 'Loren' AND p.last_name = 'Taylor-Raymond'
  AND g.game_date = '2025-07-16' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 3, 1, 0, 0, 0, 0, 1, 0, 0, 0
FROM players p, games g
WHERE p.first_name = 'Loren' AND p.last_name = 'Taylor-Raymond'
  AND g.game_date = '2025-08-07' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 2, 1, 1, 0, 0, 0, 0, 1, 0, 0
FROM players p, games g
WHERE p.first_name = 'Mike' AND p.last_name = 'Tersigni'
  AND g.game_date = '2025-06-04' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 4, 3, 1, 2, 0, 0, 2, 1, 0, 0
FROM players p, games g
WHERE p.first_name = 'Mike' AND p.last_name = 'Tersigni'
  AND g.game_date = '2025-06-11' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 4, 1, 1, 0, 0, 0, 1, 0, 0, 0
FROM players p, games g
WHERE p.first_name = 'Mike' AND p.last_name = 'Tersigni'
  AND g.game_date = '2025-06-27' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 3, 2, 0, 0, 0, 0, 2, 0, 0, 0
FROM players p, games g
WHERE p.first_name = 'Mike' AND p.last_name = 'Tersigni'
  AND g.game_date = '2025-08-07' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;

INSERT INTO player_game_stats (player_id, game_id, at_bats, hits, runs, rbis, walks, strikeouts, singles, doubles, triples, home_runs)
SELECT p.id, g.id, 2, 1, 1, 0, 0, 0, 0, 0, 0, 0
FROM players p, games g
WHERE p.first_name = 'Cardona' AND p.last_name = 'Cardona'
  AND g.game_date = '2025-06-04' AND g.season_id = (SELECT id FROM seasons WHERE year = 2025 LIMIT 1)
ON CONFLICT (player_id, game_id) DO UPDATE SET
  at_bats = EXCLUDED.at_bats, hits = EXCLUDED.hits, runs = EXCLUDED.runs,
  rbis = EXCLUDED.rbis, walks = EXCLUDED.walks, strikeouts = EXCLUDED.strikeouts,
  singles = EXCLUDED.singles, doubles = EXCLUDED.doubles, triples = EXCLUDED.triples, home_runs = EXCLUDED.home_runs;
