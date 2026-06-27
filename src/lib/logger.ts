import { env } from './env';

type Level = 'debug' | 'info' | 'warn' | 'error';

/**
 * Minimal dependency-free structured logger.
 * - JSON lines in production (parseable by log aggregators)
 * - Pretty single-line output in development
 * Never log secrets, tokens, or request bodies.
 */
function emit(level: Level, message: string, meta?: Record<string, unknown>) {
  const time = new Date().toISOString();
  if (env.isProduction) {
    process.stdout.write(`${JSON.stringify({ time, level, message, ...meta })}\n`);
  } else {
    const extra = meta && Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    // eslint-disable-next-line no-console
    console.log(`[${level}] ${message}${extra}`);
  }
}

export const logger = {
  debug: (m: string, meta?: Record<string, unknown>) =>
    !env.isProduction && emit('debug', m, meta),
  info: (m: string, meta?: Record<string, unknown>) => emit('info', m, meta),
  warn: (m: string, meta?: Record<string, unknown>) => emit('warn', m, meta),
  error: (m: string, meta?: Record<string, unknown>) => emit('error', m, meta),
};
