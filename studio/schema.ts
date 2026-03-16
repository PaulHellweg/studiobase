// Dark Factory Studio — Phase 03 Schema
// Project: StudioBase v2
// Generated from: spec.md + architecture.md
// ORM: Drizzle (native PostgreSQL RLS)
// Status: awaiting_approval

import {
  pgTable,
  pgEnum,
  pgPolicy,
  uuid,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

// ── Enums ──────────────────────────────────────────────────────────────────

export const roleEnum = pgEnum('role', [
  'super_admin',
  'tenant_admin',
  'teacher',
  'customer',
]);

export const bookingStatusEnum = pgEnum('booking_status', [
  'confirmed',
  'cancelled',
  'attended',
  'no_show',
]);

export const scheduleStatusEnum = pgEnum('schedule_status', [
  'draft',
  'published',
  'cancelled',
]);

export const creditTypeEnum = pgEnum('credit_type', [
  'grant',
  'debit',
  'refund',
  'expiry',
]);

export const paymentTypeEnum = pgEnum('payment_type', [
  'one_time',
  'subscription',
]);

export const paymentStatusEnum = pgEnum('payment_status', [
  'pending',
  'completed',
  'refunded',
  'failed',
]);

export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'active',
  'paused',
  'cancelled',
  'past_due',
]);

export const subscriptionPeriodEnum = pgEnum('subscription_period', [
  'weekly',
  'monthly',
]);

// ── Core Models ────────────────────────────────────────────────────────────

/**
 * Tenant — One per studio (multi-tenant root entity)
 *
 * No tenantId column (this IS the tenant)
 * Cascade: Deleting a tenant cascades all tenant-scoped data
 */
export const tenants = pgTable(
  'tenants',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    slug: text('slug').notNull(), // subdomain routing
    locale: text('locale').notNull().default('en'), // de | en
    plan: text('plan').notNull().default('free'), // free | starter | pro
    settings: jsonb('settings').notNull().default({}), // cancellationWindowHours, etc.
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    slugIdx: uniqueIndex('tenants_slug_idx').on(table.slug),
  })
);

/**
 * User — Platform user (Better-Auth compatible)
 *
 * Extends Better-Auth's user model with custom fields.
 * PII encryption (name, email, phone) happens at application layer (Drizzle middleware).
 * Better-Auth manages session/account tables separately.
 */
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // Encrypted PII fields (stored as ciphertext)
    name: text('name').notNull(), // encrypted
    email: text('email').notNull(), // encrypted (uniqueness on ciphertext)
    phone: text('phone'), // encrypted
    // Better-Auth fields
    emailVerified: boolean('email_verified').notNull().default(false),
    image: text('image'), // avatar URL
    locale: text('locale').notNull().default('en'),
    // Soft delete for audit trail
    deletedAt: timestamp('deleted_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    emailIdx: uniqueIndex('users_email_idx').on(table.email),
    deletedAtIdx: index('users_deleted_at_idx').on(table.deletedAt),
  })
);

/**
 * TenantMembership — User ↔ Tenant join with role
 *
 * Maps to Better-Auth Organization plugin membership.
 * A user can belong to multiple tenants with different roles.
 * RLS: Enforces session tenantId matches membership.tenantId.
 */
export const tenantMemberships = pgTable(
  'tenant_memberships',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: roleEnum('role').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    tenantUserIdx: uniqueIndex('tenant_memberships_tenant_user_idx').on(
      table.tenantId,
      table.userId
    ),
    tenantIdIdx: index('tenant_memberships_tenant_id_idx').on(table.tenantId),
    userIdIdx: index('tenant_memberships_user_id_idx').on(table.userId),
  })
);

// RLS Policy: Only show memberships for current session tenantId
export const tenantMembershipsRLS = pgPolicy('tenant_memberships_rls', {
  as: 'permissive',
  for: 'all',
  to: 'authenticated',
  using: sql`tenant_id = current_setting('app.current_tenant_id')::uuid`,
});

/**
 * Studio — Studio profile per tenant
 *
 * One studio per tenant. Contains public-facing studio info.
 * RLS: Isolated by tenantId.
 */
export const studios = pgTable(
  'studios',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    address: text('address'),
    logoUrl: text('logo_url'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    tenantIdIdx: uniqueIndex('studios_tenant_id_idx').on(table.tenantId),
  })
);

