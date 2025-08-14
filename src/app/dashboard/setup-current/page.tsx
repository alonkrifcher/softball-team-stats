'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Calendar, CheckCircle, AlertTriangle, Play } from 'lucide-react';

interface SetupResult {
  success: boolean;
  message: string;
}

export default function SetupCurrentPage() {
  const [result, setResult] = useState<SetupResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSetup = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/setup/create-current-season', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        message: `Setup error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Setup Current Season</h1>
          <p className="text-gray-600">Initialize the current season for creating new games</p>
        </div>

        <div className="card p-6">
          <div className="flex items-start space-x-4">
            <Calendar className="h-6 w-6 text-blue-600 mt-1" />
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Current Season Setup</h2>
              <p className="text-gray-600 mb-4">
                This will create the 2025 and 2026 seasons in the current stats system, allowing you to create new games and enter stats for the current season.
              </p>
              
              <div className="bg-blue-50 p-4 rounded-md mb-4">
                <h3 className="font-medium text-blue-900 mb-2">What this does:</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Creates "Spring/Summer 2025" season (active)</li>
                  <li>• Creates "Spring/Summer 2026" season (inactive, for future use)</li>
                  <li>• Enables the "Create New Game" functionality</li>
                  <li>• Allows manual stats entry for new games</li>
                </ul>
              </div>

              <div className="bg-yellow-50 p-4 rounded-md mb-6">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> This is separate from your historical data. Your historical stats (2018-2025) remain unchanged and accessible via the History and All-Time Stats pages.
                </p>
              </div>
              
              <button
                onClick={handleSetup}
                disabled={loading}
                className="btn-primary flex items-center space-x-2"
              >
                <Play className={`h-4 w-4 ${loading ? 'animate-pulse' : ''}`} />
                <span>{loading ? 'Setting up...' : 'Setup Current Season'}</span>
              </button>
            </div>
          </div>
        </div>

        {result && (
          <div className={`card p-6 ${result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
            <div className="flex items-start space-x-3">
              {result.success ? (
                <CheckCircle className="h-6 w-6 text-green-600 mt-0.5" />
              ) : (
                <AlertTriangle className="h-6 w-6 text-red-600 mt-0.5" />
              )}
              <div className="flex-1">
                <h3 className={`font-semibold ${result.success ? 'text-green-900' : 'text-red-900'}`}>
                  {result.success ? 'Setup Complete!' : 'Setup Failed'}
                </h3>
                <p className={`mt-1 ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                  {result.message}
                </p>

                {result.success && (
                  <div className="mt-4 space-x-4">
                    <a 
                      href="/stats/entry" 
                      className="btn-primary inline-flex items-center space-x-2"
                    >
                      <Calendar className="h-4 w-4" />
                      <span>Create New Game</span>
                    </a>
                    <a 
                      href="/dashboard" 
                      className="btn-outline inline-flex items-center space-x-2"
                    >
                      <span>Back to Dashboard</span>
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}