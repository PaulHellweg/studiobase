import { db as defaultDb } from '../db/index.js';
import {
  bookings,
  scheduleInstances,
  classTypes,
  schedules,
  tenants,
  auditLogs,
} from '@studiobase/shared/schema';
import { eq, and, sql } from 'drizzle-orm';
import { debitCredits, refundCredits } from './credit-service.js';
import { promoteFromWaitlist } from './waitlist-service.js';

type Db = typeof defaultDb;

export interface BookingResult {
  success: boolean;
  bookingId?: string;
  error?: string;
}

/**
 * Book a class for a customer.
 * 1. Check instance exists and is published
 * 2. Check capacity
 * 3. Check user doesn't already have a booking
 * 4. Debit credits
 * 5. Create booking
 */
export async function createBooking(
  userId: string,
  tenantId: string,
  scheduleInstanceId: string,
  db: Db = defaultDb,
): Promise<BookingResult> {
  // Get the instance with its class type info
  const [instance] = await db
    .select({
      id: scheduleInstances.id,
      capacity: scheduleInstances.capacity,
      status: scheduleInstances.status,
      scheduleId: scheduleInstances.scheduleId,
    })
    .from(scheduleInstances)
    .where(
      and(
        eq(scheduleInstances.id, scheduleInstanceId),
        eq(scheduleInstances.tenantId, tenantId),
      ),
    )
    .limit(1);

  if (!instance) {
    return { success: false, error: 'Schedule instance not found' };
  }

  if (instance.status !== 'published') {
    return { success: false, error: 'Class is not available for booking' };
  }

  // Get credit cost from associated class type
  const [schedule] = await db
    .select({ classTypeId: schedules.classTypeId })
    .from(schedules)
    .where(eq(schedules.id, instance.scheduleId))
    .limit(1);

  if (!schedule) {
    return { success: false, error: 'Schedule not found' };
  }

  const [classType] = await db
    .select({ creditCost: classTypes.creditCost })
    .from(classTypes)
    .where(eq(classTypes.id, schedule.classTypeId))
    .limit(1);

  if (!classType) {
    return { success: false, error: 'Class type not found' };
  }

  // Check existing booking
  const [existingBooking] = await db
    .select({ id: bookings.id })
    .from(bookings)
    .where(
      and(
        eq(bookings.userId, userId),
        eq(bookings.scheduleInstanceId, scheduleInstanceId),
        eq(bookings.status, 'confirmed'),
      ),
    )
    .limit(1);

  if (existingBooking) {
    return { success: false, error: 'Already booked for this class' };
  }

  // Check capacity
  const [{ count }] = await db
    .select({
      count: sql<number>`COUNT(*)`.as('count'),
    })
    .from(bookings)
    .where(
      and(
        eq(bookings.scheduleInstanceId, scheduleInstanceId),
        eq(bookings.status, 'confirmed'),
      ),
    );

  if (Number(count) >= instance.capacity) {
    return { success: false, error: 'Class is full' };
  }

  // Create booking first to get the ID for the credit ledger
  const [booking] = await db
    .insert(bookings)
    .values({
      tenantId,
      userId,
      scheduleInstanceId,
      status: 'confirmed',
      creditsUsed: classType.creditCost,
    })
    .returning({ id: bookings.id });

  // Debit credits
  const debited = await debitCredits(
    userId,
    tenantId,
    classType.creditCost,
    booking.id,
    db,
  );

  if (!debited) {
    // Rollback: delete the booking
    await db.delete(bookings).where(eq(bookings.id, booking.id));
    return { success: false, error: 'Insufficient credits' };
  }

  // Audit log
  await db.insert(auditLogs).values({
    tenantId,
    userId,
    action: 'booking.created',
    entityType: 'booking',
    entityId: booking.id,
    metadata: { scheduleInstanceId, creditsUsed: classType.creditCost },
  });

  return { success: true, bookingId: booking.id };
}

/**
 * Cancel a booking.
 * 1. Mark booking as cancelled
 * 2. Refund credits
 * 3. Promote next person from waitlist
 */
export async function cancelBooking(
  userId: string,
  tenantId: string,
  bookingId: string,
  db: Db = defaultDb,
): Promise<{ success: boolean; error?: string }> {
  const [booking] = await db
    .select()
    .from(bookings)
    .where(
      and(
        eq(bookings.id, bookingId),
        eq(bookings.userId, userId),
        eq(bookings.tenantId, tenantId),
        eq(bookings.status, 'confirmed'),
      ),
    )
    .limit(1);

  if (!booking) {
    return { success: false, error: 'Booking not found or already cancelled' };
  }

  // Enforce cancellation window
  const [instance] = await db
    .select({ date: scheduleInstances.date, startTime: schedules.startTime })
    .from(scheduleInstances)
    .innerJoin(schedules, eq(scheduleInstances.scheduleId, schedules.id))
    .where(eq(scheduleInstances.id, booking.scheduleInstanceId))
    .limit(1);

  if (instance) {
    const [tenant] = await db
      .select({ settings: tenants.settings })
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    const cancellationWindowHours = (tenant?.settings as any)?.cancellationWindowHours ?? 0;
    if (cancellationWindowHours > 0) {
      const classDate = new Date(instance.date);
      const [hours, minutes] = (instance.startTime ?? '00:00').split(':').map(Number);
      classDate.setHours(hours, minutes, 0, 0);
      const deadline = new Date(classDate.getTime() - cancellationWindowHours * 60 * 60 * 1000);
      if (new Date() > deadline) {
        return { success: false, error: `Cancellation window has passed (${cancellationWindowHours}h before class)` };
      }
    }
  }

  // Cancel the booking
  await db
    .update(bookings)
    .set({ status: 'cancelled', updatedAt: new Date() })
    .where(eq(bookings.id, bookingId));

  // Refund credits
  await refundCredits(userId, tenantId, booking.creditsUsed, bookingId, db);

  // Audit log
  await db.insert(auditLogs).values({
    tenantId,
    userId,
    action: 'booking.cancelled',
    entityType: 'booking',
    entityId: bookingId,
    metadata: { creditsRefunded: booking.creditsUsed },
  });

  // Promote from waitlist
  await promoteFromWaitlist(booking.scheduleInstanceId, tenantId, db);

  return { success: true };
}

/**
 * Get bookings for a user.
 */
export async function getUserBookings(
  userId: string,
  tenantId: string,
  limit: number = 20,
  offset: number = 0,
  db: Db = defaultDb,
) {
  return db
    .select()
    .from(bookings)
    .where(
      and(
        eq(bookings.userId, userId),
        eq(bookings.tenantId, tenantId),
      ),
    )
    .orderBy(sql`${bookings.createdAt} DESC`)
    .limit(limit)
    .offset(offset);
}
