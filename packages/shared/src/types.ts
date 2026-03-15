// ─── Enums ───────────────────────────────────────────────────────────────────

export type Role = "super_admin" | "tenant_admin" | "teacher" | "customer";

export type ClassCategory =
  | "yoga"
  | "pilates"
  | "dance"
  | "fitness"
  | "meditation"
  | "martial_arts"
  | "other";

export type RecurrenceType = "none" | "daily" | "weekly" | "custom";

export type InstanceStatus = "scheduled" | "cancelled" | "completed";

export type BookingStatus = "confirmed" | "waitlisted" | "cancelled" | "attended" | "no_show";

export type CreditTransactionType =
  | "purchase"
  | "deduction"
  | "refund"
  | "admin_adjustment"
  | "expiry";

export type PaymentStatus = "pending" | "succeeded" | "failed" | "refunded";

// ─── Domain Types ─────────────────────────────────────────────────────────────

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  primaryColor?: string | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Studio {
  id: string;
  tenantId: string;
  name: string;
  address: string;
  timezone: string;
  isActive: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Room {
  id: string;
  studioId: string;
  tenantId: string;
  name: string;
  capacity: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClassType {
  id: string;
  tenantId: string;
  name: string;
  description?: string | null;
  category: ClassCategory;
  durationMinutes: number;
  creditCost: number;
  color?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Schedule {
  id: string;
  tenantId: string;
  classTypeId: string;
  roomId: string;
  teacherId: string;
  recurrenceType: RecurrenceType;
  recurrenceDays?: number[] | null;
  startTime: string;
  endTime: string;
  startDate: Date;
  endDate?: Date | null;
  maxCapacity: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScheduleInstance {
  id: string;
  scheduleId: string;
  tenantId: string;
  classTypeId: string;
  roomId: string;
  teacherId: string;
  startAt: Date;
  endAt: Date;
  maxCapacity: number;
  status: InstanceStatus;
  isCancelled: boolean;
  cancelReason?: string | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  id: string;
  keycloakId: string;
  tenantId?: string | null;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  avatarUrl?: string | null;
  marketingConsent: boolean;
  dataRetentionRequestedAt?: Date | null;
  deletionRequestedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeacherProfile {
  id: string;
  userProfileId: string;
  tenantId: string;
  bio?: string | null;
  specialties: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Booking {
  id: string;
  tenantId: string;
  scheduleInstanceId: string;
  userId: string;
  status: BookingStatus;
  creditsUsed: number;
  waitlistPosition?: number | null;
  cancelledAt?: Date | null;
  cancelReason?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreditPackage {
  id: string;
  tenantId: string;
  name: string;
  credits: number;
  priceCents: number;
  currency: string;
  validityDays?: number | null;
  stripePriceId?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreditBalance {
  id: string;
  tenantId: string;
  userId: string;
  balance: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreditTransaction {
  id: string;
  tenantId: string;
  userId: string;
  type: CreditTransactionType;
  amount: number;
  balanceAfter: number;
  bookingId?: string | null;
  packageId?: string | null;
  adminNote?: string | null;
  expiresAt?: Date | null;
  createdAt: Date;
}

export interface Payment {
  id: string;
  tenantId: string;
  userId: string;
  packageId?: string | null;
  stripePaymentIntentId?: string | null;
  stripeSubscriptionId?: string | null;
  amountCents: number;
  currency: string;
  status: PaymentStatus;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Auth / Context ───────────────────────────────────────────────────────────

export interface AuthUser {
  userId: string;
  tenantId?: string;
  roles: Role[];
  email?: string;
}

export interface KeycloakTokenPayload {
  sub: string;
  email?: string;
  tenantId?: string;
  roles?: string[];
  realm_access?: { roles: string[] };
}
