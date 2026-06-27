import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { env } from './lib/env';
import { logger } from './lib/logger';
import publicRoutes from './routes/public';
import adminRoutes from './routes/admin';
import authRoutes from './routes/auth';
import { errorHandler, notFound } from './middleware/error';
import { requestLog, publicCache } from './middleware/requestLog';
import { publicLimiter, adminLimiter } from './middleware/rateLimit';

export function createApp() {
  const app = express();

  // Behind Vercel/any proxy: needed for correct client IPs (rate limiting).
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(helmet());
  app.use(compression());
  app.use(express.json({ limit: '2mb' }));
  app.use(requestLog);

  app.use(
    cors({
      origin(origin, callback) {
        // Allow non-browser tools (curl/health checks) with no origin.
        if (!origin || env.allowedOrigins.includes(origin)) return callback(null, true);
        logger.warn('cors blocked', { origin });
        return callback(new Error(`Origin not allowed: ${origin}`));
      },
      credentials: true,
    }),
  );

  app.get('/', (_req, res) => res.json({ name: 'firstchoice-backend', status: 'ok' }));

  // Health/readiness — reports config status even when misconfigured.
  app.get('/api/health', (_req, res) => {
    res.json({
      status: env.missing.length ? 'misconfigured' : 'ok',
      ...(env.missing.length ? { missingEnv: env.missing } : {}),
      time: new Date().toISOString(),
    });
  });

  // If required env vars are missing, fail every API call with a clear 503
  // instead of crashing the serverless function on import.
  if (env.missing.length > 0) {
    logger.error('backend misconfigured — missing required env', { missing: env.missing });
    app.use('/api', (_req, res) => {
      res.status(503).json({
        error: 'Server is not configured. Set the required environment variables.',
        missingEnv: env.missing,
      });
    });
    return app;
  }

  app.use('/api/public', publicLimiter, publicCache, publicRoutes);
  // Auth routes first so /login stays public; everything else under /api/admin
  // is guarded by requireAdmin inside adminRoutes.
  app.use('/api/admin/auth', adminLimiter, authRoutes);
  app.use('/api/admin', adminLimiter, adminRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
