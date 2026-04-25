-- Aggregated views. Run after Drizzle migrations.

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
  p.slug,
  p.gender,
  s.id AS season_id,
  s.year,
  s.label AS season_label,
  COUNT(DISTINCT bl.game_id) AS games,
  COALESCE(SUM(bl.ab), 0) AS ab,
  COALESCE(SUM(bl.r), 0) AS r,
  COALESCE(SUM(bl.h), 0) AS h,
  COALESCE(SUM(bl.singles), 0) AS singles,
  COALESCE(SUM(bl.doubles), 0) AS doubles,
  COALESCE(SUM(bl.triples), 0) AS triples,
  COALESCE(SUM(bl.hr), 0) AS hr,
  COALESCE(SUM(bl.rbi), 0) AS rbi,
  COALESCE(SUM(bl.bb), 0) AS bb,
  COALESCE(SUM(bl.k), 0) AS k,
  COALESCE(SUM(bl.sac), 0) AS sac,
  SUM(bl.h)::numeric / NULLIF(SUM(bl.ab), 0) AS avg,
  (SUM(bl.h)+SUM(bl.bb))::numeric / NULLIF(SUM(bl.ab)+SUM(bl.bb), 0) AS obp,
  (SUM(bl.singles)+2*SUM(bl.doubles)+3*SUM(bl.triples)+4*SUM(bl.hr))::numeric
    / NULLIF(SUM(bl.ab), 0) AS slg
FROM players p
JOIN batting_lines bl ON bl.player_id = p.id
JOIN games g ON g.id = bl.game_id
JOIN seasons s ON s.id = g.season_id
GROUP BY p.id, p.display_name, p.slug, p.gender, s.id, s.year, s.label;

CREATE OR REPLACE VIEW v_player_career_stats AS
SELECT
  player_id,
  display_name,
  slug,
  gender,
  SUM(games) AS games,
  SUM(ab) AS ab,
  SUM(r) AS r,
  SUM(h) AS h,
  SUM(singles) AS singles,
  SUM(doubles) AS doubles,
  SUM(triples) AS triples,
  SUM(hr) AS hr,
  SUM(rbi) AS rbi,
  SUM(bb) AS bb,
  SUM(k) AS k,
  SUM(sac) AS sac,
  SUM(h)::numeric / NULLIF(SUM(ab), 0) AS avg,
  (SUM(h)+SUM(bb))::numeric / NULLIF(SUM(ab)+SUM(bb), 0) AS obp,
  (SUM(singles)+2*SUM(doubles)+3*SUM(triples)+4*SUM(hr))::numeric / NULLIF(SUM(ab), 0) AS slg
FROM v_player_season_stats
GROUP BY player_id, display_name, slug, gender;

CREATE OR REPLACE VIEW v_team_season_record AS
SELECT
  s.id AS season_id,
  s.year,
  s.label,
  COUNT(*) FILTER (WHERE g.result = 'W') AS wins,
  COUNT(*) FILTER (WHERE g.result = 'L') AS losses,
  COUNT(*) FILTER (WHERE g.result = 'T') AS ties,
  SUM(g.uhj_runs) AS runs_for,
  SUM(g.opp_runs) AS runs_against
FROM seasons s
JOIN games g ON g.season_id = s.id
WHERE g.status IN ('final', 'historical')
GROUP BY s.id, s.year, s.label;
