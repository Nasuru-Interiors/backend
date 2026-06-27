import { createClient } from '@supabase/supabase-js';
import { env } from './env';

/**
 * Service-role client — bypasses RLS. Backend ONLY. Never expose this key.
 * Used for all reads (including drafts) and all writes.
 */
export const supabaseAdmin = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
