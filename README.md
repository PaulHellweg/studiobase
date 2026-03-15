# StudioBase

Multi-tenant SaaS booking platform for class-based businesses (yoga, pilates, barre, fitness boutiques, dance schools). Replaces bSport.

## Features

- **Multi-Tenant** — Row-level isolation, every query scoped by tenantId from Keycloak token
- **Schedule Management** — Recurring templates, instance overrides, conflict detection
- **Online Booking** — Public booking page at `/:slug/book`, 3-click booking flow
- **Credit System** — FIFO consumption, configurable packages, full audit trail
- **Stripe Payments** — Checkout + Subscriptions, webhook processing
- **Teacher Portal** — Personal calendar, attendance marking, earnings
- **Waitlist** — FIFO promotion on cancellation, auto credit deduction
- **DSGVO** — Data export, account deletion, PII encryption at rest
- **i18n** — German + English from day 1

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite 5 + TypeScript |
| API | tRPC v11 (type-safe, modular monolith) |
| Backend | Node.js 20 + Express |
| Auth | Keycloak 24 (Docker, PKCE) |
| Database | PostgreSQL 16 |
| ORM | Prisma 5 |
| Payments | Stripe SDK |
| Styling | Tailwind CSS 3 |
| i18n | i18next + react-i18next |
| Testing | Vitest |
| Email | Resend (prod) / Mailpit (dev) |

## Quick Start

```bash
# Start infrastructure
docker compose up -d

# Install dependencies
pnpm install

# Push database schema
pnpm db:push

# Seed test data
pnpm db:seed

# Start dev servers
pnpm dev
# Server: http://localhost:3001
# Client: http://localhost:5173
# Keycloak: http://localhost:8080 (admin/admin)
# Mailpit: http://localhost:8025
```

## Test Users (Keycloak)

| Email | Password | Role | Tenant |
|-------|----------|------|--------|
| admin@studiobase.dev | password | super_admin | — |
| owner@halenow.dev | password | tenant_admin | Hale Now |
| teacher@halenow.dev | password | teacher | Hale Now |
| customer@test.dev | password | customer | Hale Now |

## Roles

| Role | Can | Cannot |
|------|-----|--------|
| super_admin | Create/manage tenants, platform settings | — |
| tenant_admin | Manage own studios, teachers, classes, schedules, credits, customers | Access other tenants |
| teacher | View own schedule, mark attendance, view earnings | Modify schedules |
| customer | Book classes, buy credits, cancel bookings | Access admin views |

## Project Structure

```
studiobase/
├── docker-compose.yml          ← Postgres + Keycloak + Mailpit
├── keycloak/                   ← Realm import (roles, mappers, test users)
├── packages/
│   ├── server/                 ← Express + tRPC + Prisma
│   │   ├── prisma/schema.prisma
│   │   └── src/routers/        ← 8 tRPC routers
│   ├── client/                 ← React SPA + tRPC client
│   │   └── src/pages/          ← Admin UI pages
│   └── shared/                 ← Types + Zod validation
└── studio/                     ← DF Studio pipeline artifacts
```

## Milestone Status

| # | Milestone | Status |
|---|-----------|--------|
| 0 | Foundation (monorepo, Docker, Prisma, Keycloak, tRPC) | Done |
| 1 | Database seed (tenant, studios, classes, packages, users) | Done |
| 2 | Admin UI (Dashboard, Studios, Classes, Schedule, Customers, Plans) | Done |
| 3 | Public booking page + credit purchase | Done |
| 4 | Teacher portal + attendance | Done |
| 5 | Stripe live integration + email notifications | In Progress |

## Security

- Row-level tenant isolation via Keycloak tenantId claim
- PII encrypted at rest (email, name, phone)
- Stripe webhook signature verification
- Rate limiting on auth + booking + payment routes
- OWASP Top 10 reviewed
- DSGVO: data export + deletion endpoints

## License

MIT
