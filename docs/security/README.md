# Security Documentation

This directory contains security documentation for the ChannelBoost YouTube Growth application, prepared for Google Cloud App Security Assessment (CASA) verification.

## Current State Summary

### Stack Overview

| Component | Technology | Notes |
|-----------|------------|-------|
| Framework | Next.js 16 (App Router) | Server-side rendering + API routes |
| Hosting | Vercel | Edge + Serverless functions |
| Authentication | NextAuth.js + JWT | Cookie-based session tokens |
| Database | PostgreSQL + Prisma ORM | Parameterized queries |
| External APIs | Google/YouTube, Stripe, OpenAI | Server-side only |
| File Uploads | **None** | Not supported - N/A for file security controls |

### Router Type

- **App Router** (`/app` directory)
- No pages/ router usage
- No Server Actions (`"use server"` directives)

### API Routes (49 total)

| Category | Count | Auth Required | Notes |
|----------|-------|---------------|-------|
| `/api/auth/*` | 4 | Mixed | Login, signup, password reset |
| `/api/me/*` | 20 | Yes | User data, channels, videos |
| `/api/integrations/*` | 7 | Mixed | Google OAuth, Stripe |
| `/api/competitors/*` | 2 | Yes | Competitor video analysis |
| `/api/contact` | 1 | No | Contact form (rate limited) |
| `/api/private/*` | 4 | Secret/Admin | Cron jobs, admin tools |
| `/api/dev/*` | 3 | Dev only | Development helpers |
| `/api/test/*` | 8 | Test mode | E2E test helpers |

### External Service Integrations

| Service | Purpose | Auth Method | Key Files |
|---------|---------|-------------|-----------|
| Google OAuth | YouTube channel linking | OAuth 2.0 + refresh tokens | `lib/google-tokens.ts`, `lib/auth.ts` |
| YouTube Data API | Channel/video data | OAuth access token | `lib/youtube-api.ts`, `lib/google-client.ts` |
| YouTube Analytics API | Retention, metrics | OAuth access token | `lib/youtube-analytics.ts` |
| Stripe | Payments/subscriptions | API key + webhooks | `lib/stripe.ts` |
| OpenAI | LLM for content ideas | API key | `lib/llm.ts`, `lib/idea-board-llm.ts` |
| Resend | Email delivery | API key | `app/api/auth/forgot-password/route.ts` |

### Database Usage

- **ORM**: Prisma Client
- **Schema**: `prisma/schema.prisma`
- **No raw SQL**: All queries via Prisma (parameterized)
- **Sensitive fields**:
  - `User.passwordHash` - bcrypt hashed
  - `GoogleAccount.refreshTokenEnc` - OAuth refresh tokens
  - `GoogleAccount.accessTokenEnc` - OAuth access tokens

### Caching Strategy

| Cache Type | TTL | Purpose |
|------------|-----|---------|
| Plan cache | 24h | LLM-generated content plans |
| Retention cache | 12h | YouTube Analytics retention data |
| Video metrics cache | 24h | View/engagement statistics |
| Niche cache | 7d | Channel niche classification |
| Competitor feed | 6h | Competitor video lists |

### Logging

- **Logger**: `lib/logger.ts`
- **Redaction**: Sensitive keys auto-redacted (passwords, tokens, secrets)
- **Format**: Structured JSON with request correlation IDs

### Secret Management

All secrets via environment variables:
- `NEXTAUTH_SECRET` - Session signing
- `EMAIL_TOKEN_SECRET` - Password reset tokens
- `GOOGLE_CLIENT_ID/SECRET` - OAuth
- `STRIPE_SECRET_KEY` - Payments
- `STRIPE_WEBHOOK_SECRET` - Webhook verification
- `OPENAI_API_KEY` - LLM
- `CRON_SECRET` - Cron job auth

## Key Security Files

| File | Purpose |
|------|---------|
| `proxy.ts` | Security headers, request hardening, auth protection |
| `lib/security/authz.ts` | Authorization helpers |
| `lib/security/headers.ts` | Security header configuration |
| `lib/security/validation.ts` | Input validation utilities |
| `lib/api/withAuth.ts` | Route-level authentication |
| `lib/api/withRateLimit.ts` | Rate limiting middleware |
| `lib/api/withValidation.ts` | Zod schema validation |
| `lib/logger.ts` | Redacted logging |
| `lib/crypto.ts` | Password hashing (bcrypt) |
| `lib/stripe.ts` | Webhook signature verification |

## Documentation Index

1. [Trust Boundaries](./trust-boundaries.md) - System architecture and trust zones
2. [Data Flows](./data-flows.md) - DFD Level 0 and Level 1 diagrams
3. [Data Classification](./data-classification.md) - Data types and protection requirements
4. [CASA Evidence Matrix](./casa-evidence-matrix.md) - Control mapping and evidence
5. [Verification Steps](./verification-steps.md) - Manual verification procedures

## No File Uploads

This application **does not accept file uploads**. All controls related to:
- File storage outside web root
- Antivirus scanning
- File permission restrictions
- SVG/scriptable content sanitization

Are explicitly marked as **N/A** in the evidence matrix with justification.
