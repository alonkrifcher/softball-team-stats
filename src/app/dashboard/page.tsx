'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { BarChart3, Calendar, Users, TrendingUp } from 'lucide-react';

interface DashboardStats {
  gamesPlayed: number;
  teamAverage: string;
  activePlayers: number;
  winRate: string;
}

interface RecentGame {
  id: number;
  gameDate: string;
  opponent: string;
  homeAway: string;
  result: string;
  resultDisplay: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentGames, setRecentGames] = useState<RecentGame[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsResponse, gamesResponse] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch('/api/dashboard/recent-games')
      ]);
      
      if (statsResponse.ok && gamesResponse.ok) {
        const statsData = await statsResponse.json();
        const gamesData = await gamesResponse.json();
        setStats(statsData);
        setRecentGames(gamesData.recentGames);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">UHJ Homepage</h1>
          <p className="text-gray-600">Welcome to your team stats dashboard</p>
        </div>

        {/* Team Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="stat-label">Games Played</p>
                <p className="stat-value">{loading ? '...' : stats?.gamesPlayed || 0}</p>
              </div>
              <Calendar className="h-8 w-8" style={{color: '#7BAFD4'}} />
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="stat-label">Team Average</p>
                <p className="stat-value">{loading ? '...' : stats?.teamAverage || '.000'}</p>
              </div>
              <TrendingUp className="h-8 w-8" style={{color: '#7BAFD4'}} />
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="stat-label">Active Players</p>
                <p className="stat-value">{loading ? '...' : stats?.activePlayers || 0}</p>
              </div>
              <Users className="h-8 w-8" style={{color: '#7BAFD4'}} />
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="stat-label">Win Rate</p>
                <p className="stat-value">{loading ? '...' : stats?.winRate || '0%'}</p>
              </div>
              <BarChart3 className="h-8 w-8" style={{color: '#7BAFD4'}} />
            </div>
          </div>
        </div>

        {/* Recent Games */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Games</h2>
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" style={{borderColor: '#7BAFD4'}}></div>
                <p className="text-gray-600 mt-2">Loading games...</p>
              </div>
            ) : recentGames.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No completed games yet.</p>
              </div>
            ) : (
              recentGames.map((game) => (
                <div key={game.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div>
                    <p className="font-medium text-gray-900">vs {game.opponent}</p>
                    <p className="text-sm text-gray-600">{new Date(game.gameDate).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium ${
                      game.result === 'W' ? 'text-green-600' : 
                      game.result === 'L' ? 'text-red-600' : 'text-yellow-600'
                    }`}>
                      {game.resultDisplay}
                    </p>
                    <p className="text-sm text-gray-600 capitalize">{game.homeAway}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}