# Tasks: Pricing Page & Reusable Upgrade Component

**Input**: Design documents from `/specs/010-pricing-page/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Not explicitly requested — test tasks omitted. Manual testing via quickstart.md.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Create new files and directory structure

- [x] T001 Create directory `apps/web/components/pricing/` for the reusable pricing component
- [x] T002 Create directory `apps/web/app/(marketing)/pricing/` for the pricing page route

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared component and Stripe config changes that all user stories depend on

**CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 Create `UpgradeCard` component in `apps/web/components/pricing/UpgradeCard.tsx` — a `'use client'` component matching the Figma design (node 272:2). Must include: white card with 2px `var(--color-imperial-blue)` border and 20px radius; gradient header (`var(--color-hot-rose)` → `var(--color-cool-sky)` at ~167deg) with rounded top corners; sparkle icon + "Upgrade to Pro!" title in white bold; subtitle "Unlock all features and grow your channel faster" in white; 5 feature items with check-circle icons (Unlimited idea suggestions, Video analysis with actionable fixes, Subscriber driver insights, Up to 3 connected channels, Priority support); price "Only $12/mo" using `SUBSCRIPTION.PRO_MONTHLY_PRICE_USD` from `@/lib/shared/product`; "Purchase" button with `var(--color-imperial-blue)` background, white text, 8px radius. Props: `onPurchase: () => void`, `isPro: boolean`, `loading?: boolean`. When `isPro` is true, disable button and show "Current Plan" badge. Use named export.
- [x] T004 Create `UpgradeCard` styles in `apps/web/components/pricing/UpgradeCard.module.css` — CSS Modules using design system variables only (no hardcoded hex). Mobile-first responsive layout. 4pt spacing grid. Card shadow: `0px 4px 4px 0px rgba(0,0,0,0.08)`. Gradient header height ~123px. Feature list items spaced at 30px line-height. Button full-width on mobile, auto-width on desktop. Hover/disabled states on button.
- [x] T005 Update success URL in `apps/web/lib/stripe.ts` — change `successUrl` in `createCheckoutSession()` from `${APP_URL}/videos?checkout=success` to `${APP_URL}/dashboard?checkout=success`. Also update `cancelUrl` to `${APP_URL}/pricing?checkout=canceled` so canceled checkout returns to the Pricing page.

**Checkpoint**: UpgradeCard component ready, Stripe URLs updated — user story implementation can begin

---

## Phase 3: User Story 1 — Authenticated User Purchases Pro Plan (Priority: P1) MVP

**Goal**: Signed-in Free user visits Pricing page, clicks Purchase, goes to Stripe Checkout, and lands on Dashboard after payment.

**Independent Test**: Sign in as Free user → visit `/pricing` → click Purchase → verify Stripe Checkout opens → complete test payment → verify redirect to `/dashboard?checkout=success`

### Implementation for User Story 1

- [x] T006 [US1] Create Pricing page client wrapper in `apps/web/app/(marketing)/pricing/PricingClient.tsx` — a `'use client'` component that: receives `isAuthenticated: boolean` and `isPro: boolean` as props; implements `handlePurchase` that calls `POST /api/integrations/stripe/checkout` and redirects to `data.url` when authenticated, or redirects to `/auth/login?callbackUrl=/api/integrations/stripe/checkout` when not authenticated; passes `onPurchase`, `isPro`, and `loading` state to `UpgradeCard`; shows error message if checkout POST fails. Include a page title/heading section above the card ("Pricing" or "Upgrade to Pro") styled with existing typography tokens.
- [x] T007 [US1] Create Pricing page server component in `apps/web/app/(marketing)/pricing/page.tsx` — server component with `generateMetadata` (title: "Pricing | ChannelBoost", description about Pro plan). Optionally fetch session via `getServerSession()` to determine auth state. If authenticated, fetch subscription status via `getSubscriptionStatus(userId)` and derive `isPro` using `getPlanFromSubscription()`. Render `PricingClient` with `isAuthenticated` and `isPro` props. Page lives under `(marketing)` layout so it gets `StaticNav`.

**Checkpoint**: Authenticated Free user can visit `/pricing`, click Purchase, and reach Stripe Checkout. Post-payment redirects to Dashboard.

---

## Phase 4: User Story 2 — Unauthenticated User Purchases Pro Plan (Priority: P1)

**Goal**: Visitor clicks Purchase on Pricing page, signs in, then seamlessly continues to Stripe Checkout.

**Independent Test**: Visit `/pricing` while signed out → click Purchase → verify redirect to `/auth/login?callbackUrl=/api/integrations/stripe/checkout` → sign in → verify redirect to Stripe Checkout

### Implementation for User Story 2

- [x] T008 [US2] Verify GET `/api/integrations/stripe/checkout` handles the post-sign-in redirect flow in `apps/web/app/api/integrations/stripe/checkout/route.ts` — read the existing GET handler and confirm it: (a) authenticates the now-signed-in user, (b) creates a checkout session, (c) redirects to Stripe. If it returns 401 for unauthenticated users instead of creating a session, that's fine because the user will be authenticated after the LoginForm redirect. Document any edge cases found. If the GET handler needs adjustment (e.g., it doesn't redirect properly after sign-in callback), make minimal changes.

**Checkpoint**: Full unauthenticated → sign-in → Stripe Checkout → Dashboard flow works end-to-end.

---

## Phase 5: User Story 3 — Account Page Upgrade Prompt (Priority: P2)

**Goal**: Signed-in Free user sees the same UpgradeCard on the Account page with a working Purchase button that goes directly to Stripe Checkout.

**Independent Test**: Sign in as Free user → visit `/account` → verify UpgradeCard appears → click Purchase → verify Stripe Checkout opens

### Implementation for User Story 3

- [x] T009 [US3] Refactor `BillingCTA` in `apps/web/app/(app)/account/_components/BillingCTA.tsx` — import `UpgradeCard` from `@/components/pricing/UpgradeCard`. In the `!isSubscribed` branch (lines 120-149), replace the existing inline upgrade UI with `<UpgradeCard onPurchase={handleSubscribe} isPro={false} loading={loading} />`. Keep the subscribed branch (lines 56-117) unchanged. Keep the existing `handleSubscribe` function that POSTs to `/api/integrations/stripe/checkout`.
- [x] T010 [US3] Update `BillingCTA.module.css` in `apps/web/app/(app)/account/_components/BillingCTA.module.css` — remove the `.cardHighlight` class and any styles only used by the old inline upgrade UI (lines 14-19, 111-113). Keep all styles used by the subscribed state (.card, .header, .title, .badge, .cancelNotice, .details, .pricing, .price, .period, .features, .btn, etc.).

**Checkpoint**: Account page shows UpgradeCard for Free users, Purchase goes to Stripe. Pro users still see subscription management UI.

---

## Phase 6: User Story 4 — Pricing Page as Marketing Surface (Priority: P2)

**Goal**: Pricing page is publicly accessible, renders correctly for all visitors, and matches Figma design.

**Independent Test**: Visit `/pricing` while signed out → verify page renders with full pricing card, correct gradient, feature list, price, and CTA

### Implementation for User Story 4

- [x] T011 [US4] Add SEO metadata and page structure polish in `apps/web/app/(marketing)/pricing/page.tsx` — ensure `generateMetadata` includes Open Graph tags (og:title, og:description). Add structured page layout: centered content, marketing-appropriate max-width, proper vertical spacing. Verify the page renders correctly under the `(marketing)` layout with `StaticNav` visible above.
- [x] T012 [US4] Add Pricing page styles if needed in `apps/web/app/(marketing)/pricing/pricing.module.css` — page-level layout styles (centering, max-width, padding, vertical rhythm). Use existing page layout tokens (`--page-max-width-narrow`, `--page-padding-desktop`). Mobile-first responsive. Only create this file if PricingClient needs page-level layout beyond what UpgradeCard provides.

**Checkpoint**: Pricing page works as a standalone marketing surface, visually matches Figma design.

---

## Phase 7: User Story 5 — Checkout Error Handling (Priority: P3)

**Goal**: If Stripe Checkout session creation fails, user sees a clear error message and can retry.

**Independent Test**: Temporarily break STRIPE_SECRET_KEY → click Purchase → verify error message appears → fix key → click Purchase again → verify Stripe Checkout opens

### Implementation for User Story 5

- [x] T013 [US5] Add error state to `PricingClient` in `apps/web/app/(marketing)/pricing/PricingClient.tsx` — add `error` state. When the POST to `/api/integrations/stripe/checkout` fails or returns a non-ok response, set error message. Display error using `ErrorBanner` from `@/components/ui/ErrorBanner` above or below the UpgradeCard. Clear error on retry. Ensure the Purchase button returns to non-loading state on failure.

**Checkpoint**: Error handling works for checkout failures on both Pricing page and Account page (BillingCTA already has basic error handling via console.error — optionally improve it).

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final verification and cleanup

- [x] T014 Run `make preflight` and verify no regressions against `.agent/baseline.json`
- [x] T015 Manual test all flows per `specs/010-pricing-page/quickstart.md` testing checklist
- [x] T016 Verify Pro user state — sign in as Pro user, visit `/pricing`, confirm Purchase button shows "Current Plan" and is disabled. Visit `/account`, confirm UpgradeCard is not shown and subscription management UI appears instead.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Phase 2 — core purchase flow
- **US2 (Phase 4)**: Depends on Phase 3 (shares PricingClient) — unauthenticated flow
- **US3 (Phase 5)**: Depends on Phase 2 only — can run in parallel with US1/US2
- **US4 (Phase 6)**: Depends on Phase 3 (shares pricing page) — SEO polish
- **US5 (Phase 7)**: Depends on Phase 3 (shares PricingClient) — error handling
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US1 (P1)**: Requires Foundational phase. No other story dependencies. **This is the MVP.**
- **US2 (P1)**: Requires US1 (shares PricingClient with auth/unauth logic). Minimal incremental work — mostly verification.
- **US3 (P2)**: Requires Foundational phase only (UpgradeCard). **Can run in parallel with US1.**
- **US4 (P2)**: Requires US1 (Pricing page exists). SEO/layout polish pass.
- **US5 (P3)**: Requires US1 (PricingClient exists). Error handling enhancement.

### Parallel Opportunities

- T003 and T004 can run in parallel (component file + CSS file)
- T005 is independent of T003/T004
- US3 (Account page refactor) can run in parallel with US1 (Pricing page) since they touch different files
- T011 and T012 can run in parallel (metadata + styles)

---

## Parallel Example: Foundational Phase

```
# These can run in parallel:
Task T003: "Create UpgradeCard component in apps/web/components/pricing/UpgradeCard.tsx"
Task T004: "Create UpgradeCard styles in apps/web/components/pricing/UpgradeCard.module.css"
Task T005: "Update success URL in apps/web/lib/stripe.ts"
```

## Parallel Example: US1 + US3

```
# After Foundational phase, these stories can run in parallel:
# Developer A: US1 (Pricing page)
Task T006: "Create PricingClient in apps/web/app/(marketing)/pricing/PricingClient.tsx"
Task T007: "Create Pricing page in apps/web/app/(marketing)/pricing/page.tsx"

