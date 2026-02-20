# lib/features/

Domain logic, use-cases, schemas, types, and errors — organized by domain.

## Purpose

Each subdirectory represents a bounded domain (e.g., `competitors/`,
`keywords/`, `channel-profile/`). Features contain the business rules of the
application, independent of HTTP handling and external I/O.

## Folder Structure

```
lib/features/<domain>/
  types.ts              Domain types and interfaces
  schemas.ts            Zod validation schemas
  errors.ts             DomainError subclasses for this domain
  use-cases/
    <verbNoun>.ts       One file per use-case function
  index.ts              Barrel re-exports (public API only)
  __tests__/            Unit tests
```

## Import Rules

**Can import:**
- `lib/ports/` (interface contracts for external I/O)
- `lib/shared/` (cross-domain utilities)
- `@prisma/client` (database access is acceptable in features)

**Must NOT import:**
- `lib/adapters/` (use ports instead)
- `components/`
- `app/`

## Conventions

- Features receive already-validated, typed inputs.
- Features return domain types or throw `DomainError`.
- Features do NOT return `Response` objects or handle HTTP concerns.
- Use-case functions are the primary public API — keep them focused on a single operation.
- Schemas in `schemas.ts` are used by route handlers via `withValidation()`.

## Example

```ts
// lib/features/competitors/use-cases/discoverCompetitors.ts
import type { CompetitorPort } from "@/lib/ports/CompetitorPort";
import { CompetitorError } from "../errors";
import type { DiscoverInput, CompetitorResult } from "../types";

export async function discoverCompetitors(
  input: DiscoverInput,
  port: CompetitorPort,
): Promise<CompetitorResult[]> {
  const results = await port.search(input.query, input.niche);
  if (results.length === 0) {
    throw new CompetitorError("NOT_FOUND", "No competitors found for query");
  }
  return results;
}
```
