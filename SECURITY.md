# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| Latest  | :white_check_mark: |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability, please report it responsibly.

### How to Report

1. **DO NOT** create a public GitHub issue for security vulnerabilities
2. Email security concerns to: [security@getchannelboost.com](mailto:security@getchannelboost.com)
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Any suggested fixes

### Response Timeline

- **Acknowledgment**: Within 48 hours
- **Initial Assessment**: Within 5 business days
- **Resolution Target**: Within 30 days for critical issues

### What to Expect

1. We will acknowledge receipt of your report
2. We will investigate and validate the issue
3. We will work on a fix and coordinate disclosure
4. We will credit you (if desired) in our security acknowledgments

## Security Architecture

### Authentication

- **Method**: JWT-based sessions via NextAuth.js
- **Storage**: HttpOnly, Secure, SameSite=Lax cookies
- **Session Duration**: 30 days maximum
- **Password Requirements**: Minimum 12 characters

### Authorization

- All access control decisions are made server-side
- Resource ownership verified on every request
- Subscription status checked before premium features
- Admin access controlled via environment variables

### Data Protection

- Passwords hashed with bcrypt (cost factor 12)
- OAuth tokens stored server-side only
- Sensitive data redacted from logs
- TLS required for all connections

### External Integrations

| Service | Security Measures |
|---------|-------------------|
| Google OAuth | State parameter, PKCE where available |
| YouTube API | OAuth tokens, server-side only |
| Stripe | Webhook signature verification, server-side only |
| OpenAI | API key server-side only, no PII in prompts |

## Dependency Policy

### Automated Scanning

- **npm audit**: Run on every CI build
- **Dependabot**: Enabled for security updates
- **Manual review**: Required for major updates

### Update Policy

| Severity | Response Time |
|----------|---------------|
| Critical | Within 24 hours |
| High | Within 7 days |
| Medium | Within 30 days |
| Low | Next regular update |

### Allowed Dependencies

We prefer minimal dependencies. New dependencies require:

1. Security review (npm audit, known vulnerabilities)
2. Maintenance status check (active maintainers)
3. License compatibility (MIT, Apache 2.0, BSD preferred)

## Security Headers

All responses include:

```
Content-Security-Policy: default-src 'self'; ...
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Strict-Transport-Security: max-age=31536000; includeSubDomains
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

## Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| Plan generation | 5 | 1 hour |
| Video sync | 10 | 1 hour |
| Checkout | 3 | 1 minute |
| Contact form | 5 | 1 hour |

## Incident Response

### Severity Levels

| Level | Definition | Response |
|-------|------------|----------|
| Critical | Active exploitation, data breach | Immediate, all-hands |
| High | Exploitable vulnerability | Within 4 hours |
| Medium | Theoretical vulnerability | Within 24 hours |
| Low | Hardening opportunity | Planned sprint |

### Response Steps

1. **Contain**: Isolate affected systems
2. **Assess**: Determine scope and impact
3. **Remediate**: Apply fixes
4. **Notify**: Inform affected users if required
5. **Review**: Post-incident analysis

## Compliance

This application is designed to meet:

- **CASA** (Cloud App Security Assessment) for Google OAuth verification
- **OWASP ASVS** Level 2 controls
- **GDPR** data protection requirements
- **SOC 2** Type II security principles

## Security Documentation

Detailed security documentation is available in `/docs/security/`:

- [Trust Boundaries](./docs/security/trust-boundaries.md)
- [Data Flows](./docs/security/data-flows.md)
- [Data Classification](./docs/security/data-classification.md)
- [CASA Evidence Matrix](./docs/security/casa-evidence-matrix.md)
- [Verification Steps](./docs/security/verification-steps.md)

## Contact

For security inquiries: security@getchannelboost.com