export const studiosRLS = pgPolicy('studios_rls', {
  as: 'permissive',
  for: 'all',
  to: 'authenticated',
  using: sql`tenant_id = current_setting('app.current_tenant_id')::uuid`,
});

/**
 * ClassType — Class template (e.g., "Vinyasa Yoga")
 *
 * Admin creates these. Used as templates for Schedule entries.
 * RLS: Isolated by tenantId.
 */
export const classTypes = pgTable(
  'class_types',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    duration: integer('duration').notNull(), // minutes
    capacity: integer('capacity').notNull(),
    creditCost: integer('credit_cost').notNull().default(1),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    tenantIdIdx: index('class_types_tenant_id_idx').on(table.tenantId),
    activeIdx: index('class_types_active_idx').on(table.active),
  })
);

export const classTypesRLS = pgPolicy('class_types_rls', {
  as: 'permissive',
  for: 'all',
  to: 'authenticated',
  using: sql`tenant_id = current_setting('app.current_tenant_id')::uuid`,
});

/**
 * Teacher — Teacher profile linked to User
 *
 * A user with teacher role has a teacher profile.
 * RLS: Isolated by tenantId.
 */
export const teachers = pgTable(
  'teachers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    bio: text('bio'),
    avatarUrl: text('avatar_url'),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    tenantIdIdx: index('teachers_tenant_id_idx').on(table.tenantId),
    userIdIdx: index('teachers_user_id_idx').on(table.userId),
    tenantUserIdx: uniqueIndex('teachers_tenant_user_idx').on(
      table.tenantId,
      table.userId
    ),
  })
);

export const teachersRLS = pgPolicy('teachers_rls', {
  as: 'permissive',
  for: 'all',
  to: 'authenticated',
  using: sql`tenant_id = current_setting('app.current_tenant_id')::uuid`,
});

/**
 * Schedule — Recurring or one-off class schedule entry
 *
 * Admin creates these to define when classes happen.
 * Can be draft (not visible to customers) or published.
 * Soft delete: allows archiving without losing booking history.
 * RLS: Isolated by tenantId.
 */
export const schedules = pgTable(
  'schedules',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    classTypeId: uuid('class_type_id')
      .notNull()
      .references(() => classTypes.id, { onDelete: 'restrict' }),
    teacherId: uuid('teacher_id')
      .notNull()
      .references(() => teachers.id, { onDelete: 'restrict' }),
    dayOfWeek: integer('day_of_week'), // 0-6 (Sunday = 0), null if one-off
    startTime: text('start_time').notNull(), // HH:MM format
    endTime: text('end_time').notNull(),
    location: text('location'),
    status: scheduleStatusEnum('status').notNull().default('draft'),
    // Soft delete
    deletedAt: timestamp('deleted_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    tenantIdIdx: index('schedules_tenant_id_idx').on(table.tenantId),
    classTypeIdIdx: index('schedules_class_type_id_idx').on(table.classTypeId),
    teacherIdIdx: index('schedules_teacher_id_idx').on(table.teacherId),
    statusIdx: index('schedules_status_idx').on(table.status),
    deletedAtIdx: index('schedules_deleted_at_idx').on(table.deletedAt),
  })
);

export const schedulesRLS = pgPolicy('schedules_rls', {
  as: 'permissive',
  for: 'all',
  to: 'authenticated',
  using: sql`tenant_id = current_setting('app.current_tenant_id')::uuid`,
});

/**
 * ScheduleInstance — Concrete occurrence of a Schedule on a specific date
 *
 * Generated from Schedule entries. Each instance is bookable.
 * Composite unique: (scheduleId, date) — one instance per schedule per day.
 * Soft delete: preserves history when admin cancels a specific instance.
 * RLS: Isolated by tenantId.
 */
export const scheduleInstances = pgTable(
  'schedule_instances',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    scheduleId: uuid('schedule_id')
      .notNull()
      .references(() => schedules.id, { onDelete: 'cascade' }),
    date: timestamp('date').notNull(), // specific occurrence date
    capacity: integer('capacity').notNull(), // inherited from ClassType, can be overridden
    status: scheduleStatusEnum('status').notNull().default('published'),
    // Soft delete
    deletedAt: timestamp('deleted_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    tenantIdIdx: index('schedule_instances_tenant_id_idx').on(table.tenantId),
    scheduleIdIdx: index('schedule_instances_schedule_id_idx').on(
      table.scheduleId
    ),
    dateIdx: index('schedule_instances_date_idx').on(table.date),
    scheduleIdDateIdx: uniqueIndex('schedule_instances_schedule_id_date_idx').on(
      table.scheduleId,
      table.date
    ),
    deletedAtIdx: index('schedule_instances_deleted_at_idx').on(
      table.deletedAt
    ),
  })
);

