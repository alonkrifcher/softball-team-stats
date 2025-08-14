'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Calendar, MapPin, Trophy, Users } from 'lucide-react';

interface Game {
  id: number;
  gameNumber: number;
  gameDate: string;
  opponent: string;
  result: string;
  uhjRuns: number | null;
  oppRuns: number | null;
  playerCount: number;
}

export default function SeasonGamesPage() {
  const params = useParams();
  const year = params.year as string;
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (year) {
      fetchGames();
    }
  }, [year]);

  const fetchGames = async () => {
    try {
      const response = await fetch(`/api/history/${year}/games`);
      if (response.ok) {
        const data = await response.json();
        setGames(data);
      }
    } catch (error) {
      console.error('Error fetching games:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Date TBD';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
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
    return 'Result Unknown';
  };

  const getResultColor = (game: Game) => {
    if (game.result?.startsWith('W') || (game.uhjRuns && game.oppRuns && game.uhjRuns > game.oppRuns)) {
      return 'text-green-600';
    } else if (game.result?.startsWith('L') || (game.uhjRuns && game.oppRuns && game.uhjRuns < game.oppRuns)) {
      return 'text-red-600';
    } else if (game.result?.startsWith('T') || (game.uhjRuns && game.oppRuns && game.uhjRuns === game.oppRuns)) {
      return 'text-yellow-600';
    }
    return 'text-gray-600';
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{year} Season Games</h1>
            <p className="text-gray-600">{games.length} games played</p>
          </div>
          <div className="flex space-x-2">
            <a 
              href={`/history/${year}/players`}
              className="btn-outline btn-sm"
            >
              Player Stats
            </a>
            <a 
              href="/history"
              className="btn-primary btn-sm"
            >
              All Seasons
            </a>
          </div>
        </div>

        <div className="grid gap-4">
          {games.length === 0 ? (
            <div className="card p-8 text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-gray-900 mb-2">No Games Found</h2>
              <p className="text-gray-600">No games found for the {year} season</p>
            </div>
          ) : (
            games.map((game) => (
              <div key={game.id} className="card p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Game {game.gameNumber}
                      </h3>
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDate(game.gameDate)}
                      </div>
                    </div>

                    <div className="flex items-center space-x-6">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                        <span className="text-gray-700">vs {game.opponent || 'Unknown Opponent'}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <Trophy className={`h-4 w-4 mr-1 ${getResultColor(game)}`} />
                        <span className={`font-semibold ${getResultColor(game)}`}>
                          {getResultDisplay(game)}
                        </span>
                      </div>

                      <div className="flex items-center">
                        <Users className="h-4 w-4 text-gray-400 mr-1" />
                        <span className="text-gray-600">{game.playerCount} players</span>
                      </div>
                    </div>
                  </div>

                  <div className="ml-4">
                    <a 
                      href={`/history/${year}/games/${game.gameNumber}`}
                      className="btn-primary btn-sm"
                    >
                      View Stats
                    </a>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}