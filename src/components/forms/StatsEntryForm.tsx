'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Player, Game, PlayerGameStats } from '@/types';
import { Plus, Minus, Save } from 'lucide-react';

const playerStatSchema = z.object({
  playerId: z.number().int().min(1, 'Please select a player'),
  battingOrder: z.number().int().min(1).max(15).optional(),
  atBats: z.number().int().min(0).default(0),
  hits: z.number().int().min(0).default(0),
  runs: z.number().int().min(0).default(0),
  rbis: z.number().int().min(0).default(0),
  walks: z.number().int().min(0).default(0),
  strikeouts: z.number().int().min(0).default(0),
  singles: z.number().int().min(0).default(0),
  doubles: z.number().int().min(0).default(0),
  triples: z.number().int().min(0).default(0),
  homeRuns: z.number().int().min(0).default(0),
  stolenBases: z.number().int().min(0).default(0),
  fieldingPosition: z.string().optional(),
  errors: z.number().int().min(0).default(0),
  assists: z.number().int().min(0).default(0),
  putouts: z.number().int().min(0).default(0),
});

const statsFormSchema = z.object({
  playerStats: z.array(playerStatSchema).min(1, 'At least one player is required'),
  ourScore: z.number().int().min(0).optional(),
  theirScore: z.number().int().min(0).optional(),
});

type StatsFormData = z.infer<typeof statsFormSchema>;

