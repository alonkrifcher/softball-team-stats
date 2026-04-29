import nodeIcal from 'node-ical';

export type ParsedEvent = {
  uid: string;
  summary: string;
  start: Date;
  end?: Date;
  location?: string;
  opponent?: string;
};

const TEAM_NAMES = ['underhand jobs', 'uhj'];

export function extractOpponent(summary: string): string | undefined {
  if (!summary) return undefined;
  let s = summary.trim();

  // TeamSideline current format: " Vs <Opponent> (<Our Team>)"
  const m = s.match(/^Vs\s+(.+?)\s*\([^)]*\)\s*$/i);
  if (m) return m[1].trim();

  // Fallback: "<League> - <Home> vs <Away>" or "<Home> vs <Away>"
  const dashIdx = s.indexOf(' - ');
  if (dashIdx !== -1) s = s.slice(dashIdx + 3).trim();
  const parts = s.split(/\s+vs\.?\s+/i);
  if (parts.length < 2) return undefined;
  const a = parts[0].trim();
  const b = parts[1].trim();
  const aIsUs = TEAM_NAMES.some((n) => a.toLowerCase().includes(n));
  const bIsUs = TEAM_NAMES.some((n) => b.toLowerCase().includes(n));
  if (aIsUs && !bIsUs) return b;
  if (bIsUs && !aIsUs) return a;
  return b;
}

// "Midtown and General - CP North Meadow 07, 96th Street & ..."
// → "CP North Meadow 07, 96th Street & ..."
export function cleanLocation(loc?: string): string | undefined {
  if (!loc) return undefined;
  const trimmed = loc.trim();
  const dash = trimmed.indexOf(' - ');
  if (dash !== -1 && dash < 40) {
    return trimmed.slice(dash + 3).trim();
  }
  return trimmed;
}

export async function fetchIcal(url: string): Promise<ParsedEvent[]> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  let res: Response;
  try {
    res = await fetch(url, { cache: 'no-store', signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) throw new Error(`iCal fetch failed: ${res.status}`);
  const text = await res.text();
  const data = nodeIcal.sync.parseICS(text);

  const events: ParsedEvent[] = [];
  for (const k of Object.keys(data)) {
    const v = data[k];
    if (v.type !== 'VEVENT') continue;
    const summary = (v.summary ?? '').toString();
    const start = v.start as Date;
    if (!start) continue;
    events.push({
      uid: (v.uid ?? k).toString(),
      summary,
      start,
      end: v.end as Date | undefined,
      location: cleanLocation(v.location?.toString()),
      opponent: extractOpponent(summary),
    });
  }
  events.sort((a, b) => a.start.getTime() - b.start.getTime());
  return events;
}
