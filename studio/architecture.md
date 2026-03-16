# StudioBase v2 — Architecture Layout

**Phase:** 02b
**Design Direction:** A — "Warm Stone"
**Status:** awaiting_approval

---

## 1. Pages by Actor

### Public (no auth required)

| Page | Route | Purpose |
|---|---|---|
| Studio Landing | `/:tenantSlug` | Public studio page — branding, description, location |
| Class Schedule | `/:tenantSlug/schedule` | Browse available classes by day/week |
| Class Detail | `/:tenantSlug/class/:classId` | Class description, teacher, time, spots remaining |
| Login | `/auth/login` | Email/password + social login via Better-Auth |
| Register | `/auth/register` | Account creation |
| Forgot Password | `/auth/forgot-password` | Password reset flow |

### Customer (`customer` role)

| Page | Route | Purpose |
|---|---|---|
| My Bookings | `/bookings` | Upcoming and past bookings |
| Booking Detail | `/bookings/:bookingId` | Single booking + cancel option |
| Credits & Subscriptions | `/credits` | Credit balance, active subscriptions, purchase history |
| Buy Credits | `/credits/buy` | Credit pack selection → Stripe Checkout |
| Subscribe | `/credits/subscribe` | Subscription tier selection → Stripe Checkout |
| Profile | `/profile` | Name, email, phone, language preference |
| Data Export | `/profile/export` | DSGVO data export request |
| Delete Account | `/profile/delete` | DSGVO account deletion request |

### Teacher (`teacher` role)

| Page | Route | Purpose |
|---|---|---|
| My Schedule | `/teacher/schedule` | Upcoming and past classes for this teacher |
| Class Session | `/teacher/class/:sessionId` | Attendance list, mark present/absent, session notes |

### Tenant Admin (`tenant_admin` role)

| Page | Route | Purpose |
|---|---|---|
| Dashboard | `/admin` | KPI overview: bookings today, revenue this month, attendance rate |
| Class Management | `/admin/classes` | CRUD for class types (name, description, capacity, duration) |
| Schedule Management | `/admin/schedule` | Create/edit recurring and one-off schedule entries |
| Schedule Entry Editor | `/admin/schedule/:entryId` | Single entry: class type, teacher, time, location, capacity, draft/published |
| Teacher Management | `/admin/teachers` | List, invite, deactivate teachers |
| Customer List | `/admin/customers` | Search customers, view booking history, credit balance |
| Customer Detail | `/admin/customers/:customerId` | Individual customer: bookings, credits, subscriptions |
| Credit Pack Config | `/admin/pricing/packs` | Create/edit credit packs (amount, price, expiry) |
| Subscription Tier Config | `/admin/pricing/subscriptions` | Create/edit subscription tiers (credits/period, price) |
| Revenue Reports | `/admin/reports` | Revenue by period, class, pack/subscription breakdown |
| Waitlist Management | `/admin/waitlists` | View active waitlists across classes |
| Studio Settings | `/admin/settings` | Studio name, description, location, default locale, cancellation window |

### Super Admin (`super_admin` role)

| Page | Route | Purpose |
|---|---|---|
| Tenant List | `/super/tenants` | All tenants, status, plan, created date |
| Tenant Detail | `/super/tenants/:tenantId` | Tenant config, billing status, DPA management |
| Create Tenant | `/super/tenants/new` | Onboard new studio |
| Global Settings | `/super/settings` | Platform-wide configuration |

**Total: 28 pages**

---

## 2. Layouts

### Public Layout
- **Top nav:** Studio logo (left), language switcher (right), login button (right)
- **Content:** max-width 72rem, centered, generous side margins
- **Footer:** Studio contact, legal links (Impressum, Datenschutz)
- Per Warm Stone: warm linen background (`--color-background`), no sidebar

### Authenticated Layout
- **Top nav:** StudioBase logo (left), navigation links (center, role-aware), user avatar + dropdown (right)
- **Content:** max-width 72rem, centered
- **No sidebar** — top navigation only (Warm Stone direction breaks the SaaS sidebar pattern)

### Admin Layout
- Extends Authenticated Layout
- Sub-navigation row below main nav for deep sections (Pricing → Packs | Subscriptions)

---

## 3. Component Tree

### Shared Components

