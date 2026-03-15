import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, adminProcedure, tenantProcedure } from "../trpc";
import { CreateStudioSchema, UpdateStudioSchema } from "@studiobase/shared";

export const studioRouter = router({
  /** Create studio — auto-creates a default "Main Room" */
  create: adminProcedure
    .input(CreateStudioSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.$transaction(async (tx) => {
        const studio = await tx.studio.create({
          data: {
            ...input,
            tenantId: ctx.tenantId!,
          },
        });
        // Auto-create default room
        await tx.room.create({
          data: {
            studioId: studio.id,
            tenantId: ctx.tenantId!,
            name: "Main Room",
            capacity: 20,
          },
        });
        return studio;
      });
    }),

  /** List studios scoped by tenantId */
  list: tenantProcedure
    .input(
      z.object({
        includeDeleted: z.boolean().default(false),
        limit: z.number().int().positive().max(100).default(50),
        offset: z.number().int().nonnegative().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const where = {
        tenantId: ctx.tenantId,
        ...(input.includeDeleted ? {} : { deletedAt: null }),
      };
      const [items, total] = await Promise.all([
        ctx.prisma.studio.findMany({
          where,
          include: { rooms: { where: { isActive: true } } },
          take: input.limit,
          skip: input.offset,
          orderBy: { createdAt: "asc" },
        }),
        ctx.prisma.studio.count({ where }),
      ]);
      return { items, total };
    }),

  /** Get single studio */
  get: tenantProcedure
    .input(z.object({ studioId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const studio = await ctx.prisma.studio.findFirst({
        where: { id: input.studioId, tenantId: ctx.tenantId },
        include: { rooms: true },
      });
      if (!studio) throw new TRPCError({ code: "NOT_FOUND" });
      return studio;
    }),

  /** Update studio */
  update: adminProcedure
    .input(
      z.object({
        studioId: z.string().uuid(),
        data: UpdateStudioSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const studio = await ctx.prisma.studio.findFirst({
        where: { id: input.studioId, tenantId: ctx.tenantId },
      });
      if (!studio) throw new TRPCError({ code: "NOT_FOUND" });
      return ctx.prisma.studio.update({
        where: { id: input.studioId },
        data: input.data,
      });
    }),

  /** Soft-delete studio */
  delete: adminProcedure
    .input(z.object({ studioId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const studio = await ctx.prisma.studio.findFirst({
        where: { id: input.studioId, tenantId: ctx.tenantId },
      });
      if (!studio) throw new TRPCError({ code: "NOT_FOUND" });
      return ctx.prisma.studio.update({
        where: { id: input.studioId },
        data: { deletedAt: new Date(), isActive: false },
      });
    }),
});
