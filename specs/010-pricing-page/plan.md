# Implementation Plan: Pricing Page & Reusable Upgrade Component

**Branch**: `010-pricing-page` | **Date**: 2026-03-13 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/010-pricing-page/spec.md`

## Summary

Build a public Pricing page at `/pricing` and a reusable `UpgradeCard` component that renders the Figma-designed Pro plan upgrade card. The same component is used on both the Pricing page (with sign-in gating for unauthenticated users) and the Account page (direct checkout). Reuses existing Stripe checkout infrastructure with a success URL update to redirect to Dashboard.

## Technical Context

**Language/Version**: TypeScript 5.x
**Primary Dependencies**: React 19, Next.js 15 (App Router), next-auth, Stripe (existing)
**Storage**: PostgreSQL via Prisma (read-only — Subscription table, no schema changes)
**Testing**: Playwright E2E (existing `z-stripe-checkout.spec.ts`), manual testing
**Target Platform**: Web (SSR + client hydration)
**Project Type**: Web application (monorepo: `apps/web`)
**Performance Goals**: Standard web page load (<3s LCP)
**Constraints**: No new dependencies. Must use CSS Modules + CSS variables. 4pt spacing grid. Mobile-first.
**Scale/Scope**: 2 pages affected (Pricing new, Account refactor), 1 new component, ~5 files changed

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Hexagonal Architecture | PASS | No new adapters/ports needed. Reuses existing Stripe adapter. New component in `components/pricing/`. Page in `app/(marketing)/pricing/`. |
| II. Verified-Change Workflow | PASS | Will run `make preflight` after implementation. |
| III. Server-First Rendering | PASS | Pricing page is a server component. UpgradeCard is `'use client'` only for the Purchase button click handler (interactive UI state). |
| IV. Design System Compliance | PASS | All colors via CSS variables. Fustat typography. 4pt spacing grid. CSS Modules. Gradient uses `--color-hot-rose` + `--color-cool-sky`. |
| V. Code Minimalism | PASS | Single reusable component. No premature abstractions. Named exports. <150 lines per file. |

**Post-Phase 1 re-check**: All gates still pass. No new layers, adapters, or dependencies introduced.

## Project Structure

### Documentation (this feature)

```text
specs/010-pricing-page/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 research findings
├── data-model.md        # Phase 1 data model (no schema changes)
├── quickstart.md        # Phase 1 quickstart guide
├── contracts/
│   └── checkout-flow.md # Checkout flow contracts
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
apps/web/
├── app/
│   ├── (marketing)/
│   │   └── pricing/
│   │       └── page.tsx              # NEW: Pricing page (server component)
│   └── (app)/
│       └── account/
│           └── _components/
│               └── BillingCTA.tsx     # MODIFIED: Use UpgradeCard for upgrade state
├── components/
│   └── pricing/
│       ├── UpgradeCard.tsx           # NEW: Reusable pricing card component
│       └── UpgradeCard.module.css    # NEW: Pricing card styles
└── lib/
    └── stripe.ts                     # MODIFIED: Update success URL to /dashboard
```

**Structure Decision**: New component in `components/pricing/` (UI component, no domain logic). Page in `app/(marketing)/pricing/` under existing marketing layout group. This follows hexagonal architecture — UI in components, page orchestration in app.

## Implementation Approach

### Phase 1: UpgradeCard Component (Core)

Create `components/pricing/UpgradeCard.tsx` — a `'use client'` component matching Figma design:

**Visual structure** (from Figma node 272:2):
- Card: white bg, 2px `--color-imperial-blue` border, 20px radius, subtle shadow
- Gradient header: `--color-hot-rose` → `--color-cool-sky` at ~167°, rounded top corners (18px)
- Title: sparkle icon + "Upgrade to Pro!", white, bold 20px
- Subtitle: "Unlock all features and grow your channel faster", white, 15px
- Feature list: 5 items with check-circle icons, bold 18px, `--color-imperial-blue`
- Price: "Only $12/mo", bold 22px, `--color-imperial-blue`
- Button: "Purchase", `--color-imperial-blue` bg, white text, 8px radius

**Props**:
- `onPurchase: () => void` — context-specific purchase handler
- `isPro: boolean` — disables button, shows "Current Plan" badge
- `loading?: boolean` — shows loading state on button

**Styles**: CSS Modules using design system variables. Mobile-first, responsive.

### Phase 2: Pricing Page

Create `app/(marketing)/pricing/page.tsx` as a server component:
- Optionally fetch session to determine auth state and plan status
- Pass `isPro` and an `onPurchase` handler to `UpgradeCard`
- Wrap in a client component for the purchase handler logic:
  - If authenticated: POST to `/api/integrations/stripe/checkout`, redirect to `url`
  - If not authenticated: redirect to `/auth/login?callbackUrl=/api/integrations/stripe/checkout`
- Add `generateMetadata` for SEO (title: "Pricing | ChannelBoost")

### Phase 3: Account Page Integration

Refactor `BillingCTA.tsx`:
- When `!isSubscribed`, render `UpgradeCard` instead of the current inline upgrade UI
- Pass `onPurchase` that calls POST `/api/integrations/stripe/checkout` (existing behavior)
- No sign-in gating needed (user is always authenticated on Account page)

### Phase 4: Success URL Update

In `lib/stripe.ts`, update `createCheckoutSession()`:
- Change `successUrl` from `${APP_URL}/videos?checkout=success` to `${APP_URL}/dashboard?checkout=success`
- Keep `cancelUrl` as `/videos?checkout=canceled` or update to `/pricing?checkout=canceled`

### Phase 5: Verification

- Run `make preflight` and verify no regressions
- Manual testing per quickstart.md checklist

## Complexity Tracking

No constitution violations. No complexity justification needed.