export const scheduleInstancesRLS = pgPolicy('schedule_instances_rls', {
  as: 'permissive',
  for: 'all',
  to: 'authenticated',
  using: sql`tenant_id = current_setting('app.current_tenant_id')::uuid`,
});

/**
 * Booking — Customer booking of a ScheduleInstance
 *
 * Customer books a class. Credits are debited via CreditLedger.
 * Composite unique: (userId, scheduleInstanceId) — one booking per customer per class.
 * Soft delete: preserves history for reports even after cancellation.
 * RLS: Isolated by tenantId.
 */
export const bookings = pgTable(
  'bookings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'set null' }), // preserve history
    scheduleInstanceId: uuid('schedule_instance_id')
      .notNull()
      .references(() => scheduleInstances.id, { onDelete: 'cascade' }),
    status: bookingStatusEnum('status').notNull().default('confirmed'),
    creditsUsed: integer('credits_used').notNull(), // snapshot at booking time
    attendanceMarked: boolean('attendance_marked').notNull().default(false),
    // Soft delete
    deletedAt: timestamp('deleted_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    tenantIdIdx: index('bookings_tenant_id_idx').on(table.tenantId),
    userIdIdx: index('bookings_user_id_idx').on(table.userId),
    scheduleInstanceIdIdx: index('bookings_schedule_instance_id_idx').on(
      table.scheduleInstanceId
    ),
    statusIdx: index('bookings_status_idx').on(table.status),
    userScheduleIdx: uniqueIndex('bookings_user_schedule_idx').on(
      table.userId,
      table.scheduleInstanceId
    ),
    deletedAtIdx: index('bookings_deleted_at_idx').on(table.deletedAt),
  })
);

export const bookingsRLS = pgPolicy('bookings_rls', {
  as: 'permissive',
  for: 'all',
  to: 'authenticated',
  using: sql`tenant_id = current_setting('app.current_tenant_id')::uuid`,
});

/**
 * Waitlist — Waitlist entry per ScheduleInstance
 *
 * FIFO by createdAt. When a spot opens, the first waitlist entry is offered.
 * Composite unique: (userId, scheduleInstanceId) — one waitlist entry per customer per class.
 * RLS: Isolated by tenantId.
 */
export const waitlists = pgTable(
  'waitlists',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    scheduleInstanceId: uuid('schedule_instance_id')
      .notNull()
      .references(() => scheduleInstances.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(), // FIFO position (1 = first)
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    tenantIdIdx: index('waitlists_tenant_id_idx').on(table.tenantId),
    userIdIdx: index('waitlists_user_id_idx').on(table.userId),
    scheduleInstanceIdIdx: index('waitlists_schedule_instance_id_idx').on(
      table.scheduleInstanceId
    ),
    userScheduleIdx: uniqueIndex('waitlists_user_schedule_idx').on(
      table.userId,
      table.scheduleInstanceId
    ),
    positionIdx: index('waitlists_position_idx').on(table.position),
  })
);

export const waitlistsRLS = pgPolicy('waitlists_rls', {
  as: 'permissive',
  for: 'all',
  to: 'authenticated',
  using: sql`tenant_id = current_setting('app.current_tenant_id')::uuid`,
});

/**
 * CreditPack — Credit pack definition
 *
 * Admin configures credit packs customers can purchase.
 * RLS: Isolated by tenantId.
 */
export const creditPacks = pgTable(
  'credit_packs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    quantity: integer('quantity').notNull(),
    price: integer('price').notNull(), // cents
    expiryDays: integer('expiry_days'), // null = no expiry
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    tenantIdIdx: index('credit_packs_tenant_id_idx').on(table.tenantId),
    activeIdx: index('credit_packs_active_idx').on(table.active),
  })
);

export const creditPacksRLS = pgPolicy('credit_packs_rls', {
  as: 'permissive',
  for: 'all',
  to: 'authenticated',
  using: sql`tenant_id = current_setting('app.current_tenant_id')::uuid`,
});

