# Security Verification Steps

This document provides concrete steps to verify security controls are working correctly.

## Prerequisites

```bash
# Set your app URL
export APP_URL="https://your-app.vercel.app"
# Or for local testing
export APP_URL="http://localhost:3000"
```

## 1. Security Headers Verification

### Check all security headers

```bash
curl -I "$APP_URL" 2>/dev/null | grep -E "^(X-|Content-Security|Strict-Transport|Referrer)"
```

**Expected output:**
```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'; ...
```

### Verify CSP blocks inline scripts (manual)

1. Open browser DevTools → Console
2. Try to inject: `<script>alert('xss')</script>` in any input
3. Should be blocked by CSP

## 2. JWT/Session Verification

### Check session cookie attributes

```bash
# After logging in, check cookies
curl -c cookies.txt -b cookies.txt "$APP_URL/api/auth/session" \
  -H "Content-Type: application/json"

# Inspect cookie file
cat cookies.txt | grep -E "(session|csrf)"
```

**Expected cookie attributes:**
- `HttpOnly` flag present
- `Secure` flag present (production)
- `SameSite=Lax`

### Test expired token rejection

```bash
# Create an expired JWT (for testing - modify exp claim)
EXPIRED_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE1MDAwMDAwMDB9.invalid"

curl -X GET "$APP_URL/api/me" \
  -H "Cookie: __Secure-next-auth.session-token=$EXPIRED_TOKEN" \
  -w "\nHTTP Status: %{http_code}\n"
```

**Expected:** HTTP 401 Unauthorized

### Test invalid signature rejection

```bash
# Use a token with invalid signature
curl -X GET "$APP_URL/api/me" \
  -H "Cookie: __Secure-next-auth.session-token=invalid.token.here" \
  -w "\nHTTP Status: %{http_code}\n"
```

**Expected:** HTTP 401 Unauthorized

## 3. CSRF Protection Verification

### Verify SameSite cookie protection

```bash
# Try cross-origin request (should fail due to SameSite=Lax)
curl -X POST "$APP_URL/api/me/channels/test/sync" \
  -H "Origin: https://attacker.com" \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n"
```

**Expected:** HTTP 401 (no cookies sent due to SameSite)

### Check NextAuth CSRF token

```bash
curl "$APP_URL/api/auth/csrf" \
  -c cookies.txt
```

**Expected:** Returns `csrfToken` in JSON

## 4. Rate Limiting Verification

### Test contact form rate limit (5/hour)

```bash
for i in {1..7}; do
  echo "Request $i:"
  curl -X POST "$APP_URL/api/contact" \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","subject":"general","message":"Test message for rate limiting"}' \
    -w "\nHTTP Status: %{http_code}\n\n"
  sleep 1
done
```

**Expected:** Requests 6-7 should return HTTP 429

### Check rate limit headers

```bash
curl -X POST "$APP_URL/api/contact" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","subject":"general","message":"Test message"}' \
  -I 2>/dev/null | grep -E "(X-RateLimit|Retry-After)"
```

## 5. Authorization Verification

### Test IDOR protection (channel ownership)

```bash
# First, get valid auth token and try to access another user's channel
# Replace with actual channel ID that doesn't belong to the user

curl -X GET "$APP_URL/api/me/channels/UCxxxxxxxxxxxxxxx" \
  -H "Cookie: __Secure-next-auth.session-token=YOUR_TOKEN" \
  -w "\nHTTP Status: %{http_code}\n"
```

**Expected:** HTTP 404 (Channel not found - because ownership check fails)

### Test subscription gating

```bash
# As free user, try to access premium endpoint
curl -X POST "$APP_URL/api/me/channels/YOUR_CHANNEL/plan/generate" \
  -H "Cookie: __Secure-next-auth.session-token=FREE_USER_TOKEN" \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n"
```

**Expected:** HTTP 402 (Subscription required)

## 6. Input Validation Verification

### Test password length requirement

```bash
curl -X POST "$APP_URL/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"short"}' \
  -w "\nHTTP Status: %{http_code}\n"
```

**Expected:** HTTP 400 with validation error about 12 character minimum

### Test email validation

```bash
curl -X POST "$APP_URL/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{"email":"not-an-email","password":"validpassword123"}' \
  -w "\nHTTP Status: %{http_code}\n"
```

**Expected:** HTTP 400 with email validation error

## 7. Log Redaction Verification

### Check that tokens are not logged

```bash
# Trigger an error that would log request details
curl -X POST "$APP_URL/api/me/channels/invalid/sync" \
  -H "Cookie: __Secure-next-auth.session-token=eyJhbGciOiJIUzI1NiJ9.test.signature" \
  -H "Authorization: Bearer sk-test-secretkey" \
  -w "\nHTTP Status: %{http_code}\n"

# Then check Vercel logs (or local console) - tokens should be redacted
```

**Expected in logs:** 
- `authorization: "Be***re"` (redacted)
- No full JWT tokens visible

## 8. OAuth Security Verification

### Check OAuth state parameter

```bash
# Start OAuth flow and check state parameter
curl -I "$APP_URL/api/integrations/google/start" \
  -H "Cookie: __Secure-next-auth.session-token=VALID_TOKEN" 2>/dev/null \
  | grep -i "location"
```

**Expected:** Redirect URL includes `state=` parameter (random hex string)

### Verify state is single-use

```bash
# After completing OAuth, try to reuse state
# The state should be deleted from database after first use
```

## 9. TLS Verification

### Check TLS configuration (production)

```bash
# Using curl to check TLS
curl -vvI "https://your-app.vercel.app" 2>&1 | grep -E "(SSL|TLS|cipher)"

# Or use SSL Labs (manual)
# Visit: https://www.ssllabs.com/ssltest/analyze.html?d=your-app.vercel.app
```

**Expected:** TLS 1.2 or 1.3, strong cipher suites

## 10. No Sensitive Data in URLs

### Verify tokens not in URLs

```bash
# Check that API routes don't accept tokens in query params
curl -X GET "$APP_URL/api/me?token=test-token" \
  -w "\nHTTP Status: %{http_code}\n"
```

**Expected:** HTTP 401 (token in query param is ignored)

## Automated Test Commands

### Run all security tests

```bash
# From project root
bun test tests/security
```

### Run security lint checks

```bash
# Check for security issues in code
bun run lint
bun run typecheck
```

### Run dependency audit

```bash
npm audit --audit-level=high
```

## Verification Checklist

| Check | Command | Expected Result | Pass |
|-------|---------|-----------------|------|
| Security headers present | `curl -I $APP_URL` | All headers set | ☐ |
| Session cookies secure | Check cookie file | HttpOnly, Secure, SameSite | ☐ |
| Rate limiting works | 7 requests to /api/contact | 429 after 5 | ☐ |
| IDOR protection | Access other user's channel | 404 | ☐ |
| Password validation | Short password signup | 400 error | ☐ |
| OAuth state used | Start OAuth flow | State in URL | ☐ |
| Tokens redacted in logs | Trigger error | No plaintext tokens | ☐ |
| TLS enforced | SSL Labs test | A rating | ☐ |
