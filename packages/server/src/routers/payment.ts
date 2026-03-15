import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, tenantProcedure, publicProcedure } from "../trpc";
import {
  CreateCheckoutSchema,
  CreateSubscriptionSchema,
  ListPaymentsSchema,
} from "@studiobase/shared";

export const paymentRouter = router({
  /**
   * Create Stripe Checkout session for a one-time credit package purchase.
   * TODO: Integrate with Stripe SDK — requires STRIPE_SECRET_KEY in env.
   */
  createCheckout: tenantProcedure
    .input(CreateCheckoutSchema)
    .mutation(async ({ ctx, input }) => {
      const pkg = await ctx.prisma.creditPackage.findFirst({
        where: { id: input.packageId, tenantId: ctx.tenantId, isActive: true },
      });
      if (!pkg) throw new TRPCError({ code: "NOT_FOUND", message: "Package not found" });

      // TODO: const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
      // TODO: const session = await stripe.checkout.sessions.create({
      //   mode: "payment",
      //   line_items: [{ price: pkg.stripePriceId!, quantity: 1 }],
      //   success_url: input.successUrl,
      //   cancel_url: input.cancelUrl,
      //   metadata: { packageId: pkg.id, userId: ctx.userId, tenantId: ctx.tenantId },
      // });
      // TODO: Create pending payment record
      // TODO: return { checkoutUrl: session.url };

      throw new TRPCError({
        code: "NOT_IMPLEMENTED",
        message: "Stripe integration pending — set STRIPE_SECRET_KEY and uncomment Stripe code",
      });
    }),

  /**
   * Create Stripe subscription session.
   * TODO: Integrate with Stripe SDK.
   */
  createSubscription: tenantProcedure
    .input(CreateSubscriptionSchema)
    .mutation(async ({ ctx, input }) => {
      const pkg = await ctx.prisma.creditPackage.findFirst({
        where: { id: input.packageId, tenantId: ctx.tenantId, isActive: true },
      });
      if (!pkg) throw new TRPCError({ code: "NOT_FOUND", message: "Package not found" });

      // TODO: const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
      // TODO: create/update Stripe customer for user
      // TODO: const session = await stripe.checkout.sessions.create({ mode: "subscription", ... });
      // TODO: return { checkoutUrl: session.url };

      throw new TRPCError({
        code: "NOT_IMPLEMENTED",
        message: "Stripe subscription integration pending",
      });
    }),

  /**
   * Stripe webhook handler — processes checkout.session.completed, invoice.paid, charge.refunded.
   * Note: raw body parsing is handled in index.ts; this procedure receives pre-verified events.
   * TODO: Uncomment Stripe event handling once STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET are set.
   */
  webhook: publicProcedure
    .input(z.object({ event: z.record(z.unknown()) }))
    .mutation(async ({ input }) => {
      const event = input.event as { type: string; data: { object: Record<string, unknown> } };

      switch (event.type) {
        case "checkout.session.completed": {
          // TODO: Extract metadata, grant credits, record payment
          // const session = event.data.object;
          // const { packageId, userId, tenantId } = session.metadata;
          // await grantCredits(ctx.prisma, { packageId, userId, tenantId });
          break;
        }
        case "invoice.paid": {
          // TODO: Handle recurring subscription payment — grant monthly credits
          break;
        }
        case "charge.refunded": {
          // TODO: Reverse credit grant, update payment status
          break;
        }
        default:
          // Unhandled event type — safe to ignore
          break;
      }

      return { received: true };
    }),

  /** List payments — customer sees own, admin sees all */
  list: tenantProcedure
    .input(ListPaymentsSchema)
    .query(async ({ ctx, input }) => {
      const isAdmin = ctx.roles.includes("tenant_admin");
      const where = {
        tenantId: ctx.tenantId,
        ...(isAdmin && input.userId ? { userId: input.userId } : {}),
        ...(!isAdmin ? { userId: ctx.userId } : {}),
        ...(input.status ? { status: input.status } : {}),
      };
      const [items, total] = await Promise.all([
        ctx.prisma.payment.findMany({
          where,
          take: input.limit,
          skip: input.offset,
          orderBy: { createdAt: "desc" },
          include: { package: true },
        }),
        ctx.prisma.payment.count({ where }),
      ]);
      return { items, total };
    }),
});
