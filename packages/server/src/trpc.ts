import { initTRPC, TRPCError } from "@trpc/server";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { prisma } from "./db";
import { verifyKeycloakToken } from "./auth";
import type { Role } from "@studiobase/shared";

// ─── Context ──────────────────────────────────────────────────────────────────

export interface Context {
  userId?: string;
  tenantId?: string;
  roles: Role[];
  prisma: typeof prisma;
}

export async function createContext({
  req,
}: CreateExpressContextOptions): Promise<Context> {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return { roles: [], prisma };
  }

  const token = authHeader.slice(7);

  try {
    const { userId, tenantId, roles } = await verifyKeycloakToken(token);
    return { userId, tenantId, roles, prisma };
  } catch {
    // Invalid token — treat as unauthenticated (let procedures gate access)
    return { roles: [], prisma };
  }
}

// ─── tRPC Init ────────────────────────────────────────────────────────────────

const t = initTRPC.context<Context>().create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        // Don't leak internal error details in production
        message:
          process.env.NODE_ENV === "production" && shape.data.httpStatus === 500
            ? "Internal server error"
            : error.message,
      },
    };
  },
});

export const router = t.router;
export const middleware = t.middleware;

// ─── Procedures ───────────────────────────────────────────────────────────────

/** No authentication required */
export const publicProcedure = t.procedure;

/** Requires a valid Keycloak JWT */
export const authedProcedure = t.procedure.use(
  middleware(({ ctx, next }) => {
    if (!ctx.userId) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Authentication required" });
    }
    const userId: string = ctx.userId;
    return next({
      ctx: {
        ...ctx,
        userId,
      },
    });
  })
);

/** Requires authentication AND a tenantId claim in the token */
export const tenantProcedure = authedProcedure.use(
  middleware(({ ctx, next }) => {
    if (!ctx.tenantId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "No tenant context — contact your administrator",
      });
    }
    const tenantId: string = ctx.tenantId;
    // userId is guaranteed by authedProcedure middleware above in the chain
    const userId: string = ctx.userId!;
    return next({
      ctx: {
        ...ctx,
        userId,
        tenantId,
      },
    });
  })
);

/** Requires tenant context AND the tenant_admin role */
export const adminProcedure = tenantProcedure.use(
  middleware(({ ctx, next }) => {
    if (!ctx.roles.includes("tenant_admin")) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
    }
    return next({ ctx });
  })
);

/** Requires the super_admin role (platform-wide operations) */
export const superAdminProcedure = authedProcedure.use(
  middleware(({ ctx, next }) => {
    if (!ctx.roles.includes("super_admin")) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Super-admin access required" });
    }
    return next({ ctx });
  })
);

/** Requires tenant context AND the teacher role */
export const teacherProcedure = tenantProcedure.use(
  middleware(({ ctx, next }) => {
    if (!ctx.roles.includes("teacher") && !ctx.roles.includes("tenant_admin")) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Teacher access required" });
    }
    return next({ ctx });
  })
);
