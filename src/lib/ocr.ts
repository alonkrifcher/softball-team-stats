import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

export const ScoresheetSchema = z.object({
  game_meta: z.object({
    date_iso: z.string().optional(),
    opponent: z.string().optional(),
    uhj_runs: z.number().int().nonnegative().optional(),
    opp_runs: z.number().int().nonnegative().optional(),
  }),
  players: z.array(
    z.object({
      name_as_written: z.string(),
      matched_player_slug: z.string().nullable(),
      ab: z.number().int().nonnegative(),
      r: z.number().int().nonnegative(),
      h: z.number().int().nonnegative(),
      singles: z.number().int().nonnegative(),
      doubles: z.number().int().nonnegative(),
      triples: z.number().int().nonnegative(),
      hr: z.number().int().nonnegative(),
      rbi: z.number().int().nonnegative(),
      bb: z.number().int().nonnegative(),
      k: z.number().int().nonnegative(),
      sac: z.number().int().nonnegative(),
      confidence: z.number().min(0).max(1),
    })
  ),
  inning_runs: z.array(z.number().int().nonnegative()).optional(),
  page_quality: z.enum(['good', 'marginal', 'poor']),
  parser_notes: z.string().optional(),
});

export type ParsedScoresheet = z.infer<typeof ScoresheetSchema>;

const TOOL_INPUT_SCHEMA = {
  type: 'object',
  properties: {
    game_meta: {
      type: 'object',
      properties: {
        date_iso: { type: 'string' },
        opponent: { type: 'string' },
        uhj_runs: { type: 'integer', minimum: 0 },
        opp_runs: { type: 'integer', minimum: 0 },
      },
    },
    players: {
      type: 'array',
      items: {
        type: 'object',
        required: [
          'name_as_written',
          'matched_player_slug',
          'ab',
          'r',
          'h',
          'singles',
          'doubles',
          'triples',
          'hr',
          'rbi',
          'bb',
          'k',
          'sac',
          'confidence',
        ],
        properties: {
          name_as_written: { type: 'string' },
          matched_player_slug: { type: ['string', 'null'] },
          ab: { type: 'integer', minimum: 0 },
          r: { type: 'integer', minimum: 0 },
          h: { type: 'integer', minimum: 0 },
          singles: { type: 'integer', minimum: 0 },
          doubles: { type: 'integer', minimum: 0 },
          triples: { type: 'integer', minimum: 0 },
          hr: { type: 'integer', minimum: 0 },
          rbi: { type: 'integer', minimum: 0 },
          bb: { type: 'integer', minimum: 0 },
          k: { type: 'integer', minimum: 0 },
          sac: { type: 'integer', minimum: 0 },
          confidence: { type: 'number', minimum: 0, maximum: 1 },
        },
      },
    },
    inning_runs: { type: 'array', items: { type: 'integer', minimum: 0 } },
    page_quality: { type: 'string', enum: ['good', 'marginal', 'poor'] },
    parser_notes: { type: 'string' },
  },
  required: ['game_meta', 'players', 'page_quality'],
} as const;

type Roster = { slug: string; display_name: string; gender: 'M' | 'F' }[];

export type OcrResult = { parsed: ParsedScoresheet; usage: { input_tokens: number; output_tokens: number; cache_read_input_tokens?: number } };

export async function parseScoresheetImage(opts: {
  imageBytes: Buffer;
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp';
  roster: Roster;
}): Promise<OcrResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY required');
  const model = process.env.OCR_MODEL || 'claude-sonnet-4-5';

  const client = new Anthropic({ apiKey });

  const rosterLines = opts.roster
    .map((p) => `- ${p.display_name} (${p.gender}) — slug: ${p.slug}`)
    .join('\n');

  const systemBlocks = [
    {
      type: 'text' as const,
      text:
        `You read photos of hand-filled paper softball scorebook pages and emit a structured batting line per player.\n\n` +
        `RULES:\n` +
        `- Always call the submit_scoresheet tool. Do not reply in text.\n` +
        `- "h" = singles + doubles + triples + hr. Re-derive if necessary.\n` +
        `- "ab" must be >= h + k. If ambiguous, choose the smaller plausible ab.\n` +
        `- If a name doesn't match any roster slug below, set matched_player_slug to null.\n` +
        `- confidence 0..1 — drop below 0.7 when handwriting or numbers are unclear.\n` +
        `- page_quality: good if every cell readable, marginal if a few cells unclear, poor if many cells unclear.\n\n` +
        `ROSTER (canonical slugs):\n${rosterLines}\n`,
      cache_control: { type: 'ephemeral' as const },
    },
  ];

  const resp = await client.messages.create({
    model,
    max_tokens: 4096,
    system: systemBlocks,
    tools: [
      {
        name: 'submit_scoresheet',
        description: 'Submit a parsed softball scoresheet.',
        input_schema: TOOL_INPUT_SCHEMA as unknown as Anthropic.Messages.Tool['input_schema'],
      },
    ],
    tool_choice: { type: 'tool', name: 'submit_scoresheet' },
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: opts.mediaType, data: opts.imageBytes.toString('base64') },
          },
          { type: 'text', text: 'Parse this scoresheet page and submit it via the tool.' },
        ],
      },
    ],
  });

  const toolUse = resp.content.find((c) => c.type === 'tool_use');
  if (!toolUse || toolUse.type !== 'tool_use') {
    throw new Error('Model did not return a tool_use block');
  }
  const parsed = ScoresheetSchema.parse(toolUse.input);

  return {
    parsed,
    usage: {
      input_tokens: resp.usage.input_tokens,
      output_tokens: resp.usage.output_tokens,
      cache_read_input_tokens: (resp.usage as { cache_read_input_tokens?: number }).cache_read_input_tokens,
    },
  };
}

export function sanityCheckRow(row: ParsedScoresheet['players'][number]) {
  const issues: string[] = [];
  if (row.h !== row.singles + row.doubles + row.triples + row.hr) issues.push('h ≠ 1B+2B+3B+HR');
  if (row.ab < row.h + row.k) issues.push('ab < h+k');
  return issues;
}
