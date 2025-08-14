'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { BarChart3, Calendar, Users, TrendingUp } from 'lucide-react';

export default function Dashboard() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome to your team stats dashboard</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="stat-label">Games Played</p>
                <p className="stat-value">12</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="stat-label">Team Average</p>
                <p className="stat-value">.285</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="stat-label">Active Players</p>
                <p className="stat-value">15</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="stat-label">Win Rate</p>
                <p className="stat-value">75%</p>
              </div>
              <BarChart3 className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Recent Games */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Games</h2>
          <div className="space-y-3">
            {[1, 2, 3].map((game) => (
              <div key={game} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">vs Thunder Bolts</p>
                  <p className="text-sm text-gray-600">March 15, 2024</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-green-600">W 8-4</p>
                  <p className="text-sm text-gray-600">Home</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <button className="btn-outline btn-md justify-start">
              <BarChart3 className="h-4 w-4 mr-2" />
              Enter Game Stats
            </button>
            <button className="btn-outline btn-md justify-start">
              <Users className="h-4 w-4 mr-2" />
              Manage Roster
            </button>
            <button className="btn-outline btn-md justify-start">
              <Calendar className="h-4 w-4 mr-2" />
              View Schedule
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}