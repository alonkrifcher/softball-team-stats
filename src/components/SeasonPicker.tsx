'use client';

import { useRouter } from 'next/navigation';

type Season = { id: string; year: number; label: string; isCurrent: boolean };

export function SeasonPicker({ seasons, selectedYear, basePath }: { seasons: Season[]; selectedYear: number; basePath: string }) {
  const router = useRouter();
  return (
    <select
      className="input w-auto"
      value={selectedYear}
      onChange={(e) => router.push(`${basePath}/${e.target.value}`)}
    >
      {seasons.map((s) => (
        <option key={s.id} value={s.year}>
          {s.label}
          {s.isCurrent ? ' (current)' : ''}
        </option>
      ))}
    </select>
  );
}
