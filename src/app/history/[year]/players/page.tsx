'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Users, TrendingUp, Target, BarChart3, Trophy, Calendar } from 'lucide-react';

interface PlayerSeasonStats {
  playerName: string;
  gender: string;
  gamesPlayed: number;
  atBats: number;
  runs: number;
  hits: number;
  singles: number;
  doubles: number;
  triples: number;
  homeRuns: number;
  xbh: number;
  totalBases: number;
  rbis: number;
  sacrifice: number;
  walks: number;
  strikeouts: number;
  avg: number;
  slg: number;
  obp: number;
  ops: number;
}

export default function SeasonPlayersPage() {
  const params = useParams();
  const year = params.year as string;
  const [players, setPlayers] = useState<PlayerSeasonStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<keyof PlayerSeasonStats>('ops');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    if (year) {
      fetchPlayerStats();
    }
  }, [year]);

  const fetchPlayerStats = async () => {
    try {
      const response = await fetch(`/api/history/${year}/players`);
      if (response.ok) {
        const data = await response.json();
        setPlayers(data);
      }
    } catch (error) {
      console.error('Error fetching player stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatAvg = (avg: number) => {
    if (avg === 0) return '.000';
    return avg.toFixed(3);
  };

  const handleSort = (column: keyof PlayerSeasonStats) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const sortedPlayers = [...players].sort((a, b) => {
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

  const getSortIcon = (column: keyof PlayerSeasonStats) => {
    if (sortBy !== column) return null;
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  // Calculate team totals
  const teamStats = players.reduce((totals, player) => ({
    totalPlayers: players.length,
    totalGames: Math.max(...players.map(p => p.gamesPlayed)),
    totalAtBats: totals.totalAtBats + player.atBats,
    totalHits: totals.totalHits + player.hits,
    totalRuns: totals.totalRuns + player.runs,
    totalRBIs: totals.totalRBIs + player.rbis,
    totalHomeRuns: totals.totalHomeRuns + player.homeRuns,
  }), {
    totalPlayers: 0,
    totalGames: 0,
    totalAtBats: 0,
    totalHits: 0,
    totalRuns: 0,
    totalRBIs: 0,
    totalHomeRuns: 0,
  });

  const teamAvg = teamStats.totalAtBats > 0 ? teamStats.totalHits / teamStats.totalAtBats : 0;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{year} Season Player Statistics</h1>
            <p className="text-gray-600">{players.length} players</p>
          </div>
          <div className="flex space-x-2">
            <a 
              href={`/history/${year}/games`}
              className="btn-outline btn-sm"
            >
              Games
            </a>
            <a 
              href="/history"
              className="btn-primary btn-sm"
            >
              All Seasons
            </a>
          </div>
        </div>

        {/* Team Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Users className="h-5 w-5 text-blue-600 mr-2" />
              <span className="font-semibold text-gray-900">{teamStats.totalPlayers}</span>
            </div>
            <p className="text-sm text-gray-600">Players</p>
          </div>

          <div className="card p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Calendar className="h-5 w-5 text-green-600 mr-2" />
              <span className="font-semibold text-gray-900">{teamStats.totalGames}</span>
            </div>
            <p className="text-sm text-gray-600">Games</p>
          </div>

          <div className="card p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <BarChart3 className="h-5 w-5 text-purple-600 mr-2" />
              <span className="font-semibold text-gray-900">.{(teamAvg * 1000).toFixed(0)}</span>
            </div>
            <p className="text-sm text-gray-600">Team Avg</p>
          </div>

          <div className="card p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Trophy className="h-5 w-5 text-orange-600 mr-2" />
              <span className="font-semibold text-gray-900">{teamStats.totalHomeRuns}</span>
            </div>
            <p className="text-sm text-gray-600">Home Runs</p>
          </div>
        </div>

        {/* Player Stats Table */}
        {players.length === 0 ? (
          <div className="card p-8 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">No Player Stats Found</h2>
            <p className="text-gray-600">No player statistics found for the {year} season</p>
          </div>
        ) : (
          <div className="card">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Player Statistics</h2>
              <p className="text-sm text-gray-600 mt-1">Click column headers to sort</p>
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
                        onClick={() => handleSort('gamesPlayed')}
                        className="hover:text-gray-700"
                      >
                        G {getSortIcon('gamesPlayed')}
                      </button>
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('avg')}
                        className="hover:text-gray-700"
                      >
                        AVG {getSortIcon('avg')}
                      </button>
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('atBats')}
                        className="hover:text-gray-700"
                      >
                        AB {getSortIcon('atBats')}
                      </button>
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('runs')}
                        className="hover:text-gray-700"
                      >
                        R {getSortIcon('runs')}
                      </button>
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('hits')}
                        className="hover:text-gray-700"
                      >
                        H {getSortIcon('hits')}
                      </button>
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('doubles')}
                        className="hover:text-gray-700"
                      >
                        2B {getSortIcon('doubles')}
                      </button>
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('triples')}
                        className="hover:text-gray-700"
                      >
                        3B {getSortIcon('triples')}
                      </button>
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('homeRuns')}
                        className="hover:text-gray-700"
                      >
                        HR {getSortIcon('homeRuns')}
                      </button>
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('rbis')}
                        className="hover:text-gray-700"
                      >
                        RBI {getSortIcon('rbis')}
                      </button>
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('walks')}
                        className="hover:text-gray-700"
                      >
                        BB {getSortIcon('walks')}
                      </button>
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('strikeouts')}
                        className="hover:text-gray-700"
                      >
                        K {getSortIcon('strikeouts')}
                      </button>
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('obp')}
                        className="hover:text-gray-700"
                      >
                        OBP {getSortIcon('obp')}
                      </button>
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('slg')}
                        className="hover:text-gray-700"
                      >
                        SLG {getSortIcon('slg')}
                      </button>
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('ops')}
                        className="hover:text-gray-700 font-semibold"
                      >
                        OPS {getSortIcon('ops')}
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedPlayers.map((player, index) => (
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
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-center">
                        {player.gamesPlayed}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-center font-mono font-semibold">
                        {formatAvg(player.avg)}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-center">
                        {player.atBats}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-center">
                        {player.runs}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-center font-semibold">
                        {player.hits}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-center">
                        {player.doubles}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-center">
                        {player.triples}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-center">
                        {player.homeRuns}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-center">
                        {player.rbis}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-center">
                        {player.walks}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-center">
                        {player.strikeouts}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-center font-mono">
                        {formatAvg(player.obp)}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-center font-mono">
                        {formatAvg(player.slg)}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-center font-mono font-bold text-blue-600">
                        {formatAvg(player.ops)}
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