# Quickstart: 010-pricing-page

**Date**: 2026-03-13

## Prerequisites

- Stripe test keys configured in `.env` (STRIPE_SECRET_KEY, STRIPE_PRICE_ID, STRIPE_WEBHOOK_SECRET)
- Database running (`make db-up`)
- Stripe CLI for webhook testing: `stripe listen --forward-to localhost:3000/api/integrations/stripe/webhook`

## Development

```bash
make dev
```

Visit `http://localhost:3000/pricing` to see the Pricing page.

## Testing Checklist

### Manual Testing

1. **Pricing page renders** — Visit `/pricing` while signed out. Verify the upgrade card with gradient header, feature list, price, and Purchase button.

2. **Unauthenticated purchase** — Click Purchase while signed out. Verify redirect to `/auth/login?callbackUrl=/api/integrations/stripe/checkout`. Sign in. Verify redirect to Stripe Checkout.

3. **Authenticated purchase** — Sign in first, then visit `/pricing`. Click Purchase. Verify direct redirect to Stripe Checkout. Complete with test card `4242 4242 4242 4242`. Verify redirect to `/dashboard?checkout=success`.

4. **Account page upgrade** — Sign in as Free user. Visit `/account`. Verify upgrade card appears. Click Purchase. Verify redirect to Stripe Checkout.

5. **Pro user state** — Sign in as Pro user. Visit `/pricing`. Verify Purchase button is disabled or shows "Current Plan".

6. **Error handling** — Temporarily break STRIPE_SECRET_KEY. Click Purchase. Verify error message appears.

## Key Files

| File | Purpose |
|------|---------|
| `app/(marketing)/pricing/page.tsx` | Pricing page (server component) |
| `components/pricing/UpgradeCard.tsx` | Reusable pricing card component |
| `components/pricing/UpgradeCard.module.css` | Pricing card styles |
| `app/(app)/account/_components/BillingCTA.tsx` | Refactored to use UpgradeCard |
| `lib/stripe.ts` | Success URL update |
