'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Upload, AlertTriangle, CheckCircle, FileText, RotateCcw } from 'lucide-react';

interface ImportResult {
  success: boolean;
  message: string;
  summary?: {
    totalLinesProcessed: number;
    successfulParses: number;
    failedParses: number;
    seasons: number;
    players: number;
    games: number;
    playerGameStatsInserted: number;
    insertErrors: number;
  };
  errors?: {
    parseErrors: Array<{
      success: false;
      error: string;
      lineNumber: number;
      originalLine: string;
    }>;
    insertErrors: string[];
  };
}

export default function CSVImportV2Page() {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null); // Clear previous results
    }
  };

  const handleReset = async () => {
    setResetting(true);
    try {
      const response = await fetch('/api/setup/reset-historical', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setResult({
          success: true,
          message: 'Database reset successfully - ready for fresh CSV import'
        });
      } else {
        const error = await response.json();
        setResult({
          success: false,
          message: `Reset failed: ${error.error || 'Unknown error'}`
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: `Reset error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setResetting(false);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    try {
      const csvText = await file.text();
      
      const response = await fetch('/api/setup/csv-import-v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ csvData: csvText }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        message: `Import error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">CSV Import V2 (Robust)</h1>
          <p className="text-gray-600">Import your complete historical softball statistics with detailed error tracking</p>
        </div>

        {/* Reset Database Section */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Step 1: Reset Database</h2>
          <p className="text-gray-600 mb-4">
            Clear all existing historical data and create fresh tables.
          </p>
          <button
            onClick={handleReset}
            disabled={resetting}
            className="btn-outline flex items-center space-x-2"
          >
            <RotateCcw className={`h-4 w-4 ${resetting ? 'animate-spin' : ''}`} />
            <span>{resetting ? 'Resetting...' : 'Reset Database'}</span>
          </button>
        </div>

        {/* File Upload Section */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Step 2: Upload CSV File</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="csvFile" className="block text-sm font-medium text-gray-700 mb-2">
                Select CSV File
              </label>
              <input
                id="csvFile"
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100"
              />
            </div>

            {file && (
              <div className="text-sm text-gray-600">
                Selected: {file.name} ({Math.round(file.size / 1024)} KB)
              </div>
            )}
          </div>
        </div>

        {/* Expected Format */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Expected CSV Format</h2>
          <div className="bg-gray-50 p-4 rounded-md overflow-x-auto">
            <code className="text-sm">
              Year,Game,Date,Opponent,Result,UHJ Runs,Opp Runs,Name,Gender,Avg,AB,R,H,1B,2B,3B,HR,XBH,TB,RBI,Sac,BB,K,SLG,OBP,OPS,EqA,On_base_num,On_base_denom
            </code>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Each row represents one player's stats for one game. Expected: ~823 data rows.
          </p>
        </div>

        {/* Import Button */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Step 3: Import Data</h2>
          <button
            onClick={handleImport}
            disabled={!file || importing}
            className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload className={`h-4 w-4 ${importing ? 'animate-pulse' : ''}`} />
            <span>{importing ? 'Importing...' : 'Import CSV Data'}</span>
          </button>
        </div>

        {/* Results */}
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
                  {result.success ? 'Import Successful!' : 'Import Failed'}
                </h3>
                <p className={`mt-1 ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                  {result.message}
                </p>

                {result.summary && (
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white/50 p-3 rounded">
                      <div className="text-2xl font-bold text-blue-600">{result.summary.successfulParses}</div>
                      <div className="text-sm text-gray-600">Rows Parsed</div>
                    </div>
                    <div className="bg-white/50 p-3 rounded">
                      <div className="text-2xl font-bold text-green-600">{result.summary.playerGameStatsInserted}</div>
                      <div className="text-sm text-gray-600">Stats Inserted</div>
                    </div>
                    <div className="bg-white/50 p-3 rounded">
                      <div className="text-2xl font-bold text-purple-600">{result.summary.players}</div>
                      <div className="text-sm text-gray-600">Players</div>
                    </div>
                    <div className="bg-white/50 p-3 rounded">
                      <div className="text-2xl font-bold text-orange-600">{result.summary.games}</div>
                      <div className="text-sm text-gray-600">Games</div>
                    </div>
                  </div>
                )}

                {result.errors && (result.errors.parseErrors.length > 0 || result.errors.insertErrors.length > 0) && (
                  <div className="mt-4">
                    <h4 className="font-medium text-red-900 mb-2">Errors Details:</h4>
                    
                    {result.errors.parseErrors.length > 0 && (
                      <div className="mb-4">
                        <h5 className="font-medium text-red-800 mb-1">Parse Errors:</h5>
                        <div className="bg-red-100 p-2 rounded text-sm max-h-40 overflow-y-auto">
                          {result.errors.parseErrors.map((error, index) => (
                            <div key={index} className="mb-1">
                              <strong>Line {error.lineNumber}:</strong> {error.error}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {result.errors.insertErrors.length > 0 && (
                      <div>
                        <h5 className="font-medium text-red-800 mb-1">Insert Errors:</h5>
                        <div className="bg-red-100 p-2 rounded text-sm max-h-40 overflow-y-auto">
                          {result.errors.insertErrors.map((error, index) => (
                            <div key={index} className="mb-1">{error}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {result.success && (
                  <div className="mt-4">
                    <a 
                      href="/history" 
                      className="btn-primary inline-flex items-center space-x-2"
                    >
                      <FileText className="h-4 w-4" />
                      <span>View Historical Data</span>
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