/**
 * SubscriptionTier — Subscription tier definition
 *
 * Admin configures subscription tiers. Managed via Stripe Billing.
 * RLS: Isolated by tenantId.
 */
export const subscriptionTiers = pgTable(
  'subscription_tiers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    creditsPerPeriod: integer('credits_per_period').notNull(),
    period: subscriptionPeriodEnum('period').notNull(),
    price: integer('price').notNull(), // cents
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    tenantIdIdx: index('subscription_tiers_tenant_id_idx').on(table.tenantId),
    activeIdx: index('subscription_tiers_active_idx').on(table.active),
  })
);

export const subscriptionTiersRLS = pgPolicy('subscription_tiers_rls', {
  as: 'permissive',
  for: 'all',
  to: 'authenticated',
  using: sql`tenant_id = current_setting('app.current_tenant_id')::uuid`,
});

/**
 * CreditLedger — Append-only ledger of credit grants/debits
 *
 * FIFO credit consumption by (expiresAt ASC NULLS LAST, createdAt ASC).
 * Records all credit movements: grant (purchase/subscription), debit (booking), refund, expiry.
 * No soft delete — append-only for audit trail.
 * RLS: Isolated by tenantId.
 */
export const creditLedger = pgTable(
  'credit_ledger',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    amount: integer('amount').notNull(), // positive = grant, negative = debit
    type: creditTypeEnum('type').notNull(),
    expiresAt: timestamp('expires_at'), // null = never expires
    relatedBookingId: uuid('related_booking_id').references(() => bookings.id),
    relatedPaymentId: uuid('related_payment_id'), // FK to payments table
    metadata: jsonb('metadata').notNull().default({}), // additional context
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    tenantIdIdx: index('credit_ledger_tenant_id_idx').on(table.tenantId),
    userIdIdx: index('credit_ledger_user_id_idx').on(table.userId),
    expiresAtIdx: index('credit_ledger_expires_at_idx').on(table.expiresAt),
    userExpiresIdx: index('credit_ledger_user_expires_idx').on(
      table.userId,
      table.expiresAt,
      table.createdAt
    ), // FIFO query optimization
    typeIdx: index('credit_ledger_type_idx').on(table.type),
  })
);

export const creditLedgerRLS = pgPolicy('credit_ledger_rls', {
  as: 'permissive',
  for: 'all',
  to: 'authenticated',
  using: sql`tenant_id = current_setting('app.current_tenant_id')::uuid`,
});

/**
 * Subscription — Stripe subscription record
 *
 * Tracks active Stripe subscriptions. Webhook updates status.
 * RLS: Isolated by tenantId.
 */
export const subscriptions = pgTable(
  'subscriptions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tierId: uuid('tier_id')
      .notNull()
      .references(() => subscriptionTiers.id, { onDelete: 'restrict' }),
    stripeSubscriptionId: text('stripe_subscription_id').notNull(),
    status: subscriptionStatusEnum('status').notNull().default('active'),
    currentPeriodStart: timestamp('current_period_start').notNull(),
    currentPeriodEnd: timestamp('current_period_end').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    tenantIdIdx: index('subscriptions_tenant_id_idx').on(table.tenantId),
    userIdIdx: index('subscriptions_user_id_idx').on(table.userId),
    stripeSubscriptionIdIdx: uniqueIndex(
      'subscriptions_stripe_subscription_id_idx'
    ).on(table.stripeSubscriptionId),
    statusIdx: index('subscriptions_status_idx').on(table.status),
  })
);

export const subscriptionsRLS = pgPolicy('subscriptions_rls', {
  as: 'permissive',
  for: 'all',
  to: 'authenticated',
  using: sql`tenant_id = current_setting('app.current_tenant_id')::uuid`,
});

/**
 * Payment — Stripe payment record
 *
 * Tracks all Stripe payments (credit pack purchases and subscription charges).
 * RLS: Isolated by tenantId.
 */
