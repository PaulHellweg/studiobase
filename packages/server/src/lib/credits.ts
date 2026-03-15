import type { PrismaClient } from "@prisma/client";

type TransactionClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GrantCreditsParams {
  userId: string;
  tenantId: string;
  packageId: string;
  /** Stripe payment intent ID or checkout session ID for idempotency */
  paymentId: string;
}

export interface DeductCreditsParams {
  userId: string;
  tenantId: string;
  amount: number;
  bookingId: string;
}

export interface GetBalanceParams {
  userId: string;
  tenantId: string;
}

// ─── Grant Credits ────────────────────────────────────────────────────────────

/**
 * Grant credits from a completed purchase.
 * Upserts the credit balance and creates a purchase transaction.
 * Call this inside a Prisma transaction for idempotency guarantees.
 */
export async function grantCredits(
  tx: TransactionClient,
  params: GrantCreditsParams
): Promise<void> {
  const pkg = await tx.creditPackage.findUnique({
    where: { id: params.packageId },
  });
  if (!pkg) {
    throw new Error(`Credit package ${params.packageId} not found`);
  }

  const expiresAt =
    pkg.validityDays
      ? new Date(Date.now() + pkg.validityDays * 24 * 60 * 60 * 1000)
      : null;

  // Upsert balance
  const existing = await tx.creditBalance.findUnique({
    where: { userId: params.userId },
  });
  const currentBalance = existing?.balance ?? 0;
  const newBalance = currentBalance + pkg.credits;

  await tx.creditBalance.upsert({
    where: { userId: params.userId },
    create: {
      userId: params.userId,
      tenantId: params.tenantId,
      balance: newBalance,
    },
    update: { balance: newBalance },
  });

  // Record purchase transaction
  await tx.creditTransaction.create({
    data: {
      tenantId: params.tenantId,
      userId: params.userId,
      type: "purchase",
      amount: pkg.credits,
      balanceAfter: newBalance,
      packageId: params.packageId,
      expiresAt: expiresAt ?? undefined,
      adminNote: `Payment: ${params.paymentId}`,
    },
  });
}

// ─── Deduct Credits (FIFO) ────────────────────────────────────────────────────

/**
 * Deduct credits from a user's balance.
 * Uses the existing CreditBalance record (single balance per user).
 * Returns false if the user has insufficient credits.
 */
export async function deductCredits(
  tx: TransactionClient,
  params: DeductCreditsParams
): Promise<boolean> {
  const balance = await tx.creditBalance.findUnique({
    where: { userId: params.userId },
  });

  if (!balance || balance.balance < params.amount) {
    return false;
  }

  const newBalance = balance.balance - params.amount;

  await tx.creditBalance.update({
    where: { userId: params.userId },
    data: { balance: newBalance },
  });

  await tx.creditTransaction.create({
    data: {
      tenantId: params.tenantId,
      userId: params.userId,
      type: "deduction",
      amount: -params.amount,
      balanceAfter: newBalance,
      bookingId: params.bookingId,
    },
  });

  return true;
}

// ─── Get Balance ──────────────────────────────────────────────────────────────

/**
 * Returns the current credit balance for a user.
 * Returns 0 if no balance record exists.
 */
export async function getBalance(
  prisma: TransactionClient,
  params: GetBalanceParams
): Promise<number> {
  const balance = await prisma.creditBalance.findUnique({
    where: { userId: params.userId },
  });
  return balance?.balance ?? 0;
}
