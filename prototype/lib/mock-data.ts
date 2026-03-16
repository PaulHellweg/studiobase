// Mock data for StudioBase prototype

export type Tenant = {
  id: string;
  slug: string;
  name: string;
  description: string;
  location: string;
  defaultLocale: string;
  cancellationWindowHours: number;
};

export type ClassType = {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  capacity: number;
  durationMinutes: number;
};

export type Teacher = {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  initials: string;
};

export type ScheduleEntry = {
  id: string;
  tenantId: string;
  classTypeId: string;
  teacherId: string;
  startTime: string;
  endTime: string;
  location: string;
  status: 'draft' | 'published';
  bookedCount: number;
  capacity: number;
};

export type Booking = {
  id: string;
  customerId: string;
  scheduleEntryId: string;
  status: 'confirmed' | 'cancelled' | 'waitlisted';
  creditsUsed: number;
  createdAt: string;
  cancelledAt?: string;
};

export type CreditLedgerEntry = {
  id: string;
  customerId: string;
  amount: number;
  type: 'grant' | 'debit';
  reason: string;
  expiresAt?: string;
  createdAt: string;
};

export type CreditPack = {
  id: string;
  tenantId: string;
  name: string;
  credits: number;
  priceEur: number;
  expiryDays: number | null;
};

export type SubscriptionTier = {
  id: string;
  tenantId: string;
  name: string;
  creditsPerPeriod: number;
  periodDays: number;
  priceEur: number;
};

export type Customer = {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  phone: string;
  locale: string;
  createdAt: string;
};

export type WaitlistEntry = {
  id: string;
  customerId: string;
  scheduleEntryId: string;
  position: number;
  createdAt: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  roles: ('super_admin' | 'tenant_admin' | 'teacher' | 'customer')[];
  tenantId?: string;
};

// Mock Tenant
export const mockTenant: Tenant = {
  id: 'tenant-1',
  slug: 'zen-flow',
  name: 'Zen Flow Yoga Studio',
  description: 'A welcoming space for mindful movement and breathwork in the heart of Berlin.',
  location: 'Prenzlauer Berg, Berlin',
  defaultLocale: 'de',
  cancellationWindowHours: 24,
};

// Mock Class Types
export const mockClassTypes: ClassType[] = [
  {
    id: 'class-type-1',
    tenantId: 'tenant-1',
    name: 'Vinyasa Flow',
    description: 'Dynamic flowing sequences linking breath and movement.',
    capacity: 15,
    durationMinutes: 75,
  },
  {
    id: 'class-type-2',
    tenantId: 'tenant-1',
    name: 'Yin Yoga',
    description: 'Slow-paced practice with passive floor poses held for longer durations.',
    capacity: 12,
    durationMinutes: 90,
  },
  {
    id: 'class-type-3',
    tenantId: 'tenant-1',
    name: 'Power Yoga',
    description: 'Vigorous, fitness-based approach to vinyasa-style yoga.',
    capacity: 20,
    durationMinutes: 60,
  },
  {
    id: 'class-type-4',
    tenantId: 'tenant-1',
    name: 'Meditation',
    description: 'Guided meditation and breathing practices.',
    capacity: 25,
    durationMinutes: 45,
  },
];

// Mock Teachers
export const mockTeachers: Teacher[] = [
  {
    id: 'teacher-1',
    tenantId: 'tenant-1',
    name: 'Maya Schmidt',
    email: 'maya@zenflow.example',
    initials: 'MS',
  },
  {
    id: 'teacher-2',
    tenantId: 'tenant-1',
    name: 'Jonas Weber',
    email: 'jonas@zenflow.example',
    initials: 'JW',
  },
  {
    id: 'teacher-3',
    tenantId: 'tenant-1',
    name: 'Lena Müller',
    email: 'lena@zenflow.example',
    initials: 'LM',
  },
];

// Mock Schedule Entries (next 7 days)
const today = new Date();
const getDateStr = (daysFromNow: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split('T')[0];
};

