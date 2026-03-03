# Research: Frontend Component Audit & Refactor

**Branch**: `001-frontend-refactor` | **Date**: 2026-03-03

## 1. UI Component Library Strategy

**Decision**: Create 6 new components in `components/ui/` following
the existing Tag component pattern (named export + CSS module +
variant props + CSS custom properties).

**Rationale**: The audit identified 10+ duplicated patterns across
20+ files. Each proposed component addresses 3+ instances of
duplication, meeting the Code Minimalism principle threshold for
justified abstraction.

**Alternatives considered**:
- Radix UI / Headless UI adoption — rejected because the project
  already has a working pattern (Tag, EmptyState, ErrorState) and
  introducing a library conflicts with the "minimal dependencies"
  approach.
- Tailwind utility classes — rejected because the project uses CSS
  modules + CSS custom properties as its established pattern.

## 2. Component API Patterns

**Decision**: Follow the established component pattern:

```typescript
type ComponentProps = {
  variant?: 'primary' | 'secondary' | ...;
  size?: 'sm' | 'md';
  children: ReactNode;
  className?: string;
};
```

**Rationale**: Matches existing Tag, EmptyState, ErrorState, and
Skeleton APIs. Variant-based discrimination, optional className for
composition, CSS module class concatenation with `.trim()`.

**Key conventions derived from existing components**:
- Props type named `{Component}Props`
- CSS module imported as `styles`
- Class composition: `` `${styles.base} ${styles[variant]} ${className}`.trim() ``
- CSS custom properties for all colors, spacing, typography
- `@media (width >= 640px)` for breakpoints
- 44px minimum touch target for interactive elements
- `aria-hidden` on decorative elements

## 3. Hook Extraction Strategy

**Decision**: Create 4 new hooks in `lib/hooks/` following the
existing kebab-case file naming and object-return pattern.

**Rationale**: The audit identified 6+ components with duplicated
loading/error state management, 3+ with search/filter URL sync,
and 2+ with polling patterns.

**Hook return type convention** (from existing hooks):
```typescript
type UseAsyncReturn<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: (...args) => Promise<void>;
  clearError: () => void;
};
```

**Alternatives considered**:
- TanStack React Query for all data fetching — partially in use
  already but would be a larger migration. The custom hook approach
  is additive and doesn't conflict with future TanStack adoption.
- SWR — rejected for same reason as above; project already has
  TanStack as a dependency.

## 4. Manual Memoization Removal

**Decision**: Strip `useMemo`, `useCallback`, and `React.memo` from
all refactored components. Rely on React Compiler for automatic
optimization.

**Rationale**: React Compiler (enabled via FR-024) auto-memoizes
at the compiler level. Manual memoization becomes redundant noise.
Removing it aligns with Code Minimalism (Principle V).

**Risk**: React Compiler is experimental in Next.js 16. Mitigation:
if compiler causes issues, it can be disabled per-file with
`'use no memo'` directive. The pre-flight suite catches regressions.

## 5. "use client" Boundary Strategy

**Decision**: Push all "use client" directives to leaf components.
Decompose page-level client wrappers into:
1. Server parent (data fetching via async/await)
2. Client leaf children (interactive state only)

**Rationale**: The audit found 126 "use client" files, many at page
wrapper level. This causes entire component trees to hydrate on the
client, inflating First Load JS. The spec mandates a 100kb budget.

**Decomposition pattern**:
```
BEFORE:
  page.tsx → ClientWrapper.tsx ("use client", 600+ lines)

AFTER:
  page.tsx (server, async data fetch) →
    PageContainer + PageHeader (server) →
      InteractiveSection.tsx ("use client", <150 lines)
      FilterPanel.tsx ("use client", <150 lines)
```

**Alternatives considered**:
- Gradual migration (keep wrappers, just slim them) — rejected
  because the 100kb budget requires structural decomposition, not
  just code reduction.

## 6. Next.js Configuration Research

### Turbopack (dev)
**Decision**: Enable via `--turbopack` flag in dev script.
**Rationale**: 10x faster HMR. Stable in Next.js 16.
**Implementation**: Update `package.json` dev script.

