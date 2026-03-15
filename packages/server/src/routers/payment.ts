import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, tenantProcedure, publicProcedure } from "../trpc";
import { logger } from "../lib/logger";
import {
  CreateCheckoutSchema,
  CreateSubscriptionSchema,
  ListPaymentsSchema,
} from "@studiobase/shared";
import {
  createCheckoutSession,
  createSubscriptionSession,
} from "../lib/stripe";
import { grantCredits } from "../lib/credits";
import { sendEmail } from "../lib/email";
import { creditsPurchased } from "../lib/emailTemplates";

export const paymentRouter = router({
  /**
   * Create Stripe Checkout session for a one-time credit package purchase.
   */
  createCheckout: tenantProcedure
    .input(CreateCheckoutSchema)
    .mutation(async ({ ctx, input }) => {
      const pkg = await ctx.prisma.creditPackage.findFirst({
        where: { id: input.packageId, tenantId: ctx.tenantId, isActive: true },
      });
      if (!pkg) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Package not found" });
      }
      if (!pkg.stripePriceId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Package has no Stripe price configured",
        });
      }

      // Fetch tenant to get the Stripe customer ID if one exists
      const tenant = await ctx.prisma.tenant.findUnique({ where: { id: ctx.tenantId } });

      const session = await createCheckoutSession({
        stripePriceId: pkg.stripePriceId,
        packageId: pkg.id,
        userId: ctx.userId,
        tenantId: ctx.tenantId,
        successUrl: input.successUrl,
        cancelUrl: input.cancelUrl,
        stripeCustomerId: tenant?.stripeCustomerId,
      });

      // Create pending payment record so we can track it
      await ctx.prisma.payment.create({
        data: {
          tenantId: ctx.tenantId,
          userId: ctx.userId,
          packageId: pkg.id,
          stripePaymentIntentId: session.payment_intent as string | undefined,
          amountCents: pkg.priceCents,
          currency: pkg.currency.toLowerCase(),
          status: "pending",
          metadata: { checkoutSessionId: session.id },
        },
      });

      if (!session.url) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Stripe did not return a checkout URL",
        });
      }

      return { checkoutUrl: session.url };
    }),

  /**
   * Create Stripe subscription session.
   */
  createSubscription: tenantProcedure
    .input(CreateSubscriptionSchema)
    .mutation(async ({ ctx, input }) => {
      const pkg = await ctx.prisma.creditPackage.findFirst({
        where: { id: input.packageId, tenantId: ctx.tenantId, isActive: true },
      });
      if (!pkg) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Package not found" });
      }
      if (!pkg.stripePriceId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Package has no Stripe price configured",
        });
      }

      const tenant = await ctx.prisma.tenant.findUnique({
        where: { id: ctx.tenantId },
      });

      const session = await createSubscriptionSession({
        stripePriceId: pkg.stripePriceId,
        packageId: pkg.id,
        userId: ctx.userId,
        tenantId: ctx.tenantId,
        successUrl: input.successUrl,
        cancelUrl: input.cancelUrl,
        stripeCustomerId: tenant?.stripeCustomerId,
      });

      if (!session.url) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Stripe did not return a checkout URL",
        });
      }

      return { checkoutUrl: session.url };
    }),

  /**
   * Stripe webhook — receives raw-body verified events from index.ts.
   * This procedure is called internally (not directly by Stripe).
   */
  webhook: publicProcedure
    .input(z.object({ event: z.record(z.unknown()) }))
    .mutation(async ({ ctx, input }) => {
      const event = input.event as {
        id: string;
        type: string;
        data: { object: Record<string, unknown> };
      };

      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as {
            id: string;
            payment_intent?: string;
            subscription?: string;
            metadata?: {
              packageId?: string;
              userId?: string;
              tenantId?: string;
            };
          };

          const { packageId, userId, tenantId } = session.metadata ?? {};
          if (!packageId || !userId || !tenantId) {
            logger.error({ sessionId: session.id }, "[webhook] checkout.session.completed: missing metadata");
            break;
          }

          // Idempotency: check if we already processed this session
          const paymentId = session.payment_intent ?? session.id;
          const existing = await ctx.prisma.payment.findFirst({
            where: {
              stripePaymentIntentId: paymentId,
              status: "succeeded",
            },
          });
          if (existing) {
            logger.info({ paymentId }, "[webhook] Already processed, skipping");
            break;
          }

          await ctx.prisma.$transaction(async (tx) => {
            await grantCredits(tx, { userId, tenantId, packageId, paymentId });

            // Update or create the payment record as succeeded
            await tx.payment.upsert({
              where: {
                stripePaymentIntentId: paymentId,
              },
              create: {
                tenantId,
                userId,
                packageId,
                stripePaymentIntentId: paymentId,
                amountCents: 0, // Unknown at this point
                currency: "eur",
                status: "succeeded",
                metadata: { checkoutSessionId: session.id },
              },
              update: {
                status: "succeeded",
              },
            });
          });

          // Send email after transaction
          const [user, pkg] = await Promise.all([
            ctx.prisma.userProfile.findUnique({ where: { id: userId } }),
            ctx.prisma.creditPackage.findUnique({ where: { id: packageId } }),
          ]);
          if (user && pkg) {
            await sendEmail({
              to: user.email,
              subject: "Credits gutgeschrieben",
              html: creditsPurchased({
                customerName: user.firstName,
                credits: pkg.credits,
                expiresAt: pkg.validityDays
                  ? new Date(
                      Date.now() + pkg.validityDays * 24 * 60 * 60 * 1000
                    ).toLocaleDateString("de-DE")
                  : null,
              }),
            });
          }
          break;
        }

        case "invoice.payment_succeeded": {
          // Subscription renewal
          const invoice = event.data.object as {
            id: string;
            payment_intent?: string;
            subscription?: string;
            metadata?: {
              packageId?: string;
              userId?: string;
              tenantId?: string;
            };
          };

          const { packageId, userId, tenantId } = invoice.metadata ?? {};
          if (!packageId || !userId || !tenantId) {
            // Subscription invoices may not carry metadata on the invoice itself;
            // in production you'd look up via invoice.subscription → subscription.metadata
            logger.warn({ invoiceId: invoice.id }, "[webhook] invoice.payment_succeeded: missing metadata, skipping");
            break;
          }

          const paymentId = invoice.payment_intent ?? invoice.id;

          const existing = await ctx.prisma.payment.findFirst({
            where: { stripePaymentIntentId: paymentId, status: "succeeded" },
          });
          if (existing) break;

          await ctx.prisma.$transaction(async (tx) => {
            await grantCredits(tx, { userId, tenantId, packageId, paymentId });
            await tx.payment.create({
              data: {
                tenantId,
                userId,
                packageId,
                stripePaymentIntentId: paymentId,
                stripeSubscriptionId: invoice.subscription,
                amountCents: 0,
                currency: "eur",
                status: "succeeded",
                metadata: { invoiceId: invoice.id },
              },
            });
          });

          const [user, pkg] = await Promise.all([
            ctx.prisma.userProfile.findUnique({ where: { id: userId } }),
            ctx.prisma.creditPackage.findUnique({ where: { id: packageId } }),
          ]);
          if (user && pkg) {
            await sendEmail({
              to: user.email,
              subject: "Credits gutgeschrieben",
              html: creditsPurchased({
                customerName: user.firstName,
                credits: pkg.credits,
                expiresAt: pkg.validityDays
                  ? new Date(
                      Date.now() + pkg.validityDays * 24 * 60 * 60 * 1000
                    ).toLocaleDateString("de-DE")
                  : null,
              }),
            });
          }
          break;
        }

        case "customer.subscription.deleted": {
          const subscription = event.data.object as {
            id: string;
            metadata?: { tenantId?: string };
          };

          // Mark the subscription payment records inactive
          await ctx.prisma.payment.updateMany({
            where: { stripeSubscriptionId: subscription.id },
            data: { status: "refunded", metadata: { cancelledByStripe: true } },
          });
          break;
        }

        default:
          // Unhandled event — safe to ignore
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
