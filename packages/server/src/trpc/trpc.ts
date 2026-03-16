import { initTRPC, TRPCError } from '@trpc/server';
import type { Context } from './context.js';
import { tenantMemberships } from '@studiobase/shared/schema';
import { eq, and } from 'drizzle-orm';

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const middleware = t.middleware;

/** No auth required */
export const publicProcedure = t.procedure;

/** Requires authenticated user */
export const protectedProcedure = t.procedure.use(
  middleware(async ({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
  }),
);

/** Requires authenticated user + active tenant */
export const tenantProcedure = t.procedure.use(
  middleware(async ({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' });
    }
    if (!ctx.tenantId) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'No active tenant' });
    }
    return next({ ctx: { ...ctx, user: ctx.user, tenantId: ctx.tenantId } });
  }),
);

/**
 * Helper: fetch the user's role in the active tenant.
 */
async function getUserRole(
  db: Context['db'],
  userId: string,
  tenantId: string,
): Promise<string | null> {
  const [membership] = await db
    .select({ role: tenantMemberships.role })
    .from(tenantMemberships)
    .where(
      and(
        eq(tenantMemberships.userId, userId),
        eq(tenantMemberships.tenantId, tenantId),
      ),
    )
    .limit(1);
  return membership?.role ?? null;
}

/** Requires tenant_admin or super_admin */
export const adminProcedure = t.procedure.use(
  middleware(async ({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' });
    }
    if (!ctx.tenantId) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'No active tenant' });
    }
    const role = await getUserRole(ctx.db, ctx.user.id, ctx.tenantId);
    if (role !== 'tenant_admin' && role !== 'super_admin') {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
    }
    return next({ ctx: { ...ctx, user: ctx.user, tenantId: ctx.tenantId, userRole: role } });
  }),
);

/** Requires teacher, tenant_admin, or super_admin */
export const teacherProcedure = t.procedure.use(
  middleware(async ({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' });
    }
    if (!ctx.tenantId) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'No active tenant' });
    }
    const role = await getUserRole(ctx.db, ctx.user.id, ctx.tenantId);
    if (role !== 'teacher' && role !== 'tenant_admin' && role !== 'super_admin') {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Teacher access required' });
    }
    return next({ ctx: { ...ctx, user: ctx.user, tenantId: ctx.tenantId, userRole: role } });
  }),
);

/** Requires super_admin only */
export const superAdminProcedure = t.procedure.use(
  middleware(async ({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' });
    }
    // Super admin check: look for super_admin membership in ANY tenant
    // or check a dedicated flag. For now, we require tenantId and super_admin role.
    if (!ctx.tenantId) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'No active tenant' });
    }
    const role = await getUserRole(ctx.db, ctx.user.id, ctx.tenantId);
    if (role !== 'super_admin') {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Super admin access required' });
    }
    return next({ ctx: { ...ctx, user: ctx.user, tenantId: ctx.tenantId, userRole: role } });
  }),
);
