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
