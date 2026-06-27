import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { env } from './lib/env';
import { logger } from './lib/logger';
import publicRoutes from './routes/public';
import adminRoutes from './routes/admin';
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
  app.get('/api/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

  app.use('/api/public', publicLimiter, publicCache, publicRoutes);
  app.use('/api/admin', adminLimiter, adminRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
