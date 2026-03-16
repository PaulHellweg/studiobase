# StudioBase v2 — Task Plan

project: StudioBase
current_phase: complete
current_status: done

## Phase Status (for gate-phase hook)
phase_01: done
phase_02: done
phase_03: done
phase_04: done

## Pipeline Progress

- [x] Phase 01: Spec (PRD) — done (v2 stack approved)
- [x] Phase 02a: Design Research — done (Direction A: Warm Stone)
- [x] Phase 02b: Architecture — done (Warm Stone, 28 pages, approved)
- [x] Phase 02c: UI Prototype — done (approved)
- [x] Phase 03: Schema (Drizzle) — done (approved)
- [x] Phase 04: Stack Review — done (sealed, approved)
- [x] Phase 05a: Scaffold — done (approved)
- [x] Phase 05b: TDD Build — done (backend only)
- [x] Phase 05b-redo: Wire Frontend to Backend — done (approved)
- [x] Phase 06: Test Suite (Vitest + Playwright) — done (110 tests: 38 server + 72 client)
- [x] Phase 07: Bug Hunt — done (findings merged with security audit)
- [x] Phase 08: Code Review — done (findings merged with security audit)
- [x] Phase 09: Security Audit (OWASP) — done (3 CRITICAL, 5 HIGH, 5 MEDIUM fixed)

## Phase 05a Scaffold Summary

### Root Config
- [x] pnpm-workspace.yaml (preserved)
- [x] turbo.json (new — Turborepo pipeline)
- [x] tsconfig.base.json (new — shared TS config)
- [x] docker-compose.yml (updated — removed Keycloak, added healthcheck)
- [x] .env.example (updated — Better-Auth, encryption key, logging)
- [x] package.json (updated — Turborepo scripts, packageManager field)

### packages/shared
- [x] package.json (ESM, drizzle-orm ^0.41.0, zod ^3.24.0)
- [x] tsconfig.json (extends base)
- [x] src/schema.ts (copied from studio/schema.ts — 16 tables, 8 enums, RLS)
- [x] src/types.ts (re-exports inferred types from schema)
- [x] src/index.ts (barrel export)
- [x] src/validation.ts (placeholder)

### packages/server
- [x] package.json (ESM, Express, tRPC, Drizzle, Better-Auth, Stripe, etc.)
- [x] tsconfig.json (extends base, paths to shared)
- [x] drizzle.config.ts (points to shared schema)
- [x] src/index.ts (Express server with helmet, cors, morgan, health check)
- [x] src/db/index.ts (Drizzle client with postgres.js)
- [x] src/db/migrate.ts (migration runner)
- [x] src/auth/index.ts (placeholder — Phase 05b)
- [x] src/trpc/index.ts (placeholder — Phase 05b)
- [x] src/stripe/index.ts (placeholder — Phase 05b)
- [x] src/email/index.ts (placeholder — Phase 05b)
- [x] src/middleware/index.ts (placeholder — Phase 05b)

### packages/client
- [x] package.json (ESM, React 18, Vite, TanStack Query, i18next, Radix, etc.)
- [x] tsconfig.json (extends base, jsx, noEmit)
- [x] vite.config.ts (React, Tailwind v4, @ alias, /api proxy)
- [x] index.html (Google Fonts: Fraunces, Source Sans 3, JetBrains Mono)
- [x] src/main.tsx (StrictMode, i18n init)
- [x] src/App.tsx (BrowserRouter with empty Routes)
- [x] src/globals.css (Warm Stone @theme with OKLCH tokens)
- [x] src/i18n/index.ts (i18next with DE/EN)
- [x] src/i18n/locales/en/common.json (English strings)
- [x] src/i18n/locales/de/common.json (German strings)
- [x] src/trpc/index.ts (placeholder — Phase 05b)
- [x] src/pages/.gitkeep
- [x] src/components/.gitkeep
- [x] src/hooks/.gitkeep
- [x] src/lib/.gitkeep

### Verification
- [x] pnpm install — all deps installed
- [x] pnpm typecheck — all 3 packages pass (0 errors)
- [ ] docker compose up -d — requires Docker (run manually)
- [ ] drizzle-kit push — requires running PostgreSQL (run after Docker)

### Notes
- drizzle-orm bumped to ^0.41.0 (better-auth peer dep requires >=0.41.0)
- drizzle-kit bumped to ^0.31.4 (better-auth peer dep requires >=0.31.4)
- One non-blocking peer dep warning: better-call wants zod ^4.0.0 but we use zod 3.x (compatible at runtime)
- Old v1 Prisma/Keycloak code removed from server and client

## Stack Changes from v1

- Prisma 5 → **Drizzle ORM** (native RLS, TypeScript-first)
- Keycloak 24 → **Better-Auth** (Organization plugin, lighter ops)
- No component library → **shadcn/ui + Aceternity UI**
- No design system → **Tailwind v4 @theme + OKLCH tokens**
- pnpm workspaces → **+ Turborepo** (build caching)
- No MCP → **mcp2cli** (GitHub, DB, Docs, Browser)
- Prisma middleware tenant isolation → **PostgreSQL RLS** (DB-level)
- Vitest → **Vitest + Playwright** (E2E)