```
TopNav
├── Logo
├── NavLinks (role-aware, from §4)
├── LanguageSwitcher (DE/EN toggle)
└── UserMenu (avatar, dropdown: profile, logout)

ClassCard
├── ClassName (Fraunces heading)
├── TeacherName + Avatar
├── TimeSlot (date, start–end)
├── SpotsBadge ("3 spots left" / "Full")
└── BookButton / WaitlistButton / LoginPrompt

ScheduleView
├── DaySelector (horizontal date pills, scroll)
├── DayList (mobile: vertical ClassCard list)
└── WeekGrid (desktop: 7-column, time rows, warm row striping)

CreditBalance
├── TotalCredits
├── ExpiryBreakdown (FIFO order by expiresAt)
└── PurchaseHistoryLink

BookingCard
├── ClassCard (compact variant)
├── BookingStatus (confirmed / cancelled / waitlisted)
├── CancelButton (visible within cancellation window)
└── CreditUsed

DataTable
├── ColumnHeaders (sortable)
├── Rows (warm hover highlight)
├── Pagination
├── SearchBar
└── EmptyState

Modal
├── Overlay
├── Content (sharp corners per Warm Stone, 1px warm border)
├── CloseButton
└── ActionFooter

Toast (slide-in, terracotta accent for alerts)
SkeletonLoader (warm linen-to-surface shimmer)
EmptyState (message + CTA, no stock illustrations)
FormField (label, input, validation, help text)
```

### Key Page Component Trees

#### Schedule Page (`/:tenantSlug/schedule`)
```
PublicLayout
└── SchedulePage
    ├── StudioHeader (name, description, location)
    ├── ClassFilterBar (class type, teacher dropdown)
    └── ScheduleView
        ├── DaySelector
        └── DayList / WeekGrid
            └── ClassCard (×n)
```

#### My Bookings (`/bookings`)
```
AuthLayout
└── BookingsPage
    ├── PageHeader ("My Bookings")
    ├── TabBar (Upcoming | Past)
    ├── BookingList
    │   └── BookingCard (×n)
    └── EmptyState
```

#### Admin Dashboard (`/admin`)
```
AdminLayout
└── DashboardPage
    ├── KPIRow
    │   ├── KPICard (Bookings Today)
    │   ├── KPICard (Revenue This Month)
    │   ├── KPICard (Attendance Rate)
    │   └── KPICard (Active Customers)
    ├── TodaySchedule (compact DayList)
    └── RecentActivity (bookings, cancellations, signups)
```

#### Teacher Class Session (`/teacher/class/:sessionId`)
```
AuthLayout
└── ClassSessionPage
    ├── ClassHeader (name, time, location)
    ├── AttendanceList
    │   └── AttendanceRow (×n)
    │       ├── CustomerName
    │       ├── AttendanceToggle
    │       └── BookingStatus
    ├── SessionNotesEditor
    └── SessionStats (booked, attended, no-show)
```

#### Admin Schedule Management (`/admin/schedule`)
```
AdminLayout
└── ScheduleManagementPage
    ├── PageHeader + CreateButton
    ├── WeekSelector
    ├── ScheduleGrid (week view, time×day matrix)
    │   └── ScheduleSlot (×n)
    │       ├── ClassName, TeacherName, Time
    │       ├── StatusBadge (draft/published)
    │       └── BookingCount / Capacity
    └── DraftBanner
```

---

## 4. Navigation Structure

### Primary Nav Links by Role

| Role | Links |
|---|---|
| **Customer** | Schedule, My Bookings, Credits |
| **Teacher** | My Schedule |
| **Tenant Admin** | Dashboard, Schedule, Classes, Customers, Pricing, Reports, Settings |
| **Super Admin** | Tenants, Settings |

### Secondary Nav (contextual sub-nav row)

- **Pricing:** Packs | Subscriptions
- **Profile:** Profile | Data Export | Delete Account
- **Customer Detail:** breadcrumb Customers → [Name]

### Route Access Control

| Route Pattern | Auth | Role |
|---|---|---|
| `/:tenantSlug/**` | No | — |
| `/auth/**` | No | — |
| `/bookings/**` | Yes | `customer` |
| `/credits/**` | Yes | `customer` |
| `/profile/**` | Yes | any |
| `/teacher/**` | Yes | `teacher` |
| `/admin/**` | Yes | `tenant_admin` |
| `/super/**` | Yes | `super_admin` |

---

## 5. User Flows

### Flow 1: Book a Class
```
Schedule → ClassCard [Book]
  ├─ not logged in → Login → redirect back
  ├─ logged in, has credits → Confirm Modal → [Confirm]
  │   → POST booking → credit deducted (FIFO) → toast → appears in My Bookings
  ├─ logged in, no credits → "Buy Credits" modal → /credits/buy
  │   → select pack → Stripe Checkout → return → retry booking
  └─ class full → Waitlist Modal → [Join] → FIFO position shown → toast
```

