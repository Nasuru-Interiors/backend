import rateLimit from 'express-rate-limit';

const json = { error: 'Too many requests, please try again shortly.' };

// Generous limit for public read traffic (the CDN absorbs most of it anyway).
export const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: json,
});

// Tighter limit for authenticated admin mutations.
export const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: json,
});

// Strict limit for Cloudinary signing to prevent signature abuse.
export const mediaLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: json,
});
