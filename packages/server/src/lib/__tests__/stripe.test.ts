import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mock the Stripe SDK before importing stripe helpers ───────────────────────

const mockSessionsCreate = vi.fn();
const mockConstructEvent = vi.fn();

vi.mock('stripe', () => {
  const MockStripe = vi.fn().mockImplementation(() => ({
    checkout: {
      sessions: {
        create: mockSessionsCreate,
      },
    },
    webhooks: {
      constructEvent: mockConstructEvent,
    },
    billingPortal: {
      sessions: {
        create: vi.fn().mockResolvedValue({ url: 'https://billing.stripe.com/portal' }),
      },
    },
    subscriptions: {
      cancel: vi.fn().mockResolvedValue({}),
    },
  }));
  return { default: MockStripe };
});

import { createCheckoutSession, constructWebhookEvent, createSubscriptionSession } from '../stripe';

// ─── createCheckoutSession ────────────────────────────────────────────────────

describe('createCheckoutSession', () => {
  beforeEach(() => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_dummy';
    vi.clearAllMocks();
  });

  it('wird mit korrekten Parametern aufgerufen (Einmalzahlung)', async () => {
    const fakeSession = { id: 'cs_test_123', url: 'https://checkout.stripe.com/pay/cs_test_123' };
    mockSessionsCreate.mockResolvedValue(fakeSession);

    const params = {
      stripePriceId: 'price_abc',
      packageId: 'pkg-1',
      userId: 'user-1',
      tenantId: 'tenant-1',
      successUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cancel',
    };

    const session = await createCheckoutSession(params);

    expect(mockSessionsCreate).toHaveBeenCalledOnce();
    const callArgs = mockSessionsCreate.mock.calls[0][0];
    expect(callArgs.mode).toBe('payment');
    expect(callArgs.line_items).toEqual([{ price: 'price_abc', quantity: 1 }]);
    expect(callArgs.success_url).toBe('https://example.com/success');
    expect(callArgs.cancel_url).toBe('https://example.com/cancel');
    expect(callArgs.metadata).toMatchObject({
      packageId: 'pkg-1',
      userId: 'user-1',
      tenantId: 'tenant-1',
    });
    expect(session).toBe(fakeSession);
  });

  it('übergibt stripeCustomerId wenn vorhanden', async () => {
    mockSessionsCreate.mockResolvedValue({ id: 'cs_test_456' });

    await createCheckoutSession({
      stripePriceId: 'price_xyz',
      packageId: 'pkg-2',
      userId: 'user-2',
      tenantId: 'tenant-1',
      successUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cancel',
      stripeCustomerId: 'cus_existing',
    });

    const callArgs = mockSessionsCreate.mock.calls[0][0];
    expect(callArgs.customer).toBe('cus_existing');
  });

  it('setzt customer auf undefined wenn stripeCustomerId null ist', async () => {
    mockSessionsCreate.mockResolvedValue({ id: 'cs_test_789' });

    await createCheckoutSession({
      stripePriceId: 'price_abc',
      packageId: 'pkg-3',
      userId: 'user-3',
      tenantId: 'tenant-1',
      successUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cancel',
      stripeCustomerId: null,
    });

    const callArgs = mockSessionsCreate.mock.calls[0][0];
    expect(callArgs.customer).toBeUndefined();
  });

  it('wirft Fehler wenn STRIPE_SECRET_KEY nicht gesetzt', async () => {
    delete process.env.STRIPE_SECRET_KEY;

    await expect(
      createCheckoutSession({
        stripePriceId: 'price_abc',
        packageId: 'pkg-1',
        userId: 'user-1',
        tenantId: 'tenant-1',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      })
    ).rejects.toThrow('STRIPE_SECRET_KEY is not set');
  });
});

// ─── createSubscriptionSession ────────────────────────────────────────────────

describe('createSubscriptionSession', () => {
  beforeEach(() => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_dummy';
    vi.clearAllMocks();
  });

  it('wird im subscription Modus aufgerufen', async () => {
    mockSessionsCreate.mockResolvedValue({ id: 'cs_sub_001' });

    await createSubscriptionSession({
      stripePriceId: 'price_monthly',
      packageId: 'pkg-sub',
      userId: 'user-1',
      tenantId: 'tenant-1',
      successUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cancel',
    });

    const callArgs = mockSessionsCreate.mock.calls[0][0];
    expect(callArgs.mode).toBe('subscription');
  });
});

// ─── constructWebhookEvent ────────────────────────────────────────────────────

describe('constructWebhookEvent', () => {
  beforeEach(() => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_dummy';
    vi.clearAllMocks();
  });

  it('gibt Stripe-Event bei gültiger Signatur zurück', () => {
    const fakeEvent = { type: 'checkout.session.completed', data: {} };
    mockConstructEvent.mockReturnValue(fakeEvent);

    const result = constructWebhookEvent('payload', 'valid-sig', 'whsec_test');

    expect(mockConstructEvent).toHaveBeenCalledWith('payload', 'valid-sig', 'whsec_test');
    expect(result).toBe(fakeEvent);
  });

  it('wirft Fehler bei ungültiger Signatur', () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error('No signatures found matching the expected signature for payload');
    });

    expect(() =>
      constructWebhookEvent('payload', 'bad-sig', 'whsec_test')
    ).toThrow('No signatures found matching the expected signature for payload');
  });
});
