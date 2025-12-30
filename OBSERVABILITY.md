## Observability

### What we log (server)
API handlers are wrapped with `createApiRoute(...)`, which emits structured JSON logs for:
- **api.request.start**: request entry
- **api.request.finish**: response exit with `durationMs` and `status`
- **api.request.error**: unexpected thrown errors (caught by the wrapper)

Common fields:
- **requestId**: correlates browser ↔ server (`x-request-id` header)
- **route**, **method**
- **status**, **durationMs**
- **userId** (when the handler uses `withAuth`)
- **channelId**, **videoId** when available from route params

### Request ID generation / propagation
- `middleware.ts` reads `x-request-id` or generates one, then:
  - sets it on the downstream request
  - sets it on the response
- API wrappers also guarantee the response includes `x-request-id`.

### Sensitive data redaction
`lib/logger.ts` redacts common secrets/tokens (auth headers, cookies, oauth codes, Stripe signatures, passwords, tokens).

### How to debug a production incident
1. From the UI or client, grab the response `x-request-id` (or UI surface when available).
2. Search server logs for that `requestId`.
3. The `api.request.finish` entry shows status + duration; `api.request.error` includes normalized error info.


