import { stripe } from './client.js';
import { db } from '../db/index.js';
import { subscriptions } from '@studiobase/shared/schema';
import { eq, and } from 'drizzle-orm';

export async function createPortalSession(
  userId: string,
  tenantId: string,
): Promise<string> {
  // Find the user's Stripe subscription to get the customer ID
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.tenantId, tenantId),
        eq(subscriptions.status, 'active'),
      ),
    )
    .limit(1);

  if (!sub) {
    throw new Error('No active subscription found');
  }

  // Retrieve the Stripe subscription to get the customer
  const stripeSub = await stripe.subscriptions.retrieve(sub.stripeSubscriptionId);
  const customerId = stripeSub.customer as string;

  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${clientUrl}/billing`,
  });

  return session.url;
}