export const payments = pgTable(
  'payments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    stripePaymentId: text('stripe_payment_id').notNull(),
    amount: integer('amount').notNull(), // cents
    currency: text('currency').notNull().default('eur'),
    status: paymentStatusEnum('status').notNull().default('pending'),
    type: paymentTypeEnum('type').notNull(),
    relatedCreditPackId: uuid('related_credit_pack_id').references(
      () => creditPacks.id
    ),
    relatedSubscriptionId: uuid('related_subscription_id').references(
      () => subscriptions.id
    ),
    metadata: jsonb('metadata').notNull().default({}),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    tenantIdIdx: index('payments_tenant_id_idx').on(table.tenantId),
    userIdIdx: index('payments_user_id_idx').on(table.userId),
    stripePaymentIdIdx: uniqueIndex('payments_stripe_payment_id_idx').on(
      table.stripePaymentId
    ),
    statusIdx: index('payments_status_idx').on(table.status),
    typeIdx: index('payments_type_idx').on(table.type),
  })
);

export const paymentsRLS = pgPolicy('payments_rls', {
  as: 'permissive',
  for: 'all',
  to: 'authenticated',
  using: sql`tenant_id = current_setting('app.current_tenant_id')::uuid`,
});

/**
 * AuditLog — Append-only event log
 *
 * No tenantId (logs super_admin actions too).
 * Auto-purge after 90 days (spec requirement).
 * No soft delete — append-only by design.
 */
export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id'), // nullable for super_admin actions
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    action: text('action').notNull(), // e.g., "booking.created", "user.deleted"
    entityType: text('entity_type').notNull(),
    entityId: uuid('entity_id'),
    metadata: jsonb('metadata').notNull().default({}),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    tenantIdIdx: index('audit_logs_tenant_id_idx').on(table.tenantId),
    userIdIdx: index('audit_logs_user_id_idx').on(table.userId),
    actionIdx: index('audit_logs_action_idx').on(table.action),
    createdAtIdx: index('audit_logs_created_at_idx').on(table.createdAt),
    tenantCreatedIdx: index('audit_logs_tenant_created_idx').on(
      table.tenantId,
      table.createdAt
    ), // for time-range queries + purge
  })
);

// No RLS on auditLogs — super_admin needs full visibility

// ── Relations ──────────────────────────────────────────────────────────────

export const tenantsRelations = relations(tenants, ({ many }) => ({
  memberships: many(tenantMemberships),
  studios: many(studios),
  classTypes: many(classTypes),
  teachers: many(teachers),
  schedules: many(schedules),
  scheduleInstances: many(scheduleInstances),
  bookings: many(bookings),
  waitlists: many(waitlists),
  creditPacks: many(creditPacks),
  subscriptionTiers: many(subscriptionTiers),
  creditLedger: many(creditLedger),
  subscriptions: many(subscriptions),
  payments: many(payments),
}));

export const usersRelations = relations(users, ({ many }) => ({
  memberships: many(tenantMemberships),
  teacherProfiles: many(teachers),
  bookings: many(bookings),
  waitlists: many(waitlists),
  creditLedger: many(creditLedger),
  subscriptions: many(subscriptions),
  payments: many(payments),
  auditLogs: many(auditLogs),
}));

export const tenantMembershipsRelations = relations(
  tenantMemberships,
  ({ one }) => ({
    tenant: one(tenants, {
      fields: [tenantMemberships.tenantId],
      references: [tenants.id],
    }),
    user: one(users, {
      fields: [tenantMemberships.userId],
      references: [users.id],
    }),
  })
);

export const studiosRelations = relations(studios, ({ one }) => ({
  tenant: one(tenants, {
    fields: [studios.tenantId],
    references: [tenants.id],
  }),
}));

export const classTypesRelations = relations(classTypes, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [classTypes.tenantId],
    references: [tenants.id],
  }),
  schedules: many(schedules),
}));

export const teachersRelations = relations(teachers, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [teachers.tenantId],
    references: [tenants.id],
  }),
  user: one(users, {
    fields: [teachers.userId],
    references: [users.id],
  }),
  schedules: many(schedules),
}));

export const schedulesRelations = relations(schedules, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [schedules.tenantId],
    references: [tenants.id],
  }),
  classType: one(classTypes, {
    fields: [schedules.classTypeId],
    references: [classTypes.id],
  }),
  teacher: one(teachers, {
    fields: [schedules.teacherId],
    references: [teachers.id],
  }),
  instances: many(scheduleInstances),
}));

