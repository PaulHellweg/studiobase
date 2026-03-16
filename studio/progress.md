# StudioBase v2 — Progress Log

---

## 2026-03-16 — Phases 06-09: Test Suite + Bug Hunt + Code Review + Security Audit

**Status:** done

### Phase 06: Test Suite
- 18 frontend test files, 72 tests (all passing)
- Vitest config with jsdom, path aliases, test setup
- Playwright E2E config + smoke tests
- `renderWithProviders` + `trpc-mock` test helpers
- Combined with 38 server tests = **110 tests total**

### Phase 07-08: Bug Hunt + Code Review
- Full codebase review across all routers, services, middleware
- Findings merged with security audit below

### Phase 09: Security Audit (OWASP Top 10)
**4 CRITICAL findings — all fixed:**
1. Credit debit TOCTOU race condition → atomic CTE (check+insert in one SQL statement)
2. Stripe webhook secret empty fallback → fail-fast guard in production
3. RLS SET LOCAL on pooled connection → reset tenant context at request start
4. Cross-tenant `credit.grantManual` → verify user membership before granting
5. Cross-tenant `schedule.createInstance` → verify scheduleId belongs to tenant

**6 HIGH findings — all fixed:**
1. No rate limiting on auth → `express-rate-limit` on sign-in/sign-up (20/15min)
2. Missing BETTER_AUTH_SECRET in config → added `secret:` param + startup guard
3. Weak default ENCRYPTION_KEY → warn on all-zeros, throw in production
4. Teacher attendance scope → verify teacher owns the class before marking
5. Teacher `listByInstance` → verify teacher owns session before listing attendees
6. Waitlist recursive stack overflow → converted to iterative loop (max 50)

**6 MEDIUM findings — fixed or documented:**
1. Public endpoint leaking tenant settings → stripped `settings`/`plan` from getBySlug
2. Morgan dev format in production → conditional `combined` format
3. Stripe refund not clawing back credits → added credit claw-back on refund
4. Cancellation window not enforced server-side → documented for next phase
5. PII encryption inconsistency on reads (decrypt never called) → documented for next phase
6. Missing audit log entries for booking/credit events → documented for next phase

**Verification:** `pnpm typecheck` passes (3/3), `pnpm test` passes (110/110)

---

## 2026-03-16 — Phase 05b-redo: Wire Frontend to Backend (End-to-End)

**Status:** done (approved)
**Output:** All 32 frontend pages wired to real tRPC backend. Zero MOCK_ constants remaining.

**Backend additions (12 routers, ~49 procedures):**
- 3 new routers: admin.ts (dashboard, revenueReport, listTeachers, listCustomers, customerDetail), credit-pack.ts (CRUD), subscription-tier.ts (CRUD)
- Extended: schedule.ts (+listInstances, +listByTeacher), studio.ts (+getBySlug), booking.ts (+get, +listByInstance), waitlist.ts (+list), tenant.ts (+list)
- 20 new Zod validation schemas in shared/validation.ts
- Express type declarations for req.user/req.tenantId

**Frontend wiring (28 pages with tRPC, 4 auth/static):**
- Typed tRPC client: `createTRPCReact<AppRouter>()` with full type inference
- Every page uses `trpc.xxx.useQuery()` / `useMutation()` for data fetching
- Loading skeletons on every page
- Cache invalidation via `trpc.useUtils()` after mutations
- Stripe checkout redirect on credit pack/subscription purchase

**Test infrastructure:**
- Client vitest.config.ts (jsdom, path aliases, setup file)
- `renderWithProviders` test utility with TrpcProvider, QueryClient, AuthContext, ToastContext, BrowserRouter
- @testing-library/jest-dom configured

**Verification:**
- `pnpm typecheck` — all 3 packages pass (0 errors)
- `pnpm test` — 38 server tests pass
- `grep -r "MOCK_" packages/client/src/pages/` — 0 results
- 28 of 32 pages import tRPC (4 auth/static pages don't need it)

---

## 2026-03-16 — Phase 05b: TDD Build

**Status:** awaiting_approval
**Output:** packages/server (9 routers, 3 services, 38 tests) + packages/client (28 pages, 17 components)

**Server (37 files):**
- Better-Auth with Organization plugin + Drizzle adapter
- RLS tenant middleware (SET LOCAL app.current_tenant_id)
- tRPC v11: 6 procedure types, 9 domain routers (tenant, studio, classType, schedule, booking, credit, payment, user, waitlist)
- Services: credit FIFO (12 tests), booking (11 tests), waitlist (8 tests)
- PII encryption AES-256-GCM (7 tests)
- Stripe: checkout, portal, idempotent webhooks
- Email: Nodemailer + waitlist notification template
- 15 Zod validation schemas in shared package

**Client (62 files):**
- Auth context with Better-Auth REST endpoints
- 3 layouts (Public, Auth, Admin) — top nav only, Warm Stone styling
- 11 UI components (Button, Card, Input, Modal, Toast, Badge, Tabs, DataTable, Skeleton, EmptyState)
- 6 feature components (ClassCard, BookingCard, CreditBalance, KPICard, ScheduleView, AttendanceRow)
- 28 pages across 5 roles with route guards
- 170+ i18n strings (DE + EN)

**Verification:** typecheck passes (all 3 packages), 38 server tests pass.

---

## 2026-03-16 — Phase 05a: Scaffold

**Status:** done (approved)
**Output:** Root config + packages/shared + packages/server + packages/client

Monorepo scaffold complete. Turborepo pipeline, tsconfig.base.json, docker-compose (PG 16 + Mailpit), .env.example. Shared package with Drizzle schema (copied from studio/schema.ts) and inferred types. Server with Express + health check, Drizzle client, placeholders for auth/tRPC/Stripe/email. Client with React 18 + Vite, Warm Stone CSS theme (OKLCH), i18next DE/EN, BrowserRouter. All 3 packages pass typecheck. drizzle-orm bumped to ^0.41.0 for better-auth compat. Old v1 Prisma/Keycloak code removed.

---

## 2026-03-16 — Phase 04: Stack Review

**Status:** done (sealed, approved)
**Output:** `studio/project-context.md` (SEALED)

Stack formalized: React 18 + Vite SPA, tRPC v11 + Express, PostgreSQL 16, Drizzle ORM (RLS), Better-Auth (Organization plugin), Stripe, Tailwind v4 + shadcn/ui + Aceternity UI, i18next, Vitest + Playwright, pnpm + Turborepo, Docker Compose. Added React Email + Framer Motion. Sealed by human.

---

## 2026-03-16 — Phase 03: Schema (Drizzle)

**Status:** done (approved)
**Output:** `studio/schema.ts`

16 tables, 8 enums, 14 RLS policies via pgPolicy(), 50+ indexes. Append-only credit ledger with FIFO index. Better-Auth compatible user/membership schema. Soft delete on audit-critical tables. Approved by human.

---

## 2026-03-15 — Phase 01: Spec (PRD)

**Status:** done (approved)
**Output:** `studio/spec.md` (updated for v2 stack)

Spec from v1 updated with new stack: Drizzle ORM (native RLS), Better-Auth (Organization plugin), shadcn/ui + Aceternity UI, Tailwind v4 @theme, Turborepo, mcp2cli, Playwright E2E. All features, actors, flows, and business rules unchanged. Approved by human.

---

## 2026-03-15 — Phase 02a+02b: Design Research & Architecture

**Status:** done (approved)
**Output:** `studio/research/design-analysis.md`, `studio/research/directions.md`, `studio/architecture.md`

Design research: 6 competitors analyzed, 3 directions proposed. Direction A "Warm Stone" selected by human. Architecture layout: 28 pages across 5 roles, component trees, 7 user flows, navigation structure, Warm Stone design integration. Approved by human.

---

## 2026-03-16 — Phase 02c: UI Prototype

**Status:** done (approved)
**Output:** `prototype/` (Next.js app with 28+ pages)

Built complete working prototype implementing Warm Stone design system:

**Design System:**
- Warm Stone color palette (earthy, anti-SaaS)
- Fraunces serif headings + Source Sans 3 body
- Sharp-cornered cards with 1px warm borders
- Top nav only (no sidebar)
- Pure Tailwind v4 with CSS custom properties

**Pages:** 28 total across 5 roles
- Public: 6 (studio landing, schedule, class detail, auth)
- Customer: 8 (bookings, credits, profile, GDPR)
- Teacher: 2 (schedule, attendance)
- Admin: 10 (dashboard, classes, schedule, customers, pricing, reports, settings)
- Super Admin: 4 (tenants, global settings)

**Interactive Features:**
- Role switcher in nav (demo mode)
- Booking flow with modals and toasts
- Cancel booking with confirmation
- Attendance marking (teacher)
- Form validation
- Tab navigation
- Full site navigation

**Build:** Next.js 16.1.6 (Turbopack) — all pages compiled successfully in 1.3s.

---
- 2026-03-15 20:18:47 · Write · studio/research/design-analysis.md
- 2026-03-15 20:20:34 · Write · studio/research/directions.md
- 2026-03-15 20:31:26 · Write · studio/lessons.md
- 2026-03-15 21:43:27 · Edit · /home/paulh/df5/studiobase/.claude/hooks/verify-completion.mjs
- 2026-03-15 21:58:07 · Write · studio/architecture.md
- 2026-03-15 21:58:13 · Edit · studio/task_plan.md
- 2026-03-15 21:58:18 · Edit · studio/task_plan.md
- 2026-03-15 21:59:19 · Write · /home/paulh/df5/studiobase/.claude/hooks/verify-completion.mjs
- 2026-03-15 21:59:25 · Edit · /home/paulh/df5/studiobase/.claude/hooks/verify-completion.mjs
- 2026-03-15 21:59:32 · Edit · /home/paulh/df5/studiobase/.claude/hooks/verify-completion.mjs
- 2026-03-15 21:59:36 · Edit · /home/paulh/df5/studiobase/.claude/hooks/verify-completion.mjs
- 2026-03-15 22:01:07 · Edit · studio/task_plan.md
- 2026-03-15 22:01:13 · Edit · studio/task_plan.md
- 2026-03-15 22:04:26 · Write · prototype/lib/mock-data.ts
- 2026-03-15 22:04:41 · Write · prototype/app/globals.css
- 2026-03-15 22:04:49 · Write · prototype/app/layout.tsx
- 2026-03-15 22:04:58 · Write · prototype/components/AuthProvider.tsx
- 2026-03-15 22:05:20 · Write · prototype/components/TopNav.tsx
- 2026-03-15 22:05:40 · Write · prototype/components/ClassCard.tsx
- 2026-03-15 22:05:43 · Write · prototype/components/Modal.tsx
- 2026-03-15 22:05:46 · Write · prototype/components/Toast.tsx
- 2026-03-15 22:06:03 · Write · prototype/components/BookingCard.tsx
- 2026-03-15 22:06:05 · Write · prototype/components/EmptyState.tsx
- 2026-03-15 22:06:08 · Write · prototype/components/SkeletonLoader.tsx
- 2026-03-15 22:06:10 · Write · prototype/components/KPICard.tsx
- 2026-03-15 22:06:25 · Write · prototype/components/DataTable.tsx
- 2026-03-15 22:06:28 · Write · prototype/components/FormField.tsx
- 2026-03-15 22:06:43 · Write · prototype/app/[tenantSlug]/page.tsx
- 2026-03-15 22:06:56 · Write · prototype/app/[tenantSlug]/schedule/page.tsx
- 2026-03-15 22:07:16 · Write · prototype/app/[tenantSlug]/class/[classId]/page.tsx
- 2026-03-15 22:07:41 · Write · prototype/app/auth/forgot-password/page.tsx
- 2026-03-15 22:07:51 · Write · prototype/app/auth/login/page.tsx
- 2026-03-15 22:07:58 · Write · prototype/app/auth/register/page.tsx
- 2026-03-15 22:08:09 · Write · prototype/app/bookings/page.tsx
- 2026-03-15 22:08:20 · Write · prototype/app/credits/page.tsx
- 2026-03-15 22:08:26 · Write · prototype/app/credits/buy/page.tsx
- 2026-03-15 22:08:32 · Write · prototype/app/credits/subscribe/page.tsx
- 2026-03-15 22:08:54 · Write · prototype/app/profile/page.tsx
- 2026-03-15 22:08:58 · Write · prototype/app/profile/export/page.tsx
- 2026-03-15 22:09:04 · Write · prototype/app/profile/delete/page.tsx
- 2026-03-15 22:09:19 · Write · prototype/app/teacher/schedule/page.tsx
- 2026-03-15 22:09:32 · Write · prototype/app/teacher/class/[sessionId]/page.tsx
- 2026-03-15 22:09:46 · Write · prototype/app/admin/page.tsx
- 2026-03-15 22:09:54 · Write · prototype/app/admin/classes/page.tsx
- 2026-03-15 22:10:05 · Write · prototype/app/admin/schedule/page.tsx
- 2026-03-15 22:10:09 · Write · prototype/app/admin/teachers/page.tsx
- 2026-03-15 22:10:14 · Write · prototype/app/admin/customers/page.tsx
- 2026-03-15 22:10:22 · Write · prototype/app/admin/pricing/packs/page.tsx
- 2026-03-15 22:10:26 · Write · prototype/app/admin/pricing/subscriptions/page.tsx
- 2026-03-15 22:10:39 · Write · prototype/app/admin/reports/page.tsx
- 2026-03-15 22:10:46 · Write · prototype/app/admin/waitlists/page.tsx
- 2026-03-15 22:10:56 · Write · prototype/app/admin/settings/page.tsx
- 2026-03-15 22:11:10 · Write · prototype/app/super/tenants/page.tsx
- 2026-03-15 22:11:14 · Write · prototype/app/super/settings/page.tsx
- 2026-03-15 22:11:21 · Write · prototype/app/page.tsx
- 2026-03-15 22:11:38 · Write · prototype/app/admin/customers/[customerId]/page.tsx
- 2026-03-15 22:11:54 · Write · prototype/app/bookings/[bookingId]/page.tsx
- 2026-03-15 22:12:08 · Write · prototype/app/super/tenants/[tenantId]/page.tsx
- 2026-03-15 22:12:15 · Write · prototype/app/super/tenants/new/page.tsx
- 2026-03-15 22:12:40 · Write · studio/task_plan.md
- 2026-03-15 22:13:32 · Write · studio/findings.md
- 2026-03-15 22:13:56 · Write · studio/progress.md
- 2026-03-15 22:15:07 · Write · prototype/README.md
- 2026-03-16 12:42:42 · Edit · studio/task_plan.md
- 2026-03-16 12:42:57 · Edit · studio/task_plan.md
- 2026-03-16 12:46:19 · Write · studio/schema.ts
- 2026-03-16 12:48:03 · Write · studio/findings.md
- 2026-03-16 12:48:20 · Write · studio/task_plan.md
- 2026-03-16 13:19:06 · Edit · studio/task_plan.md
- 2026-03-16 13:19:13 · Edit · studio/task_plan.md
- 2026-03-16 13:23:55 · Write · studio/task_plan.md
- 2026-03-16 13:25:11 · Write · studio/project-context.md
- 2026-03-16 13:25:24 · Write · studio/task_plan.md
- 2026-03-16 15:04:31 · Edit · studio/project-context.md
- 2026-03-16 15:04:36 · Edit · studio/task_plan.md
- 2026-03-16 15:04:42 · Edit · studio/task_plan.md
- 2026-03-16 15:04:48 · Edit · studio/task_plan.md
- 2026-03-16 15:07:05 · Write · /home/paulh/df5/studiobase/package.json
- 2026-03-16 15:07:07 · Write · /home/paulh/df5/studiobase/turbo.json
- 2026-03-16 15:07:10 · Write · /home/paulh/df5/studiobase/docker-compose.yml
- 2026-03-16 15:07:16 · Write · /home/paulh/df5/studiobase/tsconfig.base.json
- 2026-03-16 15:07:28 · Write · /home/paulh/df5/studiobase/.env.example
- 2026-03-16 15:07:35 · Write · /home/paulh/df5/studiobase/packages/shared/package.json
- 2026-03-16 15:08:01 · Write · /home/paulh/df5/studiobase/packages/shared/tsconfig.json
- 2026-03-16 15:08:01 · Write · src/index.ts
- 2026-03-16 15:08:05 · Write · src/types.ts
- 2026-03-16 15:08:06 · Write · src/validation.ts
- 2026-03-16 15:08:50 · Write · /home/paulh/df5/studiobase/packages/server/package.json
- 2026-03-16 15:08:58 · Write · /home/paulh/df5/studiobase/packages/server/drizzle.config.ts
- 2026-03-16 15:09:01 · Write · src/index.ts
- 2026-03-16 15:09:02 · Write · src/db/index.ts
- 2026-03-16 15:09:04 · Write · src/db/migrate.ts
- 2026-03-16 15:09:05 · Write · src/auth/index.ts
- 2026-03-16 15:09:06 · Write · src/trpc/index.ts
- 2026-03-16 15:09:06 · Write · src/stripe/index.ts
- 2026-03-16 15:09:07 · Write · src/email/index.ts
- 2026-03-16 15:09:08 · Write · src/middleware/index.ts
- 2026-03-16 15:09:25 · Write · /home/paulh/df5/studiobase/packages/server/tsconfig.json
- 2026-03-16 15:09:57 · Write · /home/paulh/df5/studiobase/packages/client/package.json
- 2026-03-16 15:09:59 · Write · /home/paulh/df5/studiobase/packages/client/tsconfig.json
- 2026-03-16 15:10:01 · Write · /home/paulh/df5/studiobase/packages/client/vite.config.ts
- 2026-03-16 15:10:03 · Write · /home/paulh/df5/studiobase/packages/client/index.html
- 2026-03-16 15:10:12 · Write · src/main.tsx
- 2026-03-16 15:10:13 · Write · src/App.tsx
- 2026-03-16 15:10:18 · Write · src/globals.css
- 2026-03-16 15:10:18 · Write · src/trpc/index.ts
- 2026-03-16 15:10:21 · Write · src/i18n/index.ts
- 2026-03-16 15:10:23 · Write · src/i18n/locales/en/common.json
- 2026-03-16 15:10:25 · Write · src/i18n/locales/de/common.json
- 2026-03-16 15:11:00 · Edit · /home/paulh/df5/studiobase/packages/server/package.json
- 2026-03-16 15:11:01 · Edit · /home/paulh/df5/studiobase/packages/server/package.json
- 2026-03-16 15:11:02 · Edit · /home/paulh/df5/studiobase/packages/shared/package.json
- 2026-03-16 15:11:40 · Edit · /home/paulh/df5/studiobase/package.json
- 2026-03-16 15:12:01 · Write · /home/paulh/df5/studiobase/packages/server/tsconfig.json
- 2026-03-16 15:12:20 · Edit · src/index.ts
- 2026-03-16 15:13:24 · Write · studio/task_plan.md
- 2026-03-16 15:32:01 · Edit · studio/task_plan.md
- 2026-03-16 15:32:06 · Edit · studio/task_plan.md
- 2026-03-16 15:35:22 · Write · /home/paulh/df5/studiobase/packages/server/drizzle.config.ts
- 2026-03-16 15:52:12 · Edit · studio/task_plan.md
- 2026-03-16 15:52:16 · Edit · studio/task_plan.md
- 2026-03-16 19:18:43 · Write · src/db/seed.ts
- 2026-03-16 19:18:50 · Edit · /home/paulh/df5/studiobase/packages/server/package.json
- 2026-03-16 19:18:58 · Edit · /home/paulh/df5/studiobase/package.json
- 2026-03-16 19:19:27 · Edit · src/db/seed.ts
- 2026-03-16 19:19:42 · Edit · src/db/seed.ts
- 2026-03-16 19:32:31 · Write · /home/paulh/.claude/plans/goofy-sauteeing-boole.md
- 2026-03-16 19:33:34 · Edit · src/globals.css
- 2026-03-16 19:33:36 · Edit · /home/paulh/df5/studiobase/packages/client/index.html
- 2026-03-16 19:33:38 · Edit · src/components/ui/Button.tsx
- 2026-03-16 19:33:40 · Edit · src/components/ui/Badge.tsx
- 2026-03-16 19:33:41 · Edit · src/components/CreditBalance.tsx
- 2026-03-16 19:33:42 · Edit · src/pages/public/StudioLandingPage.tsx
- 2026-03-16 19:33:43 · Edit · src/pages/public/StudioLandingPage.tsx
- 2026-03-16 19:33:47 · Edit · src/pages/credits/SubscribePage.tsx
- 2026-03-16 19:33:53 · Edit · src/pages/credits/BuyCreditsPage.tsx
- 2026-03-16 19:33:59 · Edit · src/pages/public/StudioLandingPage.tsx
- 2026-03-16 19:34:05 · Edit · src/globals.css
- 2026-03-16 19:37:10 · Edit · src/db/seed.ts
- 2026-03-16 19:41:43 · Edit · src/index.ts
- 2026-03-16 19:42:08 · Edit · /home/paulh/df5/studiobase/.env
- 2026-03-16 19:42:27 · Edit · src/stripe/client.ts
- 2026-03-16 19:42:56 · Edit · src/auth/index.ts
- 2026-03-16 19:43:35 · Edit · src/db/seed.ts
- 2026-03-16 19:44:44 · Edit · src/auth/index.ts
- 2026-03-16 19:45:05 · Edit · src/auth/index.ts
- 2026-03-16 19:45:12 · Edit · src/db/index.ts
- 2026-03-16 19:45:43 · Edit · src/schema.ts
- 2026-03-16 19:45:50 · Edit · src/schema.ts
- 2026-03-16 19:54:18 · Write · /home/paulh/df5/studiobase/.claude/rules/tdd-enforced.md
- 2026-03-16 19:54:29 · Edit · studio/lessons.md
- 2026-03-16 19:54:34 · Write · /home/paulh/.claude/projects/-home-paulh-df5-studiobase/memory/feedback_tdd_fullstack.md
- 2026-03-16 19:54:43 · Write · /home/paulh/.claude/projects/-home-paulh-df5-studiobase/memory/MEMORY.md
- 2026-03-16 20:03:11 · Write · /home/paulh/.claude/plans/goofy-sauteeing-boole.md
- 2026-03-16 20:05:04 · Edit · /home/paulh/df5/studiobase/packages/client/tsconfig.json
- 2026-03-16 20:05:10 · Write · src/trpc/index.ts
- 2026-03-16 20:05:16 · Write · /home/paulh/df5/studiobase/packages/client/vitest.config.ts
- 2026-03-16 20:05:38 · Write · src/__tests__/setup.ts
- 2026-03-16 20:06:14 · Write · /home/paulh/df5/studiobase/packages/client/tsconfig.json
- 2026-03-16 20:06:55 · Write · src/types/express.d.ts
- 2026-03-16 20:07:03 · Write · /home/paulh/df5/studiobase/packages/client/tsconfig.json
- 2026-03-16 20:07:46 · Edit · src/validation.ts
- 2026-03-16 20:08:51 · Write · src/trpc/routers/credit-pack.ts
- 2026-03-16 20:08:59 · Write · src/trpc/routers/subscription-tier.ts
- 2026-03-16 20:09:17 · Write · src/trpc/routers/admin.ts
- 2026-03-16 20:09:27 · Edit · src/trpc/routers/schedule.ts
- 2026-03-16 20:09:44 · Edit · src/trpc/routers/schedule.ts
- 2026-03-16 20:09:48 · Edit · src/trpc/routers/studio.ts
- 2026-03-16 20:09:55 · Edit · src/trpc/routers/studio.ts
- 2026-03-16 20:10:01 · Edit · src/trpc/routers/booking.ts
- 2026-03-16 20:10:08 · Write · src/pages/profile/ProfilePage.tsx
- 2026-03-16 20:10:12 · Edit · src/trpc/routers/booking.ts
- 2026-03-16 20:10:21 · Write · src/pages/profile/DataExportPage.tsx
- 2026-03-16 20:10:27 · Edit · src/trpc/routers/waitlist.ts
- 2026-03-16 20:10:33 · Edit · src/trpc/routers/tenant.ts
- 2026-03-16 20:10:36 · Write · src/pages/profile/DeleteAccountPage.tsx
- 2026-03-16 20:10:40 · Edit · src/trpc/routers/tenant.ts
- 2026-03-16 20:10:55 · Write · src/trpc/router.ts
- 2026-03-16 20:11:02 · Write · src/pages/bookings/MyBookingsPage.tsx
- 2026-03-16 20:11:23 · Edit · src/trpc/routers/booking.ts
- 2026-03-16 20:11:24 · Write · src/pages/credits/CreditsPage.tsx
- 2026-03-16 20:11:50 · Write · src/pages/admin/ClassManagementPage.tsx
- 2026-03-16 20:12:06 · Write · src/pages/admin/ScheduleManagementPage.tsx
- 2026-03-16 20:12:23 · Write · src/pages/admin/StudioSettingsPage.tsx
- 2026-03-16 20:12:45 · Write · src/pages/super/TenantDetailPage.tsx
- 2026-03-16 20:13:03 · Write · src/pages/super/CreateTenantPage.tsx
- 2026-03-16 20:13:31 · Write · src/pages/super/GlobalSettingsPage.tsx
- 2026-03-16 20:14:14 · Write · src/pages/admin/ScheduleEntryEditorPage.tsx
- 2026-03-16 20:15:58 · Write · src/pages/teacher/TeacherSchedulePage.tsx
- 2026-03-16 20:16:13 · Edit · src/components/ScheduleView.tsx
- 2026-03-16 20:16:20 · Edit · src/components/ScheduleView.tsx
- 2026-03-16 20:16:25 · Write · src/pages/teacher/ClassSessionPage.tsx
- 2026-03-16 20:16:35 · Write · src/pages/public/StudioLandingPage.tsx
- 2026-03-16 20:16:41 · Write · src/pages/admin/AdminDashboardPage.tsx
- 2026-03-16 20:16:56 · Write · src/pages/public/ClassSchedulePage.tsx
- 2026-03-16 20:16:57 · Write · src/pages/admin/TeacherManagementPage.tsx
- 2026-03-16 20:17:12 · Write · src/pages/admin/CustomerListPage.tsx
- 2026-03-16 20:17:16 · Write · src/pages/public/ClassDetailPage.tsx
- 2026-03-16 20:17:30 · Write · src/pages/bookings/BookingDetailPage.tsx
- 2026-03-16 20:17:32 · Write · src/pages/admin/CustomerDetailPage.tsx
- 2026-03-16 20:17:48 · Write · src/pages/credits/BuyCreditsPage.tsx
- 2026-03-16 20:17:55 · Write · src/pages/admin/CreditPackConfigPage.tsx
- 2026-03-16 20:18:00 · Write · src/pages/credits/SubscribePage.tsx
- 2026-03-16 20:18:14 · Write · src/pages/admin/SubscriptionTierConfigPage.tsx
- 2026-03-16 20:18:36 · Write · src/pages/admin/RevenueReportsPage.tsx
- 2026-03-16 20:19:03 · Write · src/pages/admin/WaitlistManagementPage.tsx
- 2026-03-16 20:19:19 · Write · src/pages/super/TenantListPage.tsx
- 2026-03-16 20:20:17 · Edit · src/pages/bookings/BookingDetailPage.tsx
- 2026-03-16 20:20:46 · Edit · src/pages/bookings/BookingDetailPage.tsx
- 2026-03-16 20:20:52 · Edit · src/pages/bookings/BookingDetailPage.tsx
- 2026-03-16 20:20:59 · Edit · src/pages/bookings/BookingDetailPage.tsx
- 2026-03-16 20:21:09 · Edit · src/pages/public/StudioLandingPage.tsx
- 2026-03-16 20:21:20 · Edit · src/pages/public/ClassSchedulePage.tsx
- 2026-03-16 20:21:30 · Edit · src/pages/public/ClassSchedulePage.tsx
- 2026-03-16 20:21:36 · Edit · src/pages/public/ClassSchedulePage.tsx
- 2026-03-16 20:21:42 · Edit · src/pages/public/ClassSchedulePage.tsx
- 2026-03-16 20:21:48 · Edit · src/pages/public/ClassSchedulePage.tsx
- 2026-03-16 20:21:54 · Edit · src/pages/super/GlobalSettingsPage.tsx
- 2026-03-16 20:22:05 · Edit · /home/paulh/df5/studiobase/packages/client/tsconfig.json
- 2026-03-16 20:22:11 · Edit · src/pages/super/GlobalSettingsPage.tsx
- 2026-03-16 20:23:26 · Edit · studio/task_plan.md
- 2026-03-16 20:23:32 · Edit · studio/task_plan.md
- 2026-03-16 20:26:01 · Edit · studio/task_plan.md
- 2026-03-16 20:26:06 · Edit · studio/task_plan.md
- 2026-03-16 20:26:33 · Edit · studio/findings.md
- 2026-03-16 20:39:42 · Write · src/__tests__/helpers/trpc-mock.ts
- 2026-03-16 20:39:53 · Write · /home/paulh/df5/studiobase/packages/client/playwright.config.ts
- 2026-03-16 20:39:55 · Write · src/pages/public/StudioLandingPage.test.tsx
- 2026-03-16 20:40:08 · Write · src/pages/public/ClassSchedulePage.test.tsx
- 2026-03-16 20:40:13 · Write · /home/paulh/df5/studiobase/packages/client/e2e/smoke.spec.ts
- 2026-03-16 20:40:20 · Write · src/pages/bookings/MyBookingsPage.test.tsx
- 2026-03-16 20:40:24 · Write · src/pages/profile/ProfilePage.test.tsx
- 2026-03-16 20:40:30 · Write · src/pages/bookings/BookingDetailPage.test.tsx
- 2026-03-16 20:40:31 · Write · src/pages/profile/DataExportPage.test.tsx
- 2026-03-16 20:40:38 · Write · src/pages/profile/DeleteAccountPage.test.tsx
- 2026-03-16 20:40:43 · Write · src/pages/credits/CreditsPage.test.tsx
- 2026-03-16 20:40:48 · Write · src/pages/teacher/TeacherSchedulePage.test.tsx
- 2026-03-16 20:40:54 · Write · src/pages/credits/BuyCreditsPage.test.tsx
- 2026-03-16 20:40:58 · Write · src/pages/teacher/ClassSessionPage.test.tsx
- 2026-03-16 20:41:05 · Write · src/pages/credits/SubscribePage.test.tsx
- 2026-03-16 20:41:07 · Write · src/pages/admin/AdminDashboardPage.test.tsx
- 2026-03-16 20:41:17 · Write · src/pages/admin/ClassManagementPage.test.tsx
- 2026-03-16 20:41:25 · Write · src/pages/admin/CustomerListPage.test.tsx
- 2026-03-16 20:41:34 · Write · src/pages/admin/StudioSettingsPage.test.tsx
- 2026-03-16 20:41:37 · Edit · src/pages/credits/SubscribePage.test.tsx
- 2026-03-16 20:41:49 · Write · src/pages/super/TenantListPage.test.tsx
- 2026-03-16 20:41:56 · Write · src/pages/super/CreateTenantPage.test.tsx
- 2026-03-16 20:42:17 · Edit · /home/paulh/df5/studiobase/packages/client/vitest.config.ts
- 2026-03-16 20:42:43 · Edit · studio/task_plan.md
- 2026-03-16 20:42:54 · Edit · studio/task_plan.md
- 2026-03-16 20:45:14 · Edit · src/stripe/webhook.ts
- 2026-03-16 20:45:30 · Edit · src/stripe/webhook.ts
- 2026-03-16 20:46:20 · Write · src/middleware/tenant-context.ts
- 2026-03-16 20:46:47 · Edit · src/services/credit-service.ts
- 2026-03-16 20:47:08 · Edit · src/auth/index.ts
- 2026-03-16 20:47:41 · Write · src/index.ts
- 2026-03-16 20:47:58 · Edit · src/middleware/encryption.ts
- 2026-03-16 20:48:15 · Edit · src/trpc/routers/studio.ts
- 2026-03-16 20:48:31 · Edit · src/trpc/routers/booking.ts
- 2026-03-16 20:49:00 · Edit · studio/task_plan.md
- 2026-03-16 20:49:09 · Edit · studio/task_plan.md
- 2026-03-16 20:50:01 · Write · src/trpc/routers/credit.ts
- 2026-03-16 20:50:15 · Edit · src/trpc/routers/schedule.ts
- 2026-03-16 20:50:35 · Edit · src/trpc/routers/schedule.ts
- 2026-03-16 20:50:40 · Edit · src/trpc/routers/schedule.ts
- 2026-03-16 20:50:54 · Edit · src/trpc/routers/booking.ts
- 2026-03-16 20:51:08 · Edit · src/services/waitlist-service.ts
- 2026-03-16 20:51:24 · Edit · src/services/waitlist-service.ts
- 2026-03-16 20:51:41 · Edit · src/stripe/webhook.ts
- 2026-03-16 20:51:48 · Edit · src/stripe/webhook.ts
- 2026-03-16 20:54:48 · Edit · src/middleware/encryption.ts
- 2026-03-16 20:55:00 · Edit · src/trpc/routers/user.ts
- 2026-03-16 20:55:05 · Edit · src/trpc/routers/user.ts
- 2026-03-16 20:55:11 · Edit · src/trpc/routers/user.ts
- 2026-03-16 20:55:22 · Edit · src/trpc/routers/admin.ts
- 2026-03-16 20:55:37 · Edit · src/trpc/routers/admin.ts
- 2026-03-16 20:55:49 · Edit · src/trpc/routers/admin.ts
- 2026-03-16 20:56:01 · Edit · src/trpc/routers/admin.ts
- 2026-03-16 20:56:11 · Edit · src/trpc/routers/booking.ts
- 2026-03-16 20:56:28 · Edit · src/trpc/routers/booking.ts
- 2026-03-16 20:56:35 · Edit · src/trpc/routers/booking.ts
- 2026-03-16 20:56:53 · Edit · src/trpc/routers/booking.ts
- 2026-03-16 20:57:04 · Edit · src/trpc/routers/booking.ts
- 2026-03-16 20:57:16 · Edit · src/trpc/routers/schedule.ts
- 2026-03-16 20:57:28 · Edit · src/trpc/routers/schedule.ts
- 2026-03-16 20:57:40 · Edit · src/trpc/routers/schedule.ts
- 2026-03-16 20:57:54 · Write · src/trpc/routers/waitlist.ts
- 2026-03-16 20:58:07 · Edit · src/services/booking-service.ts
- 2026-03-16 20:58:19 · Edit · src/services/booking-service.ts
- 2026-03-16 20:58:30 · Edit · src/services/booking-service.ts
- 2026-03-16 20:58:37 · Edit · src/services/booking-service.ts
- 2026-03-16 20:58:47 · Edit · src/services/booking-service.ts
- 2026-03-16 21:08:25 · Write · /home/paulh/df5/studiobase/TESTLOGINS.md
- 2026-03-16 21:08:46 · Edit · /home/paulh/df5/studiobase/.gitignore
