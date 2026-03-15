# StudioBase — Progress Log

---

## 2026-03-15 — Phase 01: Prompt & PRD

**Status:** done
**Output:** `studio/spec.md`

Requirements provided as a comprehensive document covering actors, core features (schedule management, online booking, credit/subscription system, Stripe payments, teacher portal, waitlist), security (tenant isolation, PII encryption, DSGVO), i18n (DE + EN), and tech stack. Spec written directly from source material. No ambiguities surfaced. Gate passed.

---

## 2026-03-15 — Phase 02: Design Review

**Status:** done
**Output:** UI prototype approved (not materialised as files; pages and routes documented in `architecture.md`)

Frontend pages defined: public booking page, customer dashboard, credit purchase, teacher portal, admin dashboard, studio settings, class type management, schedule calendar, user management. Mobile-first constraint confirmed. Tailwind + React Router 6 chosen for client. Gate passed.

---

## 2026-03-15 — Phase 03: Datenmodell

**Status:** done
**Output:** 15-table schema approved (documented in `architecture.md`; Prisma schema to be written in Phase 05)

Tables: Tenant, User, TenantMembership, Studio, ClassType, Teacher, Schedule, ScheduleInstance, Booking, Waitlist, CreditPack, CreditLedger, Subscription, Payment, AuditLog. TenantId on all core tables. Append-only credit ledger pattern confirmed. FIFO credit consumption order decided. Gate passed.

---

## 2026-03-15 — Phase 04: Stack Review

**Status:** done
**Output:** `studio/project-context.md` (SEALED)

Stack confirmed as pre-decided. Key architectural decisions recorded: tRPC over REST, Prisma client extension for tenant scoping, append-only credit ledger, Keycloak PKCE, PII encryption in Prisma middleware, Vitest over Jest. Environment variables specified for server, client, and test environments. Gate passed.

---

## 2026-03-15 — Phase 05: Build — started

**Status:** in_progress
**Current milestone:** 0 — Foundation

Tasks in progress:
- Project scaffolding (pnpm monorepo)
- Docker Compose (Postgres 16 + Keycloak 24 + Mailpit)
- Prisma schema (all 15 tables)
- Keycloak realm config
- tRPC server setup with tenant middleware
- Auth integration

TDD cycle (RED-GREEN-REFACTOR) enforced from first line of application code.
- 2026-03-15 12:02:44 · Write · studio/task_plan.md
- 2026-03-15 12:58:14 · Write · /home/paulh/df5/studiobase/packages/server/prisma/seed.ts
- 2026-03-15 12:58:27 · Write · /home/paulh/df5/studiobase/packages/server/package.json
- 2026-03-15 12:59:34 · Write · src/App.tsx
- 2026-03-15 13:00:11 · Write · src/pages/Dashboard.tsx
- 2026-03-15 13:01:04 · Write · src/pages/Studios.tsx
- 2026-03-15 13:01:49 · Write · src/pages/ClassTypes.tsx
- 2026-03-15 13:03:10 · Write · src/pages/Schedule.tsx
- 2026-03-15 13:04:01 · Write · src/pages/Customers.tsx
- 2026-03-15 13:04:51 · Write · src/pages/Plans.tsx
- 2026-03-15 13:05:20 · Write · src/index.css
- 2026-03-15 13:06:00 · Edit · src/validation.ts
- 2026-03-15 13:07:20 · Write · app/README.md
- 2026-03-15 13:07:47 · Write · /home/paulh/df5/studiobase/README.md
- 2026-03-15 13:10:01 · Write · src/components/WeeklyCalendar.tsx
- 2026-03-15 13:10:29 · Write · src/components/ParticipantList.tsx
- 2026-03-15 13:11:14 · Write · src/pages/BookingPage.tsx
- 2026-03-15 13:11:49 · Write · src/pages/MyBookings.tsx
- 2026-03-15 13:12:24 · Write · src/pages/CreditShop.tsx
- 2026-03-15 13:13:10 · Write · src/pages/TeacherPortal.tsx
- 2026-03-15 13:13:45 · Write · src/App.tsx
- 2026-03-15 13:14:10 · Edit · src/components/ParticipantList.tsx
- 2026-03-15 13:14:11 · Edit · src/components/ParticipantList.tsx
- 2026-03-15 13:14:12 · Edit · src/pages/TeacherPortal.tsx
- 2026-03-15 13:16:14 · Write · src/lib/stripe.ts
- 2026-03-15 13:16:36 · Write · src/lib/credits.ts
- 2026-03-15 13:17:07 · Write · src/lib/emailTemplates.ts
- 2026-03-15 13:17:18 · Write · src/lib/email.ts
- 2026-03-15 13:17:53 · Write · src/routers/payment.ts
- 2026-03-15 13:17:58 · Edit · src/index.ts
- 2026-03-15 13:18:05 · Edit · src/index.ts
- 2026-03-15 13:18:30 · Edit · src/routers/booking.ts
- 2026-03-15 13:18:34 · Edit · src/routers/booking.ts
- 2026-03-15 13:18:48 · Edit · src/routers/booking.ts
- 2026-03-15 13:19:16 · Edit · src/routers/booking.ts
- 2026-03-15 13:19:34 · Edit · src/pages/CreditShop.tsx
- 2026-03-15 13:19:40 · Edit · src/pages/CreditShop.tsx
- 2026-03-15 13:19:57 · Edit · src/lib/stripe.ts
- 2026-03-15 13:20:17 · Edit · src/lib/emailTemplates.ts
- 2026-03-15 13:20:33 · Edit · src/lib/emailTemplates.ts
- 2026-03-15 13:20:36 · Edit · src/lib/emailTemplates.ts
- 2026-03-15 13:20:40 · Edit · src/lib/emailTemplates.ts
- 2026-03-15 13:20:43 · Edit · src/lib/emailTemplates.ts
- 2026-03-15 13:20:52 · Edit · src/routers/payment.ts
- 2026-03-15 13:21:51 · Write · studio/task_plan.md