export const scheduleInstancesRelations = relations(
  scheduleInstances,
  ({ one, many }) => ({
    tenant: one(tenants, {
      fields: [scheduleInstances.tenantId],
      references: [tenants.id],
    }),
    schedule: one(schedules, {
      fields: [scheduleInstances.scheduleId],
      references: [schedules.id],
    }),
    bookings: many(bookings),
    waitlists: many(waitlists),
  })
);

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [bookings.tenantId],
    references: [tenants.id],
  }),
  user: one(users, {
    fields: [bookings.userId],
    references: [users.id],
  }),
  scheduleInstance: one(scheduleInstances, {
    fields: [bookings.scheduleInstanceId],
    references: [scheduleInstances.id],
  }),
  creditLedgerEntries: many(creditLedger),
}));

export const waitlistsRelations = relations(waitlists, ({ one }) => ({
  tenant: one(tenants, {
    fields: [waitlists.tenantId],
    references: [tenants.id],
  }),
  user: one(users, {
    fields: [waitlists.userId],
    references: [users.id],
  }),
  scheduleInstance: one(scheduleInstances, {
    fields: [waitlists.scheduleInstanceId],
    references: [scheduleInstances.id],
  }),
}));

export const creditPacksRelations = relations(creditPacks, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [creditPacks.tenantId],
    references: [tenants.id],
  }),
  payments: many(payments),
}));

export const subscriptionTiersRelations = relations(
  subscriptionTiers,
  ({ one, many }) => ({
    tenant: one(tenants, {
      fields: [subscriptionTiers.tenantId],
      references: [tenants.id],
    }),
    subscriptions: many(subscriptions),
  })
);

export const creditLedgerRelations = relations(creditLedger, ({ one }) => ({
  tenant: one(tenants, {
    fields: [creditLedger.tenantId],
    references: [tenants.id],
  }),
  user: one(users, {
    fields: [creditLedger.userId],
    references: [users.id],
  }),
  booking: one(bookings, {
    fields: [creditLedger.relatedBookingId],
    references: [bookings.id],
  }),
}));

export const subscriptionsRelations = relations(
  subscriptions,
  ({ one, many }) => ({
    tenant: one(tenants, {
      fields: [subscriptions.tenantId],
      references: [tenants.id],
    }),
    user: one(users, {
      fields: [subscriptions.userId],
      references: [users.id],
    }),
    tier: one(subscriptionTiers, {
      fields: [subscriptions.tierId],
      references: [subscriptionTiers.id],
    }),
    payments: many(payments),
  })
);

export const paymentsRelations = relations(payments, ({ one }) => ({
  tenant: one(tenants, {
    fields: [payments.tenantId],
    references: [tenants.id],
  }),
  user: one(users, {
    fields: [payments.userId],
    references: [users.id],
  }),
  creditPack: one(creditPacks, {
    fields: [payments.relatedCreditPackId],
    references: [creditPacks.id],
  }),
  subscription: one(subscriptions, {
    fields: [payments.relatedSubscriptionId],
    references: [subscriptions.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  tenant: one(tenants, {
    fields: [auditLogs.tenantId],
    references: [tenants.id],
  }),
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));

// ── Type Exports ───────────────────────────────────────────────────────────

export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type TenantMembership = typeof tenantMemberships.$inferSelect;
export type NewTenantMembership = typeof tenantMemberships.$inferInsert;

export type Studio = typeof studios.$inferSelect;
export type NewStudio = typeof studios.$inferInsert;

export type ClassType = typeof classTypes.$inferSelect;
export type NewClassType = typeof classTypes.$inferInsert;

export type Teacher = typeof teachers.$inferSelect;
export type NewTeacher = typeof teachers.$inferInsert;

export type Schedule = typeof schedules.$inferSelect;
export type NewSchedule = typeof schedules.$inferInsert;

export type ScheduleInstance = typeof scheduleInstances.$inferSelect;
export type NewScheduleInstance = typeof scheduleInstances.$inferInsert;

export type Booking = typeof bookings.$inferSelect;
export type NewBooking = typeof bookings.$inferInsert;

export type Waitlist = typeof waitlists.$inferSelect;
export type NewWaitlist = typeof waitlists.$inferInsert;

export type CreditPack = typeof creditPacks.$inferSelect;
export type NewCreditPack = typeof creditPacks.$inferInsert;

export type SubscriptionTier = typeof subscriptionTiers.$inferSelect;
export type NewSubscriptionTier = typeof subscriptionTiers.$inferInsert;

export type CreditLedgerEntry = typeof creditLedger.$inferSelect;
export type NewCreditLedgerEntry = typeof creditLedger.$inferInsert;

export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
