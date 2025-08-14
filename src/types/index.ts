export type UserRole = 'admin' | 'manager' | 'coach' | 'player';
export type GameStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'postponed';
export type HomeAway = 'home' | 'away';

export interface User {
  id: number;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Player {
  id: number;
  userId?: number;
  firstName: string;
  lastName: string;
  jerseyNumber?: number;
  primaryPosition?: string;
  isActive: boolean;
  user?: User;
}

export interface Season {
  id: number;
  name: string;
  year: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
}

export interface Game {
  id: number;
  seasonId: number;
  gameDate: Date;
  opponent: string;
  homeAway: HomeAway;
  location?: string;
  ourScore?: number;
  theirScore?: number;
  status: GameStatus;
  calendarEventId?: string;
  notes?: string;
  season?: Season;
}

export interface PlayerGameStats {
  id: number;
  playerId: number;
  gameId: number;
  battingOrder?: number;
  atBats: number;
  hits: number;
  runs: number;
  rbis: number;
  walks: number;
  strikeouts: number;
  singles: number;
  doubles: number;
  triples: number;
  homeRuns: number;
  stolenBases: number;
  fieldingPosition?: string;
  errors: number;
  assists: number;
  putouts: number;
  player?: Player;
  game?: Game;
}

export interface PlayerSeasonStats {
  playerId: number;
  seasonId: number;
  player: Player;
  games: number;
  atBats: number;
  hits: number;
  runs: number;
  rbis: number;
  walks: number;
  strikeouts: number;
  singles: number;
  doubles: number;
  triples: number;
  homeRuns: number;
  stolenBases: number;
  errors: number;
  assists: number;
  putouts: number;
  battingAverage: number;
  onBasePercentage: number;
  sluggingPercentage: number;
  ops: number;
}

export interface JWTPayload {
  userId: number;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}