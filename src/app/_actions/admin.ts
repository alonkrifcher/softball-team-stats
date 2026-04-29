'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { battingLines, games, playerAliases, players, scoresheetUploads, seasons } from '@/lib/db/schema';
import { requireAdmin } from '@/lib/auth/guards';
import { syncSeasonIcal } from '@/lib/ical-sync';
import { logAudit } from '@/lib/audit';
import { slugify } from '@/lib/utils';
import { parseScoresheetImage, ScoresheetSchema, sanityCheckRow } from '@/lib/ocr';
import { downloadScoresheet, uploadScoresheet, BUCKET } from '@/lib/storage';
import { randomUUID } from 'node:crypto';

const BattingLineSchema = z.object({
  playerId: z.string().uuid(),
  ab: z.coerce.number().int().nonnegative(),
  r: z.coerce.number().int().nonnegative(),
  h: z.coerce.number().int().nonnegative(),
  singles: z.coerce.number().int().nonnegative(),
  doubles: z.coerce.number().int().nonnegative(),
  triples: z.coerce.number().int().nonnegative(),
  hr: z.coerce.number().int().nonnegative(),
  rbi: z.coerce.number().int().nonnegative(),
  bb: z.coerce.number().int().nonnegative(),
  k: z.coerce.number().int().nonnegative(),
  sac: z.coerce.number().int().nonnegative(),
});

const GameUpdateSchema = z.object({
  gameId: z.string().uuid(),
  playedOn: z.string().optional(),
  opponent: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  uhjRuns: z.coerce.number().int().nullable().optional(),
  oppRuns: z.coerce.number().int().nullable().optional(),
  result: z.enum(['W', 'L', 'T']).nullable().optional(),
  status: z.enum(['scheduled', 'final', 'historical', 'cancelled']).optional(),
  notes: z.string().nullable().optional(),
});

const PlayerSchema = z.object({
  id: z.string().uuid().optional(),
  displayName: z.string().min(1),
  gender: z.enum(['M', 'F']),
  active: z.coerce.boolean().default(true),
  jerseyNumber: z.coerce.number().int().nullable().optional(),
});

export async function createGame(formData: FormData) {
  await requireAdmin();
  const seasonId = String(formData.get('seasonId'));
  const playedOn = String(formData.get('playedOn'));
  const opponent = (formData.get('opponent') as string) || null;
  const location = (formData.get('location') as string) || null;
  const [row] = await db
    .insert(games)
    .values({ seasonId, playedOn, opponent, location, status: 'scheduled' })
    .returning();
  await logAudit('admin', 'create_game', row.id);
  revalidatePath('/admin/games');
  revalidatePath('/schedule');
  return row.id;
}

export async function updateGame(formData: FormData) {
  await requireAdmin();
  const args = GameUpdateSchema.parse({
    gameId: formData.get('gameId'),
    playedOn: formData.get('playedOn') ?? undefined,
    opponent: formData.get('opponent') ?? undefined,
    location: formData.get('location') ?? undefined,
    uhjRuns: formData.get('uhjRuns') ?? undefined,
    oppRuns: formData.get('oppRuns') ?? undefined,
    result: (formData.get('result') as string) || undefined,
    status: (formData.get('status') as string) || undefined,
    notes: formData.get('notes') ?? undefined,
  });

  const set: Record<string, unknown> = { updatedAt: new Date() };
  for (const k of ['playedOn', 'opponent', 'location', 'uhjRuns', 'oppRuns', 'result', 'status', 'notes'] as const) {
    if (args[k] !== undefined) set[k] = args[k];
  }

  // Auto derive result from runs if status is final
  if (args.status === 'final' && args.uhjRuns != null && args.oppRuns != null && !args.result) {
    set.result = args.uhjRuns > args.oppRuns ? 'W' : args.uhjRuns < args.oppRuns ? 'L' : 'T';
  }

  await db.update(games).set(set).where(eq(games.id, args.gameId));
  await logAudit('admin', 'update_game', args.gameId, set);
  revalidatePath(`/admin/games/${args.gameId}`);
  revalidatePath(`/schedule/${args.gameId}`);
  revalidatePath('/schedule');
  revalidatePath('/');
}

