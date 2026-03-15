import Stripe from "stripe";

// ─── Stripe Client ────────────────────────────────────────────────────────────

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  return new Stripe(key, { apiVersion: "2024-04-10" });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export interface CreateCheckoutParams {
  stripePriceId: string;
  packageId: string;
  userId: string;
  tenantId: string;
  successUrl: string;
  cancelUrl: string;
  /** Optional existing Stripe customer ID */
  stripeCustomerId?: string | null;
}

export async function createCheckoutSession(
  params: CreateCheckoutParams
): Promise<Stripe.Checkout.Session> {
  const stripe = getStripe();
  return stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{ price: params.stripePriceId, quantity: 1 }],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    customer: params.stripeCustomerId ?? undefined,
    metadata: {
      packageId: params.packageId,
      userId: params.userId,
      tenantId: params.tenantId,
    },
  });
}

export interface CreateSubscriptionParams {
  stripePriceId: string;
  packageId: string;
  userId: string;
  tenantId: string;
  successUrl: string;
  cancelUrl: string;
  stripeCustomerId?: string | null;
}

export async function createSubscriptionSession(
  params: CreateSubscriptionParams
): Promise<Stripe.Checkout.Session> {
  const stripe = getStripe();
  return stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: params.stripePriceId, quantity: 1 }],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    customer: params.stripeCustomerId ?? undefined,
    metadata: {
      packageId: params.packageId,
      userId: params.userId,
      tenantId: params.tenantId,
    },
  });
}

export function constructWebhookEvent(
  payload: Buffer | string,
  sig: string,
  webhookSecret: string
): Stripe.Event {
  const stripe = getStripe();
  return stripe.webhooks.constructEvent(payload, sig, webhookSecret);
}

export async function getCustomerPortalUrl(
  customerId: string,
  returnUrl: string
): Promise<string> {
  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
  return session.url;
}

export async function cancelStripeSubscription(
  subscriptionId: string
): Promise<void> {
  const stripe = getStripe();
  await stripe.subscriptions.cancel(subscriptionId);
}
