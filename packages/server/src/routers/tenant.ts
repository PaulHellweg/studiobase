import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, superAdminProcedure, adminProcedure } from "../trpc";
import { CreateTenantSchema, UpdateTenantSchema } from "@studiobase/shared";

export const tenantRouter = router({
  /** Create a new tenant (platform super-admin only) */
  create: superAdminProcedure
    .input(CreateTenantSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.tenant.findUnique({
        where: { slug: input.slug },
      });
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `Tenant slug "${input.slug}" is already taken`,
        });
      }
      return ctx.prisma.tenant.create({ data: input });
    }),

  /** List all tenants (platform super-admin only) */
  list: superAdminProcedure
    .input(
      z.object({
        isActive: z.boolean().optional(),
        limit: z.number().int().positive().max(100).default(50),
        offset: z.number().int().nonnegative().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const where = input.isActive !== undefined ? { isActive: input.isActive } : {};
      const [items, total] = await Promise.all([
        ctx.prisma.tenant.findMany({
          where,
          take: input.limit,
          skip: input.offset,
          orderBy: { createdAt: "desc" },
        }),
        ctx.prisma.tenant.count({ where }),
      ]);
      return { items, total };
    }),

  /** Get a single tenant — super-admin gets any, tenant-admin gets own */
  get: adminProcedure
    .input(z.object({ tenantId: z.string().uuid().optional() }))
    .query(async ({ ctx, input }) => {
      const id = input.tenantId ?? ctx.tenantId;
      const tenant = await ctx.prisma.tenant.findUnique({ where: { id } });
      if (!tenant) throw new TRPCError({ code: "NOT_FOUND" });
      // Admins can only read their own tenant
      if (!ctx.roles.includes("super_admin") && tenant.id !== ctx.tenantId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return tenant;
    }),

  /** Update tenant settings (admin can update own tenant only) */
  update: adminProcedure
    .input(
      z.object({
        tenantId: z.string().uuid().optional(),
        data: UpdateTenantSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const id = input.tenantId ?? ctx.tenantId;
      if (!ctx.roles.includes("super_admin") && id !== ctx.tenantId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return ctx.prisma.tenant.update({ where: { id }, data: input.data });
    }),
});
