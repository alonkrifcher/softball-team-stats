'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Calendar, MapPin, Trophy, Users, TrendingUp, Target, BarChart3 } from 'lucide-react';

interface GameInfo {
  id: number;
  gameNumber: number;
  gameDate: string;
  opponent: string;
  result: string;
  uhjRuns: number | null;
  oppRuns: number | null;
}

interface PlayerStat {
  playerName: string;
  gender: string;
  avg: number;
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
  slg: number;
  obp: number;
  ops: number;
  eqa: number;
  onBaseNumerator: number;
  onBaseDenominator: number;
}

interface GameStats {
  game: GameInfo;
  playerStats: PlayerStat[];
}

export default function GameStatsPage() {
  const params = useParams();
  const year = params.year as string;
  const gameNumber = params.gameNumber as string;
  const [gameStats, setGameStats] = useState<GameStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (year && gameNumber) {
      fetchGameStats();
    }
  }, [year, gameNumber]);

  const fetchGameStats = async () => {
    try {
      const response = await fetch(`/api/history/${year}/games/${gameNumber}`);
      if (response.ok) {
        const data = await response.json();
        setGameStats(data);
      }
    } catch (error) {
      console.error('Error fetching game stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Date TBD';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getResultDisplay = (game: GameInfo) => {
    if (game.result && game.uhjRuns !== null && game.oppRuns !== null) {
      return `${game.result} ${game.uhjRuns}-${game.oppRuns}`;
    } else if (game.result) {
      return game.result;
    } else if (game.uhjRuns !== null && game.oppRuns !== null) {
      const result = game.uhjRuns > game.oppRuns ? 'W' : game.uhjRuns < game.oppRuns ? 'L' : 'T';
      return `${result} ${game.uhjRuns}-${game.oppRuns}`;
    }
    return 'Result Unknown';
  };

  const getResultColor = (game: GameInfo) => {
    if (game.result?.startsWith('W') || (game.uhjRuns && game.oppRuns && game.uhjRuns > game.oppRuns)) {
      return 'text-green-600 bg-green-50';
    } else if (game.result?.startsWith('L') || (game.uhjRuns && game.oppRuns && game.uhjRuns < game.oppRuns)) {
      return 'text-red-600 bg-red-50';
    } else if (game.result?.startsWith('T') || (game.uhjRuns && game.oppRuns && game.uhjRuns === game.oppRuns)) {
      return 'text-yellow-600 bg-yellow-50';
    }
    return 'text-gray-600 bg-gray-50';
  };

  const formatAvg = (avg: number) => {
    if (avg === 0) return '.000';
    return avg.toFixed(3);
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

  if (!gameStats) {
    return (
      <DashboardLayout>
        <div className="card p-8 text-center">
          <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Game Not Found</h2>
          <p className="text-gray-600">Could not find stats for Game {gameNumber} in {year}</p>
        </div>
      </DashboardLayout>
    );
  }

  const { game, playerStats } = gameStats;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Game Header */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {year} Season - Game {game.gameNumber}
              </h1>
              <div className="flex items-center space-x-4 mt-2 text-gray-600">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {formatDate(game.gameDate)}
                </div>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  vs {game.opponent}
                </div>
              </div>
            </div>
            <div className={`px-4 py-2 rounded-lg font-semibold ${getResultColor(game)}`}>
              <div className="flex items-center">
                <Trophy className="h-5 w-5 mr-2" />
                {getResultDisplay(game)}
              </div>
            </div>
          </div>

          <div className="flex space-x-2">
            <a 
              href={`/history/${year}/games`}
              className="btn-outline btn-sm"
            >
              ← All {year} Games
            </a>
            <a 
              href={`/history/${year}/players`}
              className="btn-outline btn-sm"
            >
              Season Player Stats
            </a>
            <a 
              href="/history"
              className="btn-primary btn-sm"
            >
              All Seasons
            </a>
          </div>
        </div>

        {/* Player Stats Table */}
        <div className="card">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Player Statistics</h2>
              <div className="flex items-center text-sm text-gray-600">
                <Users className="h-4 w-4 mr-1" />
                {playerStats.length} players
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Player
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    AVG
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    AB
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    R
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    H
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    2B
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    3B
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    HR
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    RBI
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    BB
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    K
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    OBP
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SLG
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    OPS
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {playerStats.map((player, index) => (
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
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-center font-mono">
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
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-center font-mono font-semibold">
                      {formatAvg(player.ops)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}