# StudioBase — Product Requirements Specification

**Status:** approved
**Phase:** 01 complete

---

## Overview

StudioBase is a multi-tenant SaaS booking platform designed for class-based businesses such as yoga studios, dance schools, martial arts gyms, and fitness centres. Each tenant operates a fully isolated instance of the platform under a shared infrastructure.

---

## Actors

| Role | Description |
|---|---|
| `super_admin` | Platform operator. Manages tenants, billing, and global configuration. |
| `tenant_admin` | Studio owner or manager. Manages their own studio, classes, schedules, teachers, and customers. |
| `teacher` | Leads classes. Views own schedule, manages attendance, accesses teacher portal. |
| `customer` | End user. Books classes, manages credits and subscriptions, views history. |

---

## Core Features

### Schedule Management
- Tenant admins create and manage recurring and one-off class schedules.
- Classes have capacity limits, durations, locations, and assigned teachers.
- Schedules can be published or held in draft state before going live.

### Online Booking
- Customers browse available classes via a public-facing booking page (no login required to browse).
- Booking requires authentication. Customers book using credits or active subscriptions.
- FIFO credit consumption: oldest credits consumed first.
- Bookings can be cancelled up to a configurable window (e.g. 24 hours before class). Cancellation returns credits to the customer.

### Credit and Subscription System
- Credits are purchased in packs (e.g. 10-class pack) or via recurring subscriptions (monthly, weekly).
- Credits are tenant-scoped and non-transferable between tenants.
- Subscription management: pause, cancel, resume (Stripe Billing portal).
- Credit expiry is configurable per pack/subscription tier.
- FIFO expiry: credits with the earliest expiry date are consumed first.

### Stripe Payments
- Credit packs: one-time Stripe Checkout sessions.
- Subscriptions: Stripe Billing with webhook-driven credit grants.
- Refunds are handled via Stripe; credits are revoked on refund.
- Tenant admins can view revenue reports scoped to their tenant.

### Teacher Portal
- Teachers view their upcoming and past classes.
- Teachers mark attendance and add session notes.
- Teachers cannot view financial data or other teachers' schedules.

### Waitlist
- When a class is full, customers can join a waitlist.
- If a booking is cancelled, the first customer on the waitlist is automatically offered the spot (email notification via Mailpit in dev, SES/SendGrid in prod).
- Waitlist position is FIFO.

---

## Security and Compliance

### Row-Level Tenant Isolation
- Every core database table carries a `tenantId` column.
- All queries are scoped by `tenantId` extracted from the Keycloak JWT claim.
- No cross-tenant data leakage is architecturally possible at the query layer.

### Authentication
- Keycloak 24 handles all authentication via PKCE OAuth2 flow.
- Custom protocol mappers inject `tenantId` and `roles` into the JWT.
- The server validates tokens on every request; no session state is held server-side.

### PII Encryption at Rest
- Customer names, email addresses, and phone numbers are encrypted at rest using AES-256.
- Encryption keys are stored in environment variables (rotatable).
- Encrypted fields are decrypted only at the application layer, never in SQL.

### DSGVO (GDPR) Compliance
- Customers can request full data export (JSON).
- Customers can request account deletion; all PII is purged within 30 days.
- Data processing agreements (DPA) are managed per tenant at the super_admin level.
- Audit log retains events for 90 days, then is purged automatically.

---

## Internationalisation

- Default languages: German (DE) and English (EN).
- i18next handles all UI strings.
- Date and currency formatting is locale-aware.
- Language is selectable per user; tenant admins set the default locale for their studio's public page.

---

## Technical Constraints

### Development Environment
- Docker Compose provides: PostgreSQL 16, Keycloak 24, Mailpit (local SMTP).
- No external services required to run locally.

### Quality
- TDD enforced in Phase 05 (RED-GREEN-REFACTOR with Vitest).
- All business logic covered by unit tests before shipping.

### UX
- Mobile-first responsive design.
- Tailwind CSS utility classes throughout.
- Public booking page is accessible without JavaScript (progressive enhancement where feasible).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| API | tRPC v11 over Express |
| Auth | Keycloak 24 (PKCE) |
| Database | PostgreSQL 16 |
| ORM | Prisma 5 |
| Payments | Stripe (Checkout + Billing) |
| Styling | Tailwind CSS |
| i18n | i18next |
| Testing | Vitest |
| Dev infra | Docker Compose |

---

## Out of Scope (v1)

- Native mobile apps
- Multi-location per tenant (single location per studio in v1)
- Custom domain per tenant (subdomain routing only)
- Video/streaming classes
