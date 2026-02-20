# lib/features/keywords/

Domain logic for keyword research, trends, YouTube SERP analysis, and idea
generation.

## Structure

```
keywords/
  types.ts              Input/output DTOs for use-cases
  schemas.ts            Zod schemas shared across all keyword routes
  errors.ts             KeywordError extends DomainError
  use-cases/
    researchKeywords.ts      Keyword overview/related/combined research
    getKeywordTrends.ts      Google Trends data via DataForSEO
    getYoutubeSerp.ts        YouTube SERP rankings
    generateKeywordIdeas.ts  LLM + DataForSEO video idea orchestration
  index.ts              Barrel re-exports
  __tests__/            Unit tests
```

## Adding a new keyword use-case

1. Define input/output types in `types.ts`.
2. Add a Zod schema in `schemas.ts` (used by the route via `withValidation`).
3. Create a use-case file in `use-cases/` — receive validated DTO, return
   domain result or throw `KeywordError`.
4. Re-export from `index.ts`.
5. Wire the route handler: `withValidation({ body: Schema }, handler)` →
   call use-case → map result to response.
6. Add a unit test in `__tests__/`.

## Import rules

- **Can import**: `lib/ports/`, `lib/shared/`, `@prisma/client`,
  `lib/dataforseo` (current adapter, to be moved to `lib/adapters/` later),
  `lib/keywords/` (legacy mappers — will be absorbed later).
- **Must NOT import**: `lib/adapters/`, `components/`, `app/`, `lib/api/`.
