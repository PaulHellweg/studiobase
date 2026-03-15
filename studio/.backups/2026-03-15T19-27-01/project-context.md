# SEALED — Phase 04 approved

This file is the authoritative stack reference for Phase 05 (Build).
Do not modify without re-opening Phase 04 and obtaining a new approval.

---

## Project

**Name:** StudioBase
**Type:** Multi-tenant SaaS booking platform for class-based businesses
**Monorepo root:** `studiobase/`

---

## Tech Stack

### Frontend
| Item | Choice |
|---|---|
| Framework | React 18 |
| Build tool | Vite 5 |
| Styling | Tailwind CSS 3 |
| Routing | React Router 6 |
| API client | tRPC v11 client (`@trpc/react-query`) |
| Auth client | `keycloak-js` 24 |
| i18n | i18next + react-i18next |
| State | TanStack Query (via tRPC) — no global store |

### Backend
| Item | Choice |
|---|---|
| Runtime | Node.js 20 LTS |
| HTTP server | Express 4 |
| API layer | tRPC v11 (`@trpc/server`) |
| ORM | Prisma 5 |
| Database | PostgreSQL 16 |
| Auth server | Keycloak 24 (PKCE, custom protocol mappers) |
| JWT verification | `jwks-rsa` + `jsonwebtoken` |
| Payments | Stripe SDK (`stripe` npm package) |
| Email | Nodemailer (dev: Mailpit SMTP; prod: configurable) |
| Validation | Zod 3 (shared with client via `packages/shared`) |

### Shared Package
| Item | Choice |
|---|---|
| Language | TypeScript 5 (strict mode) |
| Schemas | Zod 3 |
| Types | Inferred from Prisma + Zod |

### Testing
| Item | Choice |
|---|---|
| Test runner | Vitest |
| Assertions | Vitest built-in (`expect`) |
| Mocking | `vi.mock`, `vi.fn()` |
| DB in tests | Prisma against a test PostgreSQL DB (separate schema) |
| Coverage | `@vitest/coverage-v8` |

### Developer Infrastructure
| Item | Choice |
|---|---|
| Package manager | pnpm 9 (workspaces) |
| Containerisation | Docker Compose |
| Linting | ESLint + `@typescript-eslint` |
| Formatting | Prettier |

---

## Docker Compose Services

| Service | Image | Port (host) | Purpose |
|---|---|---|---|
| `postgres` | `postgres:16` | 5432 | Primary database |
| `keycloak` | `quay.io/keycloak/keycloak:24` | 8080 | Auth server |
| `mailpit` | `axllent/mailpit` | 1025 (SMTP), 8025 (UI) | Local email |

---

## Environment Variables

### Server (`packages/server/.env`)

```env
# Database
DATABASE_URL=postgresql://studiobase:studiobase@localhost:5432/studiobase

# Keycloak
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=studiobase
KEYCLOAK_CLIENT_ID=studiobase-server

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# PII Encryption
ENCRYPTION_KEY=<32-byte hex>

# Email (dev — Mailpit)
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_FROM=noreply@studiobase.local

# Server
PORT=3000
NODE_ENV=development
```

### Client (`packages/client/.env`)

```env
VITE_API_URL=http://localhost:3000
VITE_KEYCLOAK_URL=http://localhost:8080
VITE_KEYCLOAK_REALM=studiobase
VITE_KEYCLOAK_CLIENT_ID=studiobase-client
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### Test (`packages/server/.env.test`)

```env
DATABASE_URL=postgresql://studiobase:studiobase@localhost:5432/studiobase_test
NODE_ENV=test
ENCRYPTION_KEY=<32-byte hex — different from dev>
```

---

## Monorepo Package Names

| Package | `name` in package.json |
|---|---|
| server | `@studiobase/server` |
| client | `@studiobase/client` |
| shared | `@studiobase/shared` |

---

## Key Architectural Decisions

1. **tRPC over REST** — end-to-end type safety without code generation step; routers map cleanly to domain boundaries.
2. **Prisma client extension for tenant scoping** — `$allOperations` interceptor appends `tenantId` to every `where` clause; eliminates the possibility of accidental cross-tenant queries.
3. **Append-only credit ledger** — never update credit records; only append grant and debit entries. Balance is computed as `SUM(amount)`. Preserves full audit history.
4. **Keycloak PKCE (no client secret in browser)** — `keycloak-js` handles token refresh transparently; SPA never holds a client secret.
5. **PII encryption in Prisma middleware** — transparent to routers and services; encryption boundary is the ORM layer.
6. **Vitest over Jest** — native ESM support, faster cold start, compatible with Vite's transform pipeline.
