import { stripe } from './client.js';
import type { CreditPack, SubscriptionTier } from '@studiobase/shared/schema';

interface CheckoutParams {
  userId: string;
  tenantId: string;
  type: 'one_time' | 'subscription';
  creditPack?: CreditPack;
  subscriptionTier?: SubscriptionTier;
}

export async function createCheckoutSession(params: CheckoutParams): Promise<string> {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

  if (params.type === 'one_time' && params.creditPack) {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: params.creditPack.name,
              description: `${params.creditPack.quantity} credits`,
            },
            unit_amount: params.creditPack.price,
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId: params.userId,
        tenantId: params.tenantId,
        creditPackId: params.creditPack.id,
        type: 'credit_pack',
      },
      success_url: `${clientUrl}/billing?success=true`,
      cancel_url: `${clientUrl}/billing?cancelled=true`,
    });
    return session.url!;
  }

  if (params.type === 'subscription' && params.subscriptionTier) {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: params.subscriptionTier.name,
              description: `${params.subscriptionTier.creditsPerPeriod} credits per ${params.subscriptionTier.period}`,
            },
            unit_amount: params.subscriptionTier.price,
            recurring: {
              interval: params.subscriptionTier.period === 'weekly' ? 'week' : 'month',
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId: params.userId,
        tenantId: params.tenantId,
        subscriptionTierId: params.subscriptionTier.id,
        type: 'subscription',
      },
      success_url: `${clientUrl}/billing?success=true`,
      cancel_url: `${clientUrl}/billing?cancelled=true`,
    });
    return session.url!;
  }

  throw new Error('Invalid checkout parameters');
}
