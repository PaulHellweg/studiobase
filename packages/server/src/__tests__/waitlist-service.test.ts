import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  testDb,
  createTestTenant,
  createTestUser,
  createTestClassType,
  createTestTeacher,
  createTestSchedule,
  createTestInstance,
  cleanupTestData,
  closeTestDb,
} from './helpers/setup.js';
import { joinWaitlist, promoteFromWaitlist } from '../services/waitlist-service.js';
import { createBooking, cancelBooking } from '../services/booking-service.js';
import { grantCredits, getBalance } from '../services/credit-service.js';
import { bookings } from '@studiobase/shared/schema';
import { eq, and } from 'drizzle-orm';

let tenant: Awaited<ReturnType<typeof createTestTenant>>;
let user1: Awaited<ReturnType<typeof createTestUser>>;
let user2: Awaited<ReturnType<typeof createTestUser>>;
let user3: Awaited<ReturnType<typeof createTestUser>>;
let classType: Awaited<ReturnType<typeof createTestClassType>>;
let teacher: Awaited<ReturnType<typeof createTestTeacher>>;
let schedule: Awaited<ReturnType<typeof createTestSchedule>>;
let instance: Awaited<ReturnType<typeof createTestInstance>>;

beforeAll(async () => {
  await cleanupTestData();
});

afterAll(async () => {
  await cleanupTestData();
  await closeTestDb();
});

beforeEach(async () => {
  await cleanupTestData();
  tenant = await createTestTenant();
  user1 = await createTestUser({ name: 'User 1' });
  user2 = await createTestUser({ name: 'User 2' });
  user3 = await createTestUser({ name: 'User 3' });

  const teacherUser = await createTestUser({ name: 'Teacher' });
  classType = await createTestClassType(tenant.id, { capacity: 1, creditCost: 1 });
  teacher = await createTestTeacher(tenant.id, teacherUser.id);
  schedule = await createTestSchedule(tenant.id, classType.id, teacher.id);
  instance = await createTestInstance(tenant.id, schedule.id, { capacity: 1 });

  // Grant credits to all users
  await grantCredits(user1.id, tenant.id, 10, {}, testDb);
  await grantCredits(user2.id, tenant.id, 10, {}, testDb);
  await grantCredits(user3.id, tenant.id, 10, {}, testDb);
});

describe('Waitlist Service', () => {
  describe('joinWaitlist', () => {
    it('joins the waitlist with position 1 for first entry', async () => {
      // Fill the class first
      await createBooking(user1.id, tenant.id, instance.id, testDb);

      const result = await joinWaitlist(user2.id, tenant.id, instance.id, testDb);
      expect(result.success).toBe(true);
      expect(result.position).toBe(1);
    });

    it('assigns incrementing positions', async () => {
      await createBooking(user1.id, tenant.id, instance.id, testDb);

      const r1 = await joinWaitlist(user2.id, tenant.id, instance.id, testDb);
      const r2 = await joinWaitlist(user3.id, tenant.id, instance.id, testDb);
      expect(r1.position).toBe(1);
      expect(r2.position).toBe(2);
    });

    it('prevents duplicate waitlist entries', async () => {
      await createBooking(user1.id, tenant.id, instance.id, testDb);
      await joinWaitlist(user2.id, tenant.id, instance.id, testDb);

      const result = await joinWaitlist(user2.id, tenant.id, instance.id, testDb);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Already on waitlist');
    });

    it('prevents joining waitlist if already booked', async () => {
      await createBooking(user1.id, tenant.id, instance.id, testDb);
      const result = await joinWaitlist(user1.id, tenant.id, instance.id, testDb);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Already booked for this class');
    });
  });

  describe('promoteFromWaitlist', () => {
    it('promotes the first person on the waitlist when a spot opens', async () => {
      // Fill the class
      await createBooking(user1.id, tenant.id, instance.id, testDb);
      // user2 joins waitlist
      await joinWaitlist(user2.id, tenant.id, instance.id, testDb);

      // Cancel user1's booking (which triggers promotion)
      // But here we test promoteFromWaitlist directly
      const result = await promoteFromWaitlist(instance.id, tenant.id, testDb);
      expect(result.promoted).toBe(true);
      expect(result.userId).toBe(user2.id);

      // Verify user2 now has a booking
      const [booking] = await testDb
        .select()
        .from(bookings)
        .where(
          and(
            eq(bookings.userId, user2.id),
            eq(bookings.scheduleInstanceId, instance.id),
            eq(bookings.status, 'confirmed'),
          ),
        )
        .limit(1);
      expect(booking).toBeDefined();
    });

    it('returns promoted: false when waitlist is empty', async () => {
      const result = await promoteFromWaitlist(instance.id, tenant.id, testDb);
      expect(result.promoted).toBe(false);
    });

    it('skips users with insufficient credits and promotes the next', async () => {
      // Fill the class
      await createBooking(user1.id, tenant.id, instance.id, testDb);

      // user2 has no credits (spend them all)
      // Drain user2's credits by inserting a debit
      const { debitCredits } = await import('../services/credit-service.js');
      await debitCredits(user2.id, tenant.id, 10, null, testDb);

      // user2 and user3 join waitlist
      await joinWaitlist(user2.id, tenant.id, instance.id, testDb);
      await joinWaitlist(user3.id, tenant.id, instance.id, testDb);

      const result = await promoteFromWaitlist(instance.id, tenant.id, testDb);
      expect(result.promoted).toBe(true);
      expect(result.userId).toBe(user3.id); // user2 skipped (no credits)
    });
  });

  describe('Integration: cancel + waitlist promotion', () => {
    it('promotes waitlisted user when a booking is cancelled', async () => {
      // Fill the class
      const booking = await createBooking(user1.id, tenant.id, instance.id, testDb);

      // user2 joins waitlist
      await joinWaitlist(user2.id, tenant.id, instance.id, testDb);

      // Cancel user1's booking (this triggers promotion)
      await cancelBooking(user1.id, tenant.id, booking.bookingId!, testDb);

      // user2 should now be booked
      const [user2Booking] = await testDb
        .select()
        .from(bookings)
        .where(
          and(
            eq(bookings.userId, user2.id),
            eq(bookings.scheduleInstanceId, instance.id),
            eq(bookings.status, 'confirmed'),
          ),
        )
        .limit(1);
      expect(user2Booking).toBeDefined();

      // user2's credits should be deducted
      const balance = await getBalance(user2.id, tenant.id, testDb);
      expect(balance).toBe(9); // Started with 10, 1 deducted for booking
    });
  });
});
