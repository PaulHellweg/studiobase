import { router, superAdminProcedure } from '../trpc.js';
import { tenants, tenantMemberships } from '@studiobase/shared/schema';
import { createTenantInput, updateTenantInput, idInput, paginationInput } from '@studiobase/shared/validation';
import { eq, count } from 'drizzle-orm';

export const tenantRouter = router({
  create: superAdminProcedure
    .input(createTenantInput)
    .mutation(async ({ ctx, input }) => {
      const [tenant] = await ctx.db
        .insert(tenants)
        .values(input)
        .returning();
      return tenant;
    }),

  get: superAdminProcedure
    .input(idInput)
    .query(async ({ ctx, input }) => {
      const [tenant] = await ctx.db
        .select()
        .from(tenants)
        .where(eq(tenants.id, input.id))
        .limit(1);
      return tenant ?? null;
    }),

  update: superAdminProcedure
    .input(updateTenantInput)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const [updated] = await ctx.db
        .update(tenants)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(tenants.id, id))
        .returning();
      return updated;
    }),

  listMembers: superAdminProcedure
    .input(idInput.merge(paginationInput))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(tenantMemberships)
        .where(eq(tenantMemberships.tenantId, input.id))
        .limit(input.limit)
        .offset(input.offset);
    }),

  list: superAdminProcedure
    .input(paginationInput)
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db
        .select({
          id: tenants.id,
          name: tenants.name,
          slug: tenants.slug,
          locale: tenants.locale,
          plan: tenants.plan,
          settings: tenants.settings,
          createdAt: tenants.createdAt,
          updatedAt: tenants.updatedAt,
          memberCount: count(tenantMemberships.id),
        })
        .from(tenants)
        .leftJoin(tenantMemberships, eq(tenantMemberships.tenantId, tenants.id))
        .groupBy(tenants.id)
        .limit(input.limit)
        .offset(input.offset);
      return rows;
    }),
});
