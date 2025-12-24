# Testing Guide

This document explains how to run tests for the ChannelBoost frontend application.

## Overview

The test suite includes:

- **Unit Tests** (Vitest): Fast, isolated tests for individual functions
- **Integration Tests** (Vitest): Tests against real database
- **E2E Tests** (Playwright): Full browser-based tests of user flows
- **Stripe Checkout Tests** (Playwright): Real Stripe checkout flow with webhooks

## Prerequisites

### 1. Database Setup

Tests require a PostgreSQL database. Use Docker Compose:

```bash
# Start the database
bun run db:up

# Create the test database (one-time setup)
docker exec -it yt-growth-postgres psql -U yt_growth -c "CREATE DATABASE channelboost_test;"

# Run migrations on test database
DATABASE_URL="postgresql://yt_growth:yt_growth_dev@localhost:5432/channelboost_test?schema=public" bunx prisma migrate deploy
```

### 2. Environment Setup

Copy the test environment template:

```bash
cp env.test.example .env.test
```

Or set environment variables directly:

```bash
export APP_TEST_MODE=1
export FAKE_YOUTUBE=1
export DISABLE_RATE_LIMITS=1
export DATABASE_URL="postgresql://yt_growth:yt_growth_dev@localhost:5432/channelboost_test?schema=public"
```

## Running Tests

### Quick Commands

```bash
# Run all tests (unit + integration + e2e)
bun run test:all

# Run only unit tests (fast, no DB)
bun run test:unit

# Run only integration tests (requires database)
bun run test:integration

# Run E2E tests headless
bun run test:e2e

# Run E2E tests with UI (interactive)
bun run test:e2e:ui

# Run E2E tests with visible browser
bun run test:e2e:headed

# Run Stripe checkout tests (real Stripe, see below)
bun run test:e2e:stripe
```

### Unit Tests

Unit tests are fast and don't require a database:

```bash
bun run test:unit

# Watch mode (re-run on changes)
bun run test:unit:watch
```

### Integration Tests

Integration tests require a running database:

```bash
# Ensure database is running
bun run db:up

# Run integration tests
bun run test:integration
```

### E2E Tests

E2E tests run in a real browser and test full user flows:

```bash
# Run headless (CI mode)
bun run test:e2e

# Run with Playwright UI (interactive debugging)
bun run test:e2e:ui

# Run with visible browser
bun run test:e2e:headed
```

## Stripe Checkout Tests (Real Integration)

The `stripe-checkout.spec.ts` tests verify the **real** Stripe checkout flow:

1. User clicks upgrade button on profile page
2. Gets redirected to Stripe Checkout (checkout.stripe.com)
3. Fills in test card details (4242424242424242)
4. Completes payment
5. Webhook fires and updates subscription to PRO

### Prerequisites for Stripe Tests

1. **Install Stripe CLI**: https://stripe.com/docs/stripe-cli

2. **Start the webhook listener** (in a separate terminal):

```bash
stripe listen --forward-to localhost:3000/api/integrations/stripe/webhook
```

Copy the webhook signing secret (`whsec_...`) it displays.

3. **Configure .env.local** with real test keys:

```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...  # From stripe listen output
STRIPE_PRICE_ID=price_...        # Your subscription price ID
```

4. **Start the dev server** (NOT test mode, we want real Stripe):

```bash
bun run dev
```

5. **Run Stripe tests**:

```bash
bun run test:e2e:stripe
```

### Test Card Numbers

| Card Number          | Result                |
|---------------------|-----------------------|
| 4242424242424242    | Success               |
| 4000000000000002    | Declined              |
| 4000002500003155    | Requires authentication|

## Test Mode Flags

The application uses these environment flags for testing:

| Flag | Purpose |
|------|---------|
| `APP_TEST_MODE=1` | Enables test-only API routes (`/api/test/*`) |
| `FAKE_YOUTUBE=1` | Uses fake YouTube data, no real OAuth |
| `DISABLE_RATE_LIMITS=1` | Disables rate limiting for faster tests |

## Test-Only API Routes

When `APP_TEST_MODE=1`, these routes are available:

### YouTube (Fake)

```bash
# Link a fake YouTube channel
POST /api/test/youtube/link
Body: { "channelId": "UC_custom_id", "title": "My Channel" }

# Unlink a channel
POST /api/test/youtube/unlink
Body: { "channelId": "UC_custom_id" }  # or empty to unlink all
```

### Billing (Fake)

```bash
# Set user to PRO plan
POST /api/test/billing/set-pro

# Set user to FREE plan
POST /api/test/billing/set-free

# Set subscription to canceled (with end date)
POST /api/test/billing/set-canceled?endsAt=2025-12-31T23:59:59Z
```

### Usage Reset (Dev)

```bash
# Reset today's usage counters
POST /api/private/dev/reset-usage
```

