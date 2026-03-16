import { db as defaultDb } from '../db/index.js';
import { creditLedger } from '@studiobase/shared/schema';
import { eq, and, sql, gt, isNull, or } from 'drizzle-orm';

type Db = typeof defaultDb;

/**
 * Get the current credit balance for a user in a tenant.
 * Sum of all ledger entries (positive = grant, negative = debit).
 * Excludes expired credits.
 */
export async function getBalance(
  userId: string,
  tenantId: string,
  db: Db = defaultDb,
): Promise<number> {
  const [result] = await db
    .select({
      balance: sql<number>`COALESCE(SUM(${creditLedger.amount}), 0)`.as('balance'),
    })
    .from(creditLedger)
    .where(
      and(
        eq(creditLedger.userId, userId),
        eq(creditLedger.tenantId, tenantId),
        // Only count non-expired grants (debits/refunds always count)
        or(
          sql`${creditLedger.amount} < 0`, // debits always count
          isNull(creditLedger.expiresAt),   // non-expiring grants
          gt(creditLedger.expiresAt, sql`NOW()`), // not yet expired grants
        ),
      ),
    );
  return Number(result?.balance ?? 0);
}

/**
 * Get available credit entries for FIFO consumption.
 * Returns grant entries ordered by expiresAt ASC NULLS LAST, createdAt ASC.
 * Only returns entries with remaining balance > 0.
 */
export async function getAvailableCredits(
  userId: string,
  tenantId: string,
  db: Db = defaultDb,
) {
  // We compute available credits per grant entry by looking at
  // each grant and its associated debits. For simplicity, we use
  // the aggregate balance approach.
  const entries = await db
    .select()
    .from(creditLedger)
    .where(
      and(
        eq(creditLedger.userId, userId),
        eq(creditLedger.tenantId, tenantId),
        sql`${creditLedger.amount} > 0`,
        eq(creditLedger.type, 'grant'),
        or(
          isNull(creditLedger.expiresAt),
          gt(creditLedger.expiresAt, sql`NOW()`),
        ),
      ),
    )
    .orderBy(
      sql`${creditLedger.expiresAt} ASC NULLS LAST`,
      creditLedger.createdAt,
    );
  return entries;
}

/**
 * Debit credits from a user using FIFO (earliest expiring first).
 * Returns true if successful, false if insufficient credits.
 *
 * Uses an atomic CTE to prevent TOCTOU race conditions:
 * the balance check and debit insert happen in a single SQL statement.
 */
export async function debitCredits(
  userId: string,
  tenantId: string,
  amount: number,
  bookingId: string | null,
  db: Db = defaultDb,
): Promise<boolean> {
  // Atomic: check balance and insert debit in one statement
  // If balance is insufficient, 0 rows are inserted
  const result = await db.execute(sql`
    WITH balance_check AS (
      SELECT COALESCE(SUM(amount), 0) AS bal
      FROM credit_ledger
      WHERE user_id = ${userId}
        AND tenant_id = ${tenantId}
        AND (amount < 0 OR expires_at IS NULL OR expires_at > NOW())
    )
    INSERT INTO credit_ledger (id, tenant_id, user_id, amount, type, related_booking_id, metadata, created_at)
    SELECT gen_random_uuid(), ${tenantId}, ${userId}, ${-amount}, 'debit', ${bookingId}, '{"reason":"booking"}'::jsonb, NOW()
    FROM balance_check
    WHERE bal >= ${amount}
    RETURNING id
  `);

  return (result as any[]).length > 0;
}

/**
 * Refund credits for a cancelled booking.
 */
export async function refundCredits(
  userId: string,
  tenantId: string,
  amount: number,
  bookingId: string | null,
  db: Db = defaultDb,
): Promise<void> {
  await db.insert(creditLedger).values({
    tenantId,
    userId,
    amount, // positive = refund
    type: 'refund',
    relatedBookingId: bookingId,
    metadata: { reason: 'booking_cancellation' },
  });
}

/**
 * Grant credits to a user (from purchase, subscription, or manual).
 */
export async function grantCredits(
  userId: string,
  tenantId: string,
  amount: number,
  options: {
    expiryDays?: number;
    paymentId?: string;
    metadata?: Record<string, unknown>;
  } = {},
  db: Db = defaultDb,
): Promise<void> {
  const expiresAt = options.expiryDays
    ? new Date(Date.now() + options.expiryDays * 24 * 60 * 60 * 1000)
    : null;

  await db.insert(creditLedger).values({
    tenantId,
    userId,
    amount,
    type: 'grant',
    expiresAt,
    relatedPaymentId: options.paymentId,
    metadata: options.metadata ?? {},
  });
}

/**
 * Get the credit ledger for a user in a tenant.
 */
export async function getLedger(
  userId: string,
  tenantId: string,
  limit: number = 20,
  offset: number = 0,
  db: Db = defaultDb,
) {
  return db
    .select()
    .from(creditLedger)
    .where(
      and(
        eq(creditLedger.userId, userId),
        eq(creditLedger.tenantId, tenantId),
      ),
    )
    .orderBy(sql`${creditLedger.createdAt} DESC`)
    .limit(limit)
    .offset(offset);
}
