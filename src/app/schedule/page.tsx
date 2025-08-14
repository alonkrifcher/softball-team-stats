'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Calendar, MapPin, Trophy, Users, Clock, ChevronDown, ChevronUp } from 'lucide-react';

interface Game {
  id: number;
  seasonYear: number;
  gameNumber: number;
  gameDate: string;
  opponent: string;
  result: string | null;
  uhjRuns: number | null;
  oppRuns: number | null;
  playerCount: number;
  status: 'completed' | 'scheduled';
}

interface ScheduleData {
  games: Game[];
  gamesBySeason: { [year: number]: Game[] };
  availableSeasons: number[];
  totalGames: number;
}

export default function SchedulePage() {
  const [data, setData] = useState<ScheduleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);
  const [expandedSeasons, setExpandedSeasons] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    try {
      const response = await fetch('/api/schedule');
      if (response.ok) {
        const result = await response.json();
        setData(result);
        // Expand current year by default
        if (result.availableSeasons.length > 0) {
          setExpandedSeasons(new Set([result.availableSeasons[0]]));
        }
      }
    } catch (error) {
      console.error('Error fetching schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Date TBD';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getResultDisplay = (game: Game) => {
    if (game.result && game.uhjRuns !== null && game.oppRuns !== null) {
      return `${game.result} ${game.uhjRuns}-${game.oppRuns}`;
    } else if (game.result) {
      return game.result;
    } else if (game.uhjRuns !== null && game.oppRuns !== null) {
      const result = game.uhjRuns > game.oppRuns ? 'W' : game.uhjRuns < game.oppRuns ? 'L' : 'T';
      return `${result} ${game.uhjRuns}-${game.oppRuns}`;
    }
    return null;
  };

  const getResultColor = (game: Game) => {
    if (game.result?.startsWith('W') || (game.uhjRuns && game.oppRuns && game.uhjRuns > game.oppRuns)) {
      return 'text-green-600 bg-green-50 border-green-200';
    } else if (game.result?.startsWith('L') || (game.uhjRuns && game.oppRuns && game.uhjRuns < game.oppRuns)) {
      return 'text-red-600 bg-red-50 border-red-200';
    } else if (game.result?.startsWith('T') || (game.uhjRuns && game.oppRuns && game.uhjRuns === game.oppRuns)) {
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    }
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const toggleSeason = (year: number) => {
    const newExpanded = new Set(expandedSeasons);
    if (newExpanded.has(year)) {
      newExpanded.delete(year);
    } else {
      newExpanded.add(year);
    }
    setExpandedSeasons(newExpanded);
  };

  const getSeasonStats = (games: Game[]) => {
    const wins = games.filter(g => g.result?.startsWith('W')).length;
    const losses = games.filter(g => g.result?.startsWith('L')).length;
    const ties = games.filter(g => g.result?.startsWith('T')).length;
    const completed = wins + losses + ties;
    const scheduled = games.length - completed;
    
    return { wins, losses, ties, completed, scheduled, total: games.length };
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!data || data.totalGames === 0) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Schedule</h1>
            <p className="text-gray-600">Team game schedule and results</p>
          </div>

          <div className="card p-8 text-center">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">No Games Scheduled</h2>
            <p className="text-gray-600">No games found in the schedule</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Schedule & Results</h1>
          <p className="text-gray-600">Historical schedule and game results across all seasons</p>
        </div>

        {/* Overall Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Calendar className="h-5 w-5 text-blue-600 mr-2" />
              <span className="font-semibold text-gray-900">{data.availableSeasons.length}</span>
            </div>
            <p className="text-sm text-gray-600">Seasons</p>
          </div>
          <div className="card p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Trophy className="h-5 w-5 text-green-600 mr-2" />
              <span className="font-semibold text-gray-900">{data.totalGames}</span>
            </div>
            <p className="text-sm text-gray-600">Total Games</p>
          </div>
          <div className="card p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Users className="h-5 w-5 text-purple-600 mr-2" />
              <span className="font-semibold text-gray-900">
                {Math.round(data.games.reduce((sum, g) => sum + g.playerCount, 0) / data.games.length)}
              </span>
            </div>
            <p className="text-sm text-gray-600">Avg Players</p>
          </div>
          <div className="card p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Clock className="h-5 w-5 text-orange-600 mr-2" />
              <span className="font-semibold text-gray-900">
                {data.availableSeasons[0] || 'N/A'} - {data.availableSeasons[data.availableSeasons.length - 1] || 'N/A'}
              </span>
            </div>
            <p className="text-sm text-gray-600">Years Active</p>
          </div>
        </div>

        {/* Games by Season */}
        <div className="space-y-4">
          {data.availableSeasons.map(year => {
            const seasonGames = data.gamesBySeason[year] || [];
            const stats = getSeasonStats(seasonGames);
            const isExpanded = expandedSeasons.has(year);
            
            return (
              <div key={year} className="card">
                <div 
                  className="px-6 py-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50"
                  onClick={() => toggleSeason(year)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <h3 className="text-lg font-semibold text-gray-900">{year} Season</h3>
                      {stats.wins > 0 || stats.losses > 0 ? (
                        <span className="text-sm text-gray-600">
                          {stats.wins}-{stats.losses}{stats.ties > 0 ? `-${stats.ties}` : ''}
                        </span>
                      ) : null}
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-500">
                        {stats.total} games
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                  
                  {!isExpanded && (
                    <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Wins:</span> 
                        <span className="ml-1 font-medium text-green-600">{stats.wins}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Losses:</span> 
                        <span className="ml-1 font-medium text-red-600">{stats.losses}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Completed:</span> 
                        <span className="ml-1 font-medium">{stats.completed}</span>
                      </div>
                      <div>
                        <a 
                          href={`/history/${year}/games`}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                          onClick={(e) => e.stopPropagation()}
                        >
                          View Details →
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {isExpanded && (
                  <div className="divide-y divide-gray-100">
                    {seasonGames.map((game, index) => (
                      <div key={game.id} className="px-6 py-4 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-4 mb-2">
                              <h4 className="text-sm font-medium text-gray-900">
                                Game {game.gameNumber}
                              </h4>
                              <div className="flex items-center text-sm text-gray-500">
                                <Calendar className="h-4 w-4 mr-1" />
                                {formatDate(game.gameDate)}
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-6 text-sm">
                              <div className="flex items-center text-gray-600">
                                <MapPin className="h-4 w-4 mr-1" />
                                <span>vs {game.opponent}</span>
                              </div>
                              
                              <div className="flex items-center text-gray-500">
                                <Users className="h-4 w-4 mr-1" />
                                <span>{game.playerCount} players</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3">
                            {getResultDisplay(game) ? (
                              <div className={`px-3 py-1 rounded-md border font-medium text-sm ${getResultColor(game)}`}>
                                {getResultDisplay(game)}
                              </div>
                            ) : (
                              <div className="px-3 py-1 rounded-md border border-gray-200 bg-gray-50 text-gray-500 text-sm">
                                No Result
                              </div>
                            )}
                            
                            <a 
                              href={`/history/${year}/games/${game.gameNumber}`}
                              className="btn-outline btn-sm"
                            >
                              View Stats
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}