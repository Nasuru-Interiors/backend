import { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger';

/** Lightweight access log — method, path, status, duration. No bodies/secrets. */
export function requestLog(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const meta = {
      method: req.method,
      path: req.originalUrl.split('?')[0],
      status: res.statusCode,
      durationMs: duration,
    };
    if (res.statusCode >= 500) logger.error('request', meta);
    else if (res.statusCode >= 400) logger.warn('request', meta);
    else logger.info('request', meta);
  });
  next();
}

/** Sets CDN-friendly caching on public GET responses (Vercel/edge honor s-maxage). */
export function publicCache(_req: Request, res: Response, next: NextFunction): void {
  res.set('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=300');
  next();
}
