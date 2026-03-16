# Design Directions -- StudioBase

**Date:** 2026-03-15
**Context:** Multi-tenant SaaS booking platform for yoga/fitness studios (DACH market focus)

Three distinct directions follow. Each is designed to avoid the "generic SaaS" look that plagues every competitor analyzed in `design-analysis.md`.

---

## Direction A: "Warm Stone"

**Aesthetic:** A grounded, tactile warmth inspired by Japanese spa interiors and European wellness retreats. Quiet confidence rather than corporate polish. Surfaces feel like natural materials -- linen, warm stone, matte wood. Nothing screams for attention; everything invites you to stay.

### Color Palette (OKLCH)

| Token | OKLCH Value | Hex Approx | Usage |
|---|---|---|---|
| `--color-primary` | `oklch(0.45 0.03 55)` | #6B5E52 | Warm umber -- buttons, active states, links |
| `--color-primary-light` | `oklch(0.65 0.025 55)` | #A08E7E | Hover states, secondary text |
| `--color-accent` | `oklch(0.72 0.14 28)` | #D4724A | Terracotta -- notifications, badges, CTAs that need to pop |
| `--color-surface` | `oklch(0.97 0.008 85)` | #F5F0EA | Warm linen -- card backgrounds |
| `--color-background` | `oklch(0.99 0.005 85)` | #FDFAF5 | Page background -- barely-there warmth |
| `--color-text` | `oklch(0.25 0.02 55)` | #3D3430 | Near-black with warm undertone |
| `--color-text-muted` | `oklch(0.55 0.02 55)` | #8A7D74 | Secondary text, labels |
| `--color-border` | `oklch(0.88 0.01 75)` | #DDD5CA | Subtle warm borders |
| `--color-success` | `oklch(0.65 0.15 155)` | #4A9E6B | Sage green -- confirmed bookings |
| `--color-danger` | `oklch(0.55 0.18 20)` | #C44D3A | Muted red -- cancellations, errors |

### Typography

| Role | Font | Source | Weight |
|---|---|---|---|
| Headings | **Fraunces** | Google Fonts | 500-700 (optical size axis) |
| Body | **Source Sans 3** | Google Fonts | 400, 600 |
| Mono/Data | **JetBrains Mono** | Google Fonts | 400 |

Fraunces is a soft, variable serif with an optical size axis -- it's warm and distinctive without being precious. It avoids the "startup sans-serif" monoculture entirely. Source Sans 3 is legible and neutral but slightly warmer than Inter.

**Type Scale:**
- H1: 2.25rem / 700
- H2: 1.75rem / 600
- H3: 1.25rem / 600
- Body: 1rem / 400
- Small: 0.875rem / 400
- Caption: 0.75rem / 400

### Layout Strategy

- **Top navigation** (not left sidebar) -- breaks the "every SaaS dashboard" pattern
- **Content max-width: 72rem** with generous side margins
- **Schedule views:** Vertical day-list on mobile, week-grid on desktop with subtle row striping
- **Cards have no border-radius** -- instead, use a 1px warm border + slight background tint to differentiate surfaces. Rectangles feel more intentional.
- **Asymmetric layouts** where appropriate -- class detail pages use a 2/3 + 1/3 split, not centered cards
- **Whitespace is a feature** -- 2rem minimum between content blocks

### Animation Approach

- **Subtle and slow** -- transitions at 250-300ms with ease-out
- No bounce, no spring physics, no parallax
- Page transitions: content fades in with a slight upward drift (8px, 200ms)
- Hover states: background color shift only, no scale transforms
- Loading: skeleton screens with a warm shimmer (linen-to-surface gradient pulse)
- Schedule slot selection: gentle background fill from left to right (150ms)

### Best For

Studios that position themselves as premium, calm, intentional. Yoga studios, pilates, meditation spaces, wellness retreats. Studio owners who care about aesthetics and want their booking page to feel like an extension of their physical space.

### What Makes It NOT Generic

- Serif headings (Fraunces) immediately distinguish it from every competitor
- No blue, no teal, no purple -- warm earth tones are rare in SaaS
- Sharp-cornered cards with subtle borders instead of the ubiquitous rounded-xl
- Top nav instead of left sidebar
- The overall feeling is "curated boutique" rather than "software product"