### Flow 2: Cancel a Booking
```
My Bookings → BookingCard [Cancel]
  ├─ within window → Confirm Modal → [Confirm]
  │   → DELETE booking → credit returned → toast
  │   → waitlist: next customer auto-offered (email)
  └─ outside window → "Cannot cancel" message
```

### Flow 3: Teacher Marks Attendance
```
My Schedule → Class Session → AttendanceList
  → toggle present/absent per customer
  → add session notes (optional)
  → [Save] → PUT → toast
```

### Flow 4: Admin Creates Recurring Schedule
```
Schedule Management → [Create]
  → Schedule Entry Editor
    → class type, teacher, time, day(s), location, recurrence
    → Save as Draft / Publish
  → entries appear in grid
  → [Publish] → visible on public schedule
```

### Flow 5: Customer Subscribes
```
Credits → [Subscribe] → Subscribe Page
  → select tier → Stripe Checkout (subscription)
  → return → subscription active → credits granted per cycle
  → manage via Stripe Billing portal
```

### Flow 6: Waitlist Auto-Promotion
```
(booking cancelled for full class)
  → query waitlist (FIFO) → first customer
  → reserve spot (temporary hold)
  → email: "A spot opened up!"
  → customer confirms → credit deducted
  → no confirmation within window → next customer
```

### Flow 7: DSGVO Export / Deletion
```
Profile → Data Export → [Request]
  → generate JSON → download link
Profile → Delete Account → [Request]
  → confirm (type "DELETE") → account marked
  → PII purged within 30 days → email confirmation
```

---

## 6. Data Requirements by Component

| Component | Reads | Writes |
|---|---|---|
| ClassCard | class, teacher, booked count, capacity | — |
| BookButton | auth state, credit balance, class availability | booking (CREATE) |
| ScheduleView | classes for date range by day | — |
| CreditBalance | user credits (amount, expiry dates) | — |
| BookingCard | booking, class info, cancellation window | booking (DELETE) |
| AttendanceRow | customer name, booking, attendance | attendance (UPDATE) |
| KPICard | aggregated metric for time period | — |
| PackCard | pack name, credits, price, expiry | — |
| BuyButton | pack ID | Stripe checkout session (CREATE) |
| DataTable | paginated list + search/filter | — |
| ScheduleSlot | schedule entry, class, teacher, status | status (UPDATE) |
| WaitlistButton | class ID | waitlist entry (CREATE) |

---

## 7. States

### Loading
- Every page: skeleton loader with warm linen shimmer (Warm Stone)
- Schedule: skeleton day-list with placeholder ClassCards
- KPIs: individual skeleton cards

### Empty
- No bookings: "You haven't booked any classes yet" + link to schedule
- No credits: "No credits remaining" + link to buy
- No classes (admin): "Create your first class" + CTA
- No customers: "Customers appear here after their first booking"

### Error
- Network error: toast with retry
- Booking race condition (class filled): "Class just filled — join waitlist?"
- Payment failure: Stripe error displayed + retry
- Auth expired: redirect to login with return URL

---

## 8. Warm Stone Design Integration

### Typography
- **Fraunces** (variable serif) for all headings — warm, distinctive, anti-SaaS
- **Source Sans 3** for body text — legible, slightly warmer than Inter
- **JetBrains Mono** for data/numbers

### Layout Principles
- **Top nav only** — no left sidebar
- **Sharp-cornered cards** with 1px warm border (`--color-border`) — no rounded-xl
- **Asymmetric layouts** where appropriate (2/3 + 1/3 splits on detail pages)
- **Generous whitespace** — 2rem minimum between content blocks
- **Content max-width: 72rem**

### Color Application
- Warm umber (`--color-primary`) for buttons, active states, links
- Terracotta (`--color-accent`) for notifications, badges, CTAs
- Sage green (`--color-success`) for confirmed bookings
- Warm linen (`--color-surface`) for card backgrounds
- Barely-there warmth (`--color-background`) for page

### Animation
- Transitions: 250–300ms ease-out
- Page content: fade-in with 8px upward drift (200ms)
- Hover: background color shift only, no scale
- Loading: warm shimmer (linen-to-surface gradient pulse)
- Schedule slot selection: gentle background fill left-to-right (150ms)
