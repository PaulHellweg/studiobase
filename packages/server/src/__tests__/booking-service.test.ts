import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  testDb,
  createTestTenant,
  createTestUser,
  createTestClassType,
  createTestTeacher,
  createTestSchedule,
  createTestInstance,
  createTestMembership,
  cleanupTestData,
  closeTestDb,
} from './helpers/setup.js';
import { createBooking, cancelBooking, getUserBookings } from '../services/booking-service.js';
import { grantCredits, getBalance } from '../services/credit-service.js';

let tenant: Awaited<ReturnType<typeof createTestTenant>>;
let user: Awaited<ReturnType<typeof createTestUser>>;
let teacherUser: Awaited<ReturnType<typeof createTestUser>>;
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
  // Set up test fixtures
  tenant = await createTestTenant();
  user = await createTestUser();
  teacherUser = await createTestUser({ name: 'Teacher' });
  classType = await createTestClassType(tenant.id, { capacity: 2, creditCost: 1 });
  teacher = await createTestTeacher(tenant.id, teacherUser.id);
  schedule = await createTestSchedule(tenant.id, classType.id, teacher.id);
  instance = await createTestInstance(tenant.id, schedule.id, { capacity: 2 });
  // Grant the user some credits
  await grantCredits(user.id, tenant.id, 10, {}, testDb);
});

describe('Booking Service', () => {
  describe('createBooking', () => {
    it('books a class successfully when user has credits and capacity available', async () => {
      const result = await createBooking(user.id, tenant.id, instance.id, testDb);
      expect(result.success).toBe(true);
      expect(result.bookingId).toBeDefined();
    });

    it('deducts credits on successful booking', async () => {
      await createBooking(user.id, tenant.id, instance.id, testDb);
      const balance = await getBalance(user.id, tenant.id, testDb);
      expect(balance).toBe(9); // Started with 10, deducted 1
    });

    it('fails when class is full', async () => {
      // Book 2 users to fill capacity
      const user2 = await createTestUser();
      await grantCredits(user2.id, tenant.id, 10, {}, testDb);

      await createBooking(user.id, tenant.id, instance.id, testDb);
      await createBooking(user2.id, tenant.id, instance.id, testDb);

      // Third user should fail
      const user3 = await createTestUser();
      await grantCredits(user3.id, tenant.id, 10, {}, testDb);
      const result = await createBooking(user3.id, tenant.id, instance.id, testDb);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Class is full');
    });

    it('fails when user has insufficient credits', async () => {
      // Create user with no credits
      const poorUser = await createTestUser();
      const result = await createBooking(poorUser.id, tenant.id, instance.id, testDb);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Insufficient credits');
    });

    it('prevents double booking', async () => {
      await createBooking(user.id, tenant.id, instance.id, testDb);
      const result = await createBooking(user.id, tenant.id, instance.id, testDb);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Already booked for this class');
    });

    it('fails for non-published instance', async () => {
      const draftInstance = await createTestInstance(tenant.id, schedule.id, {
        status: 'draft',
        date: new Date('2026-04-02T09:00:00Z'),
      });
      const result = await createBooking(user.id, tenant.id, draftInstance.id, testDb);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Class is not available for booking');
    });
  });

  describe('cancelBooking', () => {
    it('cancels a booking and refunds credits', async () => {
      const booking = await createBooking(user.id, tenant.id, instance.id, testDb);
      expect(booking.success).toBe(true);

      const balanceAfterBooking = await getBalance(user.id, tenant.id, testDb);
      expect(balanceAfterBooking).toBe(9);

      const result = await cancelBooking(user.id, tenant.id, booking.bookingId!, testDb);
      expect(result.success).toBe(true);

      const balanceAfterCancel = await getBalance(user.id, tenant.id, testDb);
      expect(balanceAfterCancel).toBe(10); // Credits refunded
    });

    it('fails for non-existent booking', async () => {
      const result = await cancelBooking(
        user.id,
        tenant.id,
        '00000000-0000-0000-0000-000000000099',
        testDb,
      );
      expect(result.success).toBe(false);
    });

    it('fails for already cancelled booking', async () => {
      const booking = await createBooking(user.id, tenant.id, instance.id, testDb);
      await cancelBooking(user.id, tenant.id, booking.bookingId!, testDb);
      // Try to cancel again
      const result = await cancelBooking(user.id, tenant.id, booking.bookingId!, testDb);
      expect(result.success).toBe(false);
    });
  });

  describe('getUserBookings', () => {
    it('returns bookings for the user', async () => {
      await createBooking(user.id, tenant.id, instance.id, testDb);
      const bookings = await getUserBookings(user.id, tenant.id, 20, 0, testDb);
      expect(bookings.length).toBe(1);
    });

    it('returns empty array when no bookings', async () => {
      const bookings = await getUserBookings(user.id, tenant.id, 20, 0, testDb);
      expect(bookings.length).toBe(0);
    });
  });
});
