import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../lib/supabase';

export interface AuthedRequest extends Request {
  userId?: string;
  userEmail?: string;
}

/**
 * Verifies the Supabase access token (Bearer) and confirms the caller has an
 * admin profile. All write/admin routes sit behind this.
 */
export async function requireAdmin(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';

    if (!token) {
      res.status(401).json({ error: 'Missing authorization token' });
      return;
    }

    // Validate the JWT with Supabase Auth.
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data.user) {
      res.status(401).json({ error: 'Invalid or expired session' });
      return;
    }

    // Confirm the user is a registered admin.
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }

    req.userId = data.user.id;
    req.userEmail = data.user.email ?? undefined;
    next();
  } catch (err) {
    next(err);
  }
}
