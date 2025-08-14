'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Calendar, TrendingUp, Users, BarChart3 } from 'lucide-react';

interface Season {
  year: number;
  gameCount: number;
  winLossRecord: string;
  teamAvg: number;
  playerCount: number;
}

export default function HistoryPage() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSeasons();
  }, []);

  const fetchSeasons = async () => {
    try {
      const response = await fetch('/api/history/seasons');
      if (response.ok) {
        const data = await response.json();
        setSeasons(data);
      }
    } catch (error) {
      console.error('Error fetching seasons:', error);
    } finally {
      setLoading(false);
    }
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team History</h1>
          <p className="text-gray-600">Historical seasons and results</p>
        </div>

        <div className="grid gap-6">
          {seasons.length === 0 ? (
            <div className="card p-8 text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-gray-900 mb-2">No Historical Data</h2>
              <p className="text-gray-600 mb-4">Import your CSV file to view team history</p>
              <a 
                href="/dashboard/csv-import" 
                className="btn-primary inline-flex items-center"
              >
                Import Data
              </a>
            </div>
          ) : (
            seasons.map((season) => (
              <div key={season.year} className="card p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">{season.year} Season</h2>
                  <div className="flex space-x-4">
                    <a 
                      href={`/history/${season.year}/games`}
                      className="btn-primary btn-sm"
                    >
                      View Games
                    </a>
                    <a 
                      href={`/history/${season.year}/players`}
                      className="btn-outline btn-sm"
                    >
                      Player Stats
                    </a>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Calendar className="h-5 w-5 text-blue-600 mr-2" />
                      <span className="font-semibold text-gray-900">{season.gameCount}</span>
                    </div>
                    <p className="text-sm text-gray-600">Games</p>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
                      <span className="font-semibold text-gray-900">{season.winLossRecord}</span>
                    </div>
                    <p className="text-sm text-gray-600">Record</p>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <BarChart3 className="h-5 w-5 text-purple-600 mr-2" />
                      <span className="font-semibold text-gray-900">.{(season.teamAvg * 1000).toFixed(0)}</span>
                    </div>
                    <p className="text-sm text-gray-600">Team Avg</p>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Users className="h-5 w-5 text-orange-600 mr-2" />
                      <span className="font-semibold text-gray-900">{season.playerCount}</span>
                    </div>
                    <p className="text-sm text-gray-600">Players</p>
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