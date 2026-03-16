# StudioBase — Findings

---

## Phase 05b-redo approved by human (2026-03-16)

Frontend-to-backend wiring complete. All 32 pages use real tRPC procedures. 12 routers, ~49 procedures, 38 tests passing.

---

## Session: Phase 01 Stack Migration (v1 → v2)

**Date:** 2026-03-15
**Context:** Updated spec.md to reflect new tech stack while preserving all features, actors, flows, and business rules.

### Stack Migration Decisions

#### 1. Prisma 5 → Drizzle ORM
**Rationale:**
- Native PostgreSQL RLS support via `pgPolicy()` — tenant isolation enforced at DB layer, not application layer
- TypeScript-first schema definition (no DSL, no code generation)
- ~7KB bundle size vs Prisma's client overhead
- Direct SQL query builder — better control and transparency

**Impact:**
- Tenant isolation moves from Prisma client extension to PostgreSQL Row-Level Security policies
- PII encryption shifts from Prisma middleware to Drizzle middleware/custom wrapper pattern
- Schema definition files will be TypeScript, not Prisma schema language

#### 2. Keycloak 24 → Better-Auth
**Rationale:**
- Organization plugin provides multi-tenant RBAC out of the box
- TypeScript-native, no separate auth server to operate
- Session management built-in — no need for jwks-rsa + jsonwebtoken setup
- Simpler local development (no Keycloak container)

**Impact:**
- Docker Compose no longer needs Keycloak service
- Auth flow remains PKCE, but session validation is TypeScript-native
- `tenantId` and `roles` stored in Better-Auth session object instead of JWT claims

#### 3. No Component Library → shadcn/ui + Aceternity UI
**Rationale:**
- shadcn/ui: copy-paste components (zero runtime, full customization)
- Aceternity UI: advanced UI patterns (cards, animations, interactions)
- Tailwind v4 `@theme` enables design token system

**Impact:**
- Phase 02a now includes design-brief.md for visual identity definition
- Component library explicitly declared in spec

#### 4. pnpm workspaces → pnpm + Turborepo
**Rationale:**
- Turborepo adds build caching across packages
- Faster CI/CD and local dev rebuild times
- No change to package management itself

**Impact:**
- `turbo.json` configuration file required
- Build tasks coordinated via Turborepo

#### 5. No MCP → mcp2cli Integration
**Rationale:**
- Context-efficient external tool usage (GitHub, DB, Docs, Browser)
- Reduces token usage for repetitive operations
- Better integration with external systems during development

**Impact:**
- Development workflow can leverage MCP tools for DB queries, API docs, etc.
- Declared in spec for transparency

#### 6. Vitest → Vitest + Playwright
**Rationale:**
- Vitest covers unit and integration tests
- Playwright adds E2E testing for critical user flows
- Better coverage of real-world browser behavior

**Impact:**
- E2E test suite required in Phase 06
- Test strategy expands beyond unit tests

---

## Decisions Preserved from v1

### Credit Consumption Order
FIFO by `expiresAt ASC NULLS LAST`, then `createdAt ASC`. This remains unchanged.

### PII Encryption Boundary
Encryption/decryption still happens at the ORM layer (now Drizzle middleware instead of Prisma middleware). Fields: `User.name`, `User.email`, `User.phone`. AES-256-GCM with per-record IV.

