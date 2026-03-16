import { router, protectedProcedure } from '../trpc.js';
import { users, auditLogs } from '@studiobase/shared/schema';
import { updateProfileInput } from '@studiobase/shared/validation';
import { eq } from 'drizzle-orm';
import { encrypt, decryptPII } from '../../middleware/encryption.js';

export const userRouter = router({
  me: protectedProcedure.query(async ({ ctx }) => {
    const [user] = await ctx.db
      .select()
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1);
    return user ? decryptPII(user) : null;
  }),

  updateProfile: protectedProcedure
    .input(updateProfileInput)
    .mutation(async ({ ctx, input }) => {
      const updateData: Record<string, unknown> = { updatedAt: new Date() };

      if (input.name !== undefined) {
        updateData.name = encrypt(input.name);
      }
      if (input.phone !== undefined) {
        updateData.phone = input.phone ? encrypt(input.phone) : null;
      }
      if (input.locale !== undefined) {
        updateData.locale = input.locale;
      }
      if (input.image !== undefined) {
        updateData.image = input.image;
      }

      const [updated] = await ctx.db
        .update(users)
        .set(updateData)
        .where(eq(users.id, ctx.user.id))
        .returning();
      return decryptPII(updated);
    }),

  requestExport: protectedProcedure.mutation(async ({ ctx }) => {
    // Log the export request for async processing
    await ctx.db.insert(auditLogs).values({
      userId: ctx.user.id,
      tenantId: ctx.tenantId,
      action: 'user.export_requested',
      entityType: 'user',
      entityId: ctx.user.id,
      metadata: {},
    });
    return { success: true, message: 'Export request queued' };
  }),

  requestDeletion: protectedProcedure.mutation(async ({ ctx }) => {
    // Soft-delete the user
    await ctx.db
      .update(users)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(users.id, ctx.user.id));

    // Log the deletion request
    await ctx.db.insert(auditLogs).values({
      userId: ctx.user.id,
      tenantId: ctx.tenantId,
      action: 'user.deletion_requested',
      entityType: 'user',
      entityId: ctx.user.id,
      metadata: {},
    });

    return { success: true, message: 'Account marked for deletion' };
  }),
});