### React Compiler
**Decision**: Enable via `experimental.reactCompiler: true` in
`next.config.js`.
**Rationale**: Auto-memoization eliminates manual useMemo/useCallback.
**Prerequisite**: Install `babel-plugin-react-compiler`.
**Risk**: Low — can be disabled per-file if needed.

### Partial Prerendering (PPR)
**Decision**: Enable via `experimental.ppr: true` in
`next.config.js`. Add Suspense boundaries in pages.
**Rationale**: Serves instant static shells while streaming dynamic
content. Improves Time to First Byte.
**Implementation**: Wrap dynamic sections (user data, channel data)
in `<Suspense fallback={<Skeleton />}>`.

### AVIF Image Format
**Decision**: Configure `images.formats: ['image/avif', 'image/webp']`
in `next.config.js`.
**Rationale**: AVIF is ~20% smaller than WebP for equivalent quality.
**Implementation**: Single config line. No code changes needed.

### Image Priority
**Decision**: Add `priority` attribute to above-the-fold images
(video thumbnails in list views, channel avatars in headers).
**Rationale**: Improves Largest Contentful Paint by preloading LCP
candidates.

## 7. CSS Hygiene Research

**Decision**: Remove all redundant `font-family` declarations from
CSS modules (15+ files). Create design system tokens for
`line-height` and replace 40+ ad-hoc values.

**New line-height tokens** (to add to `globals.css`):
```css
--leading-none: 1;
--leading-tight: 1.2;
--leading-snug: 1.35;
--leading-normal: 1.5;
--leading-relaxed: 1.6;
```

**Rationale**: The project already uses `--leading-tight` and
`--leading-relaxed` in some components. Expanding the scale to
cover the 40+ ad-hoc values creates a consistent, auditable system.

## 8. File Structure Research

**Decision**: Adopt `_components/` convention for page-private
components. Threshold: components used by only 1 page move to
`_components/`. Components used by 2+ pages stay in `components/`.

**Already using `_components/`**:
- `app/(marketing)/learn/_components/`
- `app/(marketing)/learn/articles/_components/`
- `app/(app)/competitors/video/[videoId]/_components/`

**Components to relocate** (single-page usage):
- `components/badges/` → `app/(app)/goals/_components/`
- `components/dashboard/ChannelCard/` → `app/(app)/profile/_components/`
- `components/dashboard/AccountStats/` → `app/(app)/profile/_components/`
- `components/dashboard/BillingCTA/` → `app/(app)/profile/_components/`
- `components/dashboard/EmptyState/` → `app/(app)/profile/_components/`
- `components/dashboard/ErrorAlert/` → `app/(app)/profile/_components/`
- `components/channel-profile/ProfileEditor.tsx` → `app/(app)/channel-profile/_components/`

## 9. Page-Level Zod Validation Research

**Decision**: Add Zod schemas for searchParams at the top of every
page component, matching the pattern already used in API routes.

**Current API route pattern** (already working):
```typescript
const ParamsSchema = z.object({ channelId: z.string().min(1) });
// Used via withValidation({ params: ParamsSchema }, handler)
```

**New page pattern**:
```typescript
const SearchParamsSchema = z.object({
  channelId: z.string().optional(),
  range: z.enum(["7d", "28d", "90d"]).default("28d"),
});

export default async function Page({ searchParams }: Props) {
  const params = SearchParamsSchema.parse(await searchParams);
  // params.range is now typed and validated
}
```

**Pages requiring schemas**: video/[videoId], competitors,
trending, goals, profile, subscriber-insights, saved-ideas,
channel-profile, tags.

## 10. First Load JS Budget Enforcement

**Decision**: Add `size-limit` package with per-page budgets of
100kb, integrated into the pre-flight suite.

**Alternatives considered**:
- Next.js build output parsing — fragile, requires custom script
  to parse `.next/` output.
- `@next/bundle-analyzer` only — already installed but is visual
  only, not enforceable.
- `size-limit` — well-maintained, supports Next.js, integrates
  into CI. Chosen.

**Implementation**: Install `@size-limit/preset-app`, configure
`.size-limit.json` with page entries, add check to preflight.
