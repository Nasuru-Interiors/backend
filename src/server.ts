import { createApp } from './app';
import { env } from './lib/env';
import { logger } from './lib/logger';

const app = createApp();

const server = app.listen(env.port, () => {
  logger.info('backend started', { port: env.port, env: env.nodeEnv });
});

// Graceful shutdown so in-flight requests finish before the process exits.
function shutdown(signal: string) {
  logger.info('shutting down', { signal });
  server.close(() => process.exit(0));
  // Force-exit if connections hang.
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
  logger.error('unhandledRejection', { reason: String(reason) });
});
process.on('uncaughtException', (err) => {
  logger.error('uncaughtException', { message: err.message, stack: err.stack });
  process.exit(1);
});