export const mockScheduleEntries: ScheduleEntry[] = [
  {
    id: 'sched-1',
    tenantId: 'tenant-1',
    classTypeId: 'class-type-1',
    teacherId: 'teacher-1',
    startTime: `${getDateStr(0)}T09:00:00Z`,
    endTime: `${getDateStr(0)}T10:15:00Z`,
    location: 'Main Studio',
    status: 'published',
    bookedCount: 12,
    capacity: 15,
  },
  {
    id: 'sched-2',
    tenantId: 'tenant-1',
    classTypeId: 'class-type-2',
    teacherId: 'teacher-2',
    startTime: `${getDateStr(0)}T18:00:00Z`,
    endTime: `${getDateStr(0)}T19:30:00Z`,
    location: 'Main Studio',
    status: 'published',
    bookedCount: 12,
    capacity: 12,
  },
  {
    id: 'sched-3',
    tenantId: 'tenant-1',
    classTypeId: 'class-type-3',
    teacherId: 'teacher-3',
    startTime: `${getDateStr(1)}T07:00:00Z`,
    endTime: `${getDateStr(1)}T08:00:00Z`,
    location: 'Main Studio',
    status: 'published',
    bookedCount: 15,
    capacity: 20,
  },
  {
    id: 'sched-4',
    tenantId: 'tenant-1',
    classTypeId: 'class-type-1',
    teacherId: 'teacher-1',
    startTime: `${getDateStr(1)}T17:30:00Z`,
    endTime: `${getDateStr(1)}T18:45:00Z`,
    location: 'Main Studio',
    status: 'published',
    bookedCount: 8,
    capacity: 15,
  },
  {
    id: 'sched-5',
    tenantId: 'tenant-1',
    classTypeId: 'class-type-4',
    teacherId: 'teacher-2',
    startTime: `${getDateStr(2)}T19:00:00Z`,
    endTime: `${getDateStr(2)}T19:45:00Z`,
    location: 'Quiet Room',
    status: 'published',
    bookedCount: 18,
    capacity: 25,
  },
  {
    id: 'sched-6',
    tenantId: 'tenant-1',
    classTypeId: 'class-type-2',
    teacherId: 'teacher-3',
    startTime: `${getDateStr(3)}T10:00:00Z`,
    endTime: `${getDateStr(3)}T11:30:00Z`,
    location: 'Main Studio',
    status: 'published',
    bookedCount: 10,
    capacity: 12,
  },
  {
    id: 'sched-7',
    tenantId: 'tenant-1',
    classTypeId: 'class-type-1',
    teacherId: 'teacher-1',
    startTime: `${getDateStr(4)}T09:00:00Z`,
    endTime: `${getDateStr(4)}T10:15:00Z`,
    location: 'Main Studio',
    status: 'draft',
    bookedCount: 0,
    capacity: 15,
  },
  {
    id: 'sched-8',
    tenantId: 'tenant-1',
    classTypeId: 'class-type-3',
    teacherId: 'teacher-2',
    startTime: `${getDateStr(5)}T18:00:00Z`,
    endTime: `${getDateStr(5)}T19:00:00Z`,
    location: 'Main Studio',
    status: 'published',
    bookedCount: 20,
    capacity: 20,
  },
  {
    id: 'sched-9',
    tenantId: 'tenant-1',
    classTypeId: 'class-type-2',
    teacherId: 'teacher-3',
    startTime: `${getDateStr(6)}T11:00:00Z`,
    endTime: `${getDateStr(6)}T12:30:00Z`,
    location: 'Main Studio',
    status: 'published',
    bookedCount: 9,
    capacity: 12,
  },
  {
    id: 'sched-10',
    tenantId: 'tenant-1',
    classTypeId: 'class-type-4',
    teacherId: 'teacher-1',
    startTime: `${getDateStr(6)}T19:30:00Z`,
    endTime: `${getDateStr(6)}T20:15:00Z`,
    location: 'Quiet Room',
    status: 'published',
    bookedCount: 22,
    capacity: 25,
  },
];

// Mock Customers
export const mockCustomers: Customer[] = [
  {
    id: 'customer-1',
    tenantId: 'tenant-1',
    name: 'Anna Becker',
    email: 'anna@example.com',
    phone: '+49 176 12345678',
    locale: 'de',
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'customer-2',
    tenantId: 'tenant-1',
    name: 'Thomas Klein',
    email: 'thomas@example.com',
    phone: '+49 176 23456789',
    locale: 'de',
    createdAt: '2024-02-20T10:00:00Z',
  },
  {
    id: 'customer-3',
    tenantId: 'tenant-1',
    name: 'Sarah Johnson',
    email: 'sarah@example.com',
    phone: '+49 176 34567890',
    locale: 'en',
    createdAt: '2024-03-10T10:00:00Z',
  },
  {
    id: 'customer-4',
    tenantId: 'tenant-1',
    name: 'Michael Braun',
    email: 'michael@example.com',
    phone: '+49 176 45678901',
    locale: 'de',
    createdAt: '2024-04-05T10:00:00Z',
  },
  {
    id: 'customer-5',
    tenantId: 'tenant-1',
    name: 'Elena Rossi',
    email: 'elena@example.com',
    phone: '+49 176 56789012',
    locale: 'en',
    createdAt: '2024-05-12T10:00:00Z',
  },
];

