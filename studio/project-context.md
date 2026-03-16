# StudioBase v2 — Project Context

**Status:** SEALED
**Phase:** 04 (Stack Review) — approved 2026-03-16
**Date:** 2026-03-16

---

## Stack Decisions

### 1. Frontend Framework
- **Choice:** React 18 + Vite
- **Why:** Spec declares SPA architecture with tRPC. Prototype used Next.js but production app is React + Vite.
- **Alternatives considered:** Next.js (SSR benefits but rejected by spec), Remix (form-focused but adds complexity for SPA pattern)
- **Risk:** No SSR means limited SEO for public pages. Mitigated by simple public pages and static meta tags.

### 2. API Layer
- **Choice:** tRPC v11 over Express
- **Why:** Spec requires end-to-end type safety between React frontend and Node backend.
- **Alternatives considered:** REST + OpenAPI (less type safety), GraphQL (higher complexity)
- **Risk:** None. tRPC v11 is stable and ideal for TypeScript monorepos.

### 3. Database
- **Choice:** PostgreSQL 16
- **Why:** Spec requires native RLS for multi-tenant isolation. PostgreSQL 16 with pgPolicy support.
- **Alternatives considered:** SQLite (no RLS), MySQL (weaker RLS)
- **Risk:** None. PostgreSQL 16 is battle-tested for multi-tenant SaaS.

### 4. ORM
- **Choice:** Drizzle ORM
- **Why:** Spec declares Drizzle for native pgPolicy RLS. Schema already exists with 16 tables and RLS policies.
- **Alternatives considered:** Prisma (RLS via middleware is less robust), Kysely (more boilerplate)
- **Risk:** Smaller ecosystem than Prisma. Mitigated by growing adoption and TypeScript-first design.

### 5. Authentication
- **Choice:** Better-Auth with Organization plugin
- **Why:** Spec requires TypeScript-native auth with multi-tenant RBAC. No separate auth server.
- **Alternatives considered:** Auth.js v5 (no Organization plugin), Keycloak (heavy ops), Lucia (more manual code)
- **Risk:** Newer library with smaller community. Mitigated by TypeScript-first design matching our stack.

### 6. Tenant Isolation
- **Choice:** PostgreSQL Row-Level Security (RLS)
- **Why:** Spec mandates database-level tenant isolation via Drizzle pgPolicy and current_setting('app.current_tenant_id').
- **Alternatives considered:** ORM middleware (bypassed by direct DB access), schema-per-tenant (complex ops)
- **Risk:** RLS debugging complexity. Mitigated by comprehensive test suite with explicit tenant context.

### 7. Payments
- **Choice:** Stripe (Checkout + Billing)
- **Why:** Spec declares Stripe for credit packs (one-time) and subscriptions (recurring). Webhook-driven credit grants.
- **Alternatives considered:** Paddle (simpler EU compliance), LemonSqueezy (indie-friendly)
- **Risk:** Webhook reliability. Mitigated by idempotent handlers and retry logic.

### 8. Styling
- **Choice:** Tailwind CSS v4 + shadcn/ui + Aceternity UI
- **Why:** Spec declares this stack with @theme and OKLCH tokens. "Warm Stone" design direction.
- **Alternatives considered:** CSS Modules (less utility), Panda CSS (newer ecosystem)
- **Risk:** Tailwind v4 is newest major version. Lock to specific version and monitor.

### 9. i18n
- **Choice:** i18next + react-i18next
- **Why:** Spec requires DE + EN localization. i18next is mature with React integration.
- **Alternatives considered:** react-intl (heavier), Lingui (compile-time)
- **Risk:** None. Established library.

### 10. Testing
- **Choice:** Vitest (unit/integration) + Playwright (E2E)
- **Why:** Spec enforces TDD with Vitest. Playwright for browser automation.
- **Alternatives considered:** Jest (not Vite-native), Cypress (heavier)
- **Risk:** None. Modern, well-supported tooling.

### 11. Monorepo
- **Choice:** pnpm + Turborepo
- **Why:** Spec declares monorepo with server, client, shared packages. Turborepo for build caching.
- **Alternatives considered:** npm workspaces (no caching), Nx (heavier)
- **Risk:** None. Lightweight and effective.

### 12. Dev Infrastructure
- **Choice:** Docker Compose (PostgreSQL 16, Mailpit)
- **Why:** Spec requires no external services for local dev.
- **Alternatives considered:** None needed.
- **Risk:** None.

### 13. Email
- **Choice:** Nodemailer + @react-email/components
- **Why:** Mailpit for dev SMTP, SES/SendGrid for production. React Email for templating.
- **Alternatives considered:** Resend (API-only), Postmark (transactional)
- **Risk:** None. Standard approach.

---

## Monorepo Structure

