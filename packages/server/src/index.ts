import 'dotenv/config';
import express, { type Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './auth/index.js';
import { appRouter } from './trpc/router.js';
import { createContext } from './trpc/context.js';
import { tenantContext } from './middleware/tenant-context.js';
import { handleStripeWebhook } from './stripe/webhook.js';

const app: Express = express();
const port = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === 'production';

// Security headers
app.use(helmet());

// CORS
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  }),
);

// Request logging — use combined format in production
app.use(morgan(isProd ? 'combined' : 'dev'));

// Rate limiting on auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many auth attempts, try again later' },
});

// Stripe webhook needs raw body — mount BEFORE json parser
app.post(
  '/api/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  handleStripeWebhook,
);

// Body parsing (after Stripe webhook route)
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Better-Auth routes — with rate limiting on sign-in/sign-up
app.use('/api/auth/sign-in', authLimiter);
app.use('/api/auth/sign-up', authLimiter);
const authHandler = toNodeHandler(auth);
app.all('/api/auth/*', (req, res) => authHandler(req, res));

// tRPC routes — with tenant context middleware
app.use(
  '/api/trpc',
  tenantContext,
  createExpressMiddleware({
    router: appRouter,
    createContext,
  }),
);

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

export default app;
