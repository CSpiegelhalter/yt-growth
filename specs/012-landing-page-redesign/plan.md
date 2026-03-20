# Implementation Plan: Landing Page Redesign

**Branch**: `012-landing-page-redesign` | **Date**: 2026-03-19 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/012-landing-page-redesign/spec.md`

## Summary

Redesign the landing page to match the new Figma layout while preserving all existing marketing copy. The Figma design introduces a gradient hero with signup card overlay, 3D icon placement, 2-column feature cards, 3-column "How It Works" steps on a gradient band, and 2-column guide cards — all on a light lavender (#f3f4fb) page background. The implementation refactors the existing page component and its CSS in `globals.css`, reusing the current `StaticNav`, `HeroStaticCTAs`, typography components, and design tokens.

## Technical Context

**Language/Version**: TypeScript 5.x
**Primary Dependencies**: React 19, Next.js 15 (App Router), CSS Modules + globals.css
**Storage**: N/A (no database changes)
**Testing**: Visual comparison against Figma, responsive viewport testing, `make preflight`
**Target Platform**: Web (modern browsers, responsive 375px–2560px)
**Project Type**: Web application (Next.js monorepo, `apps/web`)
**Performance Goals**: Lighthouse 90+, no CLS regressions, fast FCP via inlined critical CSS
**Constraints**: No Tailwind (project uses CSS variables + globals.css), 4pt spacing grid, mobile-first, server components only
**Scale/Scope**: Single page redesign (1 page, ~10 CSS class groups, 1 new asset)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Hexagonal Architecture | PASS | Landing page is a thin entrypoint (`app/`) composing components. No domain logic changes. |
| II. Verified-Change Workflow | PASS | Will run `make preflight` after implementation. |
| III. Server-First Rendering | PASS | Landing page is a server component. No `'use client'` needed. |
| IV. Design System Compliance | PASS | Will use CSS variables for all colors, 4pt spacing grid, Fustat typography. No hardcoded hex outside `:root`. |
| V. Code Minimalism | PASS | Refactoring existing page + CSS. Target <150 lines per file. |

## Figma Design Analysis

Based on Figma node `287:115` in file `FBUmzpPK0YTx1KpkaaMwth`:

### Section Structure (top to bottom)

1. **Top Nav Bar** — Logo left, "Blog" / "Pricing" / "Log in" links right. Light background. Already exists as `StaticNav`.

2. **Hero Section** — Full-width gradient band (hot-rose → cool-sky, ~165° angle), ~426px tall.
   - Small text: "Welcome to ChannelBoost"
   - Large heading: "The Growth Engine for YouTube Creators" (we keep our existing H1 copy)
   - 3D icon (`landing_icon.svg`) positioned right side of hero, overlapping gradient
   - White signup card overlapping the gradient on the left side (form with name/email/channel URL + "Create Free Account" button)
   - Text overlay effect: crowd/pattern image at 30% opacity with `mix-blend-multiply`

3. **Value Proposition Area** (below hero, white/light background)
   - Subtitle text: "Stop guessing what to post..." (our existing subtitle)
   - 3 bullet points with checkmark icons: "Unlimited idea suggestions", "Video analysis with actionable fixes", "Subscriber driver insights"

4. **Feature Cards Section** — 2-column grid, each card has:
   - Icon (30px, colored)
   - Title (23px semibold)
   - Description paragraph
   - 3 bullet points with checkmark icons
   - "Learn about..." CTA button (pill-shaped, outlined, imperial blue)
   - Cards have white background, border, rounded corners (20px), subtle shadow

5. **How ChannelBoost Works** — Full-width gradient band (same hot-rose → cool-sky), ~473px tall.
   - Section title: "How ChannelBoost Works" (white, centered)
   - Subtitle: "Connect your channel and start getting insights in under 2 minutes" (white)
   - 3 numbered steps in a row, each with:
     - Gradient circle (76px) with number
     - Step title (23px semibold, white)
     - Step description (15px, white, centered)

6. **Free YouTube Growth Guides** — Light background, centered.
   - Section title + subtitle
   - 2-column grid of guide cards (white, bordered, rounded, shadow)
   - Each card: title, description, "Read the guide →" link

7. **FAQ Section** — Not shown in Figma but preserved for SEO value.

8. **SEO Content Section** — Not shown in Figma but preserved for SEO value.

9. **CTA Section** — Gradient band at bottom (preserved from current implementation).

### Key Design Tokens from Figma

- Page background: `#f3f4fb` (close to `--color-lavender-mist` but slightly different — use a new variable or the existing one)
- Hero gradient: `linear-gradient(165deg, var(--color-hot-rose) 15%, var(--color-cool-sky) 112%)` (extends past 100%)
- Card style: white bg, `#e8eafb` border, `border-radius: 20px`, `box-shadow: 0 4px 4px rgba(0,0,0,0.08)`
- Feature CTA buttons: pill-shaped (30px radius), 2px solid imperial-blue border, imperial-blue text
- Step circles: 76px, gradient fill (same as hero gradient)
- Text colors: white on gradient, `#222a68` (imperial-blue) on light backgrounds
- Typography: Fustat throughout (medium 15px for body, semibold 23px for section titles, extrabold 50px for hero heading)

### Asset Requirements

- `landing_icon.svg` — Already at `apps/web/public/landing_icon.svg`. Used in hero section, right-side placement.
- Splash/hero background texture — The Figma shows a crowd/city photo used at 30% opacity with `mix-blend-multiply` as a texture overlay on the gradient bands. Need to download this from Figma asset URL and add to `apps/web/public/`.

## Project Structure

### Documentation (this feature)

```text
specs/012-landing-page-redesign/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (minimal — no data entities)
├── quickstart.md        # Phase 1 output
└── contracts/           # N/A (no external interfaces)
```

### Source Code (repository root)

```text
apps/web/
├── app/
│   ├── (marketing)/
│   │   ├── layout.tsx           # Existing — no changes needed
│   │   └── page.tsx             # MODIFY — restructure landing page sections
│   └── globals.css              # MODIFY — update landing page CSS classes
├── components/
│   ├── navigation/
│   │   ├── StaticNav.tsx        # Existing — no changes needed
│   │   └── StaticNav.module.css # Existing — no changes needed
│   └── HeroStaticCTAs.tsx       # MODIFY — may need to update for new hero layout
└── public/
    ├── landing_icon.svg         # Existing — use as hero icon
    └── hero-texture.webp        # NEW — download from Figma, hero gradient texture overlay
```

**Structure Decision**: All changes are within the existing `apps/web` app. No new directories or architectural changes needed. The landing page remains a single server component in the `(marketing)` route group.

## Constitution Re-Check (Post Phase 1)

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Hexagonal Architecture | PASS | No layer boundary changes. Page remains a thin entrypoint. |
| II. Verified-Change Workflow | PASS | `make preflight` required after implementation. |
| III. Server-First Rendering | PASS | No client components introduced. All rendering is server-side. |
| IV. Design System Compliance | PASS | New `--color-page-bg` token added to `:root`. All other colors use existing CSS variables. 4pt grid spacing. Fustat typography. |
| V. Code Minimalism | PASS | Minimal changes — refactoring existing CSS classes and page structure. No new abstractions. |

## Complexity Tracking

No constitution violations. No complexity justifications needed.
