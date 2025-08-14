'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { CheckCircle, AlertCircle, Upload, FileText, Database } from 'lucide-react';

export default function CSVImportPage() {
  const [status, setStatus] = useState<'ready' | 'running' | 'success' | 'error'>('ready');
  const [message, setMessage] = useState('');
  const [summary, setSummary] = useState<any>(null);
  const [csvData, setCsvData] = useState<string>('');

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setCsvData(text);
      };
      reader.readAsText(file);
    }
  };

  const runImport = async () => {
    if (!csvData.trim()) {
      setStatus('error');
      setMessage('Please upload a CSV file first');
      return;
    }

    setStatus('running');
    setMessage('Processing CSV and importing all-time stats...');

    try {
      const response = await fetch('/api/setup/csv-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ csvData }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage('All-time stats imported successfully!');
        setSummary(data.summary);
      } else {
        setStatus('error');
        setMessage(data.error || 'CSV import failed');
        console.error('CSV import error:', data);
      }
    } catch (error) {
      setStatus('error');
      setMessage('Network error during CSV import');
      console.error('CSV import error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-6">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <Database className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Import All-Time Stats</h1>
          <p className="text-gray-600">
            Upload your CSV file with historical player game statistics
          </p>
        </div>

        <div className="card p-6 space-y-6">
          {status === 'ready' && (
            <>
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold mb-2">Expected CSV Format</h2>
                  <div className="text-xs bg-gray-50 p-3 rounded font-mono overflow-x-auto">
                    <div>Year | Game | Date | Opponent | Result | UHJ Runs | Opp Runs | Name | Gender | Avg | AB | R | H | 1B | 2B | 3B | HR | XBH | TB | RBI | Sac | BB | K | SLG | OBP | OPS | EqA | On_base_num | On_base_denom</div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Each row should be one player's stats for one game. Missing opponent/result/scores are OK.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Upload CSV File
                  </label>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {csvData && (
                    <div className="mt-2">
                      <CheckCircle className="h-4 w-4 text-green-600 inline mr-2" />
                      <span className="text-sm text-green-600">
                        CSV loaded ({csvData.split('\n').length - 1} data rows)
                      </span>
                    </div>
                  )}
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Important</h3>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• This will replace ALL existing historical data</li>
                    <li>• Creates new tables: historical_seasons, historical_players, historical_games, historical_player_games</li>
                    <li>• Make sure your CSV is tab-delimited or comma-delimited</li>
                    <li>• First row should contain headers</li>
                  </ul>
                </div>
              </div>

              <Button 
                onClick={runImport}
                className="w-full"
                size="lg"
                disabled={!csvData.trim()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Import All-Time Statistics
              </Button>
            </>
          )}

          {status === 'running' && (
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">{message}</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center space-y-4">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
              <h2 className="text-lg font-semibold text-green-800">Import Complete!</h2>
              <p className="text-sm text-gray-600">{message}</p>
              
              {summary && (
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <h3 className="font-semibold text-gray-900">Import Summary</h3>
                  
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>Seasons:</span>
                      <span className="font-semibold">{summary.seasons}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Players:</span>
                      <span className="font-semibold">{summary.players}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Games:</span>
                      <span className="font-semibold">{summary.games}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Player-Game Stats:</span>
                      <span className="font-semibold text-green-600">{summary.playerGameStats}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Button 
                  onClick={() => window.location.href = '/history'}
                  className="w-full"
                  size="lg"
                >
                  View Historical Data
                </Button>
                
                <Button 
                  onClick={() => window.location.href = '/dashboard'}
                  variant="outline"
                  className="w-full"
                >
                  Back to Dashboard
                </Button>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-red-600 mx-auto" />
              <h2 className="text-lg font-semibold text-red-800">Import Failed</h2>
              <p className="text-sm text-red-600">{message}</p>
              
              <div className="space-y-2">
                <Button 
                  onClick={runImport}
                  variant="destructive"
                  className="w-full"
                  disabled={!csvData.trim()}
                >
                  Try Again
                </Button>
                
                <Button 
                  onClick={() => window.location.href = '/dashboard'}
                  variant="outline"
                  className="w-full"
                >
                  Back to Dashboard
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="text-center">
          <Button 
            onClick={() => window.location.href = '/dashboard'}
            variant="ghost"
            className="text-sm"
          >
            ← Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}