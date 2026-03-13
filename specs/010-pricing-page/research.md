# Research: 010-pricing-page

**Date**: 2026-03-13

## R1: Existing Stripe Checkout Infrastructure

**Decision**: Reuse and extend existing `createCheckoutSession()` in `lib/stripe.ts`

**Rationale**: Full checkout infrastructure already exists:
- `lib/stripe.ts` → `createCheckoutSession(userId, email)` creates Stripe sessions
- `app/api/integrations/stripe/checkout/route.ts` → GET (redirect) and POST (JSON URL) endpoints
- Success URL: `/videos?checkout=success`, Cancel URL: `/videos?checkout=canceled`
- Webhook at `app/api/integrations/stripe/webhook/route.ts` handles `checkout.session.completed`

**Changes needed**:
- Update success URL from `/videos?checkout=success` to `/dashboard?checkout=success` (per spec FR-007)
- The GET endpoint already supports unauthenticated access (optional auth, redirects to checkout) — this is useful for the pricing page flow
- The POST endpoint requires auth — used by in-app BillingCTA

**Alternatives considered**:
- Creating a new checkout endpoint → Rejected: duplication, constitution violation (Code Minimalism)
- Server action for checkout → Rejected: existing API route pattern is tested and production-ready

## R2: Auth Sign-In with Callback URL

**Decision**: Use `/auth/login?callbackUrl=<url>` for purchase-intent handoff

**Rationale**: The existing LoginForm reads `callbackUrl` from query params and redirects after successful sign-in:
```tsx
const callbackUrl = sp.get("callbackUrl") || "/dashboard";
// After sign-in: window.location.href = callbackUrl;
```

**Flow for unauthenticated purchase**:
1. User clicks Purchase on Pricing page
2. Redirect to `/auth/login?callbackUrl=/api/integrations/stripe/checkout` (GET endpoint)
3. After sign-in, user redirected to the GET checkout endpoint
4. GET checkout endpoint creates session and redirects to Stripe

**Alternatives considered**:
- Storing purchase intent in localStorage → Rejected: fragile, doesn't survive incognito/different browser
- Custom middleware → Rejected: constitution forbids Next.js middleware
- Server action with redirect → Rejected: more complex, existing pattern works

## R3: Existing BillingCTA Component Analysis

**Decision**: Extract shared pricing card UI from BillingCTA into a new reusable `UpgradeCard` component

**Rationale**: The existing `BillingCTA` at `app/(app)/account/_components/BillingCTA.tsx` handles both subscribed and unsubscribed states. The "upgrade" half (lines 120-149) contains the pricing card UI that needs to be shared. However:
- It's tightly coupled to the Account page context (always calls POST checkout, no sign-in gating)
- It uses a gradient background (imperial-blue → cool-sky) that differs from the Figma design (hot-rose → cool-sky)
- It doesn't match the Figma layout (card with white body + gradient header)

**Approach**:
- Create a new reusable `UpgradeCard` component matching the Figma design
- Refactor `BillingCTA` to use `UpgradeCard` for the upgrade state
- `UpgradeCard` accepts an `onPurchase` callback for context-specific behavior

**Alternatives considered**:
- Modifying BillingCTA to be reusable → Rejected: it handles too many states (subscribed management + upgrade). Extracting the upgrade card is cleaner.
- Making BillingCTA accept a `variant` prop → Rejected: two very different UIs in one component violates Code Minimalism

## R4: Design Token Mapping (Figma → CSS Variables)

**Decision**: Map Figma design values to existing CSS variables

| Figma Value | CSS Variable | Usage |
|-------------|-------------|-------|
| `#222A68` | `var(--color-imperial-blue)` | Card border, text, purchase button bg |
| `#CA1F7B` | `var(--color-hot-rose)` | Gradient start |
| `#35A7FF` | `var(--color-cool-sky)` | Gradient end |
| `#F3F4FB` | `var(--sidebar-bg)` | Page background |
| `white` | `var(--bg)` | Card body background |
| Fustat Bold 20px | `font-weight: var(--font-bold)` | Card title |
| Fustat Bold 18px | `font-weight: var(--font-bold); font-size: var(--text-lg)` | Feature items |
| Fustat Bold 22px | `font-weight: var(--font-bold); font-size: var(--text-subtitle-size)` | Price |
| 20px border-radius | `var(--radius-lg, 16px)` | Card (use 20px as override or add `--radius-xl`) |
| 8px border-radius | `var(--radius-md, 8px)` | Button |

**Gradient token**: The header gradient (hot-rose → cool-sky at ~167°) matches `--gradient-positive: linear-gradient(90deg, var(--color-hot-rose), var(--color-cool-sky))` but with a different angle. Use the same colors with adjusted angle.

## R5: Routing Decision

**Decision**: Place Pricing page at `app/(marketing)/pricing/page.tsx`

**Rationale**:
- The marketing layout group already renders `StaticNav` which has a "Pricing" link pointing to `/pricing`
- No existing `/pricing` route — this is a new page
- Public-facing, no auth required to view, consistent with other marketing pages
- The `(marketing)` layout provides the right shell (StaticNav only, no sidebar)

## R6: Pro Plan Detection

**Decision**: Use existing `getPlanFromSubscription()` and `getSubscriptionStatus()` utilities

**Rationale**: Full entitlement logic exists in `lib/features/subscriptions/use-cases/checkEntitlement.ts`:
- `getPlanFromSubscription()` returns `"FREE"` or `"PRO"` based on subscription status
- Checks `isActive`, `plan`, and `currentPeriodEnd`
- Already used throughout the app

For the Pricing page (server component), fetch subscription status server-side if authenticated, pass as prop to the pricing component.
