# StudioBase UI Prototype

Phase 02c deliverable — Warm Stone design system implementation.

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:3000 and you'll be redirected to `/zen-flow` (the Zen Flow Yoga Studio landing page).

## Demo Features

### Role Switcher

1. Go to any page and click **Login** (or use the login page at `/auth/login`)
2. Enter any email/password (form validates but accepts anything)
3. Once logged in, click your avatar in the top-right
4. Use the **Switch Role (Demo)** dropdown to change between:
   - `customer` — booking pages, credits
   - `teacher` — schedule and attendance
   - `tenant_admin` — full admin dashboard
   - `super_admin` — platform management

Each role shows different navigation links and pages.

### Interactive Elements

- **Book a class**: Browse schedule → click Book → confirm modal → toast
- **Cancel booking**: My Bookings → Cancel → confirm → toast
- **Mark attendance**: Teacher role → My Schedule → click a class → toggle present/absent
- **Forms validate**: Try submitting empty login/register forms
- **Data tables**: Search, pagination on admin pages
- **Tabs**: My Bookings has Upcoming/Past tabs

## Design System

### Warm Stone

- **Colors**: Earth tones (umber, terracotta, sage, warm linen)
- **Typography**: Fraunces (serif headings) + Source Sans 3 (body)
- **Layout**: Top nav only, no sidebar, sharp corners
- **Interactions**: 250ms transitions, warm hover states

### Pages (28 total)

#### Public (no auth)
- `/zen-flow` — Studio landing
- `/zen-flow/schedule` — Browse classes
- `/zen-flow/class/:id` — Class detail
- `/auth/login`, `/auth/register`, `/auth/forgot-password`

#### Customer
- `/bookings` — My bookings (upcoming/past)
- `/bookings/:id` — Booking detail
- `/credits` — Balance & history
- `/credits/buy` — Buy credit packs
- `/credits/subscribe` — Subscribe to tiers
- `/profile` — Edit profile
- `/profile/export` — GDPR data export
- `/profile/delete` — Delete account

#### Teacher
- `/teacher/schedule` — My classes
- `/teacher/class/:sessionId` — Attendance list

#### Admin
- `/admin` — Dashboard with KPIs
- `/admin/classes` — Class types CRUD
- `/admin/schedule` — Schedule entries
- `/admin/teachers` — Teacher management
- `/admin/customers` — Customer list
- `/admin/customers/:id` — Customer detail
- `/admin/pricing/packs` — Credit packs config
- `/admin/pricing/subscriptions` — Subscription tiers
- `/admin/reports` — Revenue reports
- `/admin/waitlists` — Active waitlists
- `/admin/settings` — Studio settings

#### Super Admin
- `/super/tenants` — All tenants
- `/super/tenants/:id` — Tenant config
- `/super/tenants/new` — Create tenant
- `/super/settings` — Global settings

## Mock Data

All data comes from `/lib/mock-data.ts`:
- 1 tenant (Zen Flow Yoga Studio)
- 4 class types, 3 teachers, 10 schedule entries
- 8 bookings, credit ledger, 5 customers
- Everything is hardcoded — no backend

## Tech Stack

- Next.js 16.1.6 (App Router, Turbopack)
- Tailwind CSS v4 (CSS custom properties)
- Google Fonts (Fraunces, Source Sans 3, JetBrains Mono)
- TypeScript
- Pure React (no component library)

## What This Is NOT

This is a throwaway prototype to validate UX. It:
- Has no backend
- Has no real auth (mock context provider)
- Uses mock data only
- Has no tests
- Is not production code

The real app will be built in Phase 05 with Drizzle ORM, Better-Auth, tRPC, and proper architecture.

## Design Validation

The prototype proves:
- Warm Stone aesthetic works across all page types
- Top-nav-only layout is viable (no sidebar clutter)
- Sharp corners + earthy palette feels distinct from SaaS templates
- All 28 pages fit the mental model from architecture.md
- Interactive flows (book → confirm → toast) work smoothly
