# lib/adapters/

External I/O clients — one subdirectory per provider.

## Purpose

Adapters implement port interfaces defined in `lib/ports/`. They handle all
communication with external systems: HTTP APIs, SDKs, cloud storage, AI
services, etc.

## Folder Structure

```
lib/adapters/<provider>/
  client.ts             Main adapter implementation
  types.ts              Provider-specific types (API responses, etc.)
  cache.ts              Caching logic (if applicable)
  index.ts              Barrel re-exports
  __tests__/            Integration/unit tests
```

## Import Rules

**Can import:**
- `lib/ports/` (interfaces to implement)
- `lib/shared/` (cross-domain utilities like logging, crypto)

**Must NOT import:**
- `lib/features/` (adapters don't know about business rules)
- `components/`
- `app/`

## Conventions

- One adapter per external provider (YouTube, Stripe, DataForSEO, Replicate, S3, etc.).
- Adapters handle retries, caching, rate limiting, and provider-specific error wrapping.
- Adapters do NOT make business decisions — if logic depends on business rules,
  it belongs in a feature use-case.
- Adapters map external data formats to port-defined types.

## Example

See `lib/storage/` for an existing adapter pattern:
- `adapter.ts` defines the `StorageAdapter` interface (port)
- `local.ts` and `s3.ts` are adapter implementations
- `index.ts` exports a factory function `getStorage()`
