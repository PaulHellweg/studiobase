# Design Analysis -- Competitor & Landscape Research

**Project:** StudioBase (Multi-Tenant Yoga/Fitness Booking SaaS)
**Date:** 2026-03-15
**Method:** Knowledge-based analysis (no browser screenshots available)

---

## Direct Competitors

### 1. Mindbody

**Colors:** Deep navy (#1B2632) as primary, teal (#00B4D8) accents, white backgrounds. The dashboard uses a muted slate palette with teal action buttons.
**Typography:** Proprietary sans-serif with tight letter-spacing. Heavy use of bold weights for hierarchy. Numbers get extra prominence in dashboards.
**Layout:** Dense dashboard-first design. Left sidebar navigation. Calendar views dominate the schedule page. Mobile app uses bottom tab navigation with large touch targets.
**Distinctive:** The booking flow is streamlined -- class cards show teacher photo, time, and spots remaining in a compact row format. Revenue dashboards use large KPI cards with sparkline charts.
**Would steal:** The compact class-list format that shows essential info (time, teacher, spots) without expanding a card. The way they handle multi-step booking as a slide-in panel rather than a new page.
**Would avoid:** The overall look is corporate and dated. Heavy visual weight. The admin dashboard feels cluttered -- too many competing elements. The teal-on-navy palette has been copied by dozens of fitness SaaS tools.

---

### 2. Momoyoga

**Colors:** Warm coral/salmon (#F2745F) as primary, soft cream (#FFF9F2) backgrounds, charcoal text (#2D2D2D). Distinctly warm palette. Secondary greens for success states.
**Typography:** Rounded sans-serif (similar to Nunito). Comfortable reading sizes, generous line-height. Headings are semibold, not heavy.
**Layout:** Generous whitespace. The public booking page uses a single-column schedule list -- simple, scannable. Admin dashboard is clean with card-based widgets. Mobile-optimized schedule views.
**Distinctive:** Feels personal and approachable, unlike enterprise-grade competitors. The schedule view has a distinctive day-by-day vertical list rather than a calendar grid -- easier to scan on mobile. The onboarding flow is notably simple.
**Would steal:** The warm, non-corporate color palette. The day-list schedule format for mobile. Clean onboarding that gets studios live quickly. The way class descriptions show as expandable accordion items.
**Would avoid:** Can feel slightly amateur for larger studios. Limited visual hierarchy in the dashboard -- everything looks the same. The coral color, while warm, is now associated specifically with Momoyoga in the yoga space.

---

### 3. Glofox

**Colors:** Dark slate (#1A1A2E) backgrounds, electric blue (#4A6CF7) accents, white text. A "premium tech" palette. Gradient overlays on hero images.
**Typography:** Geometric sans-serif (similar to DM Sans). Large display headings on marketing pages. Dashboard uses smaller, denser type.
**Layout:** Marketing site uses full-bleed sections with angled dividers. Dashboard is a standard left-nav + content area. The booking widget is embeddable and compact. Calendar views use color-coded class types.
**Distinctive:** The color-coded class type system in the calendar is visually useful -- each class type (yoga, HIIT, pilates) has its own hue. The member app has a dark-mode-first aesthetic that feels more like a tech product than a wellness tool.
**Would steal:** Class type color-coding in schedules. The embeddable booking widget concept. The way they surface key metrics (attendance rate, revenue per class) in the teacher view.
**Would avoid:** The dark-slate + electric-blue palette screams "generic SaaS." Gradient dividers look dated. Marketing pages feel overdesigned compared to the functional dashboard -- there's a disconnect.

---

### 4. Fitogram

**Colors:** White-dominant with green accents (#4CAF50). Clean, almost clinical. Very little color saturation overall. Light gray backgrounds (#F7F7F7).
**Typography:** Standard system-font-stack feel. Nothing distinctive. Functional over aesthetic. Good readability.
**Layout:** Extremely clean and functional. The schedule management is table-based for admin, list-based for public booking. No visual excess. German-market-optimized (date formats, DSGVO-compliant by default).
**Distinctive:** The DSGVO-compliance-first approach is smart for the DACH market. Schedule management is table-driven -- fast to use once learned, but steep learning curve. The public booking page is minimal to the point of being stark.
**Would steal:** The functional simplicity of the admin schedule table. The way DSGVO consent flows are integrated into booking. Clean data export formats.
**Would avoid:** Too clinical. No brand personality whatsoever. The green accent is the most generic possible choice. Public-facing pages don't inspire confidence in a studio's brand.

---

### 5. Acuity Scheduling (Squarespace)

**Colors:** Since Squarespace acquisition, uses the Squarespace neutral palette -- black, white, minimal accent colors. The embeddable widget inherits the host site's colors.
**Typography:** Clean sans-serif (similar to Aktiv Grotesk). The scheduling widget is intentionally plain to blend into any website.
**Layout:** The core product is an embeddable scheduling form -- single column, step-by-step. Very focused flow: pick service, pick time, enter details, confirm. No dashboard-style complexity on the customer side.
**Distinctive:** The step-by-step booking flow is the gold standard for simplicity. Each step shows only one decision. Progress indicator is subtle but clear. Form validation is inline and immediate.
**Would steal:** The single-decision-per-step booking flow. Inline form validation patterns. The way available time slots are presented as a grid of buttons rather than a calendar.
**Would avoid:** Too anonymous -- it has no personality because it's designed to disappear into host sites. Not suitable as a standalone product aesthetic. Admin side is functional but uninspiring.

---

### 6. Booksy

**Colors:** Dark navy (#13152B) with vibrant purple (#7C3AED) accents. Gradient buttons. Gold (#F5A623) for premium/featured elements.
**Typography:** Bold geometric sans-serif for headings. Compact, dense body text. High contrast between heading and body sizes.
**Layout:** Mobile-first with a card-heavy design. Discovery/marketplace-oriented homepage. The provider profile page uses a large hero image with overlay text. Booking flow is swipe-friendly.
**Distinctive:** The marketplace/discovery aspect -- customers find new studios, not just book at known ones. Provider profiles feel like social media profiles (cover photo, reviews, gallery). The review system is prominent and integrated.
**Would steal:** The rich provider profile concept -- studios can express their brand. The integrated review/rating display. The mobile-first card layout with swipe interactions.
**Would avoid:** Too marketplace-focused for a B2B SaaS tool. The purple-navy-gold palette is trendy but will age fast. Gradient buttons already feel 2023.

---

## Cross-Cutting Patterns

### What the best do well
1. **Booking flows are linear** -- one decision per step, clear progress
2. **Schedules favor list views on mobile**, calendar grid on desktop
3. **Color-coded class types** help visual scanning across all views
4. **Teacher photos** humanize the booking experience
5. **Spot counts** ("3 spots left") create urgency without being manipulative

### What makes them all look the same
1. Everyone uses blue/teal/navy as primary -- it's a sea of sameness
2. Card grids with identical border-radius are ubiquitous
3. Left-sidebar navigation in every admin dashboard
4. Generic hero sections on marketing/landing pages
5. Same "modern SaaS" geometric sans-serif typography everywhere
6. No real use of texture, illustration, or distinctive visual elements

### The Gap (Our Opportunity)
- None of them feel like they were designed FOR wellness/yoga culture
- The admin experience is always "enterprise SaaS" regardless of the domain
- No one uses serif or humanist typography -- everything is cold geometric
- Color palettes are tech-industry-standard, not wellness-industry-appropriate
- Micro-interactions and animation are minimal or nonexistent
- No one does dark mode well for the admin side
- The gap between "how the public page feels" and "how the admin feels" is always jarring

---

## Anti-Patterns to Avoid

1. **The teal-navy trap** -- Mindbody, Glofox, and half the fitness SaaS market
2. **Card soup** -- Identical rounded-xl cards in a 3-column grid
3. **The generic hero** -- Big heading, subtext, two buttons, background image
4. **Font monotony** -- Inter/DM Sans/system sans everywhere
5. **Dashboard-itis** -- Left sidebar + top header + card grid = every SaaS ever
6. **Gradient buttons** -- Already dated
7. **Stock photography** -- Especially "diverse group doing yoga in studio" images
8. **Purple-as-premium** -- Overused since 2022
