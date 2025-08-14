'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Game } from '@/types';
import { Plus, Edit, Calendar, MapPin } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

export default function StatsPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGames();
  }, []);

  const loadGames = async () => {
    try {
      const response = await fetch('/api/games');
      if (response.ok) {
        const data = await response.json();
        setGames(data.games);
      }
    } catch (error) {
      console.error('Failed to load games:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreDisplay = (game: Game) => {
    if (game.ourScore !== null && game.theirScore !== null) {
      const isWin = game.ourScore > game.theirScore;
      const isDraw = game.ourScore === game.theirScore;
      return {
        score: `${game.ourScore}-${game.theirScore}`,
        result: isDraw ? 'T' : (isWin ? 'W' : 'L'),
        color: isDraw ? 'text-yellow-600' : (isWin ? 'text-green-600' : 'text-red-600'),
      };
    }
    return null;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Statistics</h1>
            <p className="text-gray-600">Game results and player statistics</p>
          </div>
          
          <Link href="/stats/entry">
            <Button className="flex items-center">
              <Plus className="h-4 w-4 mr-2" />
              Enter Stats
            </Button>
          </Link>
        </div>

        {/* Games List */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Games</h2>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading games...</p>
            </div>
          ) : games.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No games found.</p>
              <Link href="/stats/entry" className="inline-block mt-2">
                <Button variant="outline" size="sm">
                  Create your first game
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {games.map((game) => {
                const scoreInfo = getScoreDisplay(game);
                
                return (
                  <div
                    key={game.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div>
                            <h3 className="font-medium text-gray-900">
                              vs {game.opponent}
                            </h3>
                            <div className="flex items-center text-sm text-gray-600 space-x-4">
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                {formatDateTime(new Date(game.gameDate))}
                              </div>
                              {game.location && (
                                <div className="flex items-center">
                                  <MapPin className="h-4 w-4 mr-1" />
                                  {game.location}
                                </div>
                              )}
                              <span className="capitalize">
                                {game.homeAway}
                              </span>
                            </div>
                          </div>
                          
                          {scoreInfo && (
                            <div className="text-center">
                              <div className={`text-lg font-bold ${scoreInfo.color}`}>
                                {scoreInfo.result}
                              </div>
                              <div className="text-sm text-gray-600">
                                {scoreInfo.score}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {game.notes && (
                          <p className="text-sm text-gray-500 mt-2">{game.notes}</p>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className={`
                          inline-flex px-2 py-1 text-xs font-medium rounded-full
                          ${game.status === 'completed' ? 'bg-green-100 text-green-800' : ''}
                          ${game.status === 'scheduled' ? 'bg-blue-100 text-blue-800' : ''}
                          ${game.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' : ''}
                          ${game.status === 'cancelled' ? 'bg-red-100 text-red-800' : ''}
                          ${game.status === 'postponed' ? 'bg-gray-100 text-gray-800' : ''}
                        `}>
                          {game.status}
                        </span>
                        
                        <Link href={`/stats/entry?gameId=${game.id}`}>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-1" />
                            {game.status === 'completed' ? 'Edit' : 'Enter'} Stats
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}