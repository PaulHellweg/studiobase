import { z } from "zod";

// ─── Enum Schemas ─────────────────────────────────────────────────────────────

export const RoleSchema = z.enum([
  "super_admin",
  "tenant_admin",
  "teacher",
  "customer",
]);

export const ClassCategorySchema = z.enum([
  "yoga",
  "pilates",
  "dance",
  "fitness",
  "meditation",
  "martial_arts",
  "other",
]);

export const RecurrenceTypeSchema = z.enum(["none", "daily", "weekly", "custom"]);

export const InstanceStatusSchema = z.enum([
  "scheduled",
  "cancelled",
  "completed",
]);

export const BookingStatusSchema = z.enum([
  "confirmed",
  "waitlisted",
  "cancelled",
  "attended",
  "no_show",
]);

export const CreditTransactionTypeSchema = z.enum([
  "purchase",
  "deduction",
  "refund",
  "admin_adjustment",
  "expiry",
]);

export const PaymentStatusSchema = z.enum([
  "pending",
  "succeeded",
  "failed",
  "refunded",
]);

// ─── Tenant Schemas ───────────────────────────────────────────────────────────

export const CreateTenantSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with dashes"),
  logoUrl: z.string().url().optional(),
  primaryColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
});

export const UpdateTenantSchema = CreateTenantSchema.partial();

// ─── Studio Schemas ───────────────────────────────────────────────────────────

export const CreateStudioSchema = z.object({
  name: z.string().min(1).max(100),
  address: z.string().min(1),
  timezone: z.string().min(1),
});

export const UpdateStudioSchema = CreateStudioSchema.partial();

// ─── Room Schemas ─────────────────────────────────────────────────────────────

export const CreateRoomSchema = z.object({
  studioId: z.string().uuid(),
  name: z.string().min(1).max(100),
  capacity: z.number().int().positive(),
});

export const UpdateRoomSchema = CreateRoomSchema.partial().omit({ studioId: true });

// ─── ClassType Schemas ────────────────────────────────────────────────────────

export const CreateClassTypeSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  category: ClassCategorySchema,
  durationMinutes: z.number().int().positive(),
  creditCost: z.number().int().nonnegative(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
});

export const UpdateClassTypeSchema = CreateClassTypeSchema.partial();

// ─── Schedule Schemas ─────────────────────────────────────────────────────────

export const CreateScheduleSchema = z.object({
  classTypeId: z.string().uuid(),
  roomId: z.string().uuid(),
  teacherId: z.string().uuid(),
  recurrenceType: RecurrenceTypeSchema,
  recurrenceDays: z.array(z.number().int().min(0).max(6)).optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Format HH:MM"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Format HH:MM"),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  maxCapacity: z.number().int().positive(),
});

export const UpdateScheduleSchema = CreateScheduleSchema.partial();

export const OverrideInstanceSchema = z.object({
  instanceId: z.string().uuid(),
  teacherId: z.string().uuid().optional(),
  roomId: z.string().uuid().optional(),
  startAt: z.coerce.date().optional(),
  endAt: z.coerce.date().optional(),
  maxCapacity: z.number().int().positive().optional(),
  isCancelled: z.boolean().optional(),
  cancelReason: z.string().optional(),
  notes: z.string().optional(),
});

// ─── Booking Schemas ──────────────────────────────────────────────────────────

export const CreateBookingSchema = z.object({
  scheduleInstanceId: z.string().uuid(),
});

export const CancelBookingSchema = z.object({
  bookingId: z.string().uuid(),
  cancelReason: z.string().optional(),
});

export const ListBookingsSchema = z.object({
  scheduleInstanceId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  status: BookingStatusSchema.optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  limit: z.number().int().positive().max(100).default(50),
  offset: z.number().int().nonnegative().default(0),
});

export const MarkAttendanceSchema = z.object({
  bookingId: z.string().uuid(),
  status: z.enum(["attended", "no_show"]),
});

// ─── Credit Schemas ───────────────────────────────────────────────────────────

export const CreateCreditPackageSchema = z.object({
  name: z.string().min(1).max(100),
  credits: z.number().int().positive(),
  priceCents: z.number().int().positive(),
  currency: z.string().length(3).default("EUR"),
  validityDays: z.number().int().positive().optional(),
  stripePriceId: z.string().optional(),
});

export const UpdateCreditPackageSchema = CreateCreditPackageSchema.partial();

export const AdjustCreditBalanceSchema = z.object({
  userId: z.string().uuid(),
  amount: z.number().int(),
  reason: z.string().min(1, "Reason is required for admin adjustments"),
});

export const ListCreditTransactionsSchema = z.object({
  userId: z.string().uuid().optional(),
  type: CreditTransactionTypeSchema.optional(),
  limit: z.number().int().positive().max(100).default(50),
  offset: z.number().int().nonnegative().default(0),
});

// ─── Payment Schemas ──────────────────────────────────────────────────────────

export const CreateCheckoutSchema = z.object({
  packageId: z.string().uuid(),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

export const CreateSubscriptionSchema = z.object({
  packageId: z.string().uuid(),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

export const ListPaymentsSchema = z.object({
  userId: z.string().uuid().optional(),
  status: PaymentStatusSchema.optional(),
  limit: z.number().int().positive().max(100).default(50),
  offset: z.number().int().nonnegative().default(0),
});

// ─── User Schemas ─────────────────────────────────────────────────────────────

export const UpdateUserSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  marketingConsent: z.boolean().optional(),
});

export const ListUsersSchema = z.object({
  search: z.string().optional(),
  limit: z.number().int().positive().max(100).default(50),
  offset: z.number().int().nonnegative().default(0),
});

export const GetUserSchema = z.object({
  userId: z.string().uuid(),
});
