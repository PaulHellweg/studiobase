import { betterAuth } from 'better-auth';
import { organization } from 'better-auth/plugins';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '../db/index.js';

if (!process.env.BETTER_AUTH_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('BETTER_AUTH_SECRET is required in production');
}

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3001',
  database: drizzleAdapter(db, {
    provider: 'pg',
    usePlural: true,
  }),
  emailAndPassword: { enabled: true },
  plugins: [organization()],
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },
  trustedOrigins: [process.env.CLIENT_URL || 'http://localhost:5174'],
});

export type Auth = typeof auth;
