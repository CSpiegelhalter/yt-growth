# components/features/

Feature-specific UI components, hooks, and presentation formatters.

## Purpose

Each subdirectory corresponds to a domain in `lib/features/<domain>/`. This is
where interactive, client-side UI for a feature lives — including `'use client'`
components, custom hooks, and display-formatting utilities.

## Folder Structure

```
components/features/<domain>/
  <Component>.tsx           Client components
  use<Feature>.ts           React hooks wrapping API calls or state
  formatters.ts             Presentation formatting (optional)
  <Component>.module.css    Component styles
```

## Import Rules

**Can import:**
- `lib/features/<domain>/` (types, schemas)
- `lib/shared/` (format, config)
- `components/ui/` (presentational primitives)
- `lib/client/` (API fetch helpers)

**Must NOT import:**
- `lib/adapters/` (no direct external I/O from UI)
- `lib/server/` (client components cannot use server-only code)
- `app/` (no importing from entrypoints)

## Conventions

- Components here are typically `'use client'` — they handle interactivity.
- Hooks should wrap `lib/client/api.ts` fetch helpers or use TanStack Query.
- Presentation formatters convert domain data to display strings (e.g., format
  subscriber counts, duration labels). Only promote to `lib/shared/format.ts`
  when used by 3+ feature domains.
