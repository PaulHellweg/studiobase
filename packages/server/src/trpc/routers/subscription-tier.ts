import { router, tenantProcedure, adminProcedure } from '../trpc.js';
import { subscriptionTiers } from '@studiobase/shared/schema';
import {
  paginationInput,
  createSubscriptionTierInput,
  updateSubscriptionTierInput,
  idInput,
} from '@studiobase/shared/validation';
import { eq, and } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

export const subscriptionTierRouter = router({
  list: tenantProcedure
    .input(paginationInput)
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(subscriptionTiers)
        .where(
          and(
            eq(subscriptionTiers.tenantId, ctx.tenantId),
            eq(subscriptionTiers.active, true),
          ),
        )
        .limit(input.limit)
        .offset(input.offset);
    }),

  create: adminProcedure
    .input(createSubscriptionTierInput)
    .mutation(async ({ ctx, input }) => {
      const [tier] = await ctx.db
        .insert(subscriptionTiers)
        .values({ ...input, tenantId: ctx.tenantId })
        .returning();
      return tier;
    }),

  update: adminProcedure
    .input(updateSubscriptionTierInput)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const [updated] = await ctx.db
        .update(subscriptionTiers)
        .set({ ...data, updatedAt: new Date() })
        .where(
          and(
            eq(subscriptionTiers.id, id),
            eq(subscriptionTiers.tenantId, ctx.tenantId),
          ),
        )
        .returning();
      if (!updated) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Subscription tier not found' });
      }
      return updated;
    }),

  archive: adminProcedure
    .input(idInput)
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(subscriptionTiers)
        .set({ active: false, updatedAt: new Date() })
        .where(
          and(
            eq(subscriptionTiers.id, input.id),
            eq(subscriptionTiers.tenantId, ctx.tenantId),
          ),
        )
        .returning();
      if (!updated) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Subscription tier not found' });
      }
      return updated;
    }),
});
