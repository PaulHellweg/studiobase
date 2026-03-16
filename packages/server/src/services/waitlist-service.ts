import { db as defaultDb } from '../db/index.js';
import { waitlists, bookings, scheduleInstances, schedules, classTypes } from '@studiobase/shared/schema';
import { eq, and, sql } from 'drizzle-orm';
import { debitCredits } from './credit-service.js';

type Db = typeof defaultDb;

/**
 * Join the waitlist for a schedule instance.
 * Position is assigned automatically based on current max position.
 */
export async function joinWaitlist(
  userId: string,
  tenantId: string,
  scheduleInstanceId: string,
  db: Db = defaultDb,
): Promise<{ success: boolean; position?: number; error?: string }> {
  // Check if already on waitlist
  const [existing] = await db
    .select({ id: waitlists.id })
    .from(waitlists)
    .where(
      and(
        eq(waitlists.userId, userId),
        eq(waitlists.scheduleInstanceId, scheduleInstanceId),
      ),
    )
    .limit(1);

  if (existing) {
    return { success: false, error: 'Already on waitlist' };
  }

  // Check if already booked
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

  // Get next position
  const [{ maxPos }] = await db
    .select({
      maxPos: sql<number>`COALESCE(MAX(${waitlists.position}), 0)`.as('maxPos'),
    })
    .from(waitlists)
    .where(eq(waitlists.scheduleInstanceId, scheduleInstanceId));

  const position = Number(maxPos) + 1;

  await db.insert(waitlists).values({
    tenantId,
    userId,
    scheduleInstanceId,
    position,
  });

  return { success: true, position };
}

/**
 * Promote the first person on the waitlist when a spot opens.
 * Automatically books them if they have sufficient credits.
 */
export async function promoteFromWaitlist(
  scheduleInstanceId: string,
  tenantId: string,
  db: Db = defaultDb,
): Promise<{ promoted: boolean; userId?: string }> {
  // Get credit cost (once, outside the loop)
  const [instance] = await db
    .select({ scheduleId: scheduleInstances.scheduleId })
    .from(scheduleInstances)
    .where(eq(scheduleInstances.id, scheduleInstanceId))
    .limit(1);

  if (!instance) return { promoted: false };

  const [schedule] = await db
    .select({ classTypeId: schedules.classTypeId })
    .from(schedules)
    .where(eq(schedules.id, instance.scheduleId))
    .limit(1);

  if (!schedule) return { promoted: false };

  const [classType] = await db
    .select({ creditCost: classTypes.creditCost })
    .from(classTypes)
    .where(eq(classTypes.id, schedule.classTypeId))
    .limit(1);

  if (!classType) return { promoted: false };

  // Iteratively try waitlisted users until one has sufficient credits
  // Max 50 iterations to prevent runaway loops
  for (let i = 0; i < 50; i++) {
    const [first] = await db
      .select()
      .from(waitlists)
      .where(eq(waitlists.scheduleInstanceId, scheduleInstanceId))
      .orderBy(waitlists.position)
      .limit(1);

    if (!first) return { promoted: false };

    const [booking] = await db
      .insert(bookings)
      .values({
        tenantId,
        userId: first.userId,
        scheduleInstanceId,
        status: 'confirmed',
        creditsUsed: classType.creditCost,
      })
      .returning({ id: bookings.id });

    const debited = await debitCredits(
      first.userId,
      tenantId,
      classType.creditCost,
      booking.id,
      db,
    );

    if (!debited) {
      // Insufficient credits — remove booking and waitlist entry, try next
      await db.delete(bookings).where(eq(bookings.id, booking.id));
      await db.delete(waitlists).where(eq(waitlists.id, first.id));
      continue;
    }

    // Success — remove from waitlist
    await db.delete(waitlists).where(eq(waitlists.id, first.id));
    return { promoted: true, userId: first.userId };
  }

  return { promoted: false };
}
