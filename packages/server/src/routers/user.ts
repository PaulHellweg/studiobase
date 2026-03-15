import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, authedProcedure, adminProcedure, tenantProcedure } from "../trpc";
import { UpdateUserSchema, ListUsersSchema, GetUserSchema } from "@studiobase/shared";

export const userRouter = router({
  /** List users with CRM search (admin only) */
  list: adminProcedure
    .input(ListUsersSchema)
    .query(async ({ ctx, input }) => {
      const where = {
        tenantId: ctx.tenantId,
        ...(input.search
          ? {
              OR: [
                { firstName: { contains: input.search, mode: "insensitive" as const } },
                { lastName: { contains: input.search, mode: "insensitive" as const } },
                { email: { contains: input.search, mode: "insensitive" as const } },
              ],
            }
          : {}),
      };
      const [items, total] = await Promise.all([
        ctx.prisma.userProfile.findMany({
          where,
          take: input.limit,
          skip: input.offset,
          orderBy: { createdAt: "desc" },
          include: {
            creditBalance: true,
            teacherProfile: true,
          },
        }),
        ctx.prisma.userProfile.count({ where }),
      ]);
      return { items, total };
    }),

  /** Get user — admin can get any in tenant, users get themselves */
  get: tenantProcedure
    .input(GetUserSchema.partial())
    .query(async ({ ctx, input }) => {
      const isAdmin = ctx.roles.includes("tenant_admin");
      const userId = input.userId ?? ctx.userId;

      if (!isAdmin && userId !== ctx.userId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const user = await ctx.prisma.userProfile.findFirst({
        where: {
          id: userId,
          ...(isAdmin ? { tenantId: ctx.tenantId } : {}),
        },
        include: { creditBalance: true, teacherProfile: true },
      });

      if (!user) throw new TRPCError({ code: "NOT_FOUND" });
      return user;
    }),

  /** Update own profile */
  update: authedProcedure
    .input(UpdateUserSchema)
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.userProfile.findFirst({
        where: { keycloakId: ctx.userId },
      });
      if (!user) throw new TRPCError({ code: "NOT_FOUND" });
      return ctx.prisma.userProfile.update({
        where: { id: user.id },
        data: input,
      });
    }),

  /**
   * Export own data (DSGVO Art. 20 — data portability).
   * Returns all personal data in a structured format.
   */
  exportData: authedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.userProfile.findFirst({
      where: { keycloakId: ctx.userId },
      include: {
        bookings: {
          include: { scheduleInstance: { include: { classType: true } } },
        },
        creditTransactions: true,
        payments: true,
        creditBalance: true,
      },
    });
    if (!user) throw new TRPCError({ code: "NOT_FOUND" });

    return {
      exportedAt: new Date().toISOString(),
      profile: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        marketingConsent: user.marketingConsent,
        createdAt: user.createdAt,
      },
      bookings: user.bookings.map((b) => ({
        id: b.id,
        className: b.scheduleInstance.classType.name,
        startAt: b.scheduleInstance.startAt,
        status: b.status,
        creditsUsed: b.creditsUsed,
        createdAt: b.createdAt,
      })),
      creditBalance: user.creditBalance?.balance ?? 0,
      creditTransactions: user.creditTransactions.map((t) => ({
        type: t.type,
        amount: t.amount,
        balanceAfter: t.balanceAfter,
        createdAt: t.createdAt,
      })),
      payments: user.payments.map((p) => ({
        amountCents: p.amountCents,
        currency: p.currency,
        status: p.status,
        createdAt: p.createdAt,
      })),
    };
  }),

  /**
   * Request account deletion (DSGVO Art. 17 — right to erasure).
   * Flags the account for deletion review — actual erasure is handled by a background job.
   */
  requestDeletion: authedProcedure
    .input(z.object({ reason: z.string().optional() }))
    .mutation(async ({ ctx }) => {
      const user = await ctx.prisma.userProfile.findFirst({
        where: { keycloakId: ctx.userId },
      });
      if (!user) throw new TRPCError({ code: "NOT_FOUND" });
      if (user.deletionRequestedAt) {
        throw new TRPCError({ code: "CONFLICT", message: "Deletion already requested" });
      }
      await ctx.prisma.userProfile.update({
        where: { id: user.id },
        data: { deletionRequestedAt: new Date() },
      });
      return { requestedAt: new Date().toISOString() };
    }),
});