export async function saveBattingLines(gameId: string, lines: unknown) {
  await requireAdmin();
  const arr = z.array(BattingLineSchema).parse(lines);

  // Derive singles when missing
  const cleaned = arr.map((l) => ({
    ...l,
    singles: l.singles || Math.max(0, l.h - l.doubles - l.triples - l.hr),
  }));

  for (const l of cleaned) {
    if (l.h !== l.singles + l.doubles + l.triples + l.hr) {
      throw new Error(`Hit total mismatch for player ${l.playerId}: H=${l.h} 1B+2B+3B+HR=${l.singles + l.doubles + l.triples + l.hr}`);
    }
    if (l.ab < l.h + l.k) {
      throw new Error(`AB too small for player ${l.playerId}: AB=${l.ab} H=${l.h} K=${l.k}`);
    }
  }

  for (const l of cleaned) {
    const ex = await db
      .select()
      .from(battingLines)
      .where(and(eq(battingLines.gameId, gameId), eq(battingLines.playerId, l.playerId)))
      .limit(1);
    if (ex.length) {
      await db
        .update(battingLines)
        .set({
          ab: l.ab,
          r: l.r,
          h: l.h,
          singles: l.singles,
          doubles: l.doubles,
          triples: l.triples,
          hr: l.hr,
          rbi: l.rbi,
          bb: l.bb,
          k: l.k,
          sac: l.sac,
          source: 'manual',
          updatedAt: new Date(),
        })
        .where(eq(battingLines.id, ex[0].id));
    } else {
      await db.insert(battingLines).values({
        gameId,
        playerId: l.playerId,
        ab: l.ab,
        r: l.r,
        h: l.h,
        singles: l.singles,
        doubles: l.doubles,
        triples: l.triples,
        hr: l.hr,
        rbi: l.rbi,
        bb: l.bb,
        k: l.k,
        sac: l.sac,
        source: 'manual',
      });
    }
  }
  await logAudit('admin', 'save_batting_lines', gameId, { count: cleaned.length });
  revalidatePath(`/admin/games/${gameId}`);
  revalidatePath(`/schedule/${gameId}`);
  revalidatePath('/stats');
}

export async function upsertPlayer(formData: FormData) {
  await requireAdmin();
  const args = PlayerSchema.parse({
    id: (formData.get('id') as string) || undefined,
    displayName: formData.get('displayName'),
    gender: formData.get('gender'),
    active: formData.get('active') === 'on' || formData.get('active') === 'true' || !formData.get('id'),
    jerseyNumber: formData.get('jerseyNumber') ? Number(formData.get('jerseyNumber')) : null,
  });

  if (args.id) {
    await db
      .update(players)
      .set({
        displayName: args.displayName,
        gender: args.gender,
        active: args.active,
        jerseyNumber: args.jerseyNumber ?? null,
        updatedAt: new Date(),
      })
      .where(eq(players.id, args.id));
  } else {
    const baseSlug = slugify(args.displayName);
    let slug = baseSlug;
    let i = 2;
    while ((await db.select().from(players).where(eq(players.slug, slug)).limit(1)).length) {
      slug = `${baseSlug}-${i++}`;
    }
    const [p] = await db
      .insert(players)
      .values({
        displayName: args.displayName,
        slug,
        gender: args.gender,
        active: args.active,
        jerseyNumber: args.jerseyNumber ?? null,
      })
      .returning();
    await db.insert(playerAliases).values({ playerId: p.id, alias: args.displayName }).onConflictDoNothing();
  }
  revalidatePath('/admin/players');
  revalidatePath('/roster');
}

export async function addAlias(playerId: string, alias: string) {
  await requireAdmin();
  await db.insert(playerAliases).values({ playerId, alias }).onConflictDoNothing();
  revalidatePath('/admin/players');
}

export async function setPlayerActive(playerId: string, active: boolean) {
  await requireAdmin();
  await db.update(players).set({ active, updatedAt: new Date() }).where(eq(players.id, playerId));
  revalidatePath('/admin/players');
  revalidatePath('/roster');
}

