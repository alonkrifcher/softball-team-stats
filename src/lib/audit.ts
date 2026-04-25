import { db } from '@/lib/db';
import { auditLog } from '@/lib/db/schema';

export async function logAudit(actor: string, action: string, target?: string, details?: unknown) {
  await db.insert(auditLog).values({
    actor,
    action,
    target,
    details: (details as object | null) ?? null,
  });
}
