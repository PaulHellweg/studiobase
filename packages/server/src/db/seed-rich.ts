/**
 * StudioBase v2 — Rich Seed Script
 *
 * Generates realistic demo data for testing:
 * - 2 tenants (Zen Flow Berlin + Urban Movement Munich)
 * - 12 users across roles
 * - 6 class types, 15 schedules
 * - 4 weeks of instances (past + future)
 * - 40+ bookings with mixed statuses
 * - Credit ledger with grants, debits, refunds
 * - Payments, waitlists, audit logs
 *
 * Usage: pnpm db:seed:rich
 */

import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../../../../.env') });

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { hashPassword } from 'better-auth/crypto';
import { encrypt } from '../middleware/encryption.js';
import * as schema from '@studiobase/shared/schema';

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client, { schema });

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

function dateAt(daysFromToday: number, time: string): Date {
  const d = new Date();
  d.setDate(d.getDate() + daysFromToday);
  const [h, m] = time.split(':').map(Number);
  d.setHours(h, m, 0, 0);
  return d;
}

async function seed() {
  console.log('🌱 Rich seed — StudioBase v2\n');

  // Clean
  console.log('Cleaning...');
  for (const table of [
    'audit_logs', 'waitlists', 'credit_ledger', 'bookings',
    'schedule_instances', 'schedules', 'class_types', 'teachers',
    'credit_packs', 'subscription_tiers', 'subscriptions', 'payments',
    'tenant_memberships', 'sessions', 'accounts', 'verifications',
    'studios', 'users', 'tenants',
  ]) {
    await client.unsafe(`DELETE FROM ${table}`);
  }

  const passwordHash = await hashPassword('test1234');

  // ─── Tenant 1: Zen Flow Berlin ──────────────────────────────────────
  const [zen] = await db.insert(schema.tenants).values({
    name: 'Zen Flow Yoga Berlin',
    slug: 'zen-flow',
    plan: 'pro',
    locale: 'de',
    settings: { cancellationWindowHours: 12 },
  }).returning();

  await db.insert(schema.studios).values({
    tenantId: zen.id,
    name: 'Zen Flow Yoga Berlin',
    description: 'Dein Raum für Yoga, Bewegung und Achtsamkeit im Herzen von Berlin-Mitte.',
    address: 'Kastanienallee 42, 10435 Berlin',
  });

  // ─── Tenant 2: Urban Movement Munich ────────────────────────────────
  const [urban] = await db.insert(schema.tenants).values({
    name: 'Urban Movement Munich',
    slug: 'urban-movement',
    plan: 'starter',
    locale: 'en',
    settings: { cancellationWindowHours: 6 },
  }).returning();

  await db.insert(schema.studios).values({
    tenantId: urban.id,
    name: 'Urban Movement Munich',
    description: 'Modern fitness and yoga studio in Schwabing.',
    address: 'Leopoldstraße 77, 80802 München',
  });

  // ─── Users ──────────────────────────────────────────────────────────
  console.log('Creating users...');
  const userDefs = [
    // Zen Flow
    { name: 'Platform Admin', email: 'super@studiobase.local', tenant: null, role: null },
    { name: 'Anna Müller', email: 'anna@zenflow.de', tenant: zen.id, role: 'tenant_admin' as const },
    { name: 'Lisa Schmidt', email: 'lisa@zenflow.de', tenant: zen.id, role: 'teacher' as const },
    { name: 'Marco Weber', email: 'marco@zenflow.de', tenant: zen.id, role: 'teacher' as const },
    { name: 'Max Bauer', email: 'max@example.com', tenant: zen.id, role: 'customer' as const },
    { name: 'Sophie Fischer', email: 'sophie@example.com', tenant: zen.id, role: 'customer' as const },
    { name: 'Julia Braun', email: 'julia@example.com', tenant: zen.id, role: 'customer' as const },
    { name: 'Thomas Klein', email: 'thomas@example.com', tenant: zen.id, role: 'customer' as const },
    { name: 'Elena Vogel', email: 'elena@example.com', tenant: zen.id, role: 'customer' as const },
    // Urban Movement
    { name: 'James Miller', email: 'james@urban.de', tenant: urban.id, role: 'tenant_admin' as const },
    { name: 'Sarah Johnson', email: 'sarah@urban.de', tenant: urban.id, role: 'teacher' as const },
    { name: 'Mike Chen', email: 'mike@example.com', tenant: urban.id, role: 'customer' as const },
  ];

  const insertedUsers = await db.insert(schema.users).values(
    userDefs.map(u => ({
      name: encrypt(u.name),
      email: u.email,
      emailVerified: true,
      locale: u.tenant === urban.id ? 'en' : 'de',
    })),
  ).returning();

  // Better-Auth accounts
  for (const u of insertedUsers) {
    await client`INSERT INTO accounts (id, account_id, provider_id, user_id, password, created_at, updated_at) VALUES (${crypto.randomUUID()}, ${u.id}, 'credential', ${u.id}, ${passwordHash}, NOW(), NOW())`;
  }

  const uMap = new Map(userDefs.map((d, i) => [d.email, { ...insertedUsers[i], def: d }]));
  const u = (email: string) => uMap.get(email)!;

  // Memberships
  console.log('Creating memberships...');
  const memberships = userDefs.filter(d => d.tenant && d.role).map(d => ({
    tenantId: d.tenant!,
    userId: u(d.email).id,
    role: d.role!,
  }));
  // Super admin gets membership in zen-flow as super_admin
  memberships.push({ tenantId: zen.id, userId: u('super@studiobase.local').id, role: 'super_admin' });
  await db.insert(schema.tenantMemberships).values(memberships);

  // ─── Teachers ───────────────────────────────────────────────────────
  console.log('Creating teachers...');
  const [lisa] = await db.insert(schema.teachers).values({
    tenantId: zen.id, userId: u('lisa@zenflow.de').id,
    bio: 'Zertifizierte Vinyasa & Yin Lehrerin mit 8 Jahren Erfahrung.',
  }).returning();
  const [marco] = await db.insert(schema.teachers).values({
    tenantId: zen.id, userId: u('marco@zenflow.de').id,
    bio: 'Power Yoga und Ashtanga Spezialist. Ehemaliger Leistungssportler.',
  }).returning();
  const [sarah] = await db.insert(schema.teachers).values({
    tenantId: urban.id, userId: u('sarah@urban.de').id,
    bio: 'Hatha and restorative yoga instructor.',
  }).returning();

  // ─── Class Types ────────────────────────────────────────────────────
  console.log('Creating class types...');
  const zenClasses = await db.insert(schema.classTypes).values([
    { tenantId: zen.id, name: 'Vinyasa Flow', description: 'Dynamisches Yoga mit fließenden Übergängen.', duration: 60, capacity: 20, creditCost: 1 },
    { tenantId: zen.id, name: 'Yin Yoga', description: 'Tiefe Dehnung und Entspannung.', duration: 75, capacity: 15, creditCost: 1 },
    { tenantId: zen.id, name: 'Power Yoga', description: 'Intensives, kraftvolles Yoga.', duration: 45, capacity: 18, creditCost: 2 },
    { tenantId: zen.id, name: 'Meditation', description: 'Geführte Meditation für inneren Frieden.', duration: 30, capacity: 25, creditCost: 1 },
    { tenantId: zen.id, name: 'Yoga Basics', description: 'Einführungskurs für Anfänger.', duration: 60, capacity: 12, creditCost: 1 },
  ]).returning();
  const urbanClasses = await db.insert(schema.classTypes).values([
    { tenantId: urban.id, name: 'Morning Flow', description: 'Start your day with energy.', duration: 60, capacity: 15, creditCost: 1 },
  ]).returning();

  const ct = (name: string) => [...zenClasses, ...urbanClasses].find(c => c.name === name)!;

  // ─── Schedules ──────────────────────────────────────────────────────
  console.log('Creating schedules...');
  const scheduleDefs = [
    // Zen Flow — Lisa teaches Vinyasa & Yin
    { tenant: zen.id, classType: ct('Vinyasa Flow'), teacher: lisa.id, day: 1, time: '09:00' },
    { tenant: zen.id, classType: ct('Vinyasa Flow'), teacher: lisa.id, day: 3, time: '09:00' },
    { tenant: zen.id, classType: ct('Vinyasa Flow'), teacher: lisa.id, day: 5, time: '09:00' },
    { tenant: zen.id, classType: ct('Yin Yoga'), teacher: lisa.id, day: 1, time: '18:00' },
    { tenant: zen.id, classType: ct('Yin Yoga'), teacher: lisa.id, day: 4, time: '18:00' },
    { tenant: zen.id, classType: ct('Meditation'), teacher: lisa.id, day: 3, time: '17:00' },
    // Zen Flow — Marco teaches Power & Basics
    { tenant: zen.id, classType: ct('Power Yoga'), teacher: marco.id, day: 2, time: '10:00' },
    { tenant: zen.id, classType: ct('Power Yoga'), teacher: marco.id, day: 4, time: '10:00' },
    { tenant: zen.id, classType: ct('Yoga Basics'), teacher: marco.id, day: 2, time: '18:00' },
    { tenant: zen.id, classType: ct('Yoga Basics'), teacher: marco.id, day: 6, time: '10:00' },
    // Urban Movement — Sarah
    { tenant: urban.id, classType: ct('Morning Flow'), teacher: sarah.id, day: 1, time: '07:30' },
    { tenant: urban.id, classType: ct('Morning Flow'), teacher: sarah.id, day: 3, time: '07:30' },
    { tenant: urban.id, classType: ct('Morning Flow'), teacher: sarah.id, day: 5, time: '07:30' },
  ];

  const insertedSchedules = await db.insert(schema.schedules).values(
    scheduleDefs.map(s => ({
      tenantId: s.tenant,
      classTypeId: s.classType.id,
      teacherId: s.teacher,
      dayOfWeek: s.day,
      startTime: s.time,
      endTime: addMinutes(s.time, s.classType.duration),
      location: s.tenant === zen.id ? 'Hauptraum' : 'Studio 1',
      status: 'published' as const,
    })),
  ).returning();

  // ─── Schedule Instances (past 2 weeks + next 2 weeks) ──────────────
  console.log('Creating instances (4 weeks)...');
  const instances: schema.NewScheduleInstance[] = [];
  for (let week = -2; week <= 1; week++) {
    for (let i = 0; i < insertedSchedules.length; i++) {
      const sched = insertedSchedules[i];
      const def = scheduleDefs[i];
      const today = new Date();
      const todayDow = today.getDay();
      let diff = def.day - todayDow + week * 7;
      const instanceDate = new Date(today);
      instanceDate.setDate(instanceDate.getDate() + diff);
      const [h, m] = def.time.split(':').map(Number);
      instanceDate.setHours(h, m, 0, 0);

      instances.push({
        tenantId: def.tenant,
        scheduleId: sched.id,
        date: instanceDate,
        capacity: def.classType.capacity,
        status: 'published' as const,
      });
    }
  }

  const insertedInstances = await db.insert(schema.scheduleInstances).values(instances).returning();
  console.log(`  ${insertedInstances.length} instances created`);

  // ─── Credit Grants ──────────────────────────────────────────────────
  console.log('Creating credit grants...');
  const zenCustomers = ['max@example.com', 'sophie@example.com', 'julia@example.com', 'thomas@example.com', 'elena@example.com'];
  for (const email of zenCustomers) {
    const amount = email === 'max@example.com' ? 20 : email === 'sophie@example.com' ? 10 : 5;
    await db.insert(schema.creditLedger).values({
      tenantId: zen.id,
      userId: u(email).id,
      amount,
      type: 'grant',
      expiresAt: new Date(Date.now() + 90 * 86400000),
      metadata: { reason: `${amount} Class Pack` },
    });
  }
  // Urban customer
  await db.insert(schema.creditLedger).values({
    tenantId: urban.id,
    userId: u('mike@example.com').id,
    amount: 8,
    type: 'grant',
    expiresAt: new Date(Date.now() + 60 * 86400000),
    metadata: { reason: '8 Class Pack' },
  });

  // ─── Bookings (past + upcoming) ────────────────────────────────────
  console.log('Creating bookings...');
  let bookingCount = 0;

  // Past bookings (attended/no_show)
  const pastInstances = insertedInstances.filter(i => new Date(i.date) < new Date() && scheduleDefs[insertedInstances.indexOf(i) % scheduleDefs.length]?.tenant === zen.id);
  for (const inst of pastInstances.slice(0, 15)) {
    const customers = ['max@example.com', 'sophie@example.com', 'julia@example.com'];
    for (const email of customers.slice(0, Math.floor(Math.random() * 3) + 1)) {
      try {
        const status = Math.random() > 0.15 ? 'attended' : 'no_show';
        await db.insert(schema.bookings).values({
          tenantId: zen.id,
          userId: u(email).id,
          scheduleInstanceId: inst.id,
          status: status as any,
          creditsUsed: 1,
          attendanceMarked: true,
        });
        await db.insert(schema.creditLedger).values({
          tenantId: zen.id,
          userId: u(email).id,
          amount: -1,
          type: 'debit',
          metadata: { class: 'auto-seed' },
        });
        bookingCount++;
      } catch { /* unique constraint — skip */ }
    }
  }

  // Future bookings (confirmed)
  const futureInstances = insertedInstances.filter(i => new Date(i.date) > new Date() && scheduleDefs[insertedInstances.indexOf(i) % scheduleDefs.length]?.tenant === zen.id);
  for (const inst of futureInstances.slice(0, 8)) {
    for (const email of ['max@example.com', 'sophie@example.com']) {
      try {
        await db.insert(schema.bookings).values({
          tenantId: zen.id,
          userId: u(email).id,
          scheduleInstanceId: inst.id,
          status: 'confirmed',
          creditsUsed: 1,
        });
        await db.insert(schema.creditLedger).values({
          tenantId: zen.id,
          userId: u(email).id,
          amount: -1,
          type: 'debit',
          metadata: { class: 'auto-seed' },
        });
        bookingCount++;
      } catch { /* skip duplicates */ }
    }
  }
  console.log(`  ${bookingCount} bookings created`);

  // ─── Payments ───────────────────────────────────────────────────────
  console.log('Creating payments...');
  await db.insert(schema.payments).values([
    { tenantId: zen.id, userId: u('max@example.com').id, stripePaymentId: 'pi_seed_001', amount: 15900, currency: 'eur', status: 'completed', type: 'one_time', metadata: { pack: '20 Class Pack' } },
    { tenantId: zen.id, userId: u('sophie@example.com').id, stripePaymentId: 'pi_seed_002', amount: 8900, currency: 'eur', status: 'completed', type: 'one_time', metadata: { pack: '10 Class Pack' } },
    { tenantId: zen.id, userId: u('julia@example.com').id, stripePaymentId: 'pi_seed_003', amount: 4500, currency: 'eur', status: 'completed', type: 'one_time', metadata: { pack: '5 Class Pack' } },
    { tenantId: zen.id, userId: u('thomas@example.com').id, stripePaymentId: 'pi_seed_004', amount: 4500, currency: 'eur', status: 'completed', type: 'one_time', metadata: { pack: '5 Class Pack' } },
    { tenantId: zen.id, userId: u('elena@example.com').id, stripePaymentId: 'pi_seed_005', amount: 4500, currency: 'eur', status: 'completed', type: 'one_time', metadata: { pack: '5 Class Pack' } },
    { tenantId: urban.id, userId: u('mike@example.com').id, stripePaymentId: 'pi_seed_006', amount: 6900, currency: 'eur', status: 'completed', type: 'one_time', metadata: { pack: '8 Class Pack' } },
  ]);

  // ─── Credit Packs + Subscription Tiers ──────────────────────────────
  console.log('Creating pricing...');
  await db.insert(schema.creditPacks).values([
    { tenantId: zen.id, name: '5er Karte', quantity: 5, price: 4500, expiryDays: 60 },
    { tenantId: zen.id, name: '10er Karte', quantity: 10, price: 8900, expiryDays: 90 },
    { tenantId: zen.id, name: '20er Karte', quantity: 20, price: 15900, expiryDays: 180 },
    { tenantId: urban.id, name: '8 Pack', quantity: 8, price: 6900, expiryDays: 90 },
  ]);
  await db.insert(schema.subscriptionTiers).values([
    { tenantId: zen.id, name: 'Monatlich Flex', creditsPerPeriod: 8, period: 'monthly', price: 5900 },
    { tenantId: zen.id, name: 'Monatlich Unlimited', creditsPerPeriod: 30, period: 'monthly', price: 7900 },
    { tenantId: urban.id, name: 'Monthly', creditsPerPeriod: 12, period: 'monthly', price: 4900 },
  ]);

  // ─── Waitlist ───────────────────────────────────────────────────────
  console.log('Creating waitlist...');
  // Pick a future instance and set capacity low
  if (futureInstances.length > 0) {
    const fullInstance = futureInstances[0];
    await db.update(schema.scheduleInstances).set({ capacity: 2 }).where(
      (await import('drizzle-orm')).eq(schema.scheduleInstances.id, fullInstance.id),
    );
    for (const [i, email] of ['thomas@example.com', 'elena@example.com'].entries()) {
      try {
        await db.insert(schema.waitlists).values({
          tenantId: zen.id,
          userId: u(email).id,
          scheduleInstanceId: fullInstance.id,
          position: i + 1,
        });
      } catch { /* skip */ }
    }
  }

  // ─── Audit Logs ─────────────────────────────────────────────────────
  console.log('Creating audit logs...');
  await db.insert(schema.auditLogs).values([
    { tenantId: zen.id, userId: u('anna@zenflow.de').id, action: 'tenant.settings_updated', entityType: 'tenant', entityId: zen.id, metadata: { field: 'cancellationWindowHours', value: 12 } },
    { tenantId: zen.id, userId: u('max@example.com').id, action: 'booking.created', entityType: 'booking', metadata: { class: 'Vinyasa Flow' } },
    { tenantId: zen.id, userId: u('sophie@example.com').id, action: 'booking.cancelled', entityType: 'booking', metadata: { class: 'Power Yoga', creditsRefunded: 2 } },
    { tenantId: zen.id, userId: u('max@example.com').id, action: 'user.export_requested', entityType: 'user', entityId: u('max@example.com').id, metadata: {} },
  ]);

  // ─── Summary ────────────────────────────────────────────────────────
  console.log('\n✅ Rich seed complete!\n');
  console.log('Tenants:');
  console.log(`  Zen Flow Yoga Berlin   — zen-flow   (${zen.id})`);
  console.log(`  Urban Movement Munich  — urban-movement (${urban.id})`);
  console.log(`\nUsers: ${insertedUsers.length}`);
  console.log(`Class Types: ${zenClasses.length + urbanClasses.length}`);
  console.log(`Schedules: ${insertedSchedules.length}`);
  console.log(`Instances: ${insertedInstances.length}`);
  console.log(`Bookings: ~${bookingCount}`);
  console.log(`Payments: 6`);
  console.log(`Credit Packs: 4 | Subscription Tiers: 3`);
  console.log(`\nLogin (all passwords: test1234):`);
  console.log('  super@studiobase.local   — Super Admin');
  console.log('  anna@zenflow.de          — Zen Flow Admin');
  console.log('  lisa@zenflow.de          — Zen Flow Teacher');
  console.log('  marco@zenflow.de         — Zen Flow Teacher');
  console.log('  max@example.com          — Zen Flow Customer (20 credits)');
  console.log('  sophie@example.com       — Zen Flow Customer (10 credits)');
  console.log('  julia@example.com        — Zen Flow Customer (5 credits)');
  console.log('  thomas@example.com       — Zen Flow Customer (5 credits, waitlisted)');
  console.log('  elena@example.com        — Zen Flow Customer (5 credits, waitlisted)');
  console.log('  james@urban.de           — Urban Movement Admin');
  console.log('  sarah@urban.de           — Urban Movement Teacher');
  console.log('  mike@example.com         — Urban Movement Customer (8 credits)');
  console.log('\nURLs:');
  console.log('  http://localhost:5173/zen-flow');
  console.log('  http://localhost:5173/urban-movement');

  await client.end();
  process.exit(0);
}

seed().catch(err => { console.error('Seed failed:', err); process.exit(1); });
