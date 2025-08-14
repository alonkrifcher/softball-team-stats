'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Search, Trophy, Calendar, BarChart3, Users, MapPin } from 'lucide-react';

interface PlayerStats {
  atBats: number;
  hits: number;
  runs: number;
  rbis: number;
  walks: number;
  strikeouts: number;
  doubles: number;
  triples: number;
  homeRuns: number;
  stolenBases: number;
  battingAverage: number;
  onBasePercentage: number;
}

interface Player {
  name: string;
  totalGames: number;
  seasonsPlayed: number;
  firstSeason: number;
  lastSeason: number;
  seasonsList: string;
  positionsPlayed: string;
  stats: PlayerStats;
}

interface RosterResponse {
  success: boolean;
  players: Player[];
  totalPlayers: number;
}

export default function RosterPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'games' | 'average' | 'seasons'>('games');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadRoster();
  }, []);

  useEffect(() => {
    filterAndSortPlayers();
  }, [players, searchTerm, sortBy, sortOrder]);

  const loadRoster = async () => {
    try {
      const response = await fetch('/api/roster');
      if (response.ok) {
        const data: RosterResponse = await response.json();
        setPlayers(data.players);
      } else {
        console.error('Failed to load roster');
      }
    } catch (error) {
      console.error('Error loading roster:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortPlayers = () => {
    let filtered = players.filter(player =>
      player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.positionsPlayed.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'games':
          aValue = a.totalGames;
          bValue = b.totalGames;
          break;
        case 'average':
          aValue = a.stats.battingAverage;
          bValue = b.stats.battingAverage;
          break;
        case 'seasons':
          aValue = a.seasonsPlayed;
          bValue = b.seasonsPlayed;
          break;
        default:
          aValue = a.totalGames;
          bValue = b.totalGames;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredPlayers(filtered);
  };

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (field: typeof sortBy) => {
    if (sortBy !== field) return '↕️';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Roster</h1>
            <p className="text-gray-600">All-time team roster</p>
          </div>
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading roster...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Roster</h1>
          <p className="text-gray-600">All-time team roster ({players.length} players)</p>
        </div>

        {/* Search and Filters */}
        <div className="card p-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search players or positions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field as typeof sortBy);
                  setSortOrder(order as 'asc' | 'desc');
                }}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="games-desc">Most Games</option>
                <option value="games-asc">Least Games</option>
                <option value="average-desc">Highest Average</option>
                <option value="average-asc">Lowest Average</option>
                <option value="seasons-desc">Most Seasons</option>
                <option value="seasons-asc">Least Seasons</option>
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Roster Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    onClick={() => handleSort('name')}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    Player {getSortIcon('name')}
                  </th>
                  <th 
                    onClick={() => handleSort('games')}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    Games {getSortIcon('games')}
                  </th>
                  <th 
                    onClick={() => handleSort('seasons')}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    Seasons {getSortIcon('seasons')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Years Active
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Position(s)
                  </th>
                  <th 
                    onClick={() => handleSort('average')}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    AVG {getSortIcon('average')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Career Stats
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPlayers.map((player) => (
                  <tr key={player.name} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{player.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <BarChart3 className="h-4 w-4 text-blue-600 mr-2" />
                        <span className="text-sm text-gray-900 font-medium">{player.totalGames}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-green-600 mr-2" />
                        <span className="text-sm text-gray-900 font-medium">{player.seasonsPlayed}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {player.firstSeason === player.lastSeason 
                        ? player.firstSeason 
                        : `${player.firstSeason}-${player.lastSeason}`
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 text-purple-600 mr-2" />
                        <span className="text-sm text-gray-600">{player.positionsPlayed}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {player.stats.battingAverage.toFixed(3)}
                      </div>
                      <div className="text-xs text-gray-500">
                        OBP: {player.stats.onBasePercentage.toFixed(3)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600">
                      <div className="grid grid-cols-3 gap-1">
                        <div>H: {player.stats.hits}</div>
                        <div>R: {player.stats.runs}</div>
                        <div>RBI: {player.stats.rbis}</div>
                        <div>2B: {player.stats.doubles}</div>
                        <div>3B: {player.stats.triples}</div>
                        <div>HR: {player.stats.homeRuns}</div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredPlayers.length === 0 && searchTerm && (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No players found matching "{searchTerm}"</p>
          </div>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Players</p>
                <p className="text-2xl font-bold text-gray-900">{players.length}</p>
              </div>
            </div>
          </div>
          
          <div className="card p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Active Years</p>
                <p className="text-2xl font-bold text-gray-900">
                  {players.length > 0 
                    ? `${Math.min(...players.map(p => p.firstSeason))}-${Math.max(...players.map(p => p.lastSeason))}`
                    : 'N/A'
                  }
                </p>
              </div>
            </div>
          </div>
          
          <div className="card p-6">
            <div className="flex items-center">
              <Trophy className="h-8 w-8 text-yellow-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Most Games</p>
                <p className="text-2xl font-bold text-gray-900">
                  {players.length > 0 ? Math.max(...players.map(p => p.totalGames)) : 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}