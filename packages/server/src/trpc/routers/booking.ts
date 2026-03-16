import { router, tenantProcedure, teacherProcedure } from '../trpc.js';
import { decryptPII, decryptPIIList } from '../../middleware/encryption.js';
import { bookings, scheduleInstances, schedules, classTypes, teachers, users } from '@studiobase/shared/schema';
import {
  createBookingInput,
  cancelBookingInput,
  markAttendedInput,
  paginationInput,
  idInput,
  listByInstanceInput,
} from '@studiobase/shared/validation';
import { eq, and } from 'drizzle-orm';
import { createBooking, cancelBooking, getUserBookings } from '../../services/booking-service.js';
import { TRPCError } from '@trpc/server';

export const bookingRouter = router({
  create: tenantProcedure
    .input(createBookingInput)
    .mutation(async ({ ctx, input }) => {
      const result = await createBooking(
        ctx.user.id,
        ctx.tenantId,
        input.scheduleInstanceId,
        ctx.db,
      );
      if (!result.success) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: result.error });
      }
      return { bookingId: result.bookingId };
    }),

  cancel: tenantProcedure
    .input(cancelBookingInput)
    .mutation(async ({ ctx, input }) => {
      const result = await cancelBooking(
        ctx.user.id,
        ctx.tenantId,
        input.bookingId,
        ctx.db,
      );
      if (!result.success) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: result.error });
      }
      return { success: true };
    }),

  list: tenantProcedure
    .input(paginationInput)
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db
        .select({
          id: bookings.id,
          status: bookings.status,
          creditsUsed: bookings.creditsUsed,
          attendanceMarked: bookings.attendanceMarked,
          createdAt: bookings.createdAt,
          scheduleInstanceId: bookings.scheduleInstanceId,
          date: scheduleInstances.date,
          startTime: schedules.startTime,
          endTime: schedules.endTime,
          location: schedules.location,
          className: classTypes.name,
          duration: classTypes.duration,
          teacherName: users.name,
        })
        .from(bookings)
        .innerJoin(scheduleInstances, eq(bookings.scheduleInstanceId, scheduleInstances.id))
        .innerJoin(schedules, eq(scheduleInstances.scheduleId, schedules.id))
        .innerJoin(classTypes, eq(schedules.classTypeId, classTypes.id))
        .innerJoin(teachers, eq(schedules.teacherId, teachers.id))
        .innerJoin(users, eq(teachers.userId, users.id))
        .where(
          and(
            eq(bookings.userId, ctx.user.id),
            eq(bookings.tenantId, ctx.tenantId),
          ),
        )
        .orderBy(scheduleInstances.date)
        .limit(input.limit)
        .offset(input.offset);
      return decryptPIIList(rows);
    }),

  markAttended: teacherProcedure
    .input(markAttendedInput)
    .mutation(async ({ ctx, input }) => {
      // Verify the booking belongs to a class taught by this teacher (or user is admin)
      const [booking] = await ctx.db
        .select({
          id: bookings.id,
          teacherUserId: users.id,
        })
        .from(bookings)
        .innerJoin(scheduleInstances, eq(bookings.scheduleInstanceId, scheduleInstances.id))
        .innerJoin(schedules, eq(scheduleInstances.scheduleId, schedules.id))
        .innerJoin(teachers, eq(schedules.teacherId, teachers.id))
        .innerJoin(users, eq(teachers.userId, users.id))
        .where(
          and(
            eq(bookings.id, input.bookingId),
            eq(bookings.tenantId, ctx.tenantId),
          ),
        )
        .limit(1);

      if (!booking) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Booking not found' });
      }

      // Only the assigned teacher (or admin) can mark attendance
      if (booking.teacherUserId !== ctx.user.id && ctx.userRole !== 'tenant_admin' && ctx.userRole !== 'super_admin') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'You can only mark attendance for your own classes' });
      }

      const [updated] = await ctx.db
        .update(bookings)
        .set({
          status: input.status,
          attendanceMarked: true,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(bookings.id, input.bookingId),
            eq(bookings.tenantId, ctx.tenantId),
          ),
        )
        .returning();

      return updated;
    }),

  get: tenantProcedure
    .input(idInput)
    .query(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .select({
          id: bookings.id,
          status: bookings.status,
          creditsUsed: bookings.creditsUsed,
          attendanceMarked: bookings.attendanceMarked,
          createdAt: bookings.createdAt,
          scheduleInstanceId: bookings.scheduleInstanceId,
          instanceDate: scheduleInstances.date,
          startTime: schedules.startTime,
          endTime: schedules.endTime,
          location: schedules.location,
          className: classTypes.name,
          duration: classTypes.duration,
          teacherName: users.name,
        })
        .from(bookings)
        .innerJoin(scheduleInstances, eq(bookings.scheduleInstanceId, scheduleInstances.id))
        .innerJoin(schedules, eq(scheduleInstances.scheduleId, schedules.id))
        .innerJoin(classTypes, eq(schedules.classTypeId, classTypes.id))
        .innerJoin(teachers, eq(schedules.teacherId, teachers.id))
        .innerJoin(users, eq(teachers.userId, users.id))
        .where(
          and(
            eq(bookings.id, input.id),
            eq(bookings.userId, ctx.user.id),
            eq(bookings.tenantId, ctx.tenantId),
          ),
        )
        .limit(1);

      if (!row) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Booking not found' });
      }
      return decryptPII(row);
    }),

  listByInstance: teacherProcedure
    .input(listByInstanceInput)
    .query(async ({ ctx, input }) => {
      // Verify this teacher owns the session (or is admin)
      const [instance] = await ctx.db
        .select({ teacherUserId: users.id })
        .from(scheduleInstances)
        .innerJoin(schedules, eq(scheduleInstances.scheduleId, schedules.id))
        .innerJoin(teachers, eq(schedules.teacherId, teachers.id))
        .innerJoin(users, eq(teachers.userId, users.id))
        .where(
          and(
            eq(scheduleInstances.id, input.scheduleInstanceId),
            eq(scheduleInstances.tenantId, ctx.tenantId),
          ),
        )
        .limit(1);

      if (!instance) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Session not found' });
      }
      if (instance.teacherUserId !== ctx.user.id && ctx.userRole !== 'tenant_admin' && ctx.userRole !== 'super_admin') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'You can only view attendees for your own classes' });
      }

      const rows = await ctx.db
        .select({
          id: bookings.id,
          status: bookings.status,
          creditsUsed: bookings.creditsUsed,
          attendanceMarked: bookings.attendanceMarked,
          createdAt: bookings.createdAt,
          userId: bookings.userId,
          studentName: users.name,
          studentEmail: users.email,
        })
        .from(bookings)
        .innerJoin(users, eq(bookings.userId, users.id))
        .where(
          and(
            eq(bookings.scheduleInstanceId, input.scheduleInstanceId),
            eq(bookings.tenantId, ctx.tenantId),
          ),
        )
        .limit(input.limit)
        .offset(input.offset);
      return decryptPIIList(rows);
    }),
});
