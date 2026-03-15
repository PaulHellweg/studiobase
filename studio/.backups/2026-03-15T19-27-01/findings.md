# StudioBase — Findings

---

## Session: Phase 01-04 Onboarding

**Date:** 2026-03-15
**Context:** Project onboarded with complete requirements document. All phases 01-04 pre-decided.

### Source Material Quality

The requirements provided were comprehensive and covered:

- **Data models** — 15 tables named and purposed; tenantId isolation strategy specified.
- **Business rules** — FIFO credit consumption, waitlist auto-promotion, cancellation windows, credit expiry, subscription lifecycle (pause/cancel/resume).
- **Threat model** — Row-level tenant isolation via Prisma client extension; PII encryption at AES-256; Keycloak PKCE (no secret in browser); DSGVO/GDPR rights (export, deletion, audit log purge at 90 days).
- **Stack** — Fully pre-decided (React 18 + Vite, tRPC v11, Express, Keycloak 24, PostgreSQL 16, Prisma 5, Stripe, Tailwind, i18next, Vitest, Docker Compose). No deliberation required.

All phases 01-04 were approved based on this input. No gaps or ambiguities surfaced during spec writing.

---

## Decisions Recorded

### Credit Consumption Order
FIFO by `expiresAt ASC NULLS LAST`, then `createdAt ASC`. This means credits that expire soonest are consumed first; non-expiring credits are consumed last among grants of the same age. This is the most user-friendly interpretation and matches stated requirements.

### Tenant Isolation Strategy
Prisma client extension using `$allOperations` interceptor rather than row-level security (RLS) in PostgreSQL. Rationale: Prisma does not generate RLS-aware queries; enforcing at the ORM layer is simpler to reason about and test. Trade-off: a bug in the extension could allow cross-tenant reads. Mitigated by unit tests on the extension and integration tests using two separate tenant fixtures.

### PII Encryption Boundary
Encryption/decryption happens in a Prisma middleware (not in routers or services). This keeps business logic PII-agnostic. Fields: `User.name`, `User.email`, `User.phone`. Encrypted at rest using AES-256-GCM with a per-record IV stored alongside the ciphertext (Base64-encoded in the varchar column).

### No Global State Store
TanStack Query (via tRPC's React Query integration) handles all server state. No Redux, Zustand, or similar. Rationale: the data access pattern is entirely server-driven; local optimistic updates are handled by TanStack Query's mutation helpers.

### Keycloak Realm Per Environment
Dev realm: `studiobase` (seeded via realm export JSON in `docker-compose.yml`). Prod realm: separate, provisioned via Terraform (out of scope for Phase 05). The realm export is checked into source as `keycloak/realm-export.json`.

---

## Open Questions

None at this time. Requirements were sufficiently detailed to begin Phase 05.

---

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Prisma tenant extension bug allows cross-tenant read | Low | Unit + integration tests with two tenant fixtures |
| Stripe webhook replay attack | Low | Stripe signature verification on every webhook; idempotency key on credit grants |
| Keycloak `tenantId` claim manipulation | Low | Server validates claim against DB membership on sensitive operations |
| PII encryption key rotation disruption | Medium | Plan key rotation procedure before prod launch; out of scope for Phase 05 |