interface StatsEntryFormProps {
  game: Game;
  initialStats?: PlayerGameStats[];
  onSubmit: (data: StatsFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const positions = [
  'P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH', 'UTIL'
];

export default function StatsEntryForm({
  game,
  initialStats = [],
  onSubmit,
  onCancel,
  isSubmitting = false
}: StatsEntryFormProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(true);

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<StatsFormData>({
    resolver: zodResolver(statsFormSchema),
    defaultValues: {
      playerStats: initialStats.length > 0 
        ? initialStats.map(stat => ({
            playerId: stat.playerId,
            battingOrder: stat.battingOrder || undefined,
            atBats: stat.atBats,
            hits: stat.hits,
            runs: stat.runs,
            rbis: stat.rbis,
            walks: stat.walks,
            strikeouts: stat.strikeouts,
            singles: stat.singles,
            doubles: stat.doubles,
            triples: stat.triples,
            homeRuns: stat.homeRuns,
            stolenBases: stat.stolenBases,
            fieldingPosition: stat.fieldingPosition || '',
            errors: stat.errors,
            assists: stat.assists,
            putouts: stat.putouts,
          }))
        : [{ 
            playerId: 0, battingOrder: 1, atBats: 0, hits: 0, runs: 0, rbis: 0, 
            walks: 0, strikeouts: 0, singles: 0, doubles: 0, triples: 0, 
            homeRuns: 0, stolenBases: 0, fieldingPosition: '', errors: 0, 
            assists: 0, putouts: 0 
          }],
      ourScore: game.ourScore || undefined,
      theirScore: game.theirScore || undefined,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'playerStats',
  });

  useEffect(() => {
    loadPlayers();
  }, []);

  const loadPlayers = async () => {
    try {
      const response = await fetch('/api/players');
      if (response.ok) {
        const data = await response.json();
        setPlayers(data.players);
      }
    } catch (error) {
      console.error('Failed to load players:', error);
    } finally {
      setLoadingPlayers(false);
    }
  };

  const addPlayer = () => {
    const nextBattingOrder = fields.length + 1;
    append({
      playerId: 0,
      battingOrder: nextBattingOrder,
      atBats: 0,
      hits: 0,
      runs: 0,
      rbis: 0,
      walks: 0,
      strikeouts: 0,
      singles: 0,
      doubles: 0,
      triples: 0,
      homeRuns: 0,
      stolenBases: 0,
      fieldingPosition: '',
      errors: 0,
      assists: 0,
      putouts: 0,
    });
  };

  const removePlayer = (index: number) => {
    remove(index);
  };

  // Watch hits to validate against hit types
  const watchedStats = watch('playerStats');

  const validateHits = (index: number) => {
    const stats = watchedStats[index];
    if (!stats) return true;
    
    const totalHitTypes = stats.singles + stats.doubles + stats.triples + stats.homeRuns;
    return totalHitTypes <= stats.hits;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Enter Game Stats</h2>
          <p className="text-gray-600">
            {game.opponent} • {new Date(game.gameDate).toLocaleDateString()} • {game.homeAway === 'home' ? 'Home' : 'Away'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Game Score */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Final Score</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Our Score
              </label>
              <Input
                {...register('ourScore', { valueAsNumber: true })}
                type="number"
                min="0"
                placeholder="0"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Their Score
              </label>
              <Input
                {...register('theirScore', { valueAsNumber: true })}
                type="number"
                min="0"
                placeholder="0"
                disabled={isSubmitting}
              />
            </div>
          </div>
        </div>

        {/* Player Stats */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Player Statistics</h3>
            <Button
              type="button"
              variant="outline"
              
              onClick={addPlayer}
              disabled={isSubmitting}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Player
            </Button>
          </div>

          <div className="space-y-6">
            {fields.map((field, index) => {
              const currentStats = watchedStats[index];
              const hitsValid = validateHits(index);
              
              return (
                <div key={field.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium">Player {index + 1}</h4>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        
                        onClick={() => removePlayer(index)}
                        disabled={isSubmitting}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {/* Player Selection */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Player *
                      </label>
                      <Select
                        {...register(`playerStats.${index}.playerId`, { valueAsNumber: true })}
                        disabled={isSubmitting || loadingPlayers}
                      >
                        <option value={0}>Select player...</option>
                        {players.map((player) => (
                          <option key={player.id} value={player.id}>
                            #{player.jerseyNumber || '??'} {player.firstName} {player.lastName}
                          </option>
                        ))}
                      </Select>
                      {errors.playerStats?.[index]?.playerId && (
                        <p className="text-sm text-red-600 mt-1">
                          {errors.playerStats[index]?.playerId?.message}
                        </p>
                      )}
                    </div>

                    {/* Batting Order */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Order
                      </label>
                      <Input
                        {...register(`playerStats.${index}.battingOrder`, { valueAsNumber: true })}
                        type="number"
                        min="1"
                        max="15"
                        disabled={isSubmitting}
                      />
                    </div>

                    {/* Position */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Position
                      </label>
                      <Select
                        {...register(`playerStats.${index}.fieldingPosition`)}
                        disabled={isSubmitting}
                      >
                        <option value="">Select...</option>
                        {positions.map((pos) => (
                          <option key={pos} value={pos}>{pos}</option>
                        ))}
                      </Select>
                    </div>
                  </div>

                  {/* Batting Stats */}
                  <div className="mt-4">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Batting</h5>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">AB</label>
                        <Input
                          {...register(`playerStats.${index}.atBats`, { valueAsNumber: true })}
                          type="number"
                          min="0"
                          disabled={isSubmitting}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">H</label>
                        <Input
                          {...register(`playerStats.${index}.hits`, { valueAsNumber: true })}
                          type="number"
                          min="0"
                          className={!hitsValid ? 'border-red-500' : ''}
                          disabled={isSubmitting}
                        />
                        {!hitsValid && (
                          <p className="text-xs text-red-500">Hits must ≥ hit types</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">R</label>
                        <Input
                          {...register(`playerStats.${index}.runs`, { valueAsNumber: true })}
                          type="number"
                          min="0"
                          disabled={isSubmitting}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">RBI</label>
                        <Input
                          {...register(`playerStats.${index}.rbis`, { valueAsNumber: true })}
                          type="number"
                          min="0"
                          disabled={isSubmitting}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">BB</label>
                        <Input
                          {...register(`playerStats.${index}.walks`, { valueAsNumber: true })}
                          type="number"
                          min="0"
                          disabled={isSubmitting}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">K</label>
                        <Input
                          {...register(`playerStats.${index}.strikeouts`, { valueAsNumber: true })}
                          type="number"
                          min="0"
                          disabled={isSubmitting}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">SB</label>
                        <Input
                          {...register(`playerStats.${index}.stolenBases`, { valueAsNumber: true })}
                          type="number"
                          min="0"
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Hit Types */}
                  <div className="mt-4">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Hit Types</h5>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">1B</label>
                        <Input
                          {...register(`playerStats.${index}.singles`, { valueAsNumber: true })}
                          type="number"
                          min="0"
                          disabled={isSubmitting}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">2B</label>
                        <Input
                          {...register(`playerStats.${index}.doubles`, { valueAsNumber: true })}
                          type="number"
                          min="0"
                          disabled={isSubmitting}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">3B</label>
                        <Input
                          {...register(`playerStats.${index}.triples`, { valueAsNumber: true })}
                          type="number"
                          min="0"
                          disabled={isSubmitting}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">HR</label>
                        <Input
                          {...register(`playerStats.${index}.homeRuns`, { valueAsNumber: true })}
                          type="number"
                          min="0"
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Fielding Stats */}
                  <div className="mt-4">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Fielding</h5>
                    <div className="grid grid-cols-3 gap-3 max-w-md">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">E</label>
                        <Input
                          {...register(`playerStats.${index}.errors`, { valueAsNumber: true })}
                          type="number"
                          min="0"
                          disabled={isSubmitting}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">A</label>
                        <Input
                          {...register(`playerStats.${index}.assists`, { valueAsNumber: true })}
                          type="number"
                          min="0"
                          disabled={isSubmitting}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">PO</label>
                        <Input
                          {...register(`playerStats.${index}.putouts`, { valueAsNumber: true })}
                          type="number"
                          min="0"
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </div>
            ) : (
              <div className="flex items-center">
                <Save className="h-4 w-4 mr-2" />
                Save Stats
              </div>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}