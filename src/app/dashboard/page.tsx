'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { BarChart3, Calendar, Users, Trophy, History, Plus } from 'lucide-react';
import { User } from '@/types';

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Get user info from the auth context in DashboardLayout
    // This is a simplified approach since DashboardLayout already checks auth
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
    }
  };

  const navigationItems = [
    { name: 'Current Stats', href: '/stats', icon: BarChart3, description: 'View current season player statistics' },
    { name: 'All-Time Stats', href: '/all-time-stats', icon: Trophy, description: 'Career statistics and leaders' },
    { name: 'History', href: '/history', icon: History, description: 'Season history and past games' },
    { name: 'Schedule', href: '/schedule', icon: Calendar, description: 'Game schedule and results' },
    { name: 'Roster', href: '/roster', icon: Users, description: 'Team roster and player info' },
  ];

  // Add stats entry for managers/admins
  if (user && ['admin', 'manager'].includes(user.role)) {
    navigationItems.unshift({ 
      name: 'Enter Game Stats', 
      href: '/stats/entry', 
      icon: Plus, 
      description: 'Add statistics for new games' 
    });
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4">
        {/* Main Title */}
        <div className="text-center mb-12">
          <h1 
            className="text-6xl md:text-8xl font-bold mb-4"
            style={{ color: '#7BAFD4' }}
          >
            Go Handies!
          </h1>
          <p className="text-xl text-gray-600">Welcome to the UHJ Baseball Team Homepage</p>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.name}
                href={item.href}
                className="block p-6 bg-white rounded-lg border-2 border-gray-200 hover:border-[#7BAFD4] hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1"
              >
                <div className="flex items-center mb-4">
                  <Icon className="h-8 w-8 mr-3" style={{ color: '#7BAFD4' }} />
                  <h2 className="text-xl font-semibold text-gray-900">{item.name}</h2>
                </div>
                <p className="text-gray-600">{item.description}</p>
              </a>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-gray-500">Season 2025 • Go Team!</p>
        </div>
      </div>
    </DashboardLayout>
  );
}