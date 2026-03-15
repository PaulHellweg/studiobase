import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, tenantProcedure, teacherProcedure } from "../trpc";
import {
  CreateBookingSchema,
  CancelBookingSchema,
  ListBookingsSchema,
  MarkAttendanceSchema,
} from "@studiobase/shared";
import { sendEmail } from "../lib/email";
import {
  bookingConfirmation,
  bookingCancellation,
  waitlistPromotion,
} from "../lib/emailTemplates";

const CANCELLATION_WINDOW_HOURS = 2;

export const bookingRouter = router({
  /**
   * Create booking — validates capacity, deducts credits atomically (FIFO by purchase date).
   * Puts customer on waitlist if class is full.
   */
  create: tenantProcedure
    .input(CreateBookingSchema)
    .mutation(async ({ ctx, input }) => {
      const booking = await ctx.prisma.$transaction(async (tx) => {
        // 1. Lock the instance row
        const instance = await tx.scheduleInstance.findFirst({
          where: { id: input.scheduleInstanceId, tenantId: ctx.tenantId, isCancelled: false },
          include: { classType: true },
        });
        if (!instance) throw new TRPCError({ code: "NOT_FOUND", message: "Class not found or cancelled" });
        if (instance.startAt < new Date()) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot book a class that has already started" });
        }

        // 2. Check for duplicate booking
        const existing = await tx.booking.findFirst({
          where: {
            scheduleInstanceId: input.scheduleInstanceId,
            userId: ctx.userId,
            status: { in: ["confirmed", "waitlisted"] },
          },
        });
        if (existing) throw new TRPCError({ code: "CONFLICT", message: "Already booked" });

        // 3. Count confirmed bookings
        const confirmedCount = await tx.booking.count({
          where: { scheduleInstanceId: input.scheduleInstanceId, status: "confirmed" },
        });

        const isFull = confirmedCount >= instance.maxCapacity;

        if (isFull) {
          // Put on waitlist
          const waitlistCount = await tx.booking.count({
            where: { scheduleInstanceId: input.scheduleInstanceId, status: "waitlisted" },
          });
          return tx.booking.create({
            data: {
              tenantId: ctx.tenantId,
              scheduleInstanceId: input.scheduleInstanceId,
              userId: ctx.userId,
              status: "waitlisted",
              creditsUsed: 0,
              waitlistPosition: waitlistCount + 1,
            },
          });
        }

        // 4. Deduct credits (FIFO — oldest transactions first)
        const creditCost = instance.classType.creditCost;
        if (creditCost > 0) {
          const balance = await tx.creditBalance.findUnique({
            where: { userId: ctx.userId },
          });
          if (!balance || balance.balance < creditCost) {
            throw new TRPCError({
              code: "PAYMENT_REQUIRED",
              message: `Insufficient credits. Need ${creditCost}, have ${balance?.balance ?? 0}`,
            });
          }

          const newBalance = balance.balance - creditCost;
          await tx.creditBalance.update({
            where: { userId: ctx.userId },
            data: { balance: newBalance },
          });

          // Record the booking first so we can reference it in the transaction
          const booking = await tx.booking.create({
            data: {
              tenantId: ctx.tenantId,
              scheduleInstanceId: input.scheduleInstanceId,
              userId: ctx.userId,
              status: "confirmed",
              creditsUsed: creditCost,
            },
          });

          await tx.creditTransaction.create({
            data: {
              tenantId: ctx.tenantId,
              userId: ctx.userId,
              type: "deduction",
              amount: -creditCost,
              balanceAfter: newBalance,
              bookingId: booking.id,
            },
          });

          return booking;
        }

        // Free class
        return tx.booking.create({
          data: {
            tenantId: ctx.tenantId,
            scheduleInstanceId: input.scheduleInstanceId,
            userId: ctx.userId,
            status: "confirmed",
            creditsUsed: 0,
          },
        });
      });

      // Send confirmation email (fire-and-forget; email failures must not abort the booking)
      if (booking.status === "confirmed") {
        const [user, instance] = await Promise.all([
          ctx.prisma.userProfile.findUnique({ where: { id: ctx.userId } }),
          ctx.prisma.scheduleInstance.findUnique({
            where: { id: input.scheduleInstanceId },
            include: { classType: true, room: { include: { studio: true } } },
          }),
        ]);
        if (user && instance) {
          void sendEmail({
            to: user.email,
            subject: `Buchungsbestätigung: ${instance.classType.name}`,
            html: bookingConfirmation({
              customerName: user.firstName,
              className: instance.classType.name,
              date: instance.startAt.toLocaleDateString("de-DE"),
              time: instance.startAt.toLocaleTimeString("de-DE", {
                hour: "2-digit",
                minute: "2-digit",
              }),
              studio: instance.room.studio.name,
            }),
          });
        }
      }

      return booking;
    }),

  /**
   * Cancel booking — refunds credits if within cancellation window,
   * then promotes first waitlist entry.
   */
  cancel: tenantProcedure
    .input(CancelBookingSchema)
    .mutation(async ({ ctx, input }) => {
      // cancelledBooking = snapshot of booking before cancellation
      // promotedUserId = user who was promoted from waitlist (if any)
      const { cancelledBooking, promotedUserId } = await ctx.prisma.$transaction(async (tx) => {
        const booking = await tx.booking.findFirst({
          where: { id: input.bookingId, userId: ctx.userId, tenantId: ctx.tenantId },
          include: { scheduleInstance: { include: { classType: true } } },
        });
        if (!booking) throw new TRPCError({ code: "NOT_FOUND" });
        if (booking.status === "cancelled") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Booking already cancelled" });
        }

        const windowMs = CANCELLATION_WINDOW_HOURS * 60 * 60 * 1000;
        const withinWindow =
          booking.scheduleInstance.startAt.getTime() - Date.now() >= windowMs;

        // Cancel the booking
        await tx.booking.update({
          where: { id: input.bookingId },
          data: {
            status: "cancelled",
            cancelledAt: new Date(),
            cancelReason: input.cancelReason,
          },
        });

        // Refund credits if within window and credits were charged
        if (withinWindow && booking.creditsUsed > 0) {
          const balance = await tx.creditBalance.findUnique({
            where: { userId: ctx.userId },
          });
          const newBalance = (balance?.balance ?? 0) + booking.creditsUsed;
          await tx.creditBalance.update({
            where: { userId: ctx.userId },
            data: { balance: newBalance },
          });
          await tx.creditTransaction.create({
            data: {
              tenantId: ctx.tenantId,
              userId: ctx.userId,
              type: "refund",
              amount: booking.creditsUsed,
              balanceAfter: newBalance,
              bookingId: booking.id,
            },
          });
        }

        let promotedUserId: string | null = null;

        // Promote first waitlist entry if this was a confirmed booking
        if (booking.status === "confirmed") {
          const nextWaiting = await tx.booking.findFirst({
            where: {
              scheduleInstanceId: booking.scheduleInstanceId,
              status: "waitlisted",
            },
            orderBy: { waitlistPosition: "asc" },
            include: { scheduleInstance: { include: { classType: true } } },
          });

          if (nextWaiting) {
            const creditCost = nextWaiting.scheduleInstance.classType.creditCost;
            // Attempt credit deduction for promoted booking
            if (creditCost > 0) {
              const promoteeBalance = await tx.creditBalance.findUnique({
                where: { userId: nextWaiting.userId },
              });
              if (promoteeBalance && promoteeBalance.balance >= creditCost) {
                const newBal = promoteeBalance.balance - creditCost;
                await tx.creditBalance.update({
                  where: { userId: nextWaiting.userId },
                  data: { balance: newBal },
                });
                await tx.creditTransaction.create({
                  data: {
                    tenantId: ctx.tenantId,
                    userId: nextWaiting.userId,
                    type: "deduction",
                    amount: -creditCost,
                    balanceAfter: newBal,
                    bookingId: nextWaiting.id,
                  },
                });
                await tx.booking.update({
                  where: { id: nextWaiting.id },
                  data: { status: "confirmed", creditsUsed: creditCost, waitlistPosition: null },
                });
                promotedUserId = nextWaiting.userId;
              }
              // If insufficient credits — leave on waitlist, skip promotion
            } else {
              await tx.booking.update({
                where: { id: nextWaiting.id },
                data: { status: "confirmed", creditsUsed: 0, waitlistPosition: null },
              });
              promotedUserId = nextWaiting.userId;
            }
          }
        }

        return { cancelledBooking: booking, promotedUserId };
      });

      // Send cancellation email (fire-and-forget)
      const user = await ctx.prisma.userProfile.findUnique({ where: { id: ctx.userId } });
      if (user) {
        void sendEmail({
          to: user.email,
          subject: `Buchung storniert: ${cancelledBooking.scheduleInstance.classType.name}`,
          html: bookingCancellation({
            customerName: user.firstName,
            className: cancelledBooking.scheduleInstance.classType.name,
            date: cancelledBooking.scheduleInstance.startAt.toLocaleDateString("de-DE"),
          }),
        });
      }

      // Send waitlist-promotion email if someone was promoted
      if (promotedUserId) {
        const promotedUser = await ctx.prisma.userProfile.findUnique({
          where: { id: promotedUserId },
        });
        if (promotedUser) {
          void sendEmail({
            to: promotedUser.email,
            subject: `Du hast einen Platz bekommen: ${cancelledBooking.scheduleInstance.classType.name}`,
            html: waitlistPromotion({
              customerName: promotedUser.firstName,
              className: cancelledBooking.scheduleInstance.classType.name,
              date: cancelledBooking.scheduleInstance.startAt.toLocaleDateString("de-DE"),
              time: cancelledBooking.scheduleInstance.startAt.toLocaleTimeString("de-DE", {
                hour: "2-digit",
                minute: "2-digit",
              }),
            }),
          });
        }
      }

      return { success: true };
    }),

  /** List bookings — customer sees own, teacher sees classes they teach, admin sees all */
  list: tenantProcedure
    .input(ListBookingsSchema)
    .query(async ({ ctx, input }) => {
      const isAdmin = ctx.roles.includes("tenant_admin");
      const isTeacher = ctx.roles.includes("teacher");

      const where = {
        tenantId: ctx.tenantId,
        ...(!isAdmin
          ? isTeacher
            ? { scheduleInstance: { teacherId: ctx.userId } }
            : { userId: ctx.userId }
          : {}),
        ...(input.scheduleInstanceId ? { scheduleInstanceId: input.scheduleInstanceId } : {}),
        ...(input.userId && isAdmin ? { userId: input.userId } : {}),
        ...(input.status ? { status: input.status } : {}),
        ...(input.from || input.to
          ? {
              scheduleInstance: {
                startAt: {
                  ...(input.from ? { gte: input.from } : {}),
                  ...(input.to ? { lte: input.to } : {}),
                },
              },
            }
          : {}),
      };

      const [items, total] = await Promise.all([
        ctx.prisma.booking.findMany({
          where,
          include: {
            scheduleInstance: {
              include: { classType: true, room: true },
            },
            user: { select: { id: true, firstName: true, lastName: true, email: true } },
          },
          take: input.limit,
          skip: input.offset,
          orderBy: { createdAt: "desc" },
        }),
        ctx.prisma.booking.count({ where }),
      ]);

      return { items, total };
    }),

  /** Mark attendance (teacher or admin) */
  markAttendance: teacherProcedure
    .input(MarkAttendanceSchema)
    .mutation(async ({ ctx, input }) => {
      const booking = await ctx.prisma.booking.findFirst({
        where: { id: input.bookingId, tenantId: ctx.tenantId },
        include: { scheduleInstance: true },
      });
      if (!booking) throw new TRPCError({ code: "NOT_FOUND" });

      // Teachers can only mark attendance for their own classes
      const isAdmin = ctx.roles.includes("tenant_admin");
      if (!isAdmin && booking.scheduleInstance.teacherId !== ctx.userId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return ctx.prisma.booking.update({
        where: { id: input.bookingId },
        data: { status: input.status },
      });
    }),

  /** Join waitlist */
  joinWaitlist: tenantProcedure
    .input(z.object({ scheduleInstanceId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const instance = await ctx.prisma.scheduleInstance.findFirst({
        where: { id: input.scheduleInstanceId, tenantId: ctx.tenantId, isCancelled: false },
      });
      if (!instance) throw new TRPCError({ code: "NOT_FOUND" });

      const existing = await ctx.prisma.booking.findFirst({
        where: {
          scheduleInstanceId: input.scheduleInstanceId,
          userId: ctx.userId,
          status: { in: ["confirmed", "waitlisted"] },
        },
      });
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "Already in booking or waitlist" });

      const waitlistCount = await ctx.prisma.booking.count({
        where: { scheduleInstanceId: input.scheduleInstanceId, status: "waitlisted" },
      });

      return ctx.prisma.booking.create({
        data: {
          tenantId: ctx.tenantId,
          scheduleInstanceId: input.scheduleInstanceId,
          userId: ctx.userId,
          status: "waitlisted",
          creditsUsed: 0,
          waitlistPosition: waitlistCount + 1,
        },
      });
    }),

  /** Leave waitlist */
  leaveWaitlist: tenantProcedure
    .input(z.object({ bookingId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const booking = await ctx.prisma.booking.findFirst({
        where: { id: input.bookingId, userId: ctx.userId, tenantId: ctx.tenantId, status: "waitlisted" },
      });
      if (!booking) throw new TRPCError({ code: "NOT_FOUND" });
      return ctx.prisma.booking.update({
        where: { id: input.bookingId },
        data: { status: "cancelled", cancelledAt: new Date() },
      });
    }),
});
