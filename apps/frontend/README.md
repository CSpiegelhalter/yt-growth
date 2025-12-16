## YouTube Growth Consultant (Next.js)

### Prereqs
- Node 18+
- Postgres

### Setup
1) `cd apps/frontend`
2) `npm install`
3) Copy `.env.local.example` to `.env.local` and fill:
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `NEXT_PUBLIC_WEB_URL`
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`
   - `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_SUCCESS_URL`, `STRIPE_CANCEL_URL`
   - `OPENAI_API_KEY`, `OPENAI_MODEL`
   - `CRON_SECRET`
4) `npx prisma migrate dev` (or `prisma generate` if migrations already applied)
5) `npm run dev`

### Flows
- Connect YouTube: `/api/integrations/google/start` → callback stores refresh token.
- Sync videos/metrics: `POST /api/me/channels/:id/sync`.
- Decide-for-Me plan: `POST /api/me/channels/:id/plan/generate` (paid).
- Retention cliffs: `GET /api/me/channels/:id/retention` (paid).
- Subscriber audit: `GET /api/me/channels/:id/subscriber-audit` (paid).
- Stripe: `POST /api/integrations/stripe/checkout|billing-portal|webhook`.
- Cron refresh: `POST /api/private/cron/refresh` with `X-CRON-SECRET`.

### Testing
- `npm test` runs vitest (retention algorithm coverage).
