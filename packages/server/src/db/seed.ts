/**
 * StudioBase v2 — Seed Script
 *
 * Seeds the database with demo data for the "Zen Flow Yoga Studio" tenant.
 * Handles Better-Auth account table creation, PII encryption, and password hashing.
 *
 * Usage: pnpm db:seed
 */

import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Load .env from project root
const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../../../../.env') });
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import { hashPassword } from 'better-auth/crypto';
import { encrypt } from '../middleware/encryption.js';
import * as schema from '@studiobase/shared/schema';

// ---------------------------------------------------------------------------
// DB connection
// ---------------------------------------------------------------------------

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client, { schema });

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Return a date N days from now */
function daysFromNow(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

/** Compute end time from start time + duration in minutes (HH:MM format) */
function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  const hh = String(Math.floor(total / 60) % 24).padStart(2, '0');
  const mm = String(total % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}

/**
 * Get the next date (from today 2026-03-16) that falls on a given JS day-of-week.
 * dayOfWeek: 0=Sun, 1=Mon, 2=Tue, ... 6=Sat
 */
function nextDateForDay(dayOfWeek: number): Date {
  const today = new Date('2026-03-16T00:00:00');
  const todayDow = today.getDay(); // 1 = Monday
  let diff = dayOfWeek - todayDow;
  if (diff < 0) diff += 7;
  const d = new Date(today);
  d.setDate(d.getDate() + diff);
  return d;
}

/** Build a Date for a specific date + HH:MM time */
function dateWithTime(date: Date, time: string): Date {
  const [h, m] = time.split(':').map(Number);
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  return d;
}

// ---------------------------------------------------------------------------
// Main Seed
// ---------------------------------------------------------------------------

async function seed() {
  console.log('Seeding StudioBase v2...');

  // ── Clean existing data ─────────────────────────────────────────────
  console.log('  Cleaning existing data...');
  await client`DELETE FROM waitlists`;
  await client`DELETE FROM credit_ledger`;
  await client`DELETE FROM bookings`;
  await client`DELETE FROM schedule_instances`;
  await client`DELETE FROM schedules`;
  await client`DELETE FROM class_types`;
  await client`DELETE FROM teachers`;
  await client`DELETE FROM credit_packs`;
  await client`DELETE FROM subscription_tiers`;
  await client`DELETE FROM tenant_memberships`;
  await client`DELETE FROM sessions`;
  await client`DELETE FROM accounts`;
  await client`DELETE FROM studios`;
  await client`DELETE FROM users`;
  await client`DELETE FROM tenants`;

  // ── Ensure Better-Auth tables exist ──────────────────────────────────
  console.log('  Creating Better-Auth tables if needed...');
  await client`
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL,
      provider_id TEXT NOT NULL,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      access_token TEXT,
      refresh_token TEXT,
      id_token TEXT,
      access_token_expires_at TIMESTAMPTZ,
      refresh_token_expires_at TIMESTAMPTZ,
      scope TEXT,
      password TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await client`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      expires_at TIMESTAMPTZ NOT NULL,
      token TEXT NOT NULL UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      ip_address TEXT,
      user_agent TEXT,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      active_organization_id TEXT
    )
  `;
  await client`
    CREATE TABLE IF NOT EXISTS verifications (
      id TEXT PRIMARY KEY,
      identifier TEXT NOT NULL,
      value TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  // ── 1. Tenant ────────────────────────────────────────────────────────
  console.log('  Creating tenant...');
  const [tenant] = await db
    .insert(schema.tenants)
    .values({
      name: 'Zen Flow Yoga Studio',
      slug: 'zen-flow',
      plan: 'professional',
      locale: 'de',
      settings: { cancellationWindowHours: 12 },
    })
    .returning();

  const tenantId = tenant.id;
  console.log(`    Tenant ID: ${tenantId}`);

  // ── 2. Studio Profile ────────────────────────────────────────────────
  console.log('  Creating studio profile...');
  await db.insert(schema.studios).values({
    tenantId,
    name: 'Zen Flow Yoga Studio',
    description:
      'A peaceful space for yoga and mindfulness in the heart of Berlin.',
    address: 'Kastanienallee 42, 10435 Berlin',
  });

  // ── 3. Users ─────────────────────────────────────────────────────────
  console.log('  Creating users...');
  const passwordHash = await hashPassword('test1234');

  const usersData = [
    { name: 'Super Admin', email: 'super@studiobase.local' },
    { name: 'Anna Müller', email: 'admin@zenflow.local' },
    { name: 'Lisa Schmidt', email: 'teacher@zenflow.local' },
    { name: 'Max Weber', email: 'customer@zenflow.local' },
    { name: 'Sophie Fischer', email: 'sophie@example.com' },
  ];

  const insertedUsers = await db
    .insert(schema.users)
    .values(
      usersData.map((u) => ({
        name: encrypt(u.name),
        email: u.email,
        emailVerified: true,
        locale: 'de',
      }))
    )
    .returning();

  // Map by plaintext email for easy reference
  const userMap = new Map<string, (typeof insertedUsers)[0]>();
  for (let i = 0; i < usersData.length; i++) {
    userMap.set(usersData[i].email, insertedUsers[i]);
  }

  // Create Better-Auth account records (credential provider)
  for (const u of insertedUsers) {
    await client`
      INSERT INTO accounts (id, account_id, provider_id, user_id, password, created_at, updated_at)
      VALUES (
        ${crypto.randomUUID()},
        ${u.id},
        'credential',
        ${u.id},
        ${passwordHash},
        NOW(),
        NOW()
      )
    `;
  }

  const superAdmin = userMap.get('super@studiobase.local')!;
  const anna = userMap.get('admin@zenflow.local')!;
  const lisa = userMap.get('teacher@zenflow.local')!;
  const max = userMap.get('customer@zenflow.local')!;
  const sophie = userMap.get('sophie@example.com')!;

  // ── 4. Tenant Memberships ────────────────────────────────────────────
  console.log('  Creating tenant memberships...');
  await db.insert(schema.tenantMemberships).values([
    { tenantId, userId: anna.id, role: 'tenant_admin' as const },
    { tenantId, userId: lisa.id, role: 'teacher' as const },
    { tenantId, userId: max.id, role: 'customer' as const },
    { tenantId, userId: sophie.id, role: 'customer' as const },
  ]);
  // super_admin has no tenant membership (platform-level)

  // ── 5. Teacher Profile ───────────────────────────────────────────────
  console.log('  Creating teacher profile...');
  const [teacher] = await db
    .insert(schema.teachers)
    .values({
      tenantId,
      userId: lisa.id,
      bio: 'Certified Vinyasa and Yin instructor with 8 years of experience.',
      active: true,
    })
    .returning();

  // ── 6. Class Types ───────────────────────────────────────────────────
  console.log('  Creating class types...');
  const classTypesData = [
    {
      name: 'Vinyasa Flow',
      description: 'A dynamic, flowing yoga practice linking breath to movement.',
      duration: 60,
      capacity: 20,
      creditCost: 1,
    },
    {
      name: 'Yin Yoga',
      description: 'Slow-paced style with postures held for longer periods.',
      duration: 75,
      capacity: 15,
      creditCost: 1,
    },
    {
      name: 'Power Yoga',
      description: 'Vigorous, fitness-based approach to vinyasa-style yoga.',
      duration: 45,
      capacity: 18,
      creditCost: 2,
    },
    {
      name: 'Meditation',
      description: 'Guided meditation for mindfulness and inner peace.',
      duration: 30,
      capacity: 25,
      creditCost: 1,
    },
  ];

  const insertedClassTypes = await db
    .insert(schema.classTypes)
    .values(classTypesData.map((ct) => ({ ...ct, tenantId })))
    .returning();

  const ctMap = new Map<string, (typeof insertedClassTypes)[0]>();
  for (const ct of insertedClassTypes) {
    ctMap.set(ct.name, ct);
  }

  const vinyasa = ctMap.get('Vinyasa Flow')!;
  const yin = ctMap.get('Yin Yoga')!;
  const power = ctMap.get('Power Yoga')!;
  const meditation = ctMap.get('Meditation')!;

  // ── 7. Schedules ─────────────────────────────────────────────────────
  console.log('  Creating schedules...');
  // dayOfWeek: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  const schedulesDef = [
    { classType: vinyasa, day: 1, time: '09:00' },    // Mon 09:00
    { classType: yin, day: 1, time: '18:00' },         // Mon 18:00
    { classType: power, day: 2, time: '10:00' },       // Tue 10:00
    { classType: vinyasa, day: 3, time: '09:00' },     // Wed 09:00
    { classType: meditation, day: 3, time: '17:00' },  // Wed 17:00
    { classType: yin, day: 4, time: '10:00' },         // Thu 10:00
    { classType: power, day: 4, time: '18:00' },       // Thu 18:00
    { classType: vinyasa, day: 5, time: '09:00' },     // Fri 09:00
    { classType: meditation, day: 5, time: '16:00' },  // Fri 16:00
  ];

  const insertedSchedules = await db
    .insert(schema.schedules)
    .values(
      schedulesDef.map((s) => ({
        tenantId,
        classTypeId: s.classType.id,
        teacherId: teacher.id,
        dayOfWeek: s.day,
        startTime: s.time,
        endTime: addMinutes(s.time, s.classType.duration),
        location: 'Main Studio',
        status: 'published' as const,
      }))
    )
    .returning();

  // ── 8. Schedule Instances ────────────────────────────────────────────
  console.log('  Creating schedule instances (next 7 days)...');
  const instanceValues: schema.NewScheduleInstance[] = [];

  for (let i = 0; i < insertedSchedules.length; i++) {
    const sched = insertedSchedules[i];
    const def = schedulesDef[i];
    // Find the next occurrence of this day within the next 7 days from 2026-03-16
    const instanceDate = nextDateForDay(def.day);
    // Only include if within 7 days
    const endDate = new Date('2026-03-23T00:00:00');
    if (instanceDate < endDate) {
      instanceValues.push({
        tenantId,
        scheduleId: sched.id,
        date: dateWithTime(instanceDate, def.time),
        capacity: def.classType.capacity,
        status: 'published' as const,
      });
    }
  }

  const insertedInstances = await db
    .insert(schema.scheduleInstances)
    .values(instanceValues)
    .returning();

  // Build lookup: classTypeName + day -> instance
  const instanceLookup = new Map<string, (typeof insertedInstances)[0]>();
  for (let i = 0; i < insertedInstances.length; i++) {
    const sched = insertedSchedules[i];
    const def = schedulesDef[i];
    instanceLookup.set(`${def.classType.name}-${def.day}`, insertedInstances[i]);
  }

  // ── 13. Waitlist setup: Set one Vinyasa instance to capacity ─────────
  // Pick the Mon 09:00 Vinyasa Flow instance for the waitlist scenario
  const fullVinyasaInstance = instanceLookup.get('Vinyasa Flow-1')!;
  // Set capacity to 0 to simulate a full class (we'll add bookings below)
  await db
    .update(schema.scheduleInstances)
    .set({ capacity: 0 })
    .where(eq(schema.scheduleInstances.id, fullVinyasaInstance.id));

  // ── 9. Bookings ──────────────────────────────────────────────────────
  console.log('  Creating bookings...');

  // Max Weber bookings
  // Next Vinyasa Flow = Wed 09:00 (since Mon one is "full")
  const nextVinyasaForMax = instanceLookup.get('Vinyasa Flow-3')!;
  const nextYinForMax = instanceLookup.get('Yin Yoga-1')!;

  const [maxVinyasaBooking] = await db
    .insert(schema.bookings)
    .values({
      tenantId,
      userId: max.id,
      scheduleInstanceId: nextVinyasaForMax.id,
      status: 'confirmed',
      creditsUsed: vinyasa.creditCost,
    })
    .returning();

  const [maxYinBooking] = await db
    .insert(schema.bookings)
    .values({
      tenantId,
      userId: max.id,
      scheduleInstanceId: nextYinForMax.id,
      status: 'confirmed',
      creditsUsed: yin.creditCost,
    })
    .returning();

  // Sophie Fischer bookings
  const nextVinyasaForSophie = instanceLookup.get('Vinyasa Flow-3')!;
  const nextPowerForSophie = instanceLookup.get('Power Yoga-2')!;

  const [sophieVinyasaBooking] = await db
    .insert(schema.bookings)
    .values({
      tenantId,
      userId: sophie.id,
      scheduleInstanceId: nextVinyasaForSophie.id,
      status: 'confirmed',
      creditsUsed: vinyasa.creditCost,
    })
    .returning();

  const [sophiePowerBooking] = await db
    .insert(schema.bookings)
    .values({
      tenantId,
      userId: sophie.id,
      scheduleInstanceId: nextPowerForSophie.id,
      status: 'cancelled',
      creditsUsed: power.creditCost,
    })
    .returning();

  // ── 10. Credit Ledger ────────────────────────────────────────────────
  console.log('  Creating credit ledger entries...');

  // Max Weber: granted 10, debited 2
  await db.insert(schema.creditLedger).values([
    {
      tenantId,
      userId: max.id,
      amount: 10,
      type: 'grant',
      expiresAt: daysFromNow(90),
      metadata: { reason: 'Purchased 10 Class Pack' },
    },
    {
      tenantId,
      userId: max.id,
      amount: -1,
      type: 'debit',
      relatedBookingId: maxVinyasaBooking.id,
      metadata: { class: 'Vinyasa Flow' },
    },
    {
      tenantId,
      userId: max.id,
      amount: -1,
      type: 'debit',
      relatedBookingId: maxYinBooking.id,
      metadata: { class: 'Yin Yoga' },
    },
  ]);

  // Sophie Fischer: granted 5, debited 1 (Power Yoga = 2 credits, but spec says 1 debited + 1 refunded)
  // Actually, spec says: granted 5, 1 debited, 1 refunded (cancelled booking)
  await db.insert(schema.creditLedger).values([
    {
      tenantId,
      userId: sophie.id,
      amount: 5,
      type: 'grant',
      expiresAt: daysFromNow(60),
      metadata: { reason: 'Purchased 5 Class Pack' },
    },
    {
      tenantId,
      userId: sophie.id,
      amount: -1,
      type: 'debit',
      relatedBookingId: sophieVinyasaBooking.id,
      metadata: { class: 'Vinyasa Flow' },
    },
    {
      tenantId,
      userId: sophie.id,
      amount: -2,
      type: 'debit',
      relatedBookingId: sophiePowerBooking.id,
      metadata: { class: 'Power Yoga' },
    },
    {
      tenantId,
      userId: sophie.id,
      amount: 2,
      type: 'refund',
      relatedBookingId: sophiePowerBooking.id,
      metadata: { reason: 'Cancelled Power Yoga booking' },
    },
  ]);

  // ── 11. Credit Packs ─────────────────────────────────────────────────
  console.log('  Creating credit packs...');
  await db.insert(schema.creditPacks).values([
    {
      tenantId,
      name: '10 Class Pack',
      quantity: 10,
      price: 8900, // €89 in cents
      expiryDays: 90,
    },
    {
      tenantId,
      name: '20 Class Pack',
      quantity: 20,
      price: 15900, // €159 in cents
      expiryDays: 180,
    },
  ]);

  // ── 12. Subscription Tiers ───────────────────────────────────────────
  console.log('  Creating subscription tiers...');
  await db.insert(schema.subscriptionTiers).values([
    {
      tenantId,
      name: 'Monthly Unlimited',
      creditsPerPeriod: 30,
      period: 'monthly',
      price: 7900, // €79 in cents
    },
    {
      tenantId,
      name: 'Weekly Flex',
      creditsPerPeriod: 4,
      period: 'weekly',
      price: 2900, // €29 in cents
    },
  ]);

  // ── 13. Waitlist ─────────────────────────────────────────────────────
  console.log('  Creating waitlist entry...');
  await db.insert(schema.waitlists).values({
    tenantId,
    userId: sophie.id,
    scheduleInstanceId: fullVinyasaInstance.id,
    position: 1,
  });

  // ── Done ─────────────────────────────────────────────────────────────
  console.log('\nSeed complete! Summary:');
  console.log(`  Tenant:       Zen Flow Yoga Studio (${tenantId})`);
  console.log(`  Users:        ${insertedUsers.length}`);
  console.log(`  Class Types:  ${insertedClassTypes.length}`);
  console.log(`  Schedules:    ${insertedSchedules.length}`);
  console.log(`  Instances:    ${insertedInstances.length}`);
  console.log(`  Bookings:     4 (2 Max, 2 Sophie)`);
  console.log(`  Credit Packs: 2`);
  console.log(`  Sub Tiers:    2`);
  console.log(`  Waitlist:     1 (Sophie on Mon Vinyasa Flow)`);
  console.log('\nLogin credentials (all passwords: test1234):');
  console.log('  super@studiobase.local  (Super Admin — platform level)');
  console.log('  admin@zenflow.local     (Anna — tenant admin)');
  console.log('  teacher@zenflow.local   (Lisa — teacher)');
  console.log('  customer@zenflow.local  (Max — customer)');
  console.log('  sophie@example.com      (Sophie — customer)');

  await client.end();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