```
studiobase/
├── package.json              # Root workspace config
├── pnpm-workspace.yaml       # pnpm workspace definition
├── turbo.json                # Turborepo pipeline config
├── docker-compose.yml        # PostgreSQL 16 + Mailpit
├── .env.example              # Environment template
├── packages/
│   ├── server/               # Express + tRPC + Drizzle + Better-Auth
│   │   ├── package.json
│   │   ├── src/
│   │   │   ├── index.ts          # Express server entry
│   │   │   ├── trpc/             # tRPC router definitions
│   │   │   ├── db/               # Drizzle client + migrations
│   │   │   ├── auth/             # Better-Auth config
│   │   │   ├── stripe/           # Stripe handlers + webhooks
│   │   │   ├── email/            # Nodemailer + templates
│   │   │   └── middleware/       # RLS tenant context, auth guards
│   │   └── drizzle.config.ts
│   ├── client/               # React + Vite SPA
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   ├── src/
│   │   │   ├── main.tsx          # App entry
│   │   │   ├── App.tsx           # Router + providers
│   │   │   ├── pages/            # Route components
│   │   │   ├── components/       # UI components (shadcn + custom)
│   │   │   ├── hooks/            # Custom React hooks
│   │   │   ├── lib/              # Utilities
│   │   │   ├── trpc/             # tRPC client setup
│   │   │   └── i18n/             # i18next config + translations
│   │   └── public/
│   └── shared/               # Shared types, schemas, utilities
│       ├── package.json
│       └── src/
│           ├── schema.ts         # Drizzle schema (from studio/)
│           ├── types.ts          # Shared TypeScript types
│           └── validation.ts     # Zod schemas for API
├── studio/                   # Planning files (spec, architecture, etc.)
└── prototype/                # Phase 02 throwaway prototype
```

---

## Package List

### Root (package.json)
```json
{
  "devDependencies": {
    "turbo": "^2.4.0",
    "typescript": "^5.6.0",
    "prettier": "^3.4.0",
    "eslint": "^9.0.0",
    "@typescript-eslint/eslint-plugin": "^8.0.0",
    "@typescript-eslint/parser": "^8.0.0"
  }
}
```

### packages/server
```json
{
  "dependencies": {
    "express": "^4.21.0",
    "@trpc/server": "^11.0.0",
    "drizzle-orm": "^0.36.0",
    "postgres": "^3.4.0",
    "better-auth": "^1.0.0",
    "@better-auth/organization": "^1.0.0",
    "stripe": "^17.0.0",
    "nodemailer": "^6.9.0",
    "@react-email/components": "^0.0.25",
    "zod": "^3.24.0",
    "dotenv": "^16.4.0",
    "helmet": "^8.0.0",
    "cors": "^2.8.0",
    "morgan": "^1.10.0"
  },
  "devDependencies": {
    "drizzle-kit": "^0.28.0",
    "@types/express": "^5.0.0",
    "@types/nodemailer": "^6.4.0",
    "@types/cors": "^2.8.0",
    "@types/morgan": "^1.9.0",
    "vitest": "^2.1.0",
    "tsx": "^4.19.0"
  }
}
```

### packages/client
```json
{
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-router-dom": "^7.0.0",
    "@trpc/client": "^11.0.0",
    "@trpc/react-query": "^11.0.0",
    "@tanstack/react-query": "^5.60.0",
    "i18next": "^24.0.0",
    "react-i18next": "^15.1.0",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/vite": "^4.0.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.5.0",
    "lucide-react": "^0.460.0",
    "@radix-ui/react-dialog": "^1.1.0",
    "@radix-ui/react-dropdown-menu": "^2.1.0",
    "@radix-ui/react-select": "^2.1.0",
    "@radix-ui/react-tabs": "^1.1.0",
    "@radix-ui/react-toast": "^1.2.0",
    "@radix-ui/react-slot": "^1.1.0",
    "framer-motion": "^11.11.0",
    "date-fns": "^4.1.0"
  },
  "devDependencies": {
    "vite": "^6.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "vitest": "^2.1.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/user-event": "^14.5.0",
    "jsdom": "^25.0.0",
    "@playwright/test": "^1.49.0"
  }
}
```

### packages/shared
```json
{
  "dependencies": {
    "zod": "^3.24.0",
    "drizzle-orm": "^0.36.0"
  }
}
```

---

## Environment Variables

```bash
# Database
DATABASE_URL=postgres://postgres:postgres@localhost:5432/studiobase

# Auth (Better-Auth)
BETTER_AUTH_SECRET=<32+ char random string>
BETTER_AUTH_URL=http://localhost:3001

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=noreply@studiobase.local

# For production SES/SendGrid:
# SMTP_HOST=email-smtp.eu-central-1.amazonaws.com
# SMTP_USER=<SES credentials>
# SMTP_PASS=<SES credentials>
# SMTP_SECURE=true
# SMTP_PORT=465

# Encryption (AES-256 for PII)
ENCRYPTION_KEY=<32-byte hex string>

# App
NODE_ENV=development
PORT=3001
CLIENT_URL=http://localhost:5173

# Logging
LOG_LEVEL=debug
```

---

