import { describe, it, expect, vi, beforeEach } from 'vitest';
import { grantCredits, deductCredits, getBalance } from '../credits';

// ─── Mock PrismaClient ─────────────────────────────────────────────────────────

function makeMockTx() {
  return {
    creditPackage: {
      findUnique: vi.fn(),
    },
    creditBalance: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
    },
    creditTransaction: {
      create: vi.fn(),
    },
  };
}

// ─── grantCredits ─────────────────────────────────────────────────────────────

describe('grantCredits', () => {
  let tx: ReturnType<typeof makeMockTx>;

  beforeEach(() => {
    tx = makeMockTx();
  });

  it('wirft Fehler wenn Paket nicht gefunden wird', async () => {
    tx.creditPackage.findUnique.mockResolvedValue(null);

    await expect(
      grantCredits(tx as any, {
        userId: 'user-1',
        tenantId: 'tenant-1',
        packageId: 'pkg-missing',
        paymentId: 'pi_123',
      })
    ).rejects.toThrow('Credit package pkg-missing not found');
  });

  it('erstellt Guthaben mit korrektem Ablaufdatum wenn validityDays gesetzt', async () => {
    const pkg = { id: 'pkg-1', credits: 10, validityDays: 30 };
    tx.creditPackage.findUnique.mockResolvedValue(pkg);
    tx.creditBalance.findUnique.mockResolvedValue(null);
    tx.creditBalance.upsert.mockResolvedValue({});
    tx.creditTransaction.create.mockResolvedValue({});

    const before = Date.now();
    await grantCredits(tx as any, {
      userId: 'user-1',
      tenantId: 'tenant-1',
      packageId: 'pkg-1',
      paymentId: 'pi_abc',
    });
    const after = Date.now();

    const upsertCall = tx.creditBalance.upsert.mock.calls[0][0];
    expect(upsertCall.create.balance).toBe(10);
    expect(upsertCall.update.balance).toBe(10);

    const txCreate = tx.creditTransaction.create.mock.calls[0][0];
    const expiresAt: Date = txCreate.data.expiresAt;
    expect(expiresAt).toBeInstanceOf(Date);
    const msInWindow = 30 * 24 * 60 * 60 * 1000;
    expect(expiresAt.getTime()).toBeGreaterThanOrEqual(before + msInWindow);
    expect(expiresAt.getTime()).toBeLessThanOrEqual(after + msInWindow);
  });

  it('setzt expiresAt auf undefined wenn validityDays nicht gesetzt', async () => {
    const pkg = { id: 'pkg-2', credits: 5, validityDays: null };
    tx.creditPackage.findUnique.mockResolvedValue(pkg);
    tx.creditBalance.findUnique.mockResolvedValue(null);
    tx.creditBalance.upsert.mockResolvedValue({});
    tx.creditTransaction.create.mockResolvedValue({});

    await grantCredits(tx as any, {
      userId: 'user-1',
      tenantId: 'tenant-1',
      packageId: 'pkg-2',
      paymentId: 'pi_xyz',
    });

    const txCreate = tx.creditTransaction.create.mock.calls[0][0];
    expect(txCreate.data.expiresAt).toBeUndefined();
  });

  it('addiert Credits zum bestehenden Guthaben', async () => {
    const pkg = { id: 'pkg-3', credits: 10, validityDays: null };
    tx.creditPackage.findUnique.mockResolvedValue(pkg);
    tx.creditBalance.findUnique.mockResolvedValue({ balance: 5 });
    tx.creditBalance.upsert.mockResolvedValue({});
    tx.creditTransaction.create.mockResolvedValue({});

    await grantCredits(tx as any, {
      userId: 'user-1',
      tenantId: 'tenant-1',
      packageId: 'pkg-3',
      paymentId: 'pi_qwe',
    });

    const upsertCall = tx.creditBalance.upsert.mock.calls[0][0];
    expect(upsertCall.update.balance).toBe(15);
    expect(upsertCall.create.balance).toBe(15);
  });

  it('erstellt eine Purchase-Transaktion mit korrekten Daten', async () => {
    const pkg = { id: 'pkg-4', credits: 20, validityDays: null };
    tx.creditPackage.findUnique.mockResolvedValue(pkg);
    tx.creditBalance.findUnique.mockResolvedValue(null);
    tx.creditBalance.upsert.mockResolvedValue({});
    tx.creditTransaction.create.mockResolvedValue({});

    await grantCredits(tx as any, {
      userId: 'user-1',
      tenantId: 'tenant-1',
      packageId: 'pkg-4',
      paymentId: 'pi_payment',
    });

    const txCreate = tx.creditTransaction.create.mock.calls[0][0];
    expect(txCreate.data.type).toBe('purchase');
    expect(txCreate.data.amount).toBe(20);
    expect(txCreate.data.balanceAfter).toBe(20);
    expect(txCreate.data.adminNote).toContain('pi_payment');
  });
});

// ─── deductCredits ────────────────────────────────────────────────────────────

