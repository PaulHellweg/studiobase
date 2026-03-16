import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@studiobase/shared/schema';
import { sql } from 'drizzle-orm';
import 'dotenv/config';

const DATABASE_URL = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/studiobase';

// Create a separate connection for tests
const testClient = postgres(DATABASE_URL);
export const testDb = drizzle(testClient, { schema });

/**
 * Create a test tenant and return its ID.
 */
export async function createTestTenant(
  overrides: Partial<schema.NewTenant> = {},
): Promise<schema.Tenant> {
  const [tenant] = await testDb
    .insert(schema.tenants)
    .values({
      name: overrides.name ?? 'Test Studio',
      slug: overrides.slug ?? `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      locale: overrides.locale ?? 'en',
      plan: overrides.plan ?? 'free',
      ...overrides,
    })
    .returning();
  return tenant;
}

/**
 * Create a test user and return it.
 */
export async function createTestUser(
  overrides: Partial<schema.NewUser> = {},
): Promise<schema.User> {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const [user] = await testDb
    .insert(schema.users)
    .values({
      name: overrides.name ?? `Test User ${suffix}`,
      email: overrides.email ?? `test-${suffix}@example.com`,
      emailVerified: overrides.emailVerified ?? true,
      ...overrides,
    })
    .returning();
  return user;
}

/**
 * Create a tenant membership.
 */
export async function createTestMembership(
  tenantId: string,
  userId: string,
  role: 'super_admin' | 'tenant_admin' | 'teacher' | 'customer' = 'customer',
): Promise<schema.TenantMembership> {
  const [membership] = await testDb
    .insert(schema.tenantMemberships)
    .values({ tenantId, userId, role })
    .returning();
  return membership;
}

/**
 * Create a class type for testing.
 */
export async function createTestClassType(
  tenantId: string,
  overrides: Partial<schema.NewClassType> = {},
): Promise<schema.ClassType> {
  const [classType] = await testDb
    .insert(schema.classTypes)
    .values({
      tenantId,
      name: overrides.name ?? 'Yoga Class',
      duration: overrides.duration ?? 60,
      capacity: overrides.capacity ?? 10,
      creditCost: overrides.creditCost ?? 1,
      ...overrides,
    })
    .returning();
  return classType;
}

/**
 * Create a teacher profile for testing.
 */
export async function createTestTeacher(
  tenantId: string,
  userId: string,
  overrides: Partial<schema.NewTeacher> = {},
): Promise<schema.Teacher> {
  const [teacher] = await testDb
    .insert(schema.teachers)
    .values({
      tenantId,
      userId,
      ...overrides,
    })
    .returning();
  return teacher;
}

/**
 * Create a schedule for testing.
 */
export async function createTestSchedule(
  tenantId: string,
  classTypeId: string,
  teacherId: string,
  overrides: Partial<schema.NewSchedule> = {},
): Promise<schema.Schedule> {
  const [schedule] = await testDb
    .insert(schema.schedules)
    .values({
      tenantId,
      classTypeId,
      teacherId,
      startTime: overrides.startTime ?? '09:00',
      endTime: overrides.endTime ?? '10:00',
      status: overrides.status ?? 'published',
      ...overrides,
    })
    .returning();
  return schedule;
}

/**
 * Create a schedule instance for testing.
 */
export async function createTestInstance(
  tenantId: string,
  scheduleId: string,
  overrides: Partial<schema.NewScheduleInstance> = {},
): Promise<schema.ScheduleInstance> {
  const [instance] = await testDb
    .insert(schema.scheduleInstances)
    .values({
      tenantId,
      scheduleId,
      date: overrides.date ?? new Date('2026-04-01T09:00:00Z'),
      capacity: overrides.capacity ?? 10,
      status: overrides.status ?? 'published',
      ...overrides,
    })
    .returning();
  return instance;
}

/**
 * Clean up all test data. Call in afterEach/afterAll.
 * Deletes in reverse dependency order.
 */
export async function cleanupTestData(): Promise<void> {
  // Use TRUNCATE CASCADE for reliable cleanup regardless of FK order
  await testDb.execute(sql`TRUNCATE TABLE
    audit_logs, credit_ledger, waitlists, bookings, payments,
    subscriptions, schedule_instances, schedules, teachers,
    class_types, credit_packs, subscription_tiers, studios,
    tenant_memberships, users, tenants
    CASCADE`);
}

/**
 * Close the test DB connection. Call in afterAll.
 */
export async function closeTestDb(): Promise<void> {
  await testClient.end();
}
