'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { CheckCircle, AlertCircle, Database, Users, Calendar, Play, Upload, FileSpreadsheet } from 'lucide-react';

export default function SetupPage() {
  const [status, setStatus] = useState<'ready' | 'running' | 'success' | 'error'>('ready');
  const [message, setMessage] = useState('');
  const [credentials, setCredentials] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [setupType, setSetupType] = useState<'sample' | 'import' | 'team' | 'simple'>('simple');
  const router = useRouter();

  const runSetup = async () => {
    setStatus('running');
    
    if (setupType === 'simple') {
      setMessage('Setting up database with simple approach...');
      
      try {
        const response = await fetch('/api/setup/simple', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage('Simple setup completed successfully!');
          setCredentials(data.credentials);
          setSummary(data.summary);
        } else {
          setStatus('error');
          setMessage(data.error || 'Simple setup failed');
          console.error('Simple setup error:', data);
        }
      } catch (error) {
        setStatus('error');
        setMessage('Network error during simple setup');
        console.error('Simple setup error:', error);
      }
    } else if (setupType === 'team') {
      setMessage('Importing Underhand Jobs team data...');
      
      try {
        const response = await fetch('/api/setup/team-data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage('Team data imported successfully!');
          setCredentials(data.credentials);
          setSummary(data.summary);
        } else {
          setStatus('error');
          setMessage(data.error || 'Team data import failed');
          console.error('Team data import error:', data);
        }
      } catch (error) {
        setStatus('error');
        setMessage('Network error during team data import');
        console.error('Team data import error:', error);
      }
    } else if (setupType === 'import') {
      if (!selectedFile) {
        setStatus('error');
        setMessage('Please select an Excel file to import');
        return;
      }
      
      setMessage('Processing Excel file...');
      
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      try {
        const response = await fetch('/api/setup/import', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage('Excel data imported successfully!');
          setCredentials(data.credentials);
          setSummary(data.summary);
        } else {
          setStatus('error');
          setMessage(data.error || 'Import failed');
          console.error('Import error:', data);
        }
      } catch (error) {
        setStatus('error');
        setMessage('Network error during import');
        console.error('Import error:', error);
      }
    } else {
      setMessage('Initializing database...');

      try {
        const response = await fetch('/api/setup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage('Database setup completed successfully!');
          setCredentials(data.credentials);
        } else {
          setStatus('error');
          setMessage(data.error || 'Setup failed');
          console.error('Setup error:', data);
        }
      } catch (error) {
        setStatus('error');
        setMessage('Network error during setup');
        console.error('Setup error:', error);
      }
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const goToLogin = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <Database className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Database Setup</h1>
          <p className="text-gray-600">
            Initialize your softball team database with sample data
          </p>
        </div>

        <div className="card p-6 space-y-6">
          {status === 'ready' && (
            <>
              {/* Setup Type Selection */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-center">Choose Setup Method</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  <button
                    onClick={() => setSetupType('simple')}
                    className={`p-3 border-2 rounded-lg transition-colors ${
                      setupType === 'simple' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Database className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                    <div className="font-semibold text-sm">Simple Setup</div>
                    <div className="text-xs text-gray-600">Clean & easy</div>
                  </button>
                  
                  <button
                    onClick={() => setSetupType('sample')}
                    className={`p-3 border-2 rounded-lg transition-colors ${
                      setupType === 'sample' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Play className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                    <div className="font-semibold text-sm">Sample Data</div>
                    <div className="text-xs text-gray-600">Example players</div>
                  </button>
                  
                  <button
                    onClick={() => setSetupType('team')}
                    className={`p-3 border-2 rounded-lg transition-colors ${
                      setupType === 'team' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Users className="h-6 w-6 mx-auto mb-2 text-orange-600" />
                    <div className="font-semibold text-sm">Team Data</div>
                    <div className="text-xs text-gray-600">Underhand Jobs</div>
                  </button>
                  
                  <button
                    onClick={() => setSetupType('import')}
                    className={`p-3 border-2 rounded-lg transition-colors ${
                      setupType === 'import' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <FileSpreadsheet className="h-6 w-6 mx-auto mb-2 text-green-600" />
                    <div className="font-semibold text-sm">Import Excel</div>
                    <div className="text-xs text-gray-600">Upload data</div>
                  </button>
                </div>
              </div>

              {/* Simple Setup */}
              {setupType === 'simple' && (
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-6">
                    Ultra-simple setup that creates everything cleanly:
                  </p>
                  
                  <div className="space-y-3 text-left">
                    <div className="flex items-center text-sm">
                      <Database className="h-4 w-4 text-blue-600 mr-2" />
                      Clean database tables (drops existing)
                    </div>
                    <div className="flex items-center text-sm">
                      <Users className="h-4 w-4 text-orange-600 mr-2" />
                      24 Underhand Jobs players
                    </div>
                    <div className="flex items-center text-sm">
                      <Calendar className="h-4 w-4 text-green-600 mr-2" />
                      2025 season with 9 games
                    </div>
                    <div className="flex items-center text-sm">
                      <CheckCircle className="h-4 w-4 text-purple-600 mr-2" />
                      Simple passwords: "password"
                    </div>
                  </div>
                </div>
              )}

              {/* Team Data Setup */}
              {setupType === 'team' && (
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-6">
                    This will import your actual Underhand Jobs team data including:
                  </p>
                  
                  <div className="space-y-3 text-left">
                    <div className="flex items-center text-sm">
                      <Users className="h-4 w-4 text-orange-600 mr-2" />
                      24 Underhand Jobs players
                    </div>
                    <div className="flex items-center text-sm">
                      <Calendar className="h-4 w-4 text-green-600 mr-2" />
                      2025 Spring/Summer season
                    </div>
                    <div className="flex items-center text-sm">
                      <Play className="h-4 w-4 text-purple-600 mr-2" />
                      9 games from April to August
                    </div>
                  </div>
                </div>
              )}

              {/* Sample Data Setup */}
              {setupType === 'sample' && (
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-6">
                    This will create your database tables and add sample data including:
                  </p>
                  
                  <div className="space-y-3 text-left">
                    <div className="flex items-center text-sm">
                      <Users className="h-4 w-4 text-blue-600 mr-2" />
                      Admin and Manager accounts
                    </div>
                    <div className="flex items-center text-sm">
                      <Calendar className="h-4 w-4 text-green-600 mr-2" />
                      Current season setup
                    </div>
                    <div className="flex items-center text-sm">
                      <Play className="h-4 w-4 text-purple-600 mr-2" />
                      10 sample players
                    </div>
                  </div>
                </div>
              )}

              {/* Excel Import Setup */}
              {setupType === 'import' && (
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-4">
                      Upload your Excel file with team data. Expected format:
                    </p>
                    <div className="text-xs text-left bg-gray-50 p-3 rounded space-y-1">
                      <div><strong>Sheet 1:</strong> "Season_Totals" - Player season statistics</div>
                      <div><strong>Sheet 2+:</strong> Individual game sheets with player stats</div>
                      <div><strong>Optional:</strong> "Games" sheet with game info</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Select Excel File (.xlsx)
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleFileSelect}
                        className="flex-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      {selectedFile && (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      )}
                    </div>
                    {selectedFile && (
                      <p className="text-sm text-green-600">
                        Selected: {selectedFile.name}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <Button 
                onClick={runSetup}
                className="w-full"
                size="lg"
                disabled={setupType === 'import' && !selectedFile}
              >
                {setupType === 'simple' ? (
                  <>
                    <Database className="h-4 w-4 mr-2" />
                    Simple Setup
                  </>
                ) : setupType === 'team' ? (
                  <>
                    <Users className="h-4 w-4 mr-2" />
                    Import Team Data
                  </>
                ) : setupType === 'import' ? (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Import Excel Data
                  </>
                ) : (
                  <>
                    <Database className="h-4 w-4 mr-2" />
                    Initialize with Sample Data
                  </>
                )}
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
              <h2 className="text-lg font-semibold text-green-800">Setup Complete!</h2>
              <p className="text-sm text-gray-600">{message}</p>
              
              {credentials && (
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <h3 className="font-semibold text-gray-900">Login Credentials</h3>
                  
                  <div className="text-sm space-y-2">
                    <div className="bg-white p-3 rounded border">
                      <div className="font-semibold text-blue-600">Manager Account</div>
                      <div>Email: {credentials.manager.email}</div>
                      <div>Password: {credentials.manager.password}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Can enter stats and manage games
                      </div>
                    </div>
                    
                    <div className="bg-white p-3 rounded border">
                      <div className="font-semibold text-purple-600">Admin Account</div>
                      <div>Email: {credentials.admin.email}</div>
                      <div>Password: {credentials.admin.password}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Full system access
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <Button 
                onClick={goToLogin}
                className="w-full"
                size="lg"
              >
                Go to Login
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-red-600 mx-auto" />
              <h2 className="text-lg font-semibold text-red-800">Setup Failed</h2>
              <p className="text-sm text-red-600">{message}</p>
              
              <div className="space-y-2">
                <Button 
                  onClick={runSetup}
                  variant="destructive"
                  className="w-full"
                >
                  Try Again
                </Button>
                
                <Button 
                  onClick={goToLogin}
                  variant="outline"
                  className="w-full"
                >
                  Back to Login
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="text-center text-xs text-gray-500">
          <p>⚠️ This setup page will only work once for security</p>
        </div>
      </div>
    </div>
  );
}