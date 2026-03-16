import type { Request, Response } from 'express';
import Stripe from 'stripe';
import { stripe } from './client.js';
import { db } from '../db/index.js';
import { payments, subscriptions, creditPacks, subscriptionTiers, creditLedger } from '@studiobase/shared/schema';
import { eq, and } from 'drizzle-orm';
import { grantCredits } from '../services/credit-service.js';

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
if (!endpointSecret && process.env.NODE_ENV === 'production') {
  throw new Error('STRIPE_WEBHOOK_SECRET is required in production');
}

export async function handleStripeWebhook(req: Request, res: Response): Promise<void> {
  let event: Stripe.Event;

  try {
    const sig = req.headers['stripe-signature'] as string;
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret!);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    res.status(400).json({ error: 'Invalid signature' });
    return;
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;
      case 'charge.refunded':
        await handleChargeRefunded(event.data.object as Stripe.Charge);
        break;
      default:
        // Unhandled event type
        break;
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook handler error:', err);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const { userId, tenantId, creditPackId, type } = session.metadata ?? {};
  if (!userId || !tenantId) return;

  // Idempotency: check if payment already recorded
  const [existing] = await db
    .select({ id: payments.id })
    .from(payments)
    .where(eq(payments.stripePaymentId, session.payment_intent as string ?? session.id))
    .limit(1);

  if (existing) return; // Already processed

  if (type === 'credit_pack' && creditPackId) {
    // Get credit pack details
    const [pack] = await db
      .select()
      .from(creditPacks)
      .where(eq(creditPacks.id, creditPackId))
      .limit(1);

    if (!pack) return;

    // Record payment
    const [payment] = await db
      .insert(payments)
      .values({
        tenantId,
        userId,
        stripePaymentId: (session.payment_intent as string) ?? session.id,
        amount: session.amount_total ?? pack.price,
        currency: session.currency ?? 'eur',
        status: 'completed',
        type: 'one_time',
        relatedCreditPackId: creditPackId,
        metadata: { sessionId: session.id },
      })
      .returning();

    // Grant credits
    await grantCredits(userId, tenantId, pack.quantity, {
      expiryDays: pack.expiryDays ?? undefined,
      paymentId: payment.id,
    });
  }

  if (type === 'subscription') {
    const subscriptionId = session.subscription as string;
    if (!subscriptionId) return;

    const { subscriptionTierId } = session.metadata ?? {};
    if (!subscriptionTierId) return;

    // Record subscription
    const stripeSub = await stripe.subscriptions.retrieve(subscriptionId);
    await db.insert(subscriptions).values({
      tenantId,
      userId,
      tierId: subscriptionTierId,
      stripeSubscriptionId: subscriptionId,
      status: 'active',
      currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
    });
  }
}

async function handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
  const subscriptionId = invoice.subscription as string;
  if (!subscriptionId) return;

  // Find our subscription record
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.stripeSubscriptionId, subscriptionId))
    .limit(1);

  if (!sub) return;

  // Idempotency check
  const paymentIntentId = invoice.payment_intent as string ?? invoice.id;
  const [existing] = await db
    .select({ id: payments.id })
    .from(payments)
    .where(eq(payments.stripePaymentId, paymentIntentId))
    .limit(1);

  if (existing) return;

  // Get tier to know how many credits to grant
  const [tier] = await db
    .select()
    .from(subscriptionTiers)
    .where(eq(subscriptionTiers.id, sub.tierId))
    .limit(1);

  if (!tier) return;

  // Record payment
  const [payment] = await db
    .insert(payments)
    .values({
      tenantId: sub.tenantId,
      userId: sub.userId,
      stripePaymentId: paymentIntentId,
      amount: invoice.amount_paid ?? 0,
      currency: invoice.currency ?? 'eur',
      status: 'completed',
      type: 'subscription',
      relatedSubscriptionId: sub.id,
      metadata: { invoiceId: invoice.id },
    })
    .returning();

  // Grant credits for this period
  const expiryDays = tier.period === 'weekly' ? 7 : 30;
  await grantCredits(sub.userId, sub.tenantId, tier.creditsPerPeriod, {
    expiryDays,
    paymentId: payment.id,
    metadata: { subscriptionId: sub.id, period: tier.period },
  });

  // Update subscription period
  const stripeSub = await stripe.subscriptions.retrieve(subscriptionId);
  await db
    .update(subscriptions)
    .set({
      currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.id, sub.id));
}

async function handleChargeRefunded(charge: Stripe.Charge): Promise<void> {
  const paymentIntentId = charge.payment_intent as string;
  if (!paymentIntentId) return;

  // Find the payment record
  const [payment] = await db
    .select()
    .from(payments)
    .where(eq(payments.stripePaymentId, paymentIntentId))
    .limit(1);

  if (!payment || payment.status === 'refunded') return;

  // Mark as refunded
  await db
    .update(payments)
    .set({ status: 'refunded', updatedAt: new Date() })
    .where(eq(payments.id, payment.id));

  // Claw back granted credits — find all grant entries linked to this payment
  // and insert a negative (expiry) entry to revoke them
  const grants = await db
    .select({ id: creditLedger.id, amount: creditLedger.amount })
    .from(creditLedger)
    .where(
      and(
        eq(creditLedger.relatedPaymentId, payment.id),
        eq(creditLedger.type, 'grant'),
      ),
    );

  for (const grant of grants) {
    await db.insert(creditLedger).values({
      tenantId: payment.tenantId,
      userId: payment.userId,
      amount: -grant.amount, // claw back
      type: 'expiry',
      metadata: { reason: 'payment_refunded', originalGrantId: grant.id },
    });
  }
}
