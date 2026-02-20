# lib/shared/

Cross-domain utilities — last resort location.

## Purpose

Shared contains utilities that are genuinely used across 3+ domains and do not
belong to any single feature or adapter. This is intentionally restrictive to
prevent shared from becoming a dumping ground.

## Import Rules

**Can import:**
- Nothing in the application (shared is a leaf layer)
- External packages only

**Must NOT import:**
- `lib/features/`
- `lib/adapters/`
- `lib/ports/`
- `components/`
- `app/`

**Imported by:**
- `lib/features/`, `lib/adapters/`, `lib/api/`, `lib/server/`, `components/`

## What Belongs Here

- Logging (`logger.ts`)
- Cryptographic utilities (`crypto.ts`, `content-hash.ts`, `stable-hash.ts`)
- Date/number/currency formatting (`format.ts`)
- Error base classes (`errors.ts`)
- App-wide config constants (`config/brand.ts`, `config/product.ts`)

## What Does NOT Belong Here

- Feature-specific helpers (put in `lib/features/<domain>/`)
- Provider-specific utilities (put in `lib/adapters/<provider>/`)
- Presentation formatting (put in `components/features/<domain>/`)
- Anything used by only 1-2 modules (keep it local, promote later)

## Before Adding

1. Search existing `lib/shared/` — does a similar function already exist?
2. Confirm at least 3 domains need it.
3. If in doubt, keep it in the feature folder and promote to shared later.