// Mock Bookings
export const mockBookings: Booking[] = [
  {
    id: 'booking-1',
    customerId: 'customer-1',
    scheduleEntryId: 'sched-1',
    status: 'confirmed',
    creditsUsed: 1,
    createdAt: `${getDateStr(-2)}T10:00:00Z`,
  },
  {
    id: 'booking-2',
    customerId: 'customer-1',
    scheduleEntryId: 'sched-4',
    status: 'confirmed',
    creditsUsed: 1,
    createdAt: `${getDateStr(-1)}T14:00:00Z`,
  },
  {
    id: 'booking-3',
    customerId: 'customer-1',
    scheduleEntryId: 'sched-6',
    status: 'cancelled',
    creditsUsed: 1,
    createdAt: `${getDateStr(-3)}T10:00:00Z`,
    cancelledAt: `${getDateStr(-1)}T12:00:00Z`,
  },
  {
    id: 'booking-4',
    customerId: 'customer-2',
    scheduleEntryId: 'sched-2',
    status: 'confirmed',
    creditsUsed: 1,
    createdAt: `${getDateStr(-2)}T15:00:00Z`,
  },
  {
    id: 'booking-5',
    customerId: 'customer-2',
    scheduleEntryId: 'sched-8',
    status: 'waitlisted',
    creditsUsed: 0,
    createdAt: `${getDateStr(-1)}T09:00:00Z`,
  },
  {
    id: 'booking-6',
    customerId: 'customer-3',
    scheduleEntryId: 'sched-3',
    status: 'confirmed',
    creditsUsed: 1,
    createdAt: `${getDateStr(-2)}T11:00:00Z`,
  },
  {
    id: 'booking-7',
    customerId: 'customer-4',
    scheduleEntryId: 'sched-5',
    status: 'confirmed',
    creditsUsed: 1,
    createdAt: `${getDateStr(-1)}T16:00:00Z`,
  },
  {
    id: 'booking-8',
    customerId: 'customer-5',
    scheduleEntryId: 'sched-9',
    status: 'confirmed',
    creditsUsed: 1,
    createdAt: `${getDateStr(-2)}T13:00:00Z`,
  },
];

// Mock Credit Ledger
export const mockCreditLedger: CreditLedgerEntry[] = [
  {
    id: 'ledger-1',
    customerId: 'customer-1',
    amount: 10,
    type: 'grant',
    reason: 'Credit pack purchase',
    expiresAt: `${getDateStr(60)}T00:00:00Z`,
    createdAt: `${getDateStr(-30)}T10:00:00Z`,
  },
  {
    id: 'ledger-2',
    customerId: 'customer-1',
    amount: -1,
    type: 'debit',
    reason: 'Class booking',
    createdAt: `${getDateStr(-2)}T10:00:00Z`,
  },
  {
    id: 'ledger-3',
    customerId: 'customer-1',
    amount: -1,
    type: 'debit',
    reason: 'Class booking',
    createdAt: `${getDateStr(-1)}T14:00:00Z`,
  },
  {
    id: 'ledger-4',
    customerId: 'customer-1',
    amount: 1,
    type: 'grant',
    reason: 'Booking cancellation refund',
    expiresAt: `${getDateStr(60)}T00:00:00Z`,
    createdAt: `${getDateStr(-1)}T12:00:00Z`,
  },
];

// Mock Credit Packs
export const mockCreditPacks: CreditPack[] = [
  {
    id: 'pack-1',
    tenantId: 'tenant-1',
    name: '5-Class Pack',
    credits: 5,
    priceEur: 75,
    expiryDays: 60,
  },
  {
    id: 'pack-2',
    tenantId: 'tenant-1',
    name: '10-Class Pack',
    credits: 10,
    priceEur: 140,
    expiryDays: 90,
  },
];

// Mock Subscription Tiers
export const mockSubscriptionTiers: SubscriptionTier[] = [
  {
    id: 'sub-1',
    tenantId: 'tenant-1',
    name: 'Weekly Unlimited',
    creditsPerPeriod: 999,
    periodDays: 7,
    priceEur: 49,
  },
  {
    id: 'sub-2',
    tenantId: 'tenant-1',
    name: 'Monthly 8-Class',
    creditsPerPeriod: 8,
    periodDays: 30,
    priceEur: 99,
  },
];

// Mock Waitlist Entries
export const mockWaitlistEntries: WaitlistEntry[] = [
  {
    id: 'wait-1',
    customerId: 'customer-2',
    scheduleEntryId: 'sched-8',
    position: 1,
    createdAt: `${getDateStr(-1)}T09:00:00Z`,
  },
  {
    id: 'wait-2',
    customerId: 'customer-4',
    scheduleEntryId: 'sched-2',
    position: 1,
    createdAt: `${getDateStr(-1)}T11:00:00Z`,
  },
];

// Helper to get class type by ID
export const getClassType = (id: string) => mockClassTypes.find(c => c.id === id);

// Helper to get teacher by ID
export const getTeacher = (id: string) => mockTeachers.find(t => t.id === id);

// Helper to get schedule entry by ID
export const getScheduleEntry = (id: string) => mockScheduleEntries.find(s => s.id === id);

// Helper to get customer by ID
export const getCustomer = (id: string) => mockCustomers.find(c => c.id === id);

// Helper to calculate credit balance for a customer
export const getCreditBalance = (customerId: string): number => {
  const entries = mockCreditLedger.filter(e => e.customerId === customerId);
  return entries.reduce((sum, e) => sum + e.amount, 0);
};
