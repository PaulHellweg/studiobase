# StudioBase — Architecture

**Status:** approved
**Phase:** 02 / 03 / 04 complete

---

## Monorepo Structure

```
studiobase/
├── packages/
│   ├── server/          # Express + tRPC API server
│   │   ├── src/
│   │   │   ├── routers/       # tRPC routers (one file per domain)
│   │   │   ├── middleware/    # tenantProcedure, auth, error handling
│   │   │   ├── services/      # Business logic (pure functions, testable)
│   │   │   ├── lib/           # Prisma client, Stripe client, Keycloak verifier
│   │   │   └── index.ts       # Express app entry point
│   │   └── __tests__/
│   ├── client/          # React 18 + Vite SPA
│   │   ├── src/
│   │   │   ├── pages/         # Route-level components
│   │   │   ├── components/    # Shared UI components
│   │   │   ├── hooks/         # Custom React hooks (trpc, auth, i18n)
│   │   │   ├── lib/           # trpc client, keycloak-js init
│   │   │   └── i18n/          # Translation JSON files (de, en)
│   │   └── index.html
│   └── shared/          # Shared TypeScript types and Zod schemas
│       └── src/
│           ├── types/         # Inferred Prisma types, domain types
│           └── validation/    # Zod schemas for inputs (reused server + client)
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── docker-compose.yml
├── pnpm-workspace.yaml
└── package.json
```

---

## Database — 15 Tables

All core tables carry `tenantId` (UUID, non-nullable, indexed).

| Table | Purpose |
|---|---|
| `Tenant` | One row per studio. Stores name, slug, locale, plan. |
| `User` | Platform user. Links to Keycloak subject (`keycloakId`). Encrypted PII. |
| `TenantMembership` | Join table: User ↔ Tenant with role assignment. |
| `Studio` | Studio profile per tenant (address, description, logo). |
| `ClassType` | Template for a class (name, duration, capacity, credit cost). |
| `Teacher` | Teacher profile linked to a User. |
| `Schedule` | A recurring or one-off schedule entry (classType, teacher, time, status). |
| `ScheduleInstance` | A concrete occurrence of a Schedule on a specific date. |
| `Booking` | Customer booking of a ScheduleInstance. Status: confirmed/cancelled/attended. |
| `Waitlist` | Waitlist entries per ScheduleInstance. FIFO by `createdAt`. |
| `CreditPack` | Definition of a credit pack (quantity, price, expiry days). |
| `CreditLedger` | Append-only ledger of credit grants and debits per customer per tenant. |
| `Subscription` | Stripe subscription record linked to a customer and tenant. |
| `Payment` | Stripe payment/charge record. |
| `AuditLog` | Append-only event log. Purged after 90 days. |

---

## Auth — Keycloak PKCE Flow

```
Browser → Keycloak /authorize (PKCE)
        ← authorization_code
Browser → Keycloak /token
        ← access_token (JWT) + refresh_token
Browser → Express API (Authorization: Bearer <token>)
Express → verifyToken() → decode + verify signature
        → extract tenantId claim + roles claim
        → attach to tRPC context
```

### Custom Protocol Mappers (Keycloak realm config)
- `tenantId` — hardcoded per client registration or user attribute; injected into token
- `roles` — tenant-scoped roles array (`tenant_admin`, `teacher`, `customer`)

### Token Verification (server)
- `jwks-rsa` fetches Keycloak public keys on startup and caches them.
- Every request verifies signature, expiry, and issuer.
- Expired tokens → 401; missing `tenantId` → 403.

---

## tRPC Routers

| Router | Procedures | Access |
|---|---|---|
| `tenant` | `create`, `get`, `update`, `listMembers` | super_admin |
| `studio` | `get`, `update` | tenant_admin |
| `classType` | `create`, `list`, `update`, `archive` | tenant_admin |
| `schedule` | `create`, `list`, `update`, `publish`, `cancel` | tenant_admin |
| `booking` | `create`, `cancel`, `list`, `markAttended` | customer / teacher |
| `credit` | `getBalance`, `listLedger`, `grantManual` | customer / tenant_admin |
| `payment` | `createCheckoutSession`, `createPortalSession`, `webhook` | customer / stripe |
| `user` | `me`, `updateProfile`, `requestExport`, `requestDeletion` | authenticated |

---

## Key Middleware

### `tenantProcedure`
A tRPC middleware that:
1. Extracts `tenantId` from the verified JWT context.
2. Injects `tenantId` into every Prisma query via a Prisma client extension (`$allOperations` where clause).
3. Prevents any query from returning rows belonging to another tenant.

```typescript
// Conceptual — not production code
const tenantProcedure = publicProcedure.use(({ ctx, next }) => {
  if (!ctx.tenantId) throw new TRPCError({ code: 'FORBIDDEN' });
  return next({ ctx: { ...ctx, db: scopedPrismaClient(ctx.tenantId) } });
});
```

### Role Guards
Composable role guards built on `tenantProcedure`:
- `adminProcedure` — requires `tenant_admin` or `super_admin`
- `teacherProcedure` — requires `teacher`, `tenant_admin`, or `super_admin`
- `superAdminProcedure` — requires `super_admin` only

---

## Frontend Pages

| Page | Route | Roles |
|---|---|---|
| Public booking page | `/book` | anonymous |
| Customer dashboard | `/dashboard` | customer |
| Credit purchase | `/credits` | customer |
| Teacher portal | `/teacher` | teacher |
| Admin dashboard | `/admin` | tenant_admin |
| Studio settings | `/admin/studio` | tenant_admin |
| Class type management | `/admin/classes` | tenant_admin |
| Schedule calendar | `/admin/schedule` | tenant_admin |
| User management | `/admin/users` | tenant_admin |

---

## Credit FIFO Logic

Credit consumption order is determined by sorting `CreditLedger` grant rows by `expiresAt ASC NULLS LAST`, then `createdAt ASC`. Debits are applied against the oldest non-zero grant first. This logic lives in a pure service function (`consumeCredits`) covered by unit tests.

---

## Stripe Integration

- **Credit packs:** `payment.createCheckoutSession` → Stripe Checkout (one-time) → webhook `checkout.session.completed` → credit grant written to ledger.
- **Subscriptions:** `payment.createCheckoutSession` (mode=subscription) → Stripe Billing → webhook `invoice.paid` → monthly credit grant.
- **Refunds:** webhook `charge.refunded` → credits revoked (debit entry in ledger, status flag on Payment row).
- **Customer portal:** `payment.createPortalSession` → Stripe Billing Portal for self-service subscription management.

---

## Email (Waitlist Notifications)

- Dev: Mailpit (SMTP on `localhost:1025`), web UI on `localhost:8025`.
- Prod: configurable SMTP (SES, SendGrid).
- Nodemailer used server-side; templates are plain HTML with i18n string interpolation.

---

## Key Non-Functionals

| Concern | Approach |
|---|---|
| Tenant isolation | `tenantId` on all tables + Prisma client extension enforces at ORM layer |
| PII at rest | AES-256 encrypt/decrypt in Prisma middleware on `User.email`, `User.name`, `User.phone` |
| Audit trail | `AuditLog` written on every booking, credit, and payment mutation |
| DSGVO export | `user.requestExport` serialises all rows related to the user and emails a JSON link |
| Mobile-first | Tailwind responsive utilities; tested at 375px breakpoint |
| Localisation | All UI strings in `i18n/{de,en}.json`; locale resolved from user preference → tenant default → `de` |
