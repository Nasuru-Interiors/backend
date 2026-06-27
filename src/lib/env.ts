import dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

const missing: string[] = [];

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    missing.push(name);
    return '';
  }
  return value;
}

function optional(name: string, fallback = ''): string {
  return process.env[name] || fallback;
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction,
  supabaseUrl: required('SUPABASE_URL'),
  supabaseServiceRoleKey: required('SUPABASE_SERVICE_ROLE_KEY'),
  supabaseAnonKey: optional('SUPABASE_ANON_KEY'),
  cloudinaryCloudName: required('CLOUDINARY_CLOUD_NAME'),
  cloudinaryApiKey: required('CLOUDINARY_API_KEY'),
  cloudinaryApiSecret: required('CLOUDINARY_API_SECRET'),
  cloudinaryFolder: optional('CLOUDINARY_UPLOAD_FOLDER', 'firstchoice'),
  port: parseInt(process.env.PORT || '4000', 10),
  allowedOrigins: optional('ALLOWED_ORIGINS', 'http://localhost:3000,http://localhost:3001')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
};

// Fail fast: a misconfigured backend should crash on boot in production rather
// than silently serving 500s. In development we warn so local work isn't blocked.
if (missing.length > 0) {
  const message = `Missing required environment variables: ${missing.join(', ')}`;
  if (isProduction) {
    throw new Error(`[env] ${message}`);
  }
  console.warn(`[env] ${message} (continuing in development)`);
}
