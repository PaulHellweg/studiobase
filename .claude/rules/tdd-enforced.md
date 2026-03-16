# Rule: TDD Enforced (Phase 05)

**In Phase 05 (Build), follow RED-GREEN-REFACTOR. No production code without a failing test first.**
**This applies to BOTH backend AND frontend code.**

## The Cycle

1. **RED** — Write a test that describes the expected behavior. Run it. It must fail.
2. **GREEN** — Write the minimum code to make the test pass. No more.
3. **REFACTOR** — Clean up while tests stay green.

## When This Applies

- Phase 05 only (Build phase)
- All application code in `app/` or `src/`
- **Backend:** API routes, business logic, data access layers, services
- **Frontend:** Pages that call APIs, hooks, data fetching, mutations, form submissions
- Utility functions

## When This Does NOT Apply

- Phase 02 prototype (throwaway, mock data)
- Configuration files, environment setup
- CSS/styling-only changes
- One-line type fixes

## What To Write

### Backend Tests (Vitest)
- Tests go in `__tests__/` or co-located `*.test.ts` files
- Test tRPC procedures with real DB calls (no mocks for DB)
- Test names describe behavior: "creates booking when credits available"

### Frontend Tests (Vitest + React Testing Library)
- Co-located `*.test.tsx` files next to pages/components
- Test that pages call the correct tRPC hooks
- Test loading states, error states, and success flows
- Test form submissions trigger mutations
- Test that data from API is rendered (not mock data)

## Definition of Done

A feature is NOT done until:
1. Backend test exists and passes (API returns correct data)
2. Frontend test exists and passes (page calls API and renders result)
3. The page works with REAL data from the database — no hardcoded mock constants
4. Forms submit to real mutations and the DB state changes

**A page that compiles and renders mock data is NOT done. It is a stub.**

## Feature Completion Rule

**Do not move to the next feature until the current feature is fully wired end-to-end.**
Each feature must be: test → implement backend → test → implement frontend → verify integration.
Never build all backends first, then all frontends — this creates the mock data gap.

## Why

TDD in the build phase catches bugs at write-time, not deploy-time. Testing both layers ensures
the frontend actually talks to the backend. A UI shell with mock data is not a feature — it's a prototype.