# Developer B: US3 (Account page refactor)
Task T009: "Refactor BillingCTA in apps/web/app/(app)/account/_components/BillingCTA.tsx"
Task T010: "Update BillingCTA styles in apps/web/app/(app)/account/_components/BillingCTA.module.css"
```

---

## Implementation Strategy

### MVP First (US1 Only)

1. Complete Phase 1: Setup (T001-T002)
2. Complete Phase 2: Foundational (T003-T005)
3. Complete Phase 3: US1 — Authenticated Purchase (T006-T007)
4. **STOP and VALIDATE**: Test authenticated purchase flow end-to-end
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → UpgradeCard ready, Stripe URLs updated
2. Add US1 → Authenticated purchase works → **MVP!**
3. Add US2 → Unauthenticated purchase works → Full purchase flow
4. Add US3 → Account page uses UpgradeCard → Reuse proven
5. Add US4 → SEO and marketing polish → Production-ready
6. Add US5 → Error handling → Robust
7. Polish → Preflight, manual test → Ship

---

## Notes

- No database schema changes required
- No new dependencies — reuses existing Stripe, next-auth, and UI infrastructure
- The UpgradeCard component is the linchpin — get Figma fidelity right in T003/T004
- US2 is mostly verification that existing auth callback + GET checkout flow works together
- BillingCTA refactor (US3) is a clean extraction — subscribed state code is untouched
