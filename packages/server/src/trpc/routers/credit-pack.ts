import { router, tenantProcedure, adminProcedure } from '../trpc.js';
import { creditPacks } from '@studiobase/shared/schema';
import {
  paginationInput,
  createCreditPackInput,
  updateCreditPackInput,
  idInput,
} from '@studiobase/shared/validation';
import { eq, and } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

export const creditPackRouter = router({
  list: tenantProcedure
    .input(paginationInput)
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(creditPacks)
        .where(
          and(
            eq(creditPacks.tenantId, ctx.tenantId),
            eq(creditPacks.active, true),
          ),
        )
        .limit(input.limit)
        .offset(input.offset);
    }),

  create: adminProcedure
    .input(createCreditPackInput)
    .mutation(async ({ ctx, input }) => {
      const [pack] = await ctx.db
        .insert(creditPacks)
        .values({ ...input, tenantId: ctx.tenantId })
        .returning();
      return pack;
    }),

  update: adminProcedure
    .input(updateCreditPackInput)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const [updated] = await ctx.db
        .update(creditPacks)
        .set({ ...data, updatedAt: new Date() })
        .where(
          and(eq(creditPacks.id, id), eq(creditPacks.tenantId, ctx.tenantId)),
        )
        .returning();
      if (!updated) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Credit pack not found' });
      }
      return updated;
    }),

  archive: adminProcedure
    .input(idInput)
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(creditPacks)
        .set({ active: false, updatedAt: new Date() })
        .where(
          and(
            eq(creditPacks.id, input.id),
            eq(creditPacks.tenantId, ctx.tenantId),
          ),
        )
        .returning();
      if (!updated) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Credit pack not found' });
      }
      return updated;
    }),
});