### Risk

May feel too quiet for high-energy fitness brands (CrossFit, HIIT studios). Could be perceived as slow or old-fashioned by younger demographics who expect more visual energy.

---

## Direction B: "Electric Ink"

**Aesthetic:** High-contrast, editorial, almost magazine-like. Think Monocle meets a fitness brand. Strong black-and-white foundation with a single, surprising accent color (chartreuse). Dense information display that trusts the user to be competent. Typography-driven design where the type IS the decoration.

### Color Palette (OKLCH)

| Token | OKLCH Value | Hex Approx | Usage |
|---|---|---|---|
| `--color-primary` | `oklch(0.15 0.0 0)` | #1A1A1A | Near-black -- primary surfaces in dark areas |
| `--color-accent` | `oklch(0.88 0.25 128)` | #C8E63A | Chartreuse -- CTAs, active states, highlights |
| `--color-accent-muted` | `oklch(0.78 0.12 128)` | #A0B85E | Softer accent for larger surfaces |
| `--color-surface` | `oklch(0.99 0.0 0)` | #FCFCFC | Almost-white card surface |
| `--color-background` | `oklch(0.97 0.0 0)` | #F5F5F5 | Light gray page background |
| `--color-background-dark` | `oklch(0.12 0.0 0)` | #141414 | Dark mode / admin header |
| `--color-text` | `oklch(0.15 0.0 0)` | #1A1A1A | Pure dark text |
| `--color-text-muted` | `oklch(0.50 0.0 0)` | #787878 | Secondary text, timestamps |
| `--color-border` | `oklch(0.85 0.0 0)` | #D4D4D4 | Light mode borders |
| `--color-border-strong` | `oklch(0.15 0.0 0)` | #1A1A1A | Thick structural borders (2px) |
| `--color-success` | `oklch(0.88 0.25 128)` | #C8E63A | Same as accent -- confirmed = highlighted |
| `--color-danger` | `oklch(0.60 0.22 25)` | #D9513A | Saturated red -- errors, cancellations |

### Typography

| Role | Font | Source | Weight |
|---|---|---|---|
| Headings | **Space Grotesk** | Google Fonts | 500-700 |
| Body | **IBM Plex Sans** | Google Fonts | 400, 500 |
| Mono/Data | **IBM Plex Mono** | Google Fonts | 400 |

Space Grotesk has geometric quirks (the distinctive "a" and "g") that give character without being loud. IBM Plex Sans is a workmanlike body font with more personality than Inter -- slightly wider, more open counters. The Plex family keeps mono and sans consistent.

**Type Scale:**
- H1: 3rem / 700 (oversized intentionally -- editorial impact)
- H2: 1.5rem / 600
- H3: 1.125rem / 600 (uppercase, tracked +0.05em)
- Body: 0.9375rem / 400
- Small: 0.8125rem / 400
- Caption: 0.6875rem / 500 (uppercase, tracked)

### Layout Strategy

- **Dense, editorial grid** -- 12-column with tight gutters (1rem)
- **Admin uses a top toolbar** (thin, black) + a collapsible left rail (icon-only by default, expands on hover)
- **Schedule is table-first** -- a proper data table with sortable columns, not a card grid. Rows highlight on hover with the chartreuse accent.
- **Class detail pages:** Full-bleed header area with large type, then structured content below in a narrow column (40rem max)
- **Section dividers:** Thick 2px black lines, not subtle gray hairlines
- **Cards use hard shadows** (4px offset, no blur, black) -- neobrutalist influence without going full brutalist
- **Public booking page:** Minimal, single-column, maximum 480px wide -- like a well-designed receipt

### Animation Approach

- **Snappy and deliberate** -- transitions at 120-150ms, ease-in-out
- No gradual fades, no drifting elements
- Hover states: instant color swap (no transition) for buttons; smooth for larger areas
- Menu/dropdown: clip-path reveal from top (100ms)
- Page transitions: none -- instant content swap (SPA, but no transition animation)
- Loading: a thin 2px chartreuse progress bar at the very top of the viewport
- Data tables: row highlight follows mouse without transition delay

