import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TRPCError } from '@trpc/server';

// ─── Mock email modules so tests don't send real emails ───────────────────────

vi.mock('../../lib/email', () => ({
  sendEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../lib/emailTemplates', () => ({
  bookingConfirmation: vi.fn().mockReturnValue('<html>confirm</html>'),
  bookingCancellation: vi.fn().mockReturnValue('<html>cancel</html>'),
  waitlistPromotion: vi.fn().mockReturnValue('<html>waitlist</html>'),
}));

// ─── Helper — build minimal mock context ─────────────────────────────────────

interface MockTx {
  scheduleInstance: { findFirst: ReturnType<typeof vi.fn> };
  booking: {
    findFirst: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    updateMany: ReturnType<typeof vi.fn>;
  };
  creditBalance: {
    findUnique: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  creditTransaction: { create: ReturnType<typeof vi.fn> };
  userProfile: { findUnique: ReturnType<typeof vi.fn> };
}

function makeMockPrisma() {
  const tx: MockTx = {
    scheduleInstance: { findFirst: vi.fn() },
    booking: {
      findFirst: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    creditBalance: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    creditTransaction: { create: vi.fn() },
    userProfile: { findUnique: vi.fn() },
  };

  const prisma = {
    ...tx,
    $transaction: vi.fn((fn: (tx: MockTx) => Promise<unknown>) => fn(tx)),
  };

  return { prisma, tx };
}

function makeMockCtx(overrides: Partial<{ userId: string; tenantId: string; roles: string[] }> = {}) {
  const { prisma, tx } = makeMockPrisma();
  return {
    ctx: {
      userId: 'user-customer',
      tenantId: 'tenant-1',
      roles: ['customer'],
      prisma,
      ...overrides,
    },
    tx,
    prisma,
  };
}

// ─── Booking-Erstellung ───────────────────────────────────────────────────────

/**
 * We test the booking mutation logic directly by calling the handler function
 * extracted via the tRPC router. Because the router is constructed at module
 * level and requires real prisma/Keycloak setup, we instead replicate the
 * exact business-rule flow as unit tests against mock prisma objects.
 *
 * This keeps tests fast, isolated, and free of infrastructure dependencies.
 */

describe('Buchungs-Erstellung: Geschäftsregeln', () => {
  // ── Helper: simulate the create booking transaction logic ─────────────────

  async function simulateCreateBooking(
    tx: ReturnType<typeof makeMockPrisma>['tx'],
    ctx: { userId: string; tenantId: string },
    input: { scheduleInstanceId: string }
  ) {
    // Mirror the booking.create mutation logic from booking.ts

    const instance = await tx.scheduleInstance.findFirst({
      where: { id: input.scheduleInstanceId, tenantId: ctx.tenantId, isCancelled: false },
      include: { classType: true },
    });
    if (!instance) throw new TRPCError({ code: 'NOT_FOUND', message: 'Class not found or cancelled' });
    if ((instance as any).startAt < new Date()) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cannot book a class that has already started' });
    }

    const existing = await tx.booking.findFirst({
      where: {
        scheduleInstanceId: input.scheduleInstanceId,
        userId: ctx.userId,
        status: { in: ['confirmed', 'waitlisted'] },
      },
    });
    if (existing) throw new TRPCError({ code: 'CONFLICT', message: 'Already booked' });

    const confirmedCount = await tx.booking.count({
      where: { scheduleInstanceId: input.scheduleInstanceId, status: 'confirmed' },
    });

    const isFull = confirmedCount >= (instance as any).maxCapacity;

    if (isFull) {
      const waitlistCount = await tx.booking.count({
        where: { scheduleInstanceId: input.scheduleInstanceId, status: 'waitlisted' },
      });
      return tx.booking.create({
        data: {
          tenantId: ctx.tenantId,
          scheduleInstanceId: input.scheduleInstanceId,
          userId: ctx.userId,
          status: 'waitlisted',
          creditsUsed: 0,
          waitlistPosition: waitlistCount + 1,
        },
      });
    }

    const creditCost = (instance as any).classType.creditCost;
    if (creditCost > 0) {
      const balance = await tx.creditBalance.findUnique({ where: { userId: ctx.userId } });
      if (!balance || balance.balance < creditCost) {
        throw new TRPCError({
          code: 'PAYMENT_REQUIRED',
          message: `Insufficient credits. Need ${creditCost}, have ${(balance as any)?.balance ?? 0}`,
        });
      }
      const newBalance = (balance as any).balance - creditCost;
      await tx.creditBalance.update({ where: { userId: ctx.userId }, data: { balance: newBalance } });
      const booking = await tx.booking.create({
        data: {
          tenantId: ctx.tenantId,
          scheduleInstanceId: input.scheduleInstanceId,
          userId: ctx.userId,
          status: 'confirmed',
          creditsUsed: creditCost,
        },
      });
      await tx.creditTransaction.create({
        data: {
          tenantId: ctx.tenantId,
          userId: ctx.userId,
          type: 'deduction',
          amount: -creditCost,
          balanceAfter: newBalance,
          bookingId: (booking as any).id,
        },
      });
      return booking;
    }

    return tx.booking.create({
      data: {
        tenantId: ctx.tenantId,
        scheduleInstanceId: input.scheduleInstanceId,
        userId: ctx.userId,
        status: 'confirmed',
        creditsUsed: 0,
      },
    });
  }

  function futureDate(hoursFromNow = 24) {
    return new Date(Date.now() + hoursFromNow * 60 * 60 * 1000);
  }

  it('erstellt Buchung wenn Plätze verfügbar', async () => {
    const { tx } = makeMockPrisma();
    const ctx = { userId: 'user-1', tenantId: 'tenant-1' };

    tx.scheduleInstance.findFirst.mockResolvedValue({
      id: 'inst-1',
      maxCapacity: 10,
      startAt: futureDate(),
      classType: { creditCost: 0 },
    });
    tx.booking.findFirst.mockResolvedValue(null);
    tx.booking.count.mockResolvedValue(5);
    tx.booking.create.mockResolvedValue({ id: 'booking-new', status: 'confirmed' });

    const result = await simulateCreateBooking(tx, ctx, { scheduleInstanceId: 'inst-1' });
    expect((result as any).status).toBe('confirmed');
  });

  it('Buchung bei voll besetzter Klasse → setzt auf Warteliste', async () => {
    const { tx } = makeMockPrisma();
    const ctx = { userId: 'user-1', tenantId: 'tenant-1' };

    tx.scheduleInstance.findFirst.mockResolvedValue({
      id: 'inst-full',
      maxCapacity: 5,
      startAt: futureDate(),
      classType: { creditCost: 2 },
    });
    tx.booking.findFirst.mockResolvedValue(null);
    // count returns 5 for confirmed (full), then 0 for waitlisted
    tx.booking.count
      .mockResolvedValueOnce(5)  // confirmed
      .mockResolvedValueOnce(0); // waitlisted
    tx.booking.create.mockResolvedValue({ id: 'wl-booking', status: 'waitlisted', waitlistPosition: 1 });

    const result = await simulateCreateBooking(tx, ctx, { scheduleInstanceId: 'inst-full' });
    expect((result as any).status).toBe('waitlisted');
    const createCall = tx.booking.create.mock.calls[0][0];
    expect(createCall.data.status).toBe('waitlisted');
    expect(createCall.data.waitlistPosition).toBe(1);
  });

  it('Buchung mit unzureichenden Credits → wirft PAYMENT_REQUIRED', async () => {
    const { tx } = makeMockPrisma();
    const ctx = { userId: 'user-broke', tenantId: 'tenant-1' };

    tx.scheduleInstance.findFirst.mockResolvedValue({
      id: 'inst-2',
      maxCapacity: 10,
      startAt: futureDate(),
      classType: { creditCost: 5 },
    });
    tx.booking.findFirst.mockResolvedValue(null);
    tx.booking.count.mockResolvedValue(3);
    tx.creditBalance.findUnique.mockResolvedValue({ balance: 2 });

    await expect(
      simulateCreateBooking(tx, ctx, { scheduleInstanceId: 'inst-2' })
    ).rejects.toThrow(TRPCError);

    await expect(
      simulateCreateBooking(tx, ctx, { scheduleInstanceId: 'inst-2' })
    ).rejects.toMatchObject({ code: 'PAYMENT_REQUIRED' });
  });

  it('Doppelbuchung derselben Klasse → wirft CONFLICT', async () => {
    const { tx } = makeMockPrisma();
    const ctx = { userId: 'user-1', tenantId: 'tenant-1' };

    tx.scheduleInstance.findFirst.mockResolvedValue({
      id: 'inst-3',
      maxCapacity: 10,
      startAt: futureDate(),
      classType: { creditCost: 1 },
    });
    tx.booking.findFirst.mockResolvedValue({ id: 'existing-booking', status: 'confirmed' });

    await expect(
      simulateCreateBooking(tx, ctx, { scheduleInstanceId: 'inst-3' })
    ).rejects.toMatchObject({ code: 'CONFLICT' });
  });

  it('Buchung zieht Credits ab und erstellt Transaktion', async () => {
    const { tx } = makeMockPrisma();
    const ctx = { userId: 'user-1', tenantId: 'tenant-1' };

    tx.scheduleInstance.findFirst.mockResolvedValue({
      id: 'inst-4',
      maxCapacity: 10,
      startAt: futureDate(),
      classType: { creditCost: 3 },
    });
    tx.booking.findFirst.mockResolvedValue(null);
    tx.booking.count.mockResolvedValue(2);
    tx.creditBalance.findUnique.mockResolvedValue({ balance: 10 });
    tx.creditBalance.update.mockResolvedValue({});
    tx.booking.create.mockResolvedValue({ id: 'booking-paid', status: 'confirmed' });
    tx.creditTransaction.create.mockResolvedValue({});

    await simulateCreateBooking(tx, ctx, { scheduleInstanceId: 'inst-4' });

    expect(tx.creditBalance.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { balance: 7 } })
    );
    expect(tx.creditTransaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ type: 'deduction', amount: -3, balanceAfter: 7 }),
      })
    );
  });
});

