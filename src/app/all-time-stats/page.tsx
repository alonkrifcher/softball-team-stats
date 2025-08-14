'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Trophy, Users, Calendar, BarChart3, TrendingUp, Target, Award } from 'lucide-react';

interface CareerStats {
  playerName: string;
  gender: string;
  firstYear: number;
  lastYear: number;
  yearsActive: number;
  totalGames: number;
  seasonsPlayed: number;
  careerAtBats: number;
  careerRuns: number;
  careerHits: number;
  careerSingles: number;
  careerDoubles: number;
  careerTriples: number;
  careerHomeRuns: number;
  careerXbh: number;
  careerTotalBases: number;
  careerRbis: number;
  careerSacrifice: number;
  careerWalks: number;
  careerStrikeouts: number;
  careerAvg: number;
  careerSlg: number;
  careerObp: number;
  careerOps: number;
  gamesPerSeason: number;
}

interface SeasonSummary {
  year: number;
  games: number;
  wins: number;
  losses: number;
  winPct: number;
  record: string;
  players: number;
  teamAvg: number;
  homeRuns: number;
}

interface TeamTotals {
  total_seasons: string;
  total_games: string;
  total_players: string;
  total_player_games: string;
  total_at_bats: string;
  total_runs: string;
  total_hits: string;
  total_home_runs: string;
  total_rbis: string;
  team_avg_all_time: string;
}

interface AllTimeStatsData {
  careerStats: CareerStats[];
  teamTotals: TeamTotals;
  seasonSummary: SeasonSummary[];
}

