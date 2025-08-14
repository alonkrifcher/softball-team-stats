'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Season, Game } from '@/types';
import { formatDate } from '@/lib/utils';

const gameSchema = z.object({
  seasonId: z.number().int().min(1, 'Please select a season'),
  gameDate: z.string().min(1, 'Game date is required'),
  gameTime: z.string().min(1, 'Game time is required'),
  opponent: z.string().min(1, 'Opponent name is required'),
  homeAway: z.enum(['home', 'away']),
  location: z.string().optional(),
  notes: z.string().optional(),
});

type GameFormData = z.infer<typeof gameSchema>;

interface GameFormProps {
  initialData?: Game;
  onSubmit: (data: Omit<GameFormData, 'gameTime'> & { gameDate: string }) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export default function GameForm({ initialData, onSubmit, onCancel, isSubmitting = false }: GameFormProps) {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loadingSeasons, setLoadingSeasons] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<GameFormData>({
    resolver: zodResolver(gameSchema),
    defaultValues: initialData ? {
      seasonId: initialData.seasonId,
      gameDate: formatDate(initialData.gameDate),
      gameTime: new Date(initialData.gameDate).toTimeString().slice(0, 5),
      opponent: initialData.opponent,
      homeAway: initialData.homeAway,
      location: initialData.location || '',
      notes: initialData.notes || '',
    } : {
      homeAway: 'home',
    },
  });

  useEffect(() => {
    loadSeasons();
  }, []);

  const loadSeasons = async () => {
    try {
      const response = await fetch('/api/seasons');
      if (response.ok) {
        const data = await response.json();
        setSeasons(data.seasons);
        
        // Set active season as default for new games
        if (!initialData) {
          const activeSeason = data.seasons.find((s: Season) => s.isActive);
          if (activeSeason) {
            setValue('seasonId', activeSeason.id);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load seasons:', error);
    } finally {
      setLoadingSeasons(false);
    }
  };

  const handleFormSubmit = async (data: GameFormData) => {
    // Combine date and time into ISO string
    const gameDateTime = new Date(`${data.gameDate}T${data.gameTime}`).toISOString();
    
    await onSubmit({
      seasonId: data.seasonId,
      gameDate: gameDateTime,
      opponent: data.opponent,
      homeAway: data.homeAway,
      location: data.location,
      notes: data.notes,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="seasonId" className="block text-sm font-medium text-gray-700 mb-1">
            Season
          </label>
          <Select {...register('seasonId', { valueAsNumber: true })} disabled={loadingSeasons}>
            <option value="">Select season...</option>
            {seasons.map((season) => (
              <option key={season.id} value={season.id}>
                {season.name} ({season.year})
              </option>
            ))}
          </Select>
          {errors.seasonId && (
            <p className="text-sm text-red-600 mt-1">{errors.seasonId.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="opponent" className="block text-sm font-medium text-gray-700 mb-1">
            Opponent
          </label>
          <Input
            {...register('opponent')}
            type="text"
            placeholder="Thunder Bolts"
            disabled={isSubmitting}
          />
          {errors.opponent && (
            <p className="text-sm text-red-600 mt-1">{errors.opponent.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="gameDate" className="block text-sm font-medium text-gray-700 mb-1">
            Game Date
          </label>
          <Input
            {...register('gameDate')}
            type="date"
            disabled={isSubmitting}
          />
          {errors.gameDate && (
            <p className="text-sm text-red-600 mt-1">{errors.gameDate.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="gameTime" className="block text-sm font-medium text-gray-700 mb-1">
            Game Time
          </label>
          <Input
            {...register('gameTime')}
            type="time"
            disabled={isSubmitting}
          />
          {errors.gameTime && (
            <p className="text-sm text-red-600 mt-1">{errors.gameTime.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="homeAway" className="block text-sm font-medium text-gray-700 mb-1">
            Home/Away
          </label>
          <Select {...register('homeAway')} disabled={isSubmitting}>
            <option value="home">Home</option>
            <option value="away">Away</option>
          </Select>
          {errors.homeAway && (
            <p className="text-sm text-red-600 mt-1">{errors.homeAway.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
            Location (Optional)
          </label>
          <Input
            {...register('location')}
            type="text"
            placeholder="Memorial Park Field 1"
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
          Notes (Optional)
        </label>
        <textarea
          {...register('notes')}
          rows={3}
          className="input resize-none"
          placeholder="Any additional notes about the game..."
          disabled={isSubmitting}
        />
      </div>

      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : initialData ? 'Update Game' : 'Create Game'}
        </Button>
      </div>
    </form>
  );
}