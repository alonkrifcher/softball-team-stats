'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import GameForm from '@/components/forms/GameForm';
import StatsEntryForm from '@/components/forms/StatsEntryForm';
import { Button } from '@/components/ui/Button';
import { Game, PlayerGameStats } from '@/types';
import { ArrowLeft, Plus } from 'lucide-react';

type FormStep = 'select_game' | 'create_game' | 'enter_stats';

export default function StatsEntryPage() {
  const [step, setStep] = useState<FormStep>('select_game');
  const [games, setGames] = useState<Game[]>([]);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [gameStats, setGameStats] = useState<PlayerGameStats[]>([]);
  const [loadingGames, setLoadingGames] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    loadGames();
    
    // Check if there's a specific game ID in the URL
    const gameId = searchParams.get('gameId');
    if (gameId) {
      loadSpecificGame(parseInt(gameId));
    }
  }, [searchParams]);

  const loadGames = async () => {
    try {
      const response = await fetch('/api/games?status=scheduled');
      if (response.ok) {
        const data = await response.json();
        setGames(data.games);
      }
    } catch (error) {
      console.error('Failed to load games:', error);
    } finally {
      setLoadingGames(false);
    }
  };

  const loadSpecificGame = async (gameId: number) => {
    try {
      const response = await fetch(`/api/games/${gameId}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedGame(data.game);
        setGameStats(data.game.playerStats || []);
        setStep('enter_stats');
      }
    } catch (error) {
      console.error('Failed to load game:', error);
    }
  };

  const handleCreateGame = async (gameData: any) => {
    setSubmitting(true);
    try {
      const response = await fetch('/api/games/universal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(gameData),
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedGame(data.game);
        setGameStats([]);
        setStep('enter_stats');
      } else {
        const errorData = await response.json();
        alert(`Failed to create game: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Failed to create game:', error);
      alert('Failed to create game. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectGame = (game: Game) => {
    setSelectedGame(game);
    setGameStats(game.playerStats || []);
    setStep('enter_stats');
  };

  const handleStatsSubmit = async (statsData: any) => {
    if (!selectedGame) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/games/${selectedGame.id}/stats/universal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerStats: statsData.playerStats,
          gameScore: {
            ourScore: statsData.ourScore,
            theirScore: statsData.theirScore,
          },
        }),
      });

      if (response.ok) {
        alert('Stats saved successfully!');
        router.push('/stats');
      } else {
        const errorData = await response.json();
        alert(`Failed to save stats: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Failed to save stats:', error);
      alert('Failed to save stats. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    if (step === 'enter_stats') {
      setStep('select_game');
      setSelectedGame(null);
      setGameStats([]);
    } else if (step === 'create_game') {
      setStep('select_game');
    }
  };

  const handleCancel = () => {
    router.push('/stats');
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={handleBack}
              className="flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {step === 'select_game' && 'Select Game'}
                {step === 'create_game' && 'Create New Game'}
                {step === 'enter_stats' && 'Enter Game Statistics'}
              </h1>
              <p className="text-gray-600">
                {step === 'select_game' && 'Choose a game to enter statistics for, or create a new game'}
                {step === 'create_game' && 'Fill in the game details'}
                {step === 'enter_stats' && 'Enter individual player statistics for this game'}
              </p>
            </div>
          </div>
        </div>

        {/* Step Content */}
        {step === 'select_game' && (
          <div className="space-y-6">
            {/* Create New Game Button */}
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Create New Game</h2>
                  <p className="text-gray-600">Add a new game to enter statistics for</p>
                </div>
                <Button
                  onClick={() => setStep('create_game')}
                  className="flex items-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Game
                </Button>
              </div>
            </div>

            {/* Scheduled Games */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Scheduled Games</h2>
              
              {loadingGames ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-gray-600 mt-2">Loading games...</p>
                </div>
              ) : games.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">No scheduled games found.</p>
                  <p className="text-sm text-gray-500 mt-1">Create a new game to start entering statistics.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {games.map((game) => (
                    <div
                      key={game.id}
                      className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => handleSelectGame(game)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">vs {game.opponent}</h3>
                          <p className="text-sm text-gray-600">
                            {new Date(game.gameDate).toLocaleDateString()} at{' '}
                            {new Date(game.gameDate).toLocaleTimeString([], {
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </p>
                          <p className="text-sm text-gray-600 capitalize">
                            {game.homeAway} {game.location && `• ${game.location}`}
                          </p>
                          {game.notes && (
                            <p className="text-xs text-gray-500 mt-1">{game.notes}</p>
                          )}
                        </div>
                        <div className="ml-4">
                          <span className={`
                            inline-flex px-2 py-1 text-xs font-medium rounded-full
                            ${game.status === 'completed' ? 'bg-green-100 text-green-800' : ''}
                            ${game.status === 'scheduled' ? 'bg-blue-100 text-blue-800' : ''}
                            ${game.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' : ''}
                            ${game.status === 'cancelled' ? 'bg-red-100 text-red-800' : ''}
                          `}>
                            {game.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {step === 'create_game' && (
          <div className="card p-6">
            <GameForm
              onSubmit={handleCreateGame}
              onCancel={handleBack}
              isSubmitting={submitting}
            />
          </div>
        )}

        {step === 'enter_stats' && selectedGame && (
          <StatsEntryForm
            game={selectedGame}
            initialStats={gameStats}
            onSubmit={handleStatsSubmit}
            onCancel={handleCancel}
            isSubmitting={submitting}
          />
        )}
      </div>
    </DashboardLayout>
  );
}