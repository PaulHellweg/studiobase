import { router, tenantProcedure } from '../trpc.js';
import { createCheckoutInput } from '@studiobase/shared/validation';
import { TRPCError } from '@trpc/server';
import { creditPacks, subscriptionTiers } from '@studiobase/shared/schema';
import { eq, and } from 'drizzle-orm';
import { createCheckoutSession } from '../../stripe/checkout.js';
import { createPortalSession } from '../../stripe/portal.js';

export const paymentRouter = router({
  createCheckoutSession: tenantProcedure
    .input(createCheckoutInput)
    .mutation(async ({ ctx, input }) => {
      if (input.creditPackId) {
        const [pack] = await ctx.db
          .select()
          .from(creditPacks)
          .where(
            and(
              eq(creditPacks.id, input.creditPackId),
              eq(creditPacks.tenantId, ctx.tenantId),
              eq(creditPacks.active, true),
            ),
          )
          .limit(1);

        if (!pack) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Credit pack not found' });
        }

        const url = await createCheckoutSession({
          userId: ctx.user.id,
          tenantId: ctx.tenantId,
          type: 'one_time',
          creditPack: pack,
        });
        return { url };
      }

      if (input.subscriptionTierId) {
        const [tier] = await ctx.db
          .select()
          .from(subscriptionTiers)
          .where(
            and(
              eq(subscriptionTiers.id, input.subscriptionTierId),
              eq(subscriptionTiers.tenantId, ctx.tenantId),
              eq(subscriptionTiers.active, true),
            ),
          )
          .limit(1);

        if (!tier) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Subscription tier not found' });
        }

        const url = await createCheckoutSession({
          userId: ctx.user.id,
          tenantId: ctx.tenantId,
          type: 'subscription',
          subscriptionTier: tier,
        });
        return { url };
      }

      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid checkout input' });
    }),

  createPortalSession: tenantProcedure.mutation(async ({ ctx }) => {
    const url = await createPortalSession(ctx.user.id, ctx.tenantId);
    return { url };
  }),
});
