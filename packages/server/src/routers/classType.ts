import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, adminProcedure, publicProcedure } from "../trpc";
import { CreateClassTypeSchema, UpdateClassTypeSchema } from "@studiobase/shared";

export const classTypeRouter = router({
  /** Create class type (admin only) */
  create: adminProcedure
    .input(CreateClassTypeSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.classType.create({
        data: { ...input, tenantId: ctx.tenantId! },
      });
    }),

  /** List class types — public for booking pages (requires tenantId query param), admin gets all */
  list: publicProcedure
    .input(
      z.object({
        tenantId: z.string().uuid(),
        activeOnly: z.boolean().default(true),
        category: z
          .enum(["yoga", "pilates", "dance", "fitness", "meditation", "martial_arts", "other"])
          .optional(),
        limit: z.number().int().positive().max(100).default(50),
        offset: z.number().int().nonnegative().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const where = {
        tenantId: input.tenantId,
        ...(input.activeOnly ? { isActive: true } : {}),
        ...(input.category ? { category: input.category } : {}),
      };
      const [items, total] = await Promise.all([
        ctx.prisma.classType.findMany({
          where,
          take: input.limit,
          skip: input.offset,
          orderBy: { name: "asc" },
        }),
        ctx.prisma.classType.count({ where }),
      ]);
      return { items, total };
    }),

  /** Update class type (admin only) */
  update: adminProcedure
    .input(
      z.object({
        classTypeId: z.string().uuid(),
        data: UpdateClassTypeSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const ct = await ctx.prisma.classType.findFirst({
        where: { id: input.classTypeId, tenantId: ctx.tenantId },
      });
      if (!ct) throw new TRPCError({ code: "NOT_FOUND" });
      return ctx.prisma.classType.update({
        where: { id: input.classTypeId },
        data: input.data,
      });
    }),

  /** Deactivate (soft-disable) a class type */
  deactivate: adminProcedure
    .input(z.object({ classTypeId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const ct = await ctx.prisma.classType.findFirst({
        where: { id: input.classTypeId, tenantId: ctx.tenantId },
      });
      if (!ct) throw new TRPCError({ code: "NOT_FOUND" });
      return ctx.prisma.classType.update({
        where: { id: input.classTypeId },
        data: { isActive: false },
      });
    }),
});