### Best For

Studios that see themselves as modern, urban, design-conscious. Studios run by people who read Kinfolk or Cereal magazine. Works for dance studios, contemporary movement, urban fitness. Also strong for the admin experience -- data-dense without feeling cluttered.

### What Makes It NOT Generic

- Black-and-white foundation with chartreuse is visually arresting and rare in this space
- Hard-drop shadows and thick borders are a deliberate aesthetic choice, not a default
- Editorial typography with oversized H1s and uppercase H3s creates visual rhythm
- Data tables instead of card grids for admin -- respects the user's competence
- The public booking page is intentionally narrow and focused -- anti-hero-section

### Risk

Chartreuse is polarizing. Some studio owners may find it too aggressive or "tech-bro." The high-contrast aesthetic can feel cold for wellness/relaxation brands. Data-dense layouts require careful responsive design.

---

## Direction C: "Soft System"

**Aesthetic:** A design system that feels alive -- rounded but not bubbly, colorful but not garish. Inspired by the best of contemporary product design (Linear, Raycast, Arc browser). Soft gradients as functional elements, not decoration. A system of surfaces at different elevations, like paper cutouts at varying depths. Feels like a tool made by people who care about craft.

### Color Palette (OKLCH)

| Token | OKLCH Value | Hex Approx | Usage |
|---|---|---|---|
| `--color-primary` | `oklch(0.55 0.20 270)` | #5E5CE6 | Indigo-violet -- primary actions |
| `--color-primary-hover` | `oklch(0.50 0.22 270)` | #4E4BD0 | Darker on hover |
| `--color-accent` | `oklch(0.75 0.16 165)` | #34B89A | Teal-mint -- secondary actions, success |
| `--color-accent-warm` | `oklch(0.75 0.15 55)` | #D4944A | Amber -- warnings, credit counts |
| `--color-surface-0` | `oklch(0.99 0.005 270)` | #FAFAFF | Tinted white -- base background |
| `--color-surface-1` | `oklch(0.97 0.008 270)` | #F0F0FA | Slightly elevated surface |
| `--color-surface-2` | `oklch(0.95 0.012 270)` | #E8E8F5 | Card/panel surfaces |
| `--color-surface-3` | `oklch(0.92 0.015 270)` | #DDDCEE | Elevated overlays, modals |
| `--color-text` | `oklch(0.20 0.03 270)` | #1C1B33 | Deep indigo-black |
| `--color-text-muted` | `oklch(0.50 0.03 270)` | #6E6D88 | Muted indigo-gray |
| `--color-border` | `oklch(0.90 0.015 270)` | #D5D4E8 | Subtle indigo-tinted border |
| `--color-danger` | `oklch(0.60 0.20 15)` | #D44A42 | Clear red |

The key insight: surfaces are not "gray" -- they carry a subtle violet/indigo tint that creates cohesion. Each elevation level increases the tint slightly, creating a sense of depth without drop shadows.

### Typography

| Role | Font | Source | Weight |
|---|---|---|---|
| Headings | **General Sans** (or **Satoshi**) | Fontshare (free) | 500-700 |
| Body | **General Sans** | Fontshare (free) | 400, 500 |
| Mono/Data | **Fira Code** | Google Fonts | 400 |

General Sans (from Fontshare) is a contemporary geometric sans-serif that's NOT Inter, NOT DM Sans. It has slightly more character -- rounder terminals, a distinctive lowercase "a". Using the same family for headings and body creates cohesion; weight differentiation creates hierarchy.

Alternative: Satoshi from the same foundry if more geometric character is desired.

**Type Scale:**
- H1: 1.875rem / 700
- H2: 1.5rem / 600
- H3: 1.125rem / 600
- Body: 0.9375rem / 400
- Small: 0.8125rem / 400
- Caption: 0.75rem / 500

### Layout Strategy

