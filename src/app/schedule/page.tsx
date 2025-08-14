'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';

export default function SchedulePage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Schedule</h1>
          <p className="text-gray-600">Team game schedule and calendar</p>
        </div>

        <div className="card p-6">
          <div className="text-center py-12">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Schedule Coming Soon</h2>
            <p className="text-gray-600">
              Google Calendar integration will be available in the next update.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              For now, you can create and view games in the Stats section.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}