'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  BarChart3, 
  Calendar, 
  Users, 
  Settings, 
  LogOut,
  Menu,
  X,
  Home,
  History,
  Trophy
} from 'lucide-react';
import { User } from '@/types';

interface NavigationProps {
  user: User;
}

export default function Navigation({ user }: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 1024);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Current Stats', href: '/stats', icon: BarChart3 },
    { name: 'All-Time Stats', href: '/all-time-stats', icon: Trophy },
    { name: 'History', href: '/history', icon: History },
    { name: 'Schedule', href: '/schedule', icon: Calendar },
    { name: 'Roster', href: '/roster', icon: Users },
  ];

  // Add admin/manager specific navigation
  if (['admin', 'manager'].includes(user.role)) {
    navigation.push({ name: 'Settings', href: '/settings', icon: Settings });
  }

  // Filter navigation for players (read-only access)
  const filteredNavigation = user.role === 'player' 
    ? navigation.filter(item => !['Settings'].includes(item.name))
    : navigation;

  return (
    <>
      {/* Mobile header */}
      {!isLargeScreen && (
        <div className="bg-white shadow-sm border-b px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">UHJ Homepage</h1>
          <button
            type="button"
            className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      )}

      {/* Navigation Sidebar */}
      <nav 
        className={`bg-white shadow-sm border-b w-64 flex flex-col overflow-y-auto transition-all duration-200 ${
          isLargeScreen 
            ? 'fixed inset-y-0 z-40' 
            : isMobileMenuOpen 
              ? 'fixed inset-y-0 z-50' 
              : 'hidden'
        }`}
      >
        {isLargeScreen && (
          <div className="px-6 py-4">
            <h1 className="text-xl font-bold text-gray-900">UHJ Homepage</h1>
          </div>
        )}

        <div className="flex flex-col flex-1">
          <nav className="flex-1 space-y-1 px-4 pb-4">
            {filteredNavigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    group flex items-center px-3 py-2 text-sm font-medium rounded-md
                    ${isActive
                      ? 'bg-primary text-white'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                    }
                  `}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Icon
                    className={`
                      mr-3 h-5 w-5 flex-shrink-0
                      ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-500'}
                    `}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User Profile */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user.firstName[0]}{user.lastName[0]}
                  </span>
                </div>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-700">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-gray-500 capitalize">{user.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="ml-3 p-1 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile backdrop */}
      {isMobileMenuOpen && !isLargeScreen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
        </div>
      )}
    </>
  );
}