## Database Reset

To reset the test database:

```bash
# Full reset with migrations and seed data
bun run test:db:reset

# Or manually:
bun scripts/test/reset-db.ts
```

## Test Structure

```
apps/frontend/
├── e2e/                          # Playwright E2E tests
│   ├── fixtures/
│   │   └── test-helpers.ts       # Shared test utilities
│   ├── global-setup.ts           # Runs before all tests
│   ├── global-teardown.ts        # Runs after all tests
│   ├── auth.spec.ts              # Authentication tests
│   ├── billing.spec.ts           # Billing/subscription tests
│   ├── gating.spec.ts            # Feature gating tests
│   ├── youtube.spec.ts           # Channel management tests
│   ├── smoke.spec.ts             # Page load smoke tests
│   ├── happy-path.spec.ts        # Main user journey
│   └── stripe-checkout.spec.ts   # Real Stripe checkout tests
├── tests/
│   ├── unit/                     # Vitest unit tests
│   │   ├── entitlements.test.ts
│   │   └── test-mode.test.ts
│   └── integration/              # Vitest integration tests
│       ├── setup.ts              # Test setup and fixtures
│       ├── entitlements.test.ts
│       └── usage.test.ts
├── lib/__tests__/                # Legacy unit tests (also runs)
│   ├── retention.test.ts
│   └── use-retention.test.ts
├── scripts/test/
│   ├── reset-db.ts               # Database reset script
│   └── run-e2e.ts                # E2E test orchestrator
├── playwright.config.ts          # Playwright configuration
├── vitest.config.ts              # Unit test configuration
├── vitest.integration.config.ts  # Integration test configuration
└── env.test.example              # Test environment template
```

## Writing Tests

### Test User Credentials

Standard test users (seeded by `reset-db.ts`):

```typescript
// Demo user (PRO, with seeded channel)
email: "demo@example.com"
password: "demo123"

// Free user (no channel)
email: "free@example.com"
password: "demo123"

// E2E test user
email: "e2e@example.com"
password: "Password123!"
```

### E2E Test Helpers

Use the helpers in `e2e/fixtures/test-helpers.ts`:

```typescript
import {
  signIn,
  signUp,
  signOut,
  setBillingState,
  linkFakeChannel,
  unlinkFakeChannel,
  getMe,
  DEMO_USER,
  TEST_USER,
} from "./fixtures/test-helpers";

test("example test", async ({ page }) => {
  // Sign in
  await signIn(page, DEMO_USER);

  // Set billing state
  await setBillingState(page, "pro");

  // Link a fake channel
  await linkFakeChannel(page, {
    channelId: "UC_test",
    title: "Test Channel",
  });

  // Get user info
  const me = await getMe(page);
  expect(me.plan).toBe("pro");
});
```

### Data Test IDs

When elements need to be found reliably, add `data-testid` attributes:

```tsx
<button data-testid="upgrade-button">Upgrade</button>
```

Then in tests:

```typescript
await page.locator('[data-testid="upgrade-button"]').click();
```

## CI/CD

For CI environments, set these environment variables:

```yaml
env:
  APP_TEST_MODE: "1"
  FAKE_YOUTUBE: "1"
  DISABLE_RATE_LIMITS: "1"
  DATABASE_URL: "postgresql://..."
  CI: "true"
```

The Playwright config automatically adjusts for CI:

- Uses single worker
- Adds retries
- Uses GitHub reporter

## Troubleshooting

### Unit tests hang forever (vitest issue)

We use bun's native test runner instead of vitest because vitest hangs in this project:

```bash
bun run test:unit
# This uses: bun test tests/unit lib/__tests__
```

If you need to add new tests, use `bun:test` imports:

```typescript
import { describe, it, expect } from "bun:test";
```

### Tests are flaky

1. Avoid arbitrary timeouts; use `expect().toBeVisible()` instead
2. Wait for network idle: `await page.waitForLoadState("networkidle")`
3. Use unique test data to avoid conflicts

### Database connection errors

1. Ensure Docker is running: `docker ps`
2. Check database exists: `docker exec -it yt-growth-postgres psql -U yt_growth -l`
3. Run migrations: `DATABASE_URL="..." bunx prisma migrate deploy`

### E2E tests can't find elements

1. Check if the element has loaded: add `await page.waitForLoadState("networkidle")`
2. Use more specific selectors or add `data-testid` attributes
3. Run in UI mode to debug: `bun run test:e2e:ui`

### Stripe tests failing

1. Make sure `stripe listen` is running in another terminal
2. Check that STRIPE_WEBHOOK_SECRET matches the `whsec_...` from stripe listen
3. Run with visible browser to see what's happening: `bun run test:e2e:stripe`

### Test mode routes return 404

Ensure `APP_TEST_MODE=1` is set in your environment. These routes are disabled in production.
