import { createClient } from '@supabase/supabase-js';

let client: ReturnType<typeof createClient> | null = null;

export function getStorage() {
  if (client) return client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required');
  client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

export const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'scoresheets';

export async function uploadScoresheet(key: string, body: Buffer | Blob, contentType = 'image/jpeg') {
  const sb = getStorage();
  const { error } = await sb.storage.from(BUCKET).upload(key, body, {
    contentType,
    upsert: false,
  });
  if (error) throw error;
  return key;
}

export async function signedUrlForDownload(key: string, expiresIn = 60 * 60) {
  const sb = getStorage();
  const { data, error } = await sb.storage.from(BUCKET).createSignedUrl(key, expiresIn);
  if (error) throw error;
  return data.signedUrl;
}

export async function downloadScoresheet(key: string): Promise<Buffer> {
  const sb = getStorage();
  const { data, error } = await sb.storage.from(BUCKET).download(key);
  if (error) throw error;
  return Buffer.from(await data.arrayBuffer());
}
