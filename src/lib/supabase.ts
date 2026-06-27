import { createClient } from '@supabase/supabase-js';
import { env } from './env';

/**
 * Service-role client — bypasses RLS. Backend ONLY. Never expose this key.
 * Used for all reads (including drafts) and all writes.
 *
 * Fallbacks are used only when env vars are missing so that importing this
 * module never throws (which would crash the serverless function on cold start
 * before our 503 "misconfigured" handler can respond). When misconfigured the
 * app short-circuits every API call with a 503, so this client is never used.
 */
const url = env.supabaseUrl || 'https://placeholder.supabase.co';
const key = env.supabaseServiceRoleKey || 'placeholder-key';

export const supabaseAdmin = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});
