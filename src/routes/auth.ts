import { Router, Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { verifyCredentials, issueToken } from '../lib/auth';
import { requireAdmin, AuthedRequest } from '../middleware/auth';
import { loginSchema } from '../validation/schemas';
import { logger } from '../lib/logger';

const router = Router();

const wrap =
  (fn: (req: Request, res: Response) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) =>
    fn(req, res).catch(next);

// Brute-force protection on the login endpoint.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts, please try again later.' },
});

// POST /api/admin/auth/login — public. Verifies credentials server-side against
// Supabase and returns a backend-signed JWT (the admin never talks to Supabase).
router.post(
  '/login',
  loginLimiter,
  wrap(async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);
    const user = await verifyCredentials(email, password);
    if (!user) {
      logger.warn('failed admin login', { email });
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }
    const token = issueToken(user);
    res.json({ token, user: { id: user.id, email: user.email } });
  }),
);

// GET /api/admin/auth/me — protected. Lets the admin app validate its token.
router.get('/me', requireAdmin, (req: AuthedRequest, res: Response) => {
  res.json({ id: req.userId, email: req.userEmail, role: 'admin' });
});

// POST /api/admin/auth/logout — stateless tokens, so the client just discards it.
router.post('/logout', (_req, res) => {
  res.json({ ok: true });
});

export default router;