export default function AllTimeStatsPage() {
  const [data, setData] = useState<AllTimeStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<keyof CareerStats>('careerOps');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'career' | 'seasons'>('career');

  useEffect(() => {
    fetchAllTimeStats();
  }, []);

  const fetchAllTimeStats = async () => {
    try {
      const response = await fetch('/api/all-time-stats');
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Error fetching all-time stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (column: keyof CareerStats) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const formatAvg = (avg: number) => {
    if (avg === 0) return '.000';
    return avg.toFixed(3);
  };

  const getSortIcon = (column: keyof CareerStats) => {
    if (sortBy !== column) return null;
    return sortOrder === 'asc' ? '↑' : '↓';
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

  if (!data) {
    return (
      <DashboardLayout>
        <div className="card p-8 text-center">
          <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">No All-Time Stats Available</h2>
          <p className="text-gray-600">Unable to load career statistics</p>
        </div>
      </DashboardLayout>
    );
  }

  const sortedCareerStats = [...data.careerStats].sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];
    
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortOrder === 'asc' 
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }
    
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    }
    
    return 0;
  });

  // Get leaders for different categories
  const battingAvgLeader = data.careerStats.reduce((prev, current) => 
    current.careerAvg > prev.careerAvg ? current : prev
  );
  const homeRunLeader = data.careerStats.reduce((prev, current) => 
    current.careerHomeRuns > prev.careerHomeRuns ? current : prev
  );
  const opsLeader = data.careerStats.reduce((prev, current) => 
    current.careerOps > prev.careerOps ? current : prev
  );
  const gamesLeader = data.careerStats.reduce((prev, current) => 
    current.totalGames > prev.totalGames ? current : prev
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">All-Time Statistics</h1>
            <p className="text-gray-600">Career statistics and team history</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setViewMode('career')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                viewMode === 'career'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Career Stats
            </button>
            <button
              onClick={() => setViewMode('seasons')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                viewMode === 'seasons'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Season Summary
            </button>
          </div>
        </div>

        {/* Team Totals Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="card p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Calendar className="h-5 w-5 text-blue-600 mr-2" />
              <span className="font-semibold text-gray-900">{data.teamTotals.total_seasons}</span>
            </div>
            <p className="text-sm text-gray-600">Seasons</p>
          </div>
          <div className="card p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <BarChart3 className="h-5 w-5 text-green-600 mr-2" />
              <span className="font-semibold text-gray-900">{data.teamTotals.total_games}</span>
            </div>
            <p className="text-sm text-gray-600">Games</p>
          </div>
          <div className="card p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Users className="h-5 w-5 text-purple-600 mr-2" />
              <span className="font-semibold text-gray-900">{data.teamTotals.total_players}</span>
            </div>
            <p className="text-sm text-gray-600">Players</p>
          </div>
          <div className="card p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Target className="h-5 w-5 text-orange-600 mr-2" />
              <span className="font-semibold text-gray-900">.{(parseFloat(data.teamTotals.team_avg_all_time) * 1000).toFixed(0)}</span>
            </div>
            <p className="text-sm text-gray-600">Team Avg</p>
          </div>
          <div className="card p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="h-5 w-5 text-red-600 mr-2" />
              <span className="font-semibold text-gray-900">{data.teamTotals.total_hits}</span>
            </div>
            <p className="text-sm text-gray-600">Total Hits</p>
          </div>
          <div className="card p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Award className="h-5 w-5 text-yellow-600 mr-2" />
              <span className="font-semibold text-gray-900">{data.teamTotals.total_home_runs}</span>
            </div>
            <p className="text-sm text-gray-600">Home Runs</p>
          </div>
        </div>

        {/* Leaders Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-4">
            <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
              <Trophy className="h-4 w-4 text-yellow-500 mr-2" />
              Batting Average
            </h3>
            <div className="text-2xl font-bold text-blue-600">{formatAvg(battingAvgLeader.careerAvg)}</div>
            <div className="text-sm text-gray-600">{battingAvgLeader.playerName}</div>
            <div className="text-xs text-gray-500">{battingAvgLeader.careerAtBats} AB</div>
          </div>
          
          <div className="card p-4">
            <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
              <Trophy className="h-4 w-4 text-yellow-500 mr-2" />
              Home Runs
            </h3>
            <div className="text-2xl font-bold text-green-600">{homeRunLeader.careerHomeRuns}</div>
            <div className="text-sm text-gray-600">{homeRunLeader.playerName}</div>
            <div className="text-xs text-gray-500">{homeRunLeader.totalGames} games</div>
          </div>
          
          <div className="card p-4">
            <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
              <Trophy className="h-4 w-4 text-yellow-500 mr-2" />
              OPS Leader
            </h3>
            <div className="text-2xl font-bold text-purple-600">{formatAvg(opsLeader.careerOps)}</div>
            <div className="text-sm text-gray-600">{opsLeader.playerName}</div>
            <div className="text-xs text-gray-500">{opsLeader.careerAtBats} AB</div>
          </div>
          
          <div className="card p-4">
            <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
              <Trophy className="h-4 w-4 text-yellow-500 mr-2" />
              Most Games
            </h3>
            <div className="text-2xl font-bold text-orange-600">{gamesLeader.totalGames}</div>
            <div className="text-sm text-gray-600">{gamesLeader.playerName}</div>
            <div className="text-xs text-gray-500">{gamesLeader.firstYear}-{gamesLeader.lastYear}</div>
          </div>
        </div>

        {/* Career Stats Table */}
        {viewMode === 'career' && (
          <div className="card">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Career Statistics</h2>
              <p className="text-sm text-gray-600 mt-1">Click column headers to sort • Minimum 10 at-bats</p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('playerName')}
                        className="hover:text-gray-700 flex items-center"
                      >
                        Player {getSortIcon('playerName')}
                      </button>
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('yearsActive')}
                        className="hover:text-gray-700"
                      >
                        Years {getSortIcon('yearsActive')}
                      </button>
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('totalGames')}
                        className="hover:text-gray-700"
                      >
                        G {getSortIcon('totalGames')}
                      </button>
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('careerAvg')}
                        className="hover:text-gray-700"
                      >
                        AVG {getSortIcon('careerAvg')}
                      </button>
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('careerAtBats')}
                        className="hover:text-gray-700"
                      >
                        AB {getSortIcon('careerAtBats')}
                      </button>
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('careerHits')}
                        className="hover:text-gray-700"
                      >
                        H {getSortIcon('careerHits')}
                      </button>
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('careerHomeRuns')}
                        className="hover:text-gray-700"
                      >
                        HR {getSortIcon('careerHomeRuns')}
                      </button>
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('careerRbis')}
                        className="hover:text-gray-700"
                      >
                        RBI {getSortIcon('careerRbis')}
                      </button>
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('careerOps')}
                        className="hover:text-gray-700 font-semibold"
                      >
                        OPS {getSortIcon('careerOps')}
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedCareerStats.map((player, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-sm font-medium text-gray-900">
                            {player.playerName}
                          </div>
                          {player.gender && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              {player.gender}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {player.firstYear}-{player.lastYear}
                        </div>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-center">
                        {player.yearsActive}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-center">
                        {player.totalGames}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-center font-mono font-semibold">
                        {formatAvg(player.careerAvg)}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-center">
                        {player.careerAtBats}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-center font-semibold">
                        {player.careerHits}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-center">
                        {player.careerHomeRuns}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-center">
                        {player.careerRbis}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-center font-mono font-bold text-blue-600">
                        {formatAvg(player.careerOps)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Season Summary Table */}
        {viewMode === 'seasons' && (
          <div className="card">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Season by Season Summary</h2>
              <p className="text-sm text-gray-600 mt-1">Team performance across all seasons</p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Season
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Games
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Record
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Win %
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Players
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Team AVG
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Home Runs
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.seasonSummary.map((season, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <a 
                          href={`/history/${season.year}/games`}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {season.year}
                        </a>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-center">
                        {season.games}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-center font-mono">
                        {season.record}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-center">
                        {season.winPct > 0 ? (season.winPct * 100).toFixed(1) + '%' : '-'}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-center">
                        {season.players}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-center font-mono">
                        {formatAvg(season.teamAvg)}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-center">
                        {season.homeRuns}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}