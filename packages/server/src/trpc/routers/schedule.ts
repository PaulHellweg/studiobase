import { router, adminProcedure, tenantProcedure, teacherProcedure } from '../trpc.js';
import { safeDecrypt } from '../../middleware/encryption.js';
import { schedules, scheduleInstances, classTypes, teachers, users, bookings } from '@studiobase/shared/schema';
import {
  createScheduleInput,
  updateScheduleInput,
  createScheduleInstanceInput,
  idInput,
  paginationInput,
  listInstancesInput,
  listByTeacherInput,
} from '@studiobase/shared/validation';
import { eq, and, isNull, gte, lte, ne, sql, count } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

export const scheduleRouter = router({
  create: adminProcedure
    .input(createScheduleInput)
    .mutation(async ({ ctx, input }) => {
      const [schedule] = await ctx.db
        .insert(schedules)
        .values({ ...input, tenantId: ctx.tenantId })
        .returning();
      return schedule;
    }),

  list: tenantProcedure
    .input(paginationInput)
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(schedules)
        .where(
          and(
            eq(schedules.tenantId, ctx.tenantId),
            isNull(schedules.deletedAt),
          ),
        )
        .limit(input.limit)
        .offset(input.offset);
    }),

  update: adminProcedure
    .input(updateScheduleInput)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const [updated] = await ctx.db
        .update(schedules)
        .set({ ...data, updatedAt: new Date() })
        .where(
          and(eq(schedules.id, id), eq(schedules.tenantId, ctx.tenantId)),
        )
        .returning();
      return updated;
    }),

  publish: adminProcedure
    .input(idInput)
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(schedules)
        .set({ status: 'published', updatedAt: new Date() })
        .where(
          and(
            eq(schedules.id, input.id),
            eq(schedules.tenantId, ctx.tenantId),
          ),
        )
        .returning();
      return updated;
    }),

  cancel: adminProcedure
    .input(idInput)
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(schedules)
        .set({ status: 'cancelled', updatedAt: new Date() })
        .where(
          and(
            eq(schedules.id, input.id),
            eq(schedules.tenantId, ctx.tenantId),
          ),
        )
        .returning();
      return updated;
    }),

  // Schedule instances
  createInstance: adminProcedure
    .input(createScheduleInstanceInput)
    .mutation(async ({ ctx, input }) => {
      // Verify the schedule belongs to this tenant
      const [schedule] = await ctx.db
        .select({ classTypeId: schedules.classTypeId })
        .from(schedules)
        .where(and(eq(schedules.id, input.scheduleId), eq(schedules.tenantId, ctx.tenantId)))
        .limit(1);

      if (!schedule) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Schedule not found' });
      }

      // Get capacity from the schedule's class type if not provided
      let capacity = input.capacity;
      if (!capacity) {
        const [ct] = await ctx.db
          .select({ capacity: classTypes.capacity })
          .from(classTypes)
          .where(eq(classTypes.id, schedule.classTypeId))
          .limit(1);
        capacity = ct?.capacity ?? 20;
      }

      const [instance] = await ctx.db
        .insert(scheduleInstances)
        .values({
          tenantId: ctx.tenantId,
          scheduleId: input.scheduleId,
          date: new Date(input.date),
          capacity: capacity!,
        })
        .returning();
      return instance;
    }),

  cancelInstance: adminProcedure
    .input(idInput)
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(scheduleInstances)
        .set({ status: 'cancelled', updatedAt: new Date() })
        .where(
          and(
            eq(scheduleInstances.id, input.id),
            eq(scheduleInstances.tenantId, ctx.tenantId),
          ),
        )
        .returning();
      return updated;
    }),

  listInstances: tenantProcedure
    .input(listInstancesInput)
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db
        .select({
          id: scheduleInstances.id,
          date: scheduleInstances.date,
          capacity: scheduleInstances.capacity,
          status: scheduleInstances.status,
          scheduleId: scheduleInstances.scheduleId,
          startTime: schedules.startTime,
          endTime: schedules.endTime,
          location: schedules.location,
          className: classTypes.name,
          duration: classTypes.duration,
          creditCost: classTypes.creditCost,
          teacherName: users.name,
          bookingCount: sql<number>`(
            SELECT COUNT(*) FROM bookings b
            WHERE b.schedule_instance_id = ${scheduleInstances.id}
              AND b.status = 'confirmed'
          )`.as('booking_count'),
        })
        .from(scheduleInstances)
        .innerJoin(schedules, eq(scheduleInstances.scheduleId, schedules.id))
        .innerJoin(classTypes, eq(schedules.classTypeId, classTypes.id))
        .innerJoin(teachers, eq(schedules.teacherId, teachers.id))
        .innerJoin(users, eq(teachers.userId, users.id))
        .where(
          and(
            eq(scheduleInstances.tenantId, ctx.tenantId),
            gte(scheduleInstances.date, new Date(input.dateFrom)),
            lte(scheduleInstances.date, new Date(input.dateTo)),
            ne(scheduleInstances.status, 'cancelled'),
            isNull(scheduleInstances.deletedAt),
          ),
        )
        .orderBy(scheduleInstances.date)
        .limit(input.limit)
        .offset(input.offset);

      return {
        instances: rows.map((row) => {
          const bookingCount = Number(row.bookingCount);
          const decryptedName = safeDecrypt(row.teacherName) ?? row.teacherName ?? '';
          const nameParts = decryptedName.split(' ');
          const initials = nameParts
            .map((p: string) => p[0] ?? '')
            .join('')
            .toUpperCase()
            .slice(0, 2);
          return {
            id: row.id,
            date: row.date,
            capacity: row.capacity,
            status: row.status,
            className: row.className,
            teacherName: safeDecrypt(row.teacherName) ?? row.teacherName,
            teacherInitials: initials,
            startTime: row.startTime,
            endTime: row.endTime,
            duration: row.duration,
            creditCost: row.creditCost,
            location: row.location,
            spotsLeft: Math.max(0, row.capacity - bookingCount),
            totalSpots: row.capacity,
          };
        }),
      };
    }),

  listByTeacher: teacherProcedure
    .input(listByTeacherInput)
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db
        .select({
          id: scheduleInstances.id,
          date: scheduleInstances.date,
          capacity: scheduleInstances.capacity,
          status: scheduleInstances.status,
          scheduleId: scheduleInstances.scheduleId,
          startTime: schedules.startTime,
          endTime: schedules.endTime,
          location: schedules.location,
          className: classTypes.name,
          duration: classTypes.duration,
          creditCost: classTypes.creditCost,
          teacherName: users.name,
          bookingCount: sql<number>`(
            SELECT COUNT(*) FROM bookings b
            WHERE b.schedule_instance_id = ${scheduleInstances.id}
              AND b.status = 'confirmed'
          )`.as('booking_count'),
        })
        .from(scheduleInstances)
        .innerJoin(schedules, eq(scheduleInstances.scheduleId, schedules.id))
        .innerJoin(classTypes, eq(schedules.classTypeId, classTypes.id))
        .innerJoin(teachers, eq(schedules.teacherId, teachers.id))
        .innerJoin(users, eq(teachers.userId, users.id))
        .where(
          and(
            eq(scheduleInstances.tenantId, ctx.tenantId),
            eq(users.id, ctx.user.id),
            gte(scheduleInstances.date, new Date(input.dateFrom)),
            lte(scheduleInstances.date, new Date(input.dateTo)),
            ne(scheduleInstances.status, 'cancelled'),
            isNull(scheduleInstances.deletedAt),
          ),
        )
        .orderBy(scheduleInstances.date)
        .limit(input.limit)
        .offset(input.offset);

      return {
        instances: rows.map((row) => {
          const bookingCount = Number(row.bookingCount);
          const decryptedName = safeDecrypt(row.teacherName) ?? row.teacherName ?? '';
          const nameParts = decryptedName.split(' ');
          const initials = nameParts
            .map((p: string) => p[0] ?? '')
            .join('')
            .toUpperCase()
            .slice(0, 2);
          return {
            id: row.id,
            date: row.date,
            capacity: row.capacity,
            status: row.status,
            className: row.className,
            teacherName: safeDecrypt(row.teacherName) ?? row.teacherName,
            teacherInitials: initials,
            startTime: row.startTime,
            endTime: row.endTime,
            duration: row.duration,
            creditCost: row.creditCost,
            location: row.location,
            spotsLeft: Math.max(0, row.capacity - bookingCount),
            totalSpots: row.capacity,
          };
        }),
      };
    }),
});
