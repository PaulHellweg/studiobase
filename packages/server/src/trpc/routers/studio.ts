import { router, adminProcedure, tenantProcedure, publicProcedure } from '../trpc.js';
import { studios, tenants } from '@studiobase/shared/schema';
import { updateStudioInput, slugInput } from '@studiobase/shared/validation';
import { eq } from 'drizzle-orm';

export const studioRouter = router({
  get: tenantProcedure.query(async ({ ctx }) => {
    const [studio] = await ctx.db
      .select()
      .from(studios)
      .where(eq(studios.tenantId, ctx.tenantId))
      .limit(1);
    return studio ?? null;
  }),

  update: adminProcedure
    .input(updateStudioInput)
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(studios)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(studios.tenantId, ctx.tenantId))
        .returning();
      return updated;
    }),

  getBySlug: publicProcedure
    .input(slugInput)
    .query(async ({ ctx, input }) => {
      const [tenant] = await ctx.db
        .select()
        .from(tenants)
        .where(eq(tenants.slug, input.slug))
        .limit(1);

      if (!tenant) {
        return null;
      }

      const [studio] = await ctx.db
        .select()
        .from(studios)
        .where(eq(studios.tenantId, tenant.id))
        .limit(1);

      // Only return public-facing fields — strip settings, plan, internal config
      return {
        tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug, locale: tenant.locale },
        studio: studio ?? null,
      };
    }),
});
