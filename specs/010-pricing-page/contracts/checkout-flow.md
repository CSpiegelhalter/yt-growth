# Contract: Checkout Flow

**Date**: 2026-03-13

## Existing Endpoints (No Changes to Contract)

### GET /api/integrations/stripe/checkout

**Purpose**: Redirect user to Stripe Checkout (used for unauthenticated purchase flow)

- **Auth**: Optional (rate-limited to 3/min)
- **If authenticated**: Creates checkout session, redirects to Stripe
- **If unauthenticated**: Returns 401 (caller should redirect to sign-in first)
- **Success**: 302 redirect to Stripe Checkout URL
- **Failure**: JSON error response

### POST /api/integrations/stripe/checkout

**Purpose**: Return Stripe Checkout URL as JSON (used for in-app purchase)

- **Auth**: Required
- **Response**: `{ url: string }`
- **Failure**: `{ error: string }`

## Configuration Change

### Success URL Update

**Current**: `/videos?checkout=success`
**New**: `/dashboard?checkout=success`

**Rationale**: Spec FR-007 requires post-purchase redirect to Dashboard.

## Purchase Flow Contracts

### Flow A: Authenticated User (Account page or Pricing page)

```
1. User clicks Purchase
2. Client calls POST /api/integrations/stripe/checkout
3. Client receives { url }
4. Client redirects to url (Stripe Checkout)
5. User completes payment
6. Stripe redirects to /dashboard?checkout=success
```

### Flow B: Unauthenticated User (Pricing page)

```
1. User clicks Purchase
2. Client redirects to /auth/login?callbackUrl=/api/integrations/stripe/checkout
3. User signs in
4. LoginForm redirects to callbackUrl
5. GET /api/integrations/stripe/checkout creates session and redirects to Stripe
6. User completes payment
7. Stripe redirects to /dashboard?checkout=success
```
