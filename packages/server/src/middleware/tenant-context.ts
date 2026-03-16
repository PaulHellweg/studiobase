import type { Request, Response, NextFunction } from 'express';
import { auth } from '../auth/index.js';
import { db } from '../db/index.js';
import { sql } from 'drizzle-orm';
import { fromNodeHeaders } from 'better-auth/node';

// Extend Express Request with auth context
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        name: string;
        email: string;
        emailVerified: boolean;
        image?: string | null;
      };
      tenantId?: string;
      userRole?: string;
    }
  }
}

/**
 * Middleware that extracts session from Better-Auth,
 * resolves the active organization (tenant), and sets
 * the RLS context on the DB connection.
 *
 * Uses SET SESSION (not SET LOCAL) and always resets at the start
 * of each request to prevent cross-tenant leakage via connection pooling.
 */
export async function tenantContext(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // Always reset tenant context first to prevent leakage from pooled connections
    await db.execute(sql`SET app.current_tenant_id = '00000000-0000-0000-0000-000000000000'`);

    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const tenantId = session.session.activeOrganizationId;
    if (!tenantId) {
      res.status(403).json({ error: 'No active tenant' });
      return;
    }

    // Set RLS context for this request
    await db.execute(sql`SET app.current_tenant_id = ${tenantId}`);

    req.user = session.user;
    req.tenantId = tenantId;

    next();
  } catch (error) {
    console.error('Tenant context middleware error:', (error as Error).message);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Auth-only middleware (no tenant required).
 * Used for endpoints that only need authentication.
 */
export async function authRequired(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    req.user = session.user;
    req.tenantId = session.session.activeOrganizationId ?? undefined;

    next();
  } catch (error) {
    console.error('Auth middleware error:', (error as Error).message);
    res.status(500).json({ error: 'Internal server error' });
  }
}
