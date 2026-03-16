import { router, adminProcedure, tenantProcedure } from '../trpc.js';
import { classTypes } from '@studiobase/shared/schema';
import { createClassTypeInput, updateClassTypeInput, idInput, paginationInput } from '@studiobase/shared/validation';
import { eq, and } from 'drizzle-orm';

export const classTypeRouter = router({
  create: adminProcedure
    .input(createClassTypeInput)
    .mutation(async ({ ctx, input }) => {
      const [classType] = await ctx.db
        .insert(classTypes)
        .values({ ...input, tenantId: ctx.tenantId })
        .returning();
      return classType;
    }),

  list: tenantProcedure
    .input(paginationInput)
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(classTypes)
        .where(
          and(
            eq(classTypes.tenantId, ctx.tenantId),
            eq(classTypes.active, true),
          ),
        )
        .limit(input.limit)
        .offset(input.offset);
    }),

  update: adminProcedure
    .input(updateClassTypeInput)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const [updated] = await ctx.db
        .update(classTypes)
        .set({ ...data, updatedAt: new Date() })
        .where(
          and(eq(classTypes.id, id), eq(classTypes.tenantId, ctx.tenantId)),
        )
        .returning();
      return updated;
    }),

  archive: adminProcedure
    .input(idInput)
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(classTypes)
        .set({ active: false, updatedAt: new Date() })
        .where(
          and(
            eq(classTypes.id, input.id),
            eq(classTypes.tenantId, ctx.tenantId),
          ),
        )
        .returning();
      return updated;
    }),
});
