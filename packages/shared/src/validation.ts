import { z } from 'zod';

// ── Tenant ───────────────────────────────────────────────────────────────────

export const createTenantInput = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  locale: z.enum(['en', 'de']).default('en'),
  plan: z.enum(['free', 'starter', 'pro']).default('free'),
});

export const updateTenantInput = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255).optional(),
  locale: z.enum(['en', 'de']).optional(),
  plan: z.enum(['free', 'starter', 'pro']).optional(),
  settings: z.record(z.unknown()).optional(),
});

// ── Studio ───────────────────────────────────────────────────────────────────

export const updateStudioInput = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional(),
  address: z.string().max(500).optional(),
  logoUrl: z.string().url().optional().nullable(),
});

// ── Class Type ───────────────────────────────────────────────────────────────

export const createClassTypeInput = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  duration: z.number().int().positive().max(480),
  capacity: z.number().int().positive().max(1000),
  creditCost: z.number().int().positive().default(1),
});

export const updateClassTypeInput = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional(),
  duration: z.number().int().positive().max(480).optional(),
  capacity: z.number().int().positive().max(1000).optional(),
  creditCost: z.number().int().positive().optional(),
  active: z.boolean().optional(),
});

// ── Schedule ─────────────────────────────────────────────────────────────────

export const createScheduleInput = z.object({
  classTypeId: z.string().uuid(),
  teacherId: z.string().uuid(),
  dayOfWeek: z.number().int().min(0).max(6).optional().nullable(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  location: z.string().max(255).optional(),
});

export const updateScheduleInput = z.object({
  id: z.string().uuid(),
  classTypeId: z.string().uuid().optional(),
  teacherId: z.string().uuid().optional(),
  dayOfWeek: z.number().int().min(0).max(6).optional().nullable(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  location: z.string().max(255).optional(),
  status: z.enum(['draft', 'published', 'cancelled']).optional(),
});

export const createScheduleInstanceInput = z.object({
  scheduleId: z.string().uuid(),
  date: z.string().datetime(),
  capacity: z.number().int().positive().optional(),
});

// ── Booking ──────────────────────────────────────────────────────────────────

export const createBookingInput = z.object({
  scheduleInstanceId: z.string().uuid(),
});

export const cancelBookingInput = z.object({
  bookingId: z.string().uuid(),
});

export const markAttendedInput = z.object({
  bookingId: z.string().uuid(),
  status: z.enum(['attended', 'no_show']),
});

// ── Credit ───────────────────────────────────────────────────────────────────

export const grantCreditsInput = z.object({
  userId: z.string().uuid(),
  amount: z.number().int().positive(),
  expiryDays: z.number().int().positive().optional(),
  metadata: z.record(z.unknown()).optional(),
});

// ── Payment / Stripe ─────────────────────────────────────────────────────────

export const createCheckoutInput = z.object({
  creditPackId: z.string().uuid().optional(),
  subscriptionTierId: z.string().uuid().optional(),
}).refine(
  (data) => (data.creditPackId || data.subscriptionTierId) && !(data.creditPackId && data.subscriptionTierId),
  { message: 'Provide either creditPackId or subscriptionTierId, not both' },
);

// ── User ─────────────────────────────────────────────────────────────────────

export const updateProfileInput = z.object({
  name: z.string().min(1).max(255).optional(),
  phone: z.string().max(20).optional().nullable(),
  locale: z.enum(['en', 'de']).optional(),
  image: z.string().url().optional().nullable(),
});

// ── Waitlist ─────────────────────────────────────────────────────────────────

export const joinWaitlistInput = z.object({
  scheduleInstanceId: z.string().uuid(),
});

// ── Credit Pack ─────────────────────────────────────────────────────────────

export const createCreditPackInput = z.object({
  name: z.string().min(1).max(255),
  quantity: z.number().int().positive(),
  price: z.number().int().positive(), // cents
  expiryDays: z.number().int().positive().optional().nullable(),
});

export const updateCreditPackInput = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255).optional(),
  quantity: z.number().int().positive().optional(),
  price: z.number().int().positive().optional(),
  expiryDays: z.number().int().positive().optional().nullable(),
  active: z.boolean().optional(),
});

// ── Subscription Tier ───────────────────────────────────────────────────────

export const createSubscriptionTierInput = z.object({
  name: z.string().min(1).max(255),
  creditsPerPeriod: z.number().int().positive(),
  period: z.enum(['weekly', 'monthly']),
  price: z.number().int().positive(), // cents
});

export const updateSubscriptionTierInput = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255).optional(),
  creditsPerPeriod: z.number().int().positive().optional(),
  period: z.enum(['weekly', 'monthly']).optional(),
  price: z.number().int().positive().optional(),
  active: z.boolean().optional(),
});

// ── Schedule Instances (list) ───────────────────────────────────────────────

export const listInstancesInput = z.object({
  dateFrom: z.string().datetime(),
  dateTo: z.string().datetime(),
  limit: z.number().int().positive().max(200).default(100),
  offset: z.number().int().nonnegative().default(0),
});

export const listByTeacherInput = z.object({
  dateFrom: z.string().datetime(),
  dateTo: z.string().datetime(),
  limit: z.number().int().positive().max(200).default(100),
  offset: z.number().int().nonnegative().default(0),
});

export const listByInstanceInput = z.object({
  scheduleInstanceId: z.string().uuid(),
  limit: z.number().int().positive().max(100).default(50),
  offset: z.number().int().nonnegative().default(0),
});

// ── Admin Dashboard ─────────────────────────────────────────────────────────

export const dateRangeInput = z.object({
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});

// ── Slug-based lookup ───────────────────────────────────────────────────────

export const slugInput = z.object({
  slug: z.string().min(1).max(100),
});

// ── Pagination ───────────────────────────────────────────────────────────────

export const paginationInput = z.object({
  limit: z.number().int().positive().max(100).default(20),
  offset: z.number().int().nonnegative().default(0),
});

// ── ID param ─────────────────────────────────────────────────────────────────

export const idInput = z.object({
  id: z.string().uuid(),
});