export async function bulkSetPlayerActive(playerIds: string[], active: boolean) {
  await requireAdmin();
  if (!playerIds.length) return;
  for (const id of playerIds) {
    await db.update(players).set({ active, updatedAt: new Date() }).where(eq(players.id, id));
  }
  revalidatePath('/admin/players');
  revalidatePath('/roster');
}

export async function syncSeason(seasonId: string) {
  await requireAdmin();
  const s = await db.select().from(seasons).where(eq(seasons.id, seasonId)).limit(1);
  if (!s.length || !s[0].icalUrl) throw new Error('Season has no iCal URL');
  const result = await syncSeasonIcal(seasonId, s[0].icalUrl);
  revalidatePath(`/admin/seasons/${seasonId}`);
  revalidatePath('/schedule');
  return result;
}

export async function setSeasonIcal(seasonId: string, url: string) {
  await requireAdmin();
  await db.update(seasons).set({ icalUrl: url }).where(eq(seasons.id, seasonId));
  revalidatePath(`/admin/seasons/${seasonId}`);
}

export async function setCurrentSeason(seasonId: string) {
  await requireAdmin();
  await db.update(seasons).set({ isCurrent: false }).where(eq(seasons.isCurrent, true));
  await db.update(seasons).set({ isCurrent: true }).where(eq(seasons.id, seasonId));
  revalidatePath('/admin/seasons');
}

const UploadInitSchema = z.object({
  gameId: z.string().uuid(),
});

export async function ingestScoresheet(formData: FormData) {
  await requireAdmin();
  const { gameId } = UploadInitSchema.parse({ gameId: formData.get('gameId') });
  const file = formData.get('file');
  if (!(file instanceof File)) throw new Error('file required');
  const arrayBuf = await file.arrayBuffer();
  const buf = Buffer.from(arrayBuf);
  const ext = file.type === 'image/png' ? 'png' : 'jpg';
  const key = `scoresheets/${gameId}/${randomUUID()}.${ext}`;
  await uploadScoresheet(key, buf, file.type || 'image/jpeg');

  const [up] = await db
    .insert(scoresheetUploads)
    .values({ gameId, storageKey: key, status: 'pending' })
    .returning();
  await logAudit('admin', 'upload_scoresheet', up.id, { storageKey: key, bucket: BUCKET });

  // Kick off parse synchronously (server action). Skip on failure — admin can retry.
  try {
    await parseUpload(up.id);
  } catch (e) {
    console.error('parse failed:', e);
  }

  revalidatePath(`/admin/games/${gameId}/scoresheet`);
  return up.id;
}

export async function parseUpload(uploadId: string) {
  await requireAdmin();
  const [up] = await db.select().from(scoresheetUploads).where(eq(scoresheetUploads.id, uploadId)).limit(1);
  if (!up) throw new Error('upload not found');

  const roster = await db
    .select({ slug: players.slug, display_name: players.displayName, gender: players.gender })
    .from(players)
    .where(eq(players.active, true));

  try {
    const buf = await downloadScoresheet(up.storageKey);
    const ext = up.storageKey.toLowerCase();
    const mediaType: 'image/jpeg' | 'image/png' | 'image/webp' =
      ext.endsWith('.png') ? 'image/png' : ext.endsWith('.webp') ? 'image/webp' : 'image/jpeg';
    const { parsed, usage } = await parseScoresheetImage({
      imageBytes: buf,
      mediaType,
      roster: roster.map((r) => ({ slug: r.slug, display_name: r.display_name, gender: r.gender as 'M' | 'F' })),
    });

    await db
      .update(scoresheetUploads)
      .set({ parsedJson: parsed, status: 'parsed', errorMessage: null })
      .where(eq(scoresheetUploads.id, uploadId));

    await logAudit('admin', 'parse_scoresheet', uploadId, { usage });
  } catch (e) {
    await db
      .update(scoresheetUploads)
      .set({ status: 'failed', errorMessage: (e as Error).message })
      .where(eq(scoresheetUploads.id, uploadId));
    throw e;
  }
  revalidatePath(`/admin/games/.+/scoresheet`);
}