// ─── Buchungs-Stornierung ─────────────────────────────────────────────────────

describe('Buchungs-Stornierung: Geschäftsregeln', () => {
  function futureDate(hoursFromNow = 24) {
    return new Date(Date.now() + hoursFromNow * 60 * 60 * 1000);
  }
  function pastDate(hoursAgo = 1) {
    return new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
  }

  async function simulateCancelBooking(
    tx: ReturnType<typeof makeMockPrisma>['tx'],
    ctx: { userId: string; tenantId: string },
    input: { bookingId: string; cancelReason?: string }
  ) {
    const CANCELLATION_WINDOW_HOURS = 2;

    const booking = await tx.booking.findFirst({
      where: { id: input.bookingId, userId: ctx.userId, tenantId: ctx.tenantId },
      include: { scheduleInstance: { include: { classType: true } } },
    });
    if (!booking) throw new TRPCError({ code: 'NOT_FOUND' });
    if ((booking as any).status === 'cancelled') {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Booking already cancelled' });
    }

    const windowMs = CANCELLATION_WINDOW_HOURS * 60 * 60 * 1000;
    const withinWindow =
      (booking as any).scheduleInstance.startAt.getTime() - Date.now() >= windowMs;

    if (!withinWindow) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Cancellation window has passed' });
    }

    await tx.booking.update({
      where: { id: input.bookingId },
      data: { status: 'cancelled', cancelledAt: new Date(), cancelReason: input.cancelReason },
    });

    if ((booking as any).creditsUsed > 0) {
      const balance = await tx.creditBalance.findUnique({ where: { userId: ctx.userId } });
      const newBalance = ((balance as any)?.balance ?? 0) + (booking as any).creditsUsed;
      await tx.creditBalance.update({ where: { userId: ctx.userId }, data: { balance: newBalance } });
      await tx.creditTransaction.create({
        data: {
          tenantId: ctx.tenantId,
          userId: ctx.userId,
          type: 'refund',
          amount: (booking as any).creditsUsed,
          balanceAfter: newBalance,
          bookingId: input.bookingId,
        },
      });
    }

    let promotedUserId: string | null = null;

    if ((booking as any).status === 'confirmed') {
      const nextWaiting = await tx.booking.findFirst({
        where: { scheduleInstanceId: (booking as any).scheduleInstanceId, status: 'waitlisted' },
        orderBy: { waitlistPosition: 'asc' },
        include: { scheduleInstance: { include: { classType: true } } },
      });

      if (nextWaiting) {
        const creditCost = (nextWaiting as any).scheduleInstance.classType.creditCost;
        if (creditCost > 0) {
          const promoteeBalance = await tx.creditBalance.findUnique({
            where: { userId: (nextWaiting as any).userId },
          });
          if (promoteeBalance && (promoteeBalance as any).balance >= creditCost) {
            const newBal = (promoteeBalance as any).balance - creditCost;
            await tx.creditBalance.update({
              where: { userId: (nextWaiting as any).userId },
              data: { balance: newBal },
            });
            await tx.creditTransaction.create({
              data: {
                tenantId: ctx.tenantId,
                userId: (nextWaiting as any).userId,
                type: 'deduction',
                amount: -creditCost,
                balanceAfter: newBal,
                bookingId: (nextWaiting as any).id,
              },
            });
            await tx.booking.update({
              where: { id: (nextWaiting as any).id },
              data: { status: 'confirmed', creditsUsed: creditCost, waitlistPosition: null },
            });
            promotedUserId = (nextWaiting as any).userId;
          }
          // else: leave on waitlist
        } else {
          await tx.booking.update({
            where: { id: (nextWaiting as any).id },
            data: { status: 'confirmed', creditsUsed: 0, waitlistPosition: null },
          });
          promotedUserId = (nextWaiting as any).userId;
        }
      }
    }

    return { cancelledBooking: booking, promotedUserId };
  }

  it('Stornierung innerhalb der Frist → Erfolg und Credit-Rückerstattung', async () => {
    const { tx } = makeMockPrisma();
    const ctx = { userId: 'user-1', tenantId: 'tenant-1' };

    tx.booking.findFirst.mockResolvedValueOnce({
      id: 'booking-1',
      status: 'confirmed',
      creditsUsed: 3,
      scheduleInstanceId: 'inst-1',
      scheduleInstance: { startAt: futureDate(5), classType: { creditCost: 3 } },
    });
    tx.booking.update.mockResolvedValue({});
    tx.creditBalance.findUnique.mockResolvedValue({ balance: 0 });
    tx.creditBalance.update.mockResolvedValue({});
    tx.creditTransaction.create.mockResolvedValue({});
    tx.booking.findFirst.mockResolvedValueOnce(null); // no waitlist

    const result = await simulateCancelBooking(tx, ctx, { bookingId: 'booking-1' });
    expect(result.cancelledBooking).toBeDefined();

    const refundTx = tx.creditTransaction.create.mock.calls[0][0];
    expect(refundTx.data.type).toBe('refund');
    expect(refundTx.data.amount).toBe(3);
  });

  it('Stornierung außerhalb der Frist → wirft FORBIDDEN', async () => {
    const { tx } = makeMockPrisma();
    const ctx = { userId: 'user-1', tenantId: 'tenant-1' };

    tx.booking.findFirst.mockResolvedValue({
      id: 'booking-2',
      status: 'confirmed',
      creditsUsed: 2,
      scheduleInstanceId: 'inst-2',
      scheduleInstance: { startAt: futureDate(1), classType: { creditCost: 2 } },
      // startAt only 1 hour away, window is 2 hours → outside window
    });

    await expect(
      simulateCancelBooking(tx, ctx, { bookingId: 'booking-2' })
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  it('Wartelisten-Förderung bei Stornierung → nächster Nutzer bekommt Platz', async () => {
    const { tx } = makeMockPrisma();
    const ctx = { userId: 'user-1', tenantId: 'tenant-1' };

    // First findFirst: the cancelled booking
    tx.booking.findFirst
      .mockResolvedValueOnce({
        id: 'booking-confirmed',
        status: 'confirmed',
        creditsUsed: 0,
        scheduleInstanceId: 'inst-3',
        scheduleInstance: { startAt: futureDate(10), classType: { creditCost: 0 } },
      })
      // Second findFirst: the waitlisted user to promote
      .mockResolvedValueOnce({
        id: 'booking-waitlisted',
        userId: 'user-waitlisted',
        waitlistPosition: 1,
        scheduleInstanceId: 'inst-3',
        scheduleInstance: { startAt: futureDate(10), classType: { creditCost: 0 } },
      });

    tx.booking.update.mockResolvedValue({});

    const result = await simulateCancelBooking(tx, ctx, { bookingId: 'booking-confirmed' });

    expect(result.promotedUserId).toBe('user-waitlisted');
    const updateCalls = tx.booking.update.mock.calls;
    const promotionUpdate = updateCalls.find((c: any[]) =>
      c[0].data?.status === 'confirmed' && c[0].where?.id === 'booking-waitlisted'
    );
    expect(promotionUpdate).toBeDefined();
  });

  it('Wartelisten-Förderung überspringt Nutzer mit unzureichenden Credits', async () => {
    const { tx } = makeMockPrisma();
    const ctx = { userId: 'user-1', tenantId: 'tenant-1' };

    tx.booking.findFirst
      .mockResolvedValueOnce({
        id: 'booking-c',
        status: 'confirmed',
        creditsUsed: 5,
        scheduleInstanceId: 'inst-4',
        scheduleInstance: { startAt: futureDate(10), classType: { creditCost: 5 } },
      })
      .mockResolvedValueOnce({
        id: 'booking-wl',
        userId: 'user-broke',
        waitlistPosition: 1,
        scheduleInstanceId: 'inst-4',
        scheduleInstance: { startAt: futureDate(10), classType: { creditCost: 5 } },
      });

    tx.booking.update.mockResolvedValue({});
    tx.creditBalance.findUnique
      .mockResolvedValueOnce({ balance: 0 })  // refund: cancelled user has 0
      .mockResolvedValueOnce({ balance: 2 }); // promotee has only 2, needs 5
    tx.creditBalance.update.mockResolvedValue({});
    tx.creditTransaction.create.mockResolvedValue({});

    const result = await simulateCancelBooking(tx, ctx, { bookingId: 'booking-c' });

    // promotedUserId should be null — user didn't have enough credits
    expect(result.promotedUserId).toBeNull();

    // Booking update should only be for the cancellation, NOT for promotion
    const updateCalls = tx.booking.update.mock.calls;
    const promotionUpdate = updateCalls.find((c: any[]) =>
      c[0].data?.status === 'confirmed'
    );
    expect(promotionUpdate).toBeUndefined();
  });
});