### No Global State Store
TanStack Query (via tRPC's React Query integration) still handles all server state. No Redux, Zustand, or similar.

### Stripe Integration
Stripe Checkout + Billing webhooks remain the payment layer. No changes to this integration.

---

## Updated Risk Assessment

| Risk | Likelihood | Mitigation |
|---|---|---|
| PostgreSQL RLS policy bug allows cross-tenant read | Low | Unit + integration tests with two tenant fixtures; RLS policies enforced at DB level (defense in depth) |
| Better-Auth session tampering | Low | Session signature verification; `tenantId` validated against DB membership on sensitive operations |
| Stripe webhook replay attack | Low | Stripe signature verification on every webhook; idempotency key on credit grants |
| PII encryption key rotation disruption | Medium | Plan key rotation procedure before prod launch; out of scope for Phase 05 |
| Drizzle middleware encryption bypass | Low | Test coverage on encrypted field access; custom wrapper enforces encryption |

---

## Session: Phase 02c UI Prototype

**Date:** 2026-03-15
**Context:** Built working Next.js prototype implementing Warm Stone design system across all 28 pages.

### Implementation Decisions

#### Warm Stone Design System
**Color Palette (CSS Custom Properties):**
- Primary: #6B5E52 (warm umber)
- Primary Light: #A08E7E (hover states)
- Accent: #D4724A (terracotta — CTAs, notifications)
- Surface: #F5F0EA (warm linen — card backgrounds)
- Background: #FDFAF5 (page background)
- Success: #4A9E6B (sage green)
- Danger: #C44D3A (muted red)

**Typography:**
- Headings: Fraunces (variable serif, weights 500-700)
- Body: Source Sans 3 (weights 400, 600)
- Mono: JetBrains Mono (400)

**Layout Principles:**
- Top navigation only (NO left sidebar)
- Sharp-cornered cards with 1px warm borders
- Content max-width: 72rem
- Generous whitespace (2rem minimum between blocks)

#### Mock Data Structure
Created comprehensive mock data in `/prototype/lib/mock-data.ts`:
- 1 tenant (Zen Flow Yoga Studio)
- 4 class types (Vinyasa, Yin, Power, Meditation)
- 3 teachers with initials-based avatars
- 10 schedule entries across 7 days
- 8 bookings (confirmed/cancelled/waitlisted)
- Credit ledger with grant/debit entries
- 2 credit packs, 2 subscription tiers
- 5 customers
- 2 waitlist entries

#### Interactive Features Implemented
1. **Role switcher** in TopNav — switches between customer/teacher/admin/super_admin views
2. **Booking flow** — ClassCard → Modal → Toast confirmation
3. **Cancel booking** — BookingCard → Confirm modal → Toast
4. **Attendance toggle** — Teacher can mark present/absent
5. **Form validation** — Login, register, profile forms
6. **Modal system** — All modals open/close properly
7. **Tab navigation** — Bookings (upcoming/past), schedule views
8. **Full navigation** — Every link navigates to a real page

#### Pages Built (28 total)

**Public (6):**
- Studio landing, schedule, class detail
- Login, register, forgot password

**Customer (8):**
- My bookings, booking detail
- Credits overview, buy credits, subscribe
- Profile, data export, delete account

**Teacher (2):**
- My schedule
- Class session (attendance)

**Admin (10):**
- Dashboard, class management, schedule management
- Teachers, customers, customer detail
- Credit packs, subscription tiers
- Reports, waitlists, settings

**Super Admin (4):**
- Tenant list, tenant detail, create tenant
- Global settings

#### Build Result
Next.js build successful:
- All 28+ pages compiled without errors
- Static pages: 20
- Dynamic pages: 8 (with [params])
- Build time: ~1.3s (Turbopack)

### Design Choices

#### No Component Library
Built all UI components from scratch using pure Tailwind v4:
- TopNav with role-aware links
- ClassCard, BookingCard, KPICard
- Modal, Toast, DataTable
- FormField, EmptyState, SkeletonLoader

This validates the Warm Stone design system is implementable without shadcn/ui dependency (though we'll add it in Phase 05 for production).

#### Mock Auth Context
`AuthProvider` component allows switching between roles in the prototype. The user object includes all roles for demo purposes. This simulates Better-Auth session structure.

#### Routing Strategy
Used Next.js App Router with:
- `[tenantSlug]` for public studio pages
- `[classId]`, `[bookingId]`, etc. for detail pages
- Proper nested routes (`/admin/pricing/packs`)

---

## Session: Phase 03 Schema

**Date:** 2026-03-16
**Context:** Generated Drizzle ORM schema with native PostgreSQL RLS policies.

### Schema Design Decisions

#### ID Strategy: UUID (defaultRandom)
**Rationale:** Spec requires no auto-increment IDs in public APIs (security). UUIDs prevent enumeration attacks.

**Implementation:** All tables use `uuid('id').primaryKey().defaultRandom()`.

#### Tenant Isolation: PostgreSQL RLS
**Rationale:** Defense in depth — tenant isolation enforced at DB level, not application layer.

**Implementation:**
- All tenant-scoped tables have `tenantId` column (NOT NULL, indexed)
- Each table has a `pgPolicy()` RLS rule: `tenant_id = current_setting('app.current_tenant_id')::uuid`
- Session middleware sets `app.current_tenant_id` from Better-Auth session on every request
- Exception: `auditLogs` has nullable `tenantId` (super_admin logs platform-wide actions)

**Why not RLS on all tables?**
- `tenants`: No `tenantId` (this IS the tenant root)
- `users`: Shared across tenants via `tenantMemberships` (one user, many tenants)
- `auditLogs`: Super admin needs cross-tenant visibility

#### Soft Delete on Audit-Critical Tables
**Rationale:** Spec mentions audit trail and GDPR 30-day deletion window. Soft delete preserves history.

**Applied to:**
- `users` (GDPR: marked deleted, PII purged after 30 days)
- `bookings` (revenue reports need historical booking data)
- `schedules` (admin archives instead of deletes — preserves instance history)
- `scheduleInstances` (cancelling a specific class shouldn't destroy booking records)

**Not applied to:**
- `creditLedger` (append-only by design)
- `auditLogs` (append-only, auto-purged after 90 days per spec)
- `payments` (immutable financial record)

#### PII Encryption at Application Layer
**Rationale:** Spec requires AES-256 encryption on `User.name`, `User.email`, `User.phone`.

**Implementation:**
- Fields stored as `text` (ciphertext)
- Drizzle middleware encrypts on insert/update, decrypts on select
- Email uniqueness constraint applies to ciphertext (deterministic encryption for unique index)

**Note:** This is a known tradeoff — deterministic encryption for uniqueness. Alternative would be HMAC hash in separate column, but spec doesn't require that complexity.

#### Better-Auth Compatibility
**Rationale:** Better-Auth Organization plugin expects specific user/membership schema.

**Alignment:**
- `users` table matches Better-Auth's expected user fields: `id`, `email`, `emailVerified`, `image`
- `tenantMemberships` maps to Organization plugin's membership (one user, many orgs, role per org)
- Better-Auth manages its own `session` and `account` tables (OAuth providers) — not duplicated here

#### Credit Ledger: Append-Only Design
**Rationale:** Spec requires FIFO credit consumption with audit trail. Ledger must be immutable.

**Implementation:**
- No updates or deletes — insert only
- FIFO query index: `(userId, expiresAt, createdAt)` optimizes `ORDER BY expiresAt ASC NULLS LAST, createdAt ASC`
- `amount` is signed: positive = grant, negative = debit
- `type` enum tracks reason (grant/debit/refund/expiry)
- `relatedBookingId` and `relatedPaymentId` link to source transaction

#### Schedule vs ScheduleInstance Split
**Rationale:** Admin creates recurring schedules (e.g., "Vinyasa every Monday 18:00"). Customers book specific occurrences.

**Implementation:**
- `schedules`: Template (classType, teacher, dayOfWeek, time, status)
- `scheduleInstances`: Concrete occurrence (scheduleId, date, capacity override)
- Composite unique on `(scheduleId, date)` — one instance per schedule per day
- Cascade delete: deleting a schedule removes all future instances

**Why not generate instances on-demand?**
Capacity overrides and cancellations require per-instance state. Pre-generation simplifies booking queries.

#### Waitlist Position Tracking
**Rationale:** Spec requires FIFO waitlist with position visibility.

**Implementation:**
- `position` column (integer, indexed)
- Composite unique: `(userId, scheduleInstanceId)` — one waitlist entry per customer per class
- When booking cancelled: query `position = 1`, offer spot, decrement all other positions

**Alternative considered:** No position column, just `ORDER BY createdAt`. Rejected because position changes require re-query; explicit tracking is clearer.

#### Cascade Rules
**Tenant deleted:** Cascade all tenant-scoped data (studio, classes, bookings, etc.)

**User deleted:** Set null on `bookings.userId` (preserve revenue history), cascade `tenantMemberships` and `creditLedger`

**ClassType deleted:** Restrict (must archive via `active = false` instead)

**Schedule deleted:** Cascade `scheduleInstances` (admin intent: cancel all future occurrences)

**Rationale:** Prevents orphaned data while preserving critical financial audit trails.

#### Indexes
**Foreign keys:** All indexed (Drizzle default on relations)

**Composite unique indexes:**
- `tenants.slug` (subdomain routing)
- `users.email` (auth lookup, uniqueness on ciphertext)
- `tenantMemberships(tenantId, userId)` (one membership per user per tenant)
- `scheduleInstances(scheduleId, date)` (one instance per schedule per day)
- `bookings(userId, scheduleInstanceId)` (one booking per customer per class)
- `waitlists(userId, scheduleInstanceId)` (one waitlist entry per customer per class)

**Query optimization indexes:**
- `creditLedger(userId, expiresAt, createdAt)` (FIFO credit consumption query)
- `auditLogs(tenantId, createdAt)` (time-range queries + 90-day purge)
- `scheduleInstances.date` (schedule page queries by date range)

#### Enums vs Text
**Used enums for:**
- Fixed values unlikely to change: `role`, `bookingStatus`, `scheduleStatus`, `creditType`, `paymentType`, `paymentStatus`, `subscriptionStatus`, `subscriptionPeriod`

**Used text for:**
- `auditLogs.action` (too many possible values, extensible)
- `schedules.startTime`, `schedules.endTime` (HH:MM format, not a DB type)

#### JSONB Fields
**Used for:**
- `tenants.settings` (cancellationWindowHours, locale overrides, feature flags)
- `creditLedger.metadata` (additional context: pack name, subscription tier, refund reason)
- `payments.metadata` (Stripe metadata passthrough)
- `auditLogs.metadata` (freeform event context)

**Rationale:** Flexible config storage without schema changes. Spec doesn't define all settings upfront.

---

## Model Summary

**Total tables:** 16

**Multi-tenant core:** 14 tables with RLS (all except `tenants`, `users`, `auditLogs`)

**Relations:** 40+ bidirectional Drizzle relations

**Indexes:** 50+ (composite unique, foreign key, query optimization)

**Enums:** 8

**Soft delete:** 4 tables (`users`, `bookings`, `schedules`, `scheduleInstances`)

**Append-only:** 2 tables (`creditLedger`, `auditLogs`)

---

## Open Questions

None. Schema complete and ready for approval.

---

## What Changed in spec.md

**Modified sections:**
- **Security and Compliance → Row-Level Tenant Isolation**: References Drizzle `pgPolicy()` instead of Prisma client extension
- **Security and Compliance → Authentication**: Better-Auth with Organization plugin replaces Keycloak
- **Security and Compliance → PII Encryption at Rest**: References Drizzle middleware instead of Prisma middleware
- **Technical Constraints → Development Environment**: Removed Keycloak from Docker Compose
- **Technical Constraints → Quality**: Added Playwright for E2E testing
- **Technical Constraints → Design System**: New section declaring shadcn/ui + Aceternity UI + Tailwind v4
- **Tech Stack**: Complete table rewrite with Drizzle, Better-Auth, Turborepo, mcp2cli, Playwright

**Unchanged sections:**
- All Actors
- All Core Features
- All Business Rules (FIFO, waitlist, cancellation windows, credit expiry)
- DSGVO/GDPR requirements
- Internationalisation (i18next, DE + EN)
- Out of Scope items