const CommitSchema = z.object({
  uploadId: z.string().uuid(),
  parsed: z.unknown(),
  game_meta: z.object({
    opponent: z.string().nullable().optional(),
    uhj_runs: z.coerce.number().int().nullable().optional(),
    opp_runs: z.coerce.number().int().nullable().optional(),
  }),
});

export async function commitScoresheet(uploadId: string, parsedRaw: unknown, meta: { opponent?: string | null; uhj_runs?: number | null; opp_runs?: number | null }) {
  await requireAdmin();
  CommitSchema.parse({ uploadId, parsed: parsedRaw, game_meta: meta });

  const parsed = ScoresheetSchema.parse(parsedRaw);
  const [up] = await db.select().from(scoresheetUploads).where(eq(scoresheetUploads.id, uploadId)).limit(1);
  if (!up || !up.gameId) throw new Error('upload missing game');

  // Validate every row
  for (const row of parsed.players) {
    const issues = sanityCheckRow(row);
    if (issues.length) throw new Error(`Sanity check failed for ${row.name_as_written}: ${issues.join(', ')}`);
    if (!row.matched_player_slug) throw new Error(`Unmatched player: ${row.name_as_written}`);
  }

  // Map slug -> player id
  const slugs = parsed.players.map((p) => p.matched_player_slug!).filter(Boolean);
  const playersBySlug = new Map<string, string>();
  for (const slug of slugs) {
    const [p] = await db.select().from(players).where(eq(players.slug, slug)).limit(1);
    if (!p) throw new Error(`unknown slug: ${slug}`);
    playersBySlug.set(slug, p.id);
  }

  // Upsert lines (source = ocr)
  for (const r of parsed.players) {
    const playerId = playersBySlug.get(r.matched_player_slug!)!;
    const ex = await db
      .select()
      .from(battingLines)
      .where(and(eq(battingLines.gameId, up.gameId!), eq(battingLines.playerId, playerId)))
      .limit(1);
    const values = {
      gameId: up.gameId!,
      playerId,
      ab: r.ab,
      r: r.r,
      h: r.h,
      singles: r.singles,
      doubles: r.doubles,
      triples: r.triples,
      hr: r.hr,
      rbi: r.rbi,
      bb: r.bb,
      k: r.k,
      sac: r.sac,
      source: 'ocr' as const,
      updatedAt: new Date(),
    };
    if (ex.length) {
      await db.update(battingLines).set(values).where(eq(battingLines.id, ex[0].id));
    } else {
      await db.insert(battingLines).values(values);
    }
  }

  // Update game meta
  const set: Record<string, unknown> = { updatedAt: new Date() };
  if (meta.opponent !== undefined) set.opponent = meta.opponent;
  if (meta.uhj_runs !== undefined) set.uhjRuns = meta.uhj_runs;
  if (meta.opp_runs !== undefined) set.oppRuns = meta.opp_runs;
  if (meta.uhj_runs != null && meta.opp_runs != null) {
    set.result = meta.uhj_runs > meta.opp_runs ? 'W' : meta.uhj_runs < meta.opp_runs ? 'L' : 'T';
    set.status = 'final';
  }
  await db.update(games).set(set).where(eq(games.id, up.gameId!));

  await db
    .update(scoresheetUploads)
    .set({ status: 'committed', committedAt: new Date() })
    .where(eq(scoresheetUploads.id, uploadId));

  await logAudit('admin', 'commit_scoresheet', uploadId, { gameId: up.gameId });
  revalidatePath(`/admin/games/${up.gameId}/scoresheet`);
  revalidatePath(`/schedule/${up.gameId}`);
  revalidatePath('/stats');
}

export async function rejectScoresheet(uploadId: string) {
  await requireAdmin();
  await db
    .update(scoresheetUploads)
    .set({ status: 'rejected' })
    .where(eq(scoresheetUploads.id, uploadId));
  await logAudit('admin', 'reject_scoresheet', uploadId);
}
