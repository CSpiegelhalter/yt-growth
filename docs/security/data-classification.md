# Data Classification

This document defines data types, protection levels, and security requirements for all data processed by ChannelBoost.

## Classification Levels

| Level | Definition | Examples |
|-------|------------|----------|
| **CRITICAL** | Compromise enables account takeover or system breach | Passwords, OAuth tokens, signing secrets |
| **HIGH** | Compromise enables unauthorized access to user data | Session tokens, API keys, customer IDs |
| **CONFIDENTIAL** | Sensitive user/business data | YouTube analytics, channel data |
| **PII** | Personally identifiable information | Email, name, IP address |
| **INTERNAL** | Non-public but not sensitive | Cache data, request logs |
| **PUBLIC** | Intentionally public | Landing page content |

## Data Type Classification

### CRITICAL Data

| Data Type | Location | Protection Requirements |
|-----------|----------|------------------------|
| `User.passwordHash` | PostgreSQL | Bcrypt (cost 12), never logged, never exposed |
| `GoogleAccount.refreshTokenEnc` | PostgreSQL | Stored encrypted, never logged, server-only |
| `NEXTAUTH_SECRET` | Env var | ≥256 bits, rotation capability |
| `EMAIL_TOKEN_SECRET` | Env var | ≥256 bits, used for JWT signing |
| `STRIPE_WEBHOOK_SECRET` | Env var | Webhook signature verification |

**Protection Requirements:**
- Encryption: At rest and in transit
- Logging: NEVER logged, even partially
- Access: Server-side only, least privilege
- Retention: Until explicitly revoked/changed
- Backup: Encrypted, access-controlled

### HIGH Data

| Data Type | Location | Protection Requirements |
|-----------|----------|------------------------|
| JWT Session Token | Cookie | HttpOnly, Secure, SameSite=Lax, 30d expiry |
| `GoogleAccount.accessTokenEnc` | PostgreSQL | Encrypted, auto-refresh, server-only |
| `Subscription.stripeCustomerId` | PostgreSQL | Server-only, used for API calls |
| `OAuthState.state` | PostgreSQL | Single-use, 10-min expiry, CSPRNG |

**Protection Requirements:**
- Encryption: TLS in transit, application-level at rest
- Logging: Redacted (first/last 2 chars only)
- Access: Authenticated users only
- Retention: Auto-expire per defined TTL
- Integrity: Signed (JWT) or verified (OAuth state)

### CONFIDENTIAL Data

| Data Type | Location | Protection Requirements |
|-----------|----------|------------------------|
| YouTube Analytics | PostgreSQL (cached) | Auth required, ownership verified |
| Video Retention Data | PostgreSQL | Auth + subscription required |
| Plan Content | PostgreSQL | Auth required, channel ownership |
| Competitor Analysis | PostgreSQL | Auth + subscription required |

**Protection Requirements:**
- Encryption: TLS in transit
- Logging: Allowed but no PII
- Access: Authenticated + authorized
- Retention: Cached 12-24h, deletable on request
- Integrity: Database constraints

### PII Data

| Data Type | Location | Protection Requirements |
|-----------|----------|------------------------|
| `User.email` | PostgreSQL | Validated, unique constraint |
| `User.name` | PostgreSQL | Optional, sanitized |
| IP Address | Logs (redacted) | For rate limiting only, not stored long-term |
| Channel Titles | PostgreSQL | From YouTube API |

**Protection Requirements:**
- Encryption: TLS in transit
- Logging: Redacted where possible
- Access: User's own data or admin
- Retention: Until account deletion
- Deletion: Cascade on user delete

### INTERNAL Data

| Data Type | Location | Protection Requirements |
|-----------|----------|------------------------|
| Request ID | Headers/Logs | Correlation only |
| Cache timestamps | PostgreSQL | TTL management |
| Sync status | PostgreSQL | Internal state |

**Protection Requirements:**
- Encryption: TLS in transit
- Logging: Allowed
- Access: Server-side
- Retention: Per cache TTL

## Protection Matrix

| Level | Encrypted at Rest | Encrypted in Transit | Logged | Client Accessible | Requires Auth |
|-------|-------------------|---------------------|--------|-------------------|---------------|
| CRITICAL | ✅ Hashed/Encrypted | ✅ TLS | ❌ Never | ❌ Never | ✅ N/A (server only) |
| HIGH | ✅ Application | ✅ TLS | ⚠️ Redacted | ❌ Never | ✅ Yes |
| CONFIDENTIAL | ⚠️ Platform | ✅ TLS | ✅ Yes | ⚠️ Filtered | ✅ Yes |
| PII | ⚠️ Platform | ✅ TLS | ⚠️ Redacted | ✅ Own only | ✅ Yes |
| INTERNAL | ⚠️ Platform | ✅ TLS | ✅ Yes | ❌ No | ✅ Yes |
| PUBLIC | ❌ No | ✅ TLS | ✅ Yes | ✅ Yes | ❌ No |

## Implementation Reference

### Password Hashing
```typescript
// lib/crypto.ts
import bcrypt from "bcryptjs";
export const hash = (s: string) => bcrypt.hash(s, 12); // Cost factor 12
export const compare = (s: string, h: string) => bcrypt.compare(s, h);
```

### Log Redaction
```typescript
// lib/logger.ts
const REDACT_KEYS = new Set([
  "authorization", "cookie", "refresh_token", "access_token",
  "id_token", "code", "client_secret", "stripe-signature",
  "password", "passwordHash", "token"
]);
```

### Cookie Configuration
```typescript
// lib/auth.ts - NextAuth cookie config
sessionToken: {
  options: {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: useSecureCookies, // true in production
  }
}
```

## Compliance Mapping

| Requirement | Implementation |
|-------------|---------------|
| GDPR Art. 32 - Security | Encryption, access controls, logging |
| GDPR Art. 17 - Right to Erasure | Cascade delete on user removal |
| CCPA - Do Not Sell | No data selling, limited third-party sharing |
| SOC 2 - Confidentiality | Classification levels, access controls |
| CASA - Data Protection | This document + implementation |
