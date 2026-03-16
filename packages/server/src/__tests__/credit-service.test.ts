import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  testDb,
  createTestTenant,
  createTestUser,
  cleanupTestData,
  closeTestDb,
} from './helpers/setup.js';
import {
  getBalance,
  grantCredits,
  debitCredits,
  refundCredits,
  getLedger,
} from '../services/credit-service.js';

let tenant: { id: string };
let user: { id: string };

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
  user = await createTestUser();
});

describe('Credit Service', () => {
  describe('getBalance', () => {
    it('returns 0 for a user with no credits', async () => {
      const balance = await getBalance(user.id, tenant.id, testDb);
      expect(balance).toBe(0);
    });

    it('returns the correct balance after granting credits', async () => {
      await grantCredits(user.id, tenant.id, 10, {}, testDb);
      const balance = await getBalance(user.id, tenant.id, testDb);
      expect(balance).toBe(10);
    });

    it('reflects debits in the balance', async () => {
      await grantCredits(user.id, tenant.id, 10, {}, testDb);
      // Need a dummy booking ID for the debit
      await debitCredits(user.id, tenant.id, 3, null, testDb);
      const balance = await getBalance(user.id, tenant.id, testDb);
      expect(balance).toBe(7);
    });
  });

  describe('grantCredits', () => {
    it('grants credits with no expiry', async () => {
      await grantCredits(user.id, tenant.id, 5, {}, testDb);
      const balance = await getBalance(user.id, tenant.id, testDb);
      expect(balance).toBe(5);
    });

    it('grants credits with expiry', async () => {
      await grantCredits(user.id, tenant.id, 5, { expiryDays: 30 }, testDb);
      const balance = await getBalance(user.id, tenant.id, testDb);
      expect(balance).toBe(5);
    });

    it('accumulates multiple grants', async () => {
      await grantCredits(user.id, tenant.id, 5, {}, testDb);
      await grantCredits(user.id, tenant.id, 3, {}, testDb);
      const balance = await getBalance(user.id, tenant.id, testDb);
      expect(balance).toBe(8);
    });
  });

  describe('debitCredits', () => {
    it('returns true when sufficient credits', async () => {
      await grantCredits(user.id, tenant.id, 10, {}, testDb);
      const result = await debitCredits(user.id, tenant.id, 5, null, testDb);
      expect(result).toBe(true);
    });

    it('returns false when insufficient credits', async () => {
      await grantCredits(user.id, tenant.id, 2, {}, testDb);
      const result = await debitCredits(user.id, tenant.id, 5, null, testDb);
      expect(result).toBe(false);
    });

    it('returns false when no credits at all', async () => {
      const result = await debitCredits(user.id, tenant.id, 1, null, testDb);
      expect(result).toBe(false);
    });
  });

  describe('refundCredits', () => {
    it('restores balance after refund', async () => {
      await grantCredits(user.id, tenant.id, 10, {}, testDb);
      await debitCredits(user.id, tenant.id, 3, null, testDb);
      await refundCredits(user.id, tenant.id, 3, null, testDb);
      const balance = await getBalance(user.id, tenant.id, testDb);
      expect(balance).toBe(10);
    });
  });

  describe('getLedger', () => {
    it('returns ledger entries in reverse chronological order', async () => {
      await grantCredits(user.id, tenant.id, 10, {}, testDb);
      await debitCredits(user.id, tenant.id, 3, null, testDb);

      const entries = await getLedger(user.id, tenant.id, 20, 0, testDb);
      expect(entries.length).toBe(2);
      // Most recent first (debit)
      expect(entries[0].amount).toBe(-3);
      expect(entries[1].amount).toBe(10);
    });

    it('respects pagination', async () => {
      await grantCredits(user.id, tenant.id, 1, {}, testDb);
      await grantCredits(user.id, tenant.id, 2, {}, testDb);
      await grantCredits(user.id, tenant.id, 3, {}, testDb);

      const page1 = await getLedger(user.id, tenant.id, 2, 0, testDb);
      expect(page1.length).toBe(2);

      const page2 = await getLedger(user.id, tenant.id, 2, 2, testDb);
      expect(page2.length).toBe(1);
    });
  });
});