- **Left sidebar navigation** BUT reimagined: narrow (240px), with grouped icon+label items, collapsible sections, and a quick-search bar at the top (Cmd+K pattern)
- **Content area has a slight max-width** (64rem) with auto centering
- **Cards use elevation (surface tint levels)** instead of borders or shadows -- a card is just a higher surface
- **Border-radius varies by element size**: small elements (badges, chips) = 6px, medium (cards, inputs) = 10px, large (modals, sections) = 14px. NOT uniform.
- **Schedule view:** A compact timeline view that shows the day as a horizontal swim-lane with class blocks positioned by time. Different from both calendar grids and vertical lists.
- **Empty states are illustrated** -- small, geometric line illustrations that match the brand
- **The booking page uses a split layout**: schedule on the left (scrollable), booking confirmation panel on the right (sticky)

### Animation Approach

- **Smooth and physical** -- transitions at 200ms with cubic-bezier(0.25, 0.46, 0.45, 0.94)
- Sidebar collapse/expand: smooth width transition
- Cards: subtle scale(1.01) on hover with elevation shift (surface-2 to surface-3)
- Modals: scale from 0.97 to 1.0 + opacity fade (150ms)
- Page content: staggered fade-in of content blocks (50ms delay between items, 3 items max)
- Toast notifications: slide in from top-right with a subtle bounce (spring easing)
- Skeleton loading: pulse animation on surface-2 to surface-3
- Booking confirmation: a satisfying checkmark draw animation (SVG path)

### Best For

Studios that want a modern, polished tool that feels current and professional but not cold. Works across the spectrum -- yoga, dance, fitness, martial arts. The color-coding system (indigo=primary, mint=success/confirmed, amber=credits) creates a consistent language. Appeals to studio owners who value good software and expect their tools to look as good as their studio.

### What Makes It NOT Generic

- Indigo-violet as primary instead of blue -- similar family but distinctly different mood
- Surface elevation via tint rather than shadows -- creates depth without visual noise
- Non-standard schedule view (swim-lane timeline) differentiates from every competitor
- Variable border-radius by element size is a subtle craft detail
- General Sans (Fontshare) avoids the Inter/DM Sans/system-font trap
- Functional color system (indigo/mint/amber) maps to booking concepts, not arbitrary decoration

### Risk

The indigo-violet could be confused with purple-as-premium if not carefully tuned. The swim-lane schedule is novel and may need user testing. Fontshare fonts require self-hosting (no Google Fonts CDN), adding a small build step.

---

## Summary Comparison

| Dimension | A: Warm Stone | B: Electric Ink | C: Soft System |
|---|---|---|---|
| **Mood** | Quiet luxury, boutique | Bold editorial, urban | Polished craft, modern |
| **Color dominant** | Warm earth (umber, terracotta) | B&W + chartreuse | Indigo-violet + tinted surfaces |
| **Typography** | Serif headings (Fraunces) | Geometric + uppercase accents | Contemporary geometric (General Sans) |
| **Layout** | Airy, top-nav, asymmetric | Dense, editorial grid, data tables | Sidebar + swim-lane, elevated surfaces |
| **Animation** | Slow, gentle | Snappy, instant | Smooth, physical |
| **Best for** | Premium yoga/wellness | Urban/contemporary studios | All studio types |
| **Differentiator** | Warmth in a cold SaaS market | Information density + bold contrast | Craft details + novel schedule view |
| **Risk** | Too calm for fitness | Chartreuse polarizes | Indigo vs. purple confusion |

---

## Recommendation

**Direction C ("Soft System")** is the safest bet for a multi-tenant platform because it works across studio types -- the system is versatile enough for yoga and CrossFit. However, it's also the closest to "good SaaS product" territory and needs careful execution to avoid feeling generic.

**Direction A ("Warm Stone")** would be my actual pick for differentiation. No competitor uses warm earth tones or serif typography. It immediately signals "this is not another SaaS dashboard" and would make StudioBase recognizable. The risk (too quiet for fitness) is manageable because tenants could eventually customize accent colors while the structural warmth remains.

**Direction B ("Electric Ink")** is the boldest bet -- highest differentiation, highest risk. Best if StudioBase wants to position as the design-conscious choice in the market.

The human should choose. I'll wait.