## Docker Compose Services

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    ports:
      - '5432:5432'
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: studiobase
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U postgres']
      interval: 5s
      timeout: 5s
      retries: 5

  mailpit:
    image: axllent/mailpit:latest
    ports:
      - '1025:1025'  # SMTP
      - '8025:8025'  # Web UI
    environment:
      MP_SMTP_AUTH_ACCEPT_ANY: 1
      MP_SMTP_AUTH_ALLOW_INSECURE: 1

volumes:
  postgres_data:
```

---

## Build & Dev Commands

```bash
# Development
pnpm dev                    # Run all packages in dev mode (Turborepo)
pnpm dev --filter=server    # Server only
pnpm dev --filter=client    # Client only

# Build
pnpm build                  # Build all packages
pnpm build --filter=server  # Server only
pnpm build --filter=client  # Client only

# Database
pnpm db:generate            # Generate Drizzle migrations
pnpm db:migrate             # Run migrations
pnpm db:push                # Push schema directly (dev)
pnpm db:studio              # Open Drizzle Studio

# Testing
pnpm test                   # Run Vitest (all packages)
pnpm test:watch             # Watch mode
pnpm test:coverage          # Coverage report
pnpm test:e2e               # Playwright E2E tests

# Linting & Formatting
pnpm lint                   # ESLint
pnpm lint:fix               # ESLint with auto-fix
pnpm format                 # Prettier
pnpm typecheck              # TypeScript type checking

# Infrastructure
docker compose up -d        # Start PostgreSQL + Mailpit
docker compose down         # Stop services
docker compose logs -f      # View logs
```

---

## Risk Assessment

| Risk | Severity | Likelihood | Mitigation |
|------|----------|------------|------------|
| Drizzle ORM maturity | Medium | Low | Schema validated. Growing ecosystem. Lock versions. |
| Better-Auth adoption | Medium | Low | TypeScript-first design. Organization plugin covers RBAC. |
| RLS debugging complexity | Medium | Medium | Comprehensive test suite with explicit tenant context. |
| No SSR for public pages | Low | Low | Simple pages. Static meta tags. SEO impact minimal. |
| Tailwind v4 stability | Low | Low | Lock to specific version. Monitor changelog. |
| Stripe webhook reliability | Medium | Medium | Idempotent handlers. Retry logic. Event logging. |
| PII encryption performance | Low | Low | Encrypt only required fields. Index on ciphertext. |

---

## Conventions

### Code Style
- **TypeScript:** Strict mode enabled (`strict: true`)
- **ESLint:** Flat config (v9+) with TypeScript rules
- **Prettier:** Default config with single quotes
- **Import order:** External, internal, relative (enforced by ESLint)

### File Naming
- **Files:** kebab-case (`credit-ledger.ts`, `use-auth.ts`)
- **Components:** PascalCase (`ClassCard.tsx`, `BookingList.tsx`)
- **Test files:** Co-located (`credit-ledger.test.ts`) or `__tests__/`
- **Types:** PascalCase (`Booking`, `CreditLedgerEntry`)

### Component Structure
```tsx
// Imports
// Types/interfaces
// Component
// Styles (if any)
// Export
```

### API Structure (tRPC)
- **Routers:** Feature-based (`booking.ts`, `schedule.ts`, `payment.ts`)
- **Procedures:** Action-based (`booking.create`, `booking.cancel`)
- **Validation:** Zod schemas in shared package

### Git
- **Branch strategy:** `main` (production), `develop` (staging), `feature/*`, `fix/*`
- **Commits:** Conventional commits (`feat:`, `fix:`, `docs:`, `chore:`)
- **PR:** Require 1 approval, passing CI

### i18n
- **Namespace:** Feature-based (`common`, `booking`, `schedule`, `admin`)
- **Keys:** Dot notation (`booking.confirm.title`, `schedule.empty.message`)
- **Files:** `packages/client/src/i18n/locales/{de,en}/*.json`

---

## Design Tokens (Warm Stone)

From Phase 02a design direction:

```css
@theme {
  /* Colors (OKLCH) */
  --color-background: oklch(0.98 0.01 85);
  --color-surface: oklch(0.96 0.02 85);
  --color-primary: oklch(0.35 0.08 50);
  --color-accent: oklch(0.55 0.15 35);
  --color-success: oklch(0.55 0.1 145);
  --color-border: oklch(0.85 0.03 75);
  --color-text: oklch(0.25 0.02 50);
  --color-text-muted: oklch(0.55 0.02 50);

  /* Typography */
  --font-heading: 'Fraunces', serif;
  --font-body: 'Source Sans 3', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  /* Spacing */
  --spacing-section: 2rem;
  --max-width-content: 72rem;
}
```

---

## Phase 05 Entry Criteria

Before proceeding to Phase 05 (Scaffold + TDD Build):

1. This document must be approved (status: SEALED)
2. All stack choices confirmed
3. No unresolved risks flagged
4. Package versions locked
5. Environment template complete
