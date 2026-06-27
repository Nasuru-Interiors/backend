import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
import { env } from './env';
import { supabaseAdmin } from './supabase';

export interface AdminTokenPayload {
  sub: string; // user id
  email: string;
  role: 'admin';
}

/**
 * Verifies email/password against Supabase Auth — entirely server-side. A fresh
 * anon client is used per call so no session state leaks between requests. The
 * admin frontend never touches Supabase; it only ever talks to this backend.
 */
export async function verifyCredentials(
  email: string,
  password: string,
): Promise<{ id: string; email: string } | null> {
  if (!env.supabaseAnonKey) return null;

  const client = createClient(env.supabaseUrl, env.supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.user) return null;

  // Confirm the authenticated user is a registered admin (service-role read).
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single();

  if (!profile || profile.role !== 'admin') return null;

  return { id: data.user.id, email: data.user.email ?? email };
}

export function issueToken(user: { id: string; email: string }): string {
  const payload: AdminTokenPayload = { sub: user.id, email: user.email, role: 'admin' };
  return jwt.sign(payload, env.adminJwtSecret, { expiresIn: '7d' });
}

export function verifyToken(token: string): AdminTokenPayload {
  return jwt.verify(token, env.adminJwtSecret) as AdminTokenPayload;
}
