import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../lib/auth';

export interface AuthedRequest extends Request {
  userId?: string;
  userEmail?: string;
}

/**
 * Verifies the backend-issued admin JWT (Bearer). All admin write/data routes
 * sit behind this. The token is signed by this backend on login, so no call to
 * Supabase is needed here — DB access stays entirely server-side.
 */
export function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';

  if (!token) {
    res.status(401).json({ error: 'Missing authorization token' });
    return;
  }

  try {
    const payload = verifyToken(token);
    if (payload.role !== 'admin') {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }
    req.userId = payload.sub;
    req.userEmail = payload.email;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired session' });
  }
}
