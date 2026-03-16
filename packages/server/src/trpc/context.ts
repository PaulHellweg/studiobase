import type { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import { db } from '../db/index.js';

export type Context = {
  user?: {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    image?: string | null;
  };
  tenantId?: string;
  db: typeof db;
};

export async function createContext({
  req,
}: CreateExpressContextOptions): Promise<Context> {
  return {
    user: req.user,
    tenantId: req.tenantId,
    db,
  };
}
