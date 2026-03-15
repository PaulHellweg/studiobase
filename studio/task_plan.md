# StudioBase — Task Plan

current_phase: 5
current_status: in_progress
phase_02: done
phase_03: done
phase_04: done

---

## Phase Status

| Phase | Name | Status |
|---|---|---|
| 01 | Prompt & PRD | done |
| 02 | Design Review | done |
| 03 | Datenmodell | done |
| 04 | Stack Review | done |
| 05 | Build | in_progress |

---

## Phase 05 — Build

### Milestone 0: Foundation

- [ ] Project scaffolding — pnpm monorepo with `packages/server`, `packages/client`, `packages/shared`
- [ ] Docker Compose — services: `postgres` (16), `keycloak` (24), `mailpit`
- [ ] Prisma schema — all 15 tables with tenantId, indexes, relations
- [ ] Keycloak realm config — realm export JSON with client, protocol mappers, roles
- [ ] tRPC server setup — Express app, tRPC adapter, context factory, error formatter
- [ ] Auth integration — JWT verification middleware, tenantProcedure, role guards

### Milestone 1: Core Booking Flow

- [ ] `classType` router + service (CRUD)
- [ ] `schedule` router + service (CRUD, publish, cancel)
- [ ] `booking` router + service (create, cancel, FIFO credit consumption)
- [ ] `waitlist` router + service (join, leave, auto-promote on cancellation)
- [ ] Public booking page (React, no auth required to browse)
- [ ] Customer dashboard (upcoming bookings, credit balance)

### Milestone 2: Payments

- [ ] Stripe Checkout session (credit packs + subscriptions)
- [ ] Stripe webhook handler (`checkout.session.completed`, `invoice.paid`, `charge.refunded`)
- [ ] Credit ledger service (grant, debit, FIFO balance query)
- [ ] Stripe Billing portal session
- [ ] Credit purchase page (React)

### Milestone 3: Admin & Teacher Portals

- [ ] Admin dashboard (stats, quick links)
- [ ] Studio settings page
- [ ] Class type management page
- [ ] Schedule calendar page (week view)
- [ ] User management page
- [ ] Teacher portal (upcoming classes, attendance marking)

### Milestone 4: Compliance & Polish

- [ ] PII encryption Prisma middleware
- [ ] AuditLog writes on all booking/credit/payment mutations
- [ ] DSGVO export endpoint
- [ ] DSGVO deletion endpoint
- [ ] i18n wiring — all UI strings externalised (de + en)
- [ ] E2E smoke tests

---

## Notes

- TDD enforced: every service function gets a failing test (RED) before implementation (GREEN).
- Test file naming: co-located `*.test.ts` in `__tests__/` directories.
- Do not write application code outside the scaffolded monorepo structure.
- Re-read this file before every file write.