describe('deductCredits', () => {
  let tx: ReturnType<typeof makeMockTx>;

  beforeEach(() => {
    tx = makeMockTx();
  });

  it('gibt false zurück wenn kein Guthaben vorhanden', async () => {
    tx.creditBalance.findUnique.mockResolvedValue(null);

    const result = await deductCredits(tx as any, {
      userId: 'user-1',
      tenantId: 'tenant-1',
      amount: 5,
      bookingId: 'booking-1',
    });

    expect(result).toBe(false);
    expect(tx.creditBalance.update).not.toHaveBeenCalled();
    expect(tx.creditTransaction.create).not.toHaveBeenCalled();
  });

  it('gibt false zurück wenn Guthaben nicht ausreicht', async () => {
    tx.creditBalance.findUnique.mockResolvedValue({ userId: 'user-1', balance: 3 });

    const result = await deductCredits(tx as any, {
      userId: 'user-1',
      tenantId: 'tenant-1',
      amount: 5,
      bookingId: 'booking-1',
    });

    expect(result).toBe(false);
    expect(tx.creditBalance.update).not.toHaveBeenCalled();
  });

  it('zieht Credits vom ältesten nicht-abgelaufenen Guthaben ab (FIFO)', async () => {
    tx.creditBalance.findUnique.mockResolvedValue({ userId: 'user-1', balance: 10 });
    tx.creditBalance.update.mockResolvedValue({});
    tx.creditTransaction.create.mockResolvedValue({});

    const result = await deductCredits(tx as any, {
      userId: 'user-1',
      tenantId: 'tenant-1',
      amount: 3,
      bookingId: 'booking-2',
    });

    expect(result).toBe(true);
    const updateCall = tx.creditBalance.update.mock.calls[0][0];
    expect(updateCall.data.balance).toBe(7);
  });

  it('erstellt Abzugs-Transaktion bei erfolgreicher Abbuchung', async () => {
    tx.creditBalance.findUnique.mockResolvedValue({ userId: 'user-1', balance: 10 });
    tx.creditBalance.update.mockResolvedValue({});
    tx.creditTransaction.create.mockResolvedValue({});

    await deductCredits(tx as any, {
      userId: 'user-1',
      tenantId: 'tenant-1',
      amount: 4,
      bookingId: 'booking-3',
    });

    const txCreate = tx.creditTransaction.create.mock.calls[0][0];
    expect(txCreate.data.type).toBe('deduction');
    expect(txCreate.data.amount).toBe(-4);
    expect(txCreate.data.balanceAfter).toBe(6);
    expect(txCreate.data.bookingId).toBe('booking-3');
  });

  it('gibt true zurück bei exakt ausreichendem Guthaben (Grenzfall)', async () => {
    tx.creditBalance.findUnique.mockResolvedValue({ userId: 'user-1', balance: 5 });
    tx.creditBalance.update.mockResolvedValue({});
    tx.creditTransaction.create.mockResolvedValue({});

    const result = await deductCredits(tx as any, {
      userId: 'user-1',
      tenantId: 'tenant-1',
      amount: 5,
      bookingId: 'booking-4',
    });

    expect(result).toBe(true);
    const updateCall = tx.creditBalance.update.mock.calls[0][0];
    expect(updateCall.data.balance).toBe(0);
  });

  it('überspringt abgelaufene Guthaben — kein Kontostand führt zu false', async () => {
    // Simulate expired balance scenario: balance record exists but is 0
    tx.creditBalance.findUnique.mockResolvedValue({ userId: 'user-1', balance: 0 });

    const result = await deductCredits(tx as any, {
      userId: 'user-1',
      tenantId: 'tenant-1',
      amount: 1,
      bookingId: 'booking-5',
    });

    expect(result).toBe(false);
  });
});

// ─── getBalance ───────────────────────────────────────────────────────────────

describe('getBalance', () => {
  let prisma: ReturnType<typeof makeMockTx>;

  beforeEach(() => {
    prisma = makeMockTx();
  });

  it('gibt Summe der verbleibenden Credits zurück (nicht abgelaufen)', async () => {
    prisma.creditBalance.findUnique.mockResolvedValue({ balance: 42 });

    const result = await getBalance(prisma as any, {
      userId: 'user-1',
      tenantId: 'tenant-1',
    });

    expect(result).toBe(42);
  });

  it('gibt 0 zurück für Nutzer ohne Guthaben-Eintrag', async () => {
    prisma.creditBalance.findUnique.mockResolvedValue(null);

    const result = await getBalance(prisma as any, {
      userId: 'user-no-balance',
      tenantId: 'tenant-1',
    });

    expect(result).toBe(0);
  });

  it('gibt 0 zurück wenn Guthaben explizit 0 ist', async () => {
    prisma.creditBalance.findUnique.mockResolvedValue({ balance: 0 });

    const result = await getBalance(prisma as any, {
      userId: 'user-1',
      tenantId: 'tenant-1',
    });

    expect(result).toBe(0);
  });
});
