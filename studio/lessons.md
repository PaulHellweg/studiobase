# StudioBase — Lessons Learned

## [2026-03-16] ARCHITECTURE
**Mistake:** Phase 05b built 9 backend routers (29 procedures, all real DB) and 28 frontend pages — but every frontend page used hardcoded MOCK_ constants instead of tRPC hooks. The build was declared "done" with zero frontend-backend integration.
**Root Cause:** The build agent worked backend-first, then frontend-first, but never wired them together. No test or verification checked whether pages actually call the API. "Compiles and renders" was treated as "done" — but rendering mock data is not a feature.
**Rule:** Every feature must be built end-to-end (test → backend → test → frontend → verify integration) before moving to the next. Never build all backends then all frontends. Frontend tests must verify tRPC hooks are called and real data is rendered. A page with mock data is a stub, not a feature.
**Pattern:** If a page defines `const MOCK_*` or hardcoded data arrays, it is not integrated. Check every page for tRPC imports before marking Phase 05 done.

## [2026-03-16] TESTING
**Mistake:** 38 server tests existed but zero frontend tests. No test verified that any page actually calls the API.
**Root Cause:** TDD rule only mentioned "application code in app/ or src/" without explicitly requiring frontend integration tests. The agent interpreted TDD as backend-only.
**Rule:** TDD applies to BOTH backend AND frontend. Frontend tests must verify: (1) tRPC hooks are called, (2) loading/error states render, (3) real data is displayed, (4) mutations fire on form submit. A feature is not complete without both backend and frontend tests.
**Pattern:** If test count is heavily skewed (38 backend / 0 frontend), the frontend is probably untested stubs.

## [2026-03-15] TOOLING
**Mistake:** verify-completion.mjs Stop hook fires WARNING on every stop attempt, creating an infinite loop of messages when the user has stepped away and tasks are open.
**Root Cause:** The hook returns exit code 0 (non-blocking) with a WARNING message, but the Stop event fires repeatedly, flooding the conversation with identical warnings.
**Rule:** Stop hooks should either BLOCK (exit 2) once or stay silent on subsequent fires. A WARNING-level stop hook should track whether it has already warned in this session.
**Pattern:** When a hook fires >3 times with the same message, it's a loop bug — fix the hook, not the conversation.
