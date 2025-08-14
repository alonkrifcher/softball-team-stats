'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { CheckCircle, AlertCircle, Upload, FileSpreadsheet, BarChart3 } from 'lucide-react';

export default function ImportStatsPage() {
  const [status, setStatus] = useState<'ready' | 'running' | 'success' | 'error'>('ready');
  const [message, setMessage] = useState('');
  const [summary, setSummary] = useState<any>(null);

  const runImport = async () => {
    setStatus('running');
    setMessage('Processing Excel file and importing stats...');

    try {
      const response = await fetch('/api/setup/import-stats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage('Stats imported successfully!');
        setSummary(data.summary);
      } else {
        setStatus('error');
        setMessage(data.error || 'Stats import failed');
        console.error('Stats import error:', data);
      }
    } catch (error) {
      setStatus('error');
      setMessage('Network error during stats import');
      console.error('Stats import error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-lg w-full space-y-6">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <BarChart3 className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Import 2025 Stats</h1>
          <p className="text-gray-600">
            Import actual game statistics from your Excel file
          </p>
        </div>

        <div className="card p-6 space-y-6">
          {status === 'ready' && (
            <>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-6">
                  This will process your Excel file and import all player game statistics:
                </p>
                
                <div className="space-y-3 text-left">
                  <div className="flex items-center text-sm">
                    <FileSpreadsheet className="h-4 w-4 text-green-600 mr-2" />
                    Process 9 games from April to August
                  </div>
                  <div className="flex items-center text-sm">
                    <BarChart3 className="h-4 w-4 text-blue-600 mr-2" />
                    Import AB, H, R, RBI, BB, K, 1B, 2B, 3B, HR
                  </div>
                  <div className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-purple-600 mr-2" />
                    Match players to existing roster
                  </div>
                </div>
              </div>

              <Button 
                onClick={runImport}
                className="w-full"
                size="lg"
              >
                <Upload className="h-4 w-4 mr-2" />
                Import 2025 Statistics
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
                      <span>Games processed:</span>
                      <span className="font-semibold">{summary.games}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total stat records:</span>
                      <span className="font-semibold">{summary.totalStats}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Successfully imported:</span>
                      <span className="font-semibold text-green-600">{summary.imported}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Skipped:</span>
                      <span className="font-semibold text-orange-600">{summary.skipped}</span>
                    </div>
                  </div>
                </div>
              )}

              <Button 
                onClick={() => window.location.href = '/stats'}
                className="w-full"
                size="lg"
              >
                View Statistics
              </Button>
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