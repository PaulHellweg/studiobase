import { router, tenantProcedure, adminProcedure } from '../trpc.js';
import { tenantMemberships } from '@studiobase/shared/schema';
import { paginationInput, grantCreditsInput } from '@studiobase/shared/validation';
import { getBalance, getLedger, grantCredits } from '../../services/credit-service.js';
import { eq, and } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

export const creditRouter = router({
  getBalance: tenantProcedure.query(async ({ ctx }) => {
    const balance = await getBalance(ctx.user.id, ctx.tenantId, ctx.db);
    return { balance };
  }),

  listLedger: tenantProcedure
    .input(paginationInput)
    .query(async ({ ctx, input }) => {
      return getLedger(
        ctx.user.id,
        ctx.tenantId,
        input.limit,
        input.offset,
        ctx.db,
      );
    }),

  grantManual: adminProcedure
    .input(grantCreditsInput)
    .mutation(async ({ ctx, input }) => {
      // Verify the target user belongs to this tenant
      const [membership] = await ctx.db
        .select({ id: tenantMemberships.id })
        .from(tenantMemberships)
        .where(
          and(
            eq(tenantMemberships.userId, input.userId),
            eq(tenantMemberships.tenantId, ctx.tenantId),
          ),
        )
        .limit(1);

      if (!membership) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found in this tenant' });
      }

      await grantCredits(
        input.userId,
        ctx.tenantId,
        input.amount,
        {
          expiryDays: input.expiryDays,
          metadata: { grantedBy: ctx.user.id, manual: true, ...input.metadata },
        },
        ctx.db,
      );
      return { success: true };
    }),
});
