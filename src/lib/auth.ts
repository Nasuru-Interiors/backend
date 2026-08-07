import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { env } from './env';
import { sql } from './db';

export interface AdminTokenPayload {
  sub: string; // user id
  email: string;
  role: 'admin';
}

/**
 * Verifies email/password against Neon Database — entirely server-side.
 * The admin frontend never touches the database directly; it only ever talks to this backend.
 */
export async function verifyCredentials(
  email: string,
  password: string,
): Promise<{ id: string; email: string } | null> {
  if (!env.databaseUrl) return null;

  try {
    const rows = await sql`
      SELECT id, email, password_hash, role
      FROM public.profiles
      WHERE lower(email) = lower(${email})
      LIMIT 1
    `;

    const user = rows[0];
    if (!user || user.role !== 'admin' || !user.password_hash) return null;

    const valid = await bcrypt.compare(password, String(user.password_hash));
    if (!valid) return null;

    return { id: String(user.id), email: String(user.email) };
  } catch (error) {
    console.error('[auth] Credential verification error:', error);
    return null;
  }
}

export function issueToken(user: { id: string; email: string }): string {
  const payload: AdminTokenPayload = { sub: user.id, email: user.email, role: 'admin' };
  return jwt.sign(payload, env.adminJwtSecret, { expiresIn: '7d' });
}

export function verifyToken(token: string): AdminTokenPayload {
  return jwt.verify(token, env.adminJwtSecret) as AdminTokenPayload;
}
