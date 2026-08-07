import { neon } from '@neondatabase/serverless';
import { env } from './env';

/**
 * Neon Database client tag function — parameterized SQL queries.
 * Backend ONLY. Never expose your DATABASE_URL.
 *
 * Fallback connection string is used when env var is missing so that importing this
 * module never throws on cold start. When misconfigured, the app short-circuits
 * API calls with a 503 status code.
 */
const connectionString = env.databaseUrl || 'postgres://placeholder:placeholder@localhost:5432/neondb';

export const sql = neon(connectionString);
