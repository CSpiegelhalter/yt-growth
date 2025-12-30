## Go-live checklist (Next.js App Router)

### Environment variables (required)
- **NEXT_PUBLIC_APP_URL**: canonical public URL (e.g. `https://getchannelboost.com`)
- **NEXTAUTH_SECRET**: strong secret for NextAuth JWT/session
- **NEXTAUTH_URL**: (recommended) same as NEXT_PUBLIC_APP_URL
- **DATABASE_URL**: Postgres connection string
- **GOOGLE_CLIENT_ID**
- **GOOGLE_CLIENT_SECRET**
- **GOOGLE_REDIRECT_URI** or **GOOGLE_OAUTH_REDIRECT**: OAuth callback URL
- **STRIPE_SECRET_KEY**
- **STRIPE_WEBHOOK_SECRET**
- **STRIPE_PRICE_ID**
- **RESEND_API_KEY**
- **CONTACT_EMAIL** (or **ADMIN_EMAIL**): destination inbox for contact form
- **CRON_SECRET**: protects `/api/private/cron/*`
- **OPENAI_API_KEY**: enables AI features (insights/ideas); without it, some endpoints will return integration errors

### Pre-flight
- **DNS + TLS**: validate apex + www behavior; redirect one canonical host.
- **Health check**: load `/` and `/learn` from a clean browser profile.
- **OAuth**: run `/api/integrations/google/start` → ensure callback returns to `/dashboard`.
- **Stripe**:
  - Checkout: `/api/integrations/stripe/checkout` works for signed-in users.
  - Webhook: Stripe dashboard endpoint points to `/api/integrations/stripe/webhook`.
  - Billing portal: `/api/integrations/stripe/billing-portal` redirects successfully.
- **Cron security**:
  - `/api/private/cron/refresh`: requires `x-cron-secret: <CRON_SECRET>`
  - `/api/private/cron/competitors-snapshot`: requires `Authorization: Bearer <CRON_SECRET>`

### Observability / debugging
- **Request correlation**: every request includes `x-request-id` header on responses.
- **Server logs**: logs are JSON with `level`, `msg`, `route`, `method`, `status`, `durationMs`, `requestId`.
- **When a user reports a problem**:
  - Ask for the **Request ID** (UI surfaces it on key error states).
  - Find that `requestId` in server logs and trace the failing route.

### SEO verification
- **robots**: check `robots.txt` allows public routes and disallows private.
- **sitemap**: check `sitemap.xml` includes only public pages.
- **indexability**:
  - Public: `/`, `/learn`, learn articles, `/contact`, `/terms`, `/privacy` should be indexable.
  - Private: `/dashboard`, `/ideas`, `/competitors`, `/saved-ideas`, `/subscriber-insights`, `/video/*` should be `noindex`.

### Smoke tests
- **Local**: `bun run typecheck` and `bun run build`
- **E2E (optional)**: `bun run test:e2e` (requires test env + DB)


