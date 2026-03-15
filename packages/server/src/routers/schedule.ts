import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, adminProcedure, teacherProcedure } from "../trpc";
import {
  CreateScheduleSchema,
  UpdateScheduleSchema,
  OverrideInstanceSchema,
} from "@studiobase/shared";

/** Generate schedule instances from a schedule definition */
async function generateInstances(
  ctx: { prisma: import("../trpc").Context["prisma"]; tenantId: string },
  scheduleId: string
): Promise<void> {
  const schedule = await ctx.prisma.schedule.findFirst({
    where: { id: scheduleId, tenantId: ctx.tenantId },
    include: { classType: true },
  });
  if (!schedule) return;

  const instances: Array<{
    scheduleId: string;
    tenantId: string;
    classTypeId: string;
    roomId: string;
    teacherId: string;
    startAt: Date;
    endAt: Date;
    maxCapacity: number;
  }> = [];

  const start = new Date(schedule.startDate);
  const end = schedule.endDate
    ? new Date(schedule.endDate)
    : new Date(start.getTime() + 90 * 24 * 60 * 60 * 1000); // 90-day default window

  const [startHour, startMin] = schedule.startTime.split(":").map(Number);
  const [endHour, endMin] = schedule.endTime.split(":").map(Number);

  const current = new Date(start);

  while (current <= end) {
    const dayOfWeek = current.getDay(); // 0=Sun … 6=Sat

    const shouldInclude =
      schedule.recurrenceType === "none"
        ? current.toDateString() === start.toDateString()
        : schedule.recurrenceType === "daily"
        ? true
        : schedule.recurrenceType === "weekly" ||
          schedule.recurrenceType === "custom"
        ? schedule.recurrenceDays.includes(dayOfWeek)
        : false;

    if (shouldInclude) {
      const startAt = new Date(current);
      startAt.setHours(startHour, startMin, 0, 0);
      const endAt = new Date(current);
      endAt.setHours(endHour, endMin, 0, 0);

      instances.push({
        scheduleId: schedule.id,
        tenantId: schedule.tenantId,
        classTypeId: schedule.classTypeId,
        roomId: schedule.roomId,
        teacherId: schedule.teacherId,
        startAt,
        endAt,
        maxCapacity: schedule.maxCapacity,
      });
    }

    if (schedule.recurrenceType === "none") break;
    current.setDate(current.getDate() + 1);
  }

  if (instances.length > 0) {
    await ctx.prisma.scheduleInstance.createMany({
      data: instances,
      skipDuplicates: true,
    });
  }
}

export const scheduleRouter = router({
  /** Create schedule and generate instances */
  create: adminProcedure
    .input(CreateScheduleSchema)
    .mutation(async ({ ctx, input }) => {
      // Check for room conflicts
      const conflict = await ctx.prisma.scheduleInstance.findFirst({
        where: {
          tenantId: ctx.tenantId,
          roomId: input.roomId,
          startAt: { gte: input.startDate },
          ...(input.endDate ? { endAt: { lte: input.endDate } } : {}),
          isCancelled: false,
        },
      });
      if (conflict) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Room has overlapping schedule in the given date range",
        });
      }

      const schedule = await ctx.prisma.schedule.create({
        data: {
          ...input,
          tenantId: ctx.tenantId!,
        },
      });

      await generateInstances({ prisma: ctx.prisma, tenantId: ctx.tenantId! }, schedule.id);
      return schedule;
    }),

  /** List schedules — teacher sees own, admin sees all */
  list: teacherProcedure
    .input(
      z.object({
        from: z.coerce.date().optional(),
        to: z.coerce.date().optional(),
        limit: z.number().int().positive().max(100).default(50),
        offset: z.number().int().nonnegative().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const isAdmin = ctx.roles.includes("tenant_admin");
      const where = {
        tenantId: ctx.tenantId,
        ...(!isAdmin ? { teacherId: ctx.userId } : {}),
        ...(input.from ? { startDate: { gte: input.from } } : {}),
        ...(input.to ? { endDate: { lte: input.to } } : {}),
      };
      const [items, total] = await Promise.all([
        ctx.prisma.schedule.findMany({
          where,
          include: { classType: true, room: true },
          take: input.limit,
          skip: input.offset,
          orderBy: { startDate: "asc" },
        }),
        ctx.prisma.schedule.count({ where }),
      ]);
      return { items, total };
    }),

  /** Update schedule definition */
  update: adminProcedure
    .input(z.object({ scheduleId: z.string().uuid(), data: UpdateScheduleSchema }))
    .mutation(async ({ ctx, input }) => {
      const schedule = await ctx.prisma.schedule.findFirst({
        where: { id: input.scheduleId, tenantId: ctx.tenantId },
      });
      if (!schedule) throw new TRPCError({ code: "NOT_FOUND" });
      return ctx.prisma.schedule.update({
        where: { id: input.scheduleId },
        data: input.data,
      });
    }),

  /** Manually trigger instance generation for a schedule */
  generateInstances: adminProcedure
    .input(z.object({ scheduleId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await generateInstances({ prisma: ctx.prisma, tenantId: ctx.tenantId! }, input.scheduleId);
      return { success: true };
    }),

  /** Override a specific schedule instance (cancel, reschedule, change teacher) */
  overrideInstance: adminProcedure
    .input(OverrideInstanceSchema)
    .mutation(async ({ ctx, input }) => {
      const instance = await ctx.prisma.scheduleInstance.findFirst({
        where: { id: input.instanceId, tenantId: ctx.tenantId },
      });
      if (!instance) throw new TRPCError({ code: "NOT_FOUND" });

      const { instanceId, ...updateData } = input;

      // If cancelling, also cancel all confirmed bookings
      if (input.isCancelled) {
        await ctx.prisma.booking.updateMany({
          where: { scheduleInstanceId: instanceId, status: "confirmed" },
          data: { status: "cancelled", cancelledAt: new Date(), cancelReason: input.cancelReason },
        });
      }

      return ctx.prisma.scheduleInstance.update({
        where: { id: instanceId },
        data: updateData,
      });
    }),

  /** List schedule instances (public-facing for booking pages) */
  listInstances: teacherProcedure
    .input(
      z.object({
        from: z.coerce.date(),
        to: z.coerce.date(),
        classTypeId: z.string().uuid().optional(),
        roomId: z.string().uuid().optional(),
        limit: z.number().int().positive().max(200).default(100),
        offset: z.number().int().nonnegative().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const isAdmin = ctx.roles.includes("tenant_admin");
      const where = {
        tenantId: ctx.tenantId,
        startAt: { gte: input.from, lte: input.to },
        isCancelled: false,
        ...(!isAdmin ? { teacherId: ctx.userId } : {}),
        ...(input.classTypeId ? { classTypeId: input.classTypeId } : {}),
        ...(input.roomId ? { roomId: input.roomId } : {}),
      };
      return ctx.prisma.scheduleInstance.findMany({
        where,
        include: {
          classType: true,
          room: true,
          teacher: { select: { id: true, firstName: true, lastName: true } },
          _count: { select: { bookings: { where: { status: "confirmed" } } } },
        },
        take: input.limit,
        skip: input.offset,
        orderBy: { startAt: "asc" },
      });
    }),
});
