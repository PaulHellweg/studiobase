import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Ensure env is loaded before reading DATABASE_URL
const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../../../../.env') });

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@studiobase/shared/schema';

const client = postgres(process.env.DATABASE_URL!);
export const db = drizzle(client, { schema });
