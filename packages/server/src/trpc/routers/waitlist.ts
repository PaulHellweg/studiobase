import { router, tenantProcedure, adminProcedure } from '../trpc.js';
import { waitlists, scheduleInstances, schedules, classTypes, users } from '@studiobase/shared/schema';
import { joinWaitlistInput, paginationInput } from '@studiobase/shared/validation';
import { joinWaitlist } from '../../services/waitlist-service.js';
import { decryptPIIList } from '../../middleware/encryption.js';
import { TRPCError } from '@trpc/server';
import { eq, and } from 'drizzle-orm';

export const waitlistRouter = router({
  join: tenantProcedure
    .input(joinWaitlistInput)
    .mutation(async ({ ctx, input }) => {
      const result = await joinWaitlist(
        ctx.user.id,
        ctx.tenantId,
        input.scheduleInstanceId,
        ctx.db,
      );
      if (!result.success) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: result.error });
      }
      return { position: result.position };
    }),

  list: adminProcedure
    .input(paginationInput)
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db
        .select({
          id: waitlists.id,
          position: waitlists.position,
          createdAt: waitlists.createdAt,
          userId: waitlists.userId,
          scheduleInstanceId: waitlists.scheduleInstanceId,
          studentName: users.name,
          studentEmail: users.email,
          instanceDate: scheduleInstances.date,
          className: classTypes.name,
          startTime: schedules.startTime,
        })
        .from(waitlists)
        .innerJoin(users, eq(waitlists.userId, users.id))
        .innerJoin(scheduleInstances, eq(waitlists.scheduleInstanceId, scheduleInstances.id))
        .innerJoin(schedules, eq(scheduleInstances.scheduleId, schedules.id))
        .innerJoin(classTypes, eq(schedules.classTypeId, classTypes.id))
        .where(eq(waitlists.tenantId, ctx.tenantId))
        .orderBy(scheduleInstances.date, waitlists.position)
        .limit(input.limit)
        .offset(input.offset);
      return decryptPIIList(rows);
    }),
});
