import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure, tenantProcedure, adminProcedure } from "../trpc";
import {
  CreateCreditPackageSchema,
  UpdateCreditPackageSchema,
  AdjustCreditBalanceSchema,
  ListCreditTransactionsSchema,
} from "@studiobase/shared";

export const creditRouter = router({
  packages: router({
    /** List credit packages — public (requires tenantId) */
    list: publicProcedure
      .input(
        z.object({
          tenantId: z.string().uuid(),
          activeOnly: z.boolean().default(true),
        })
      )
      .query(async ({ ctx, input }) => {
        return ctx.prisma.creditPackage.findMany({
          where: {
            tenantId: input.tenantId,
            ...(input.activeOnly ? { isActive: true } : {}),
          },
          orderBy: { priceCents: "asc" },
        });
      }),

    /** Create credit package (admin) */
    create: adminProcedure
      .input(CreateCreditPackageSchema)
      .mutation(async ({ ctx, input }) => {
        return ctx.prisma.creditPackage.create({
          data: { ...input, tenantId: ctx.tenantId! },
        });
      }),

    /** Update credit package (admin) */
    update: adminProcedure
      .input(
        z.object({
          packageId: z.string().uuid(),
          data: UpdateCreditPackageSchema,
        })
      )
      .mutation(async ({ ctx, input }) => {
        const pkg = await ctx.prisma.creditPackage.findFirst({
          where: { id: input.packageId, tenantId: ctx.tenantId },
        });
        if (!pkg) throw new TRPCError({ code: "NOT_FOUND" });
        return ctx.prisma.creditPackage.update({
          where: { id: input.packageId },
          data: input.data,
        });
      }),
  }),

  balance: router({
    /** Get own credit balance */
    get: tenantProcedure.query(async ({ ctx }) => {
      const balance = await ctx.prisma.creditBalance.findUnique({
        where: { userId: ctx.userId },
      });
      return balance ?? { balance: 0, userId: ctx.userId };
    }),

    /** Admin can adjust any user's balance (requires reason) */
    adjust: adminProcedure
      .input(AdjustCreditBalanceSchema)
      .mutation(async ({ ctx, input }) => {
        return ctx.prisma.$transaction(async (tx) => {
          const existing = await tx.creditBalance.findUnique({
            where: { userId: input.userId },
          });
          const currentBalance = existing?.balance ?? 0;
          const newBalance = currentBalance + input.amount;

          if (newBalance < 0) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Adjustment would result in negative balance",
            });
          }

          await tx.creditBalance.upsert({
            where: { userId: input.userId },
            create: {
              userId: input.userId,
              tenantId: ctx.tenantId!,
              balance: newBalance,
            },
            update: { balance: newBalance },
          });

          await tx.creditTransaction.create({
            data: {
              tenantId: ctx.tenantId!,
              userId: input.userId,
              type: "admin_adjustment",
              amount: input.amount,
              balanceAfter: newBalance,
              adminNote: input.reason,
            },
          });

          return { balance: newBalance };
        });
      }),
  }),

  transactions: router({
    /** List credit transactions — customer sees own, admin sees any */
    list: tenantProcedure
      .input(ListCreditTransactionsSchema)
      .query(async ({ ctx, input }) => {
        const isAdmin = ctx.roles.includes("tenant_admin");
        const where = {
          tenantId: ctx.tenantId,
          userId: isAdmin && input.userId ? input.userId : ctx.userId,
          ...(input.type ? { type: input.type } : {}),
        };
        const [items, total] = await Promise.all([
          ctx.prisma.creditTransaction.findMany({
            where,
            take: input.limit,
            skip: input.offset,
            orderBy: { createdAt: "desc" },
          }),
          ctx.prisma.creditTransaction.count({ where }),
        ]);
        return { items, total };
      }),
  }),
});
