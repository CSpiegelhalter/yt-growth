# components/layout/

App shell, navigation, and structural layout components.

## Purpose

Layout components define the persistent structure of the application: the app
header, sidebar, mobile navigation, and shell wrappers. These components are
shared across all pages within a route group.

## Import Rules

**Can import:**
- `lib/shared/` (config constants like nav items, brand)
- `lib/server/` (for server-rendered layout data like user/session)
- `components/ui/` (presentational primitives)

**Must NOT import:**
- `lib/features/` (layout is structural, not feature-specific)
- `lib/adapters/` (no direct external I/O)

## Existing Components

The `components/navigation/` folder currently holds layout components
(AppHeader, AppSidebar, AppShell, MobileNav). During migration, these will
move here. Until then, both locations are acceptable.

## Conventions

- Prefer React Server Components for layout where possible.
- Client interactivity (mobile menu toggle, sidebar collapse) should be isolated
  in small client component leaves.
