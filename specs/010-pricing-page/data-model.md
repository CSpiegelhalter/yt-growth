# Data Model: 010-pricing-page

**Date**: 2026-03-13

## No Schema Changes Required

This feature does not require any database schema modifications. All necessary entities already exist.

## Existing Entities Used

### Subscription (read-only for this feature)

| Field | Type | Relevance |
|-------|------|-----------|
| userId | Int (unique) | Link subscription to authenticated user |
| status | String | "active", "past_due", "canceled", "inactive" |
| plan | String | "free", "pro" |
| currentPeriodEnd | DateTime? | Used to verify active period |
| cancelAtPeriodEnd | Boolean | Show cancellation state |
| cancelAt | DateTime? | Scheduled cancellation date |
| stripeCustomerId | String? | Used by checkout to find/create customer |

### User (read-only for this feature)

| Field | Type | Relevance |
|-------|------|-----------|
| id | Int | Passed to createCheckoutSession |
| email | String | Passed to createCheckoutSession for Stripe customer |

## Component Props (Interface Design)

### UpgradeCard Props

```
onPurchase: () => void    — Callback when Purchase is clicked
isPro: boolean            — Whether user already has Pro plan
loading?: boolean         — External loading state control
```

### Purchase Flow State

```
Purchase Intent (transient, URL-based):
  - Encoded as callbackUrl query parameter on sign-in redirect
  - Value: "/api/integrations/stripe/checkout" (GET endpoint)
  - Survives sign-in flow via URL propagation
  - No database storage needed
```
