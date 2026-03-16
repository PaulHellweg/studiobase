import Stripe from 'stripe';

const hasStripeKey = !!process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== 'sk_test_...';

if (!hasStripeKey) {
  console.warn('STRIPE_SECRET_KEY not set — Stripe features will not work');
}

export const stripe = hasStripeKey
  ? new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-02-24.acacia' })
  : (null as unknown as Stripe);
