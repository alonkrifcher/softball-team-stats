'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { CheckCircle, AlertCircle, Database, Users, Calendar, Play } from 'lucide-react';

export default function SetupPage() {
  const [status, setStatus] = useState<'ready' | 'running' | 'success' | 'error'>('ready');
  const [message, setMessage] = useState('');
  const [credentials, setCredentials] = useState<any>(null);
  const router = useRouter();

  const runSetup = async () => {
    setStatus('running');
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
              <div className="text-center">
                <h2 className="text-lg font-semibold mb-4">Ready to Initialize</h2>
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

              <Button 
                onClick={runSetup}
                className="w-full"
                size="lg"
              >
                <Database className="h-4 w-4 mr-2" />
                Initialize Database
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