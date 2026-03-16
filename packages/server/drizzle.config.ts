import { config } from 'dotenv';
config({ path: '../../.env' });
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: '../shared/src/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
