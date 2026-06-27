// Vercel serverless entry — wraps the Express app.
import { createApp } from '../src/app';

const app = createApp();

export default app;
