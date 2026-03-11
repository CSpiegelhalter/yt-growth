# Research: Videos Page Refactor

**Feature**: 004-videos-page-refactor
**Date**: 2026-03-10

## R1: Data Model — New Table vs Extend VideoSuggestion

**Decision**: Create a new `VideoIdea` Prisma model rather than extending `VideoSuggestion`.

**Rationale**: `VideoSuggestion` serves a different purpose (AI-generated quick suggestions with dismiss/save/use actions). `VideoIdea` represents a user-owned workspace with multiple editable fields, iteration history, and a different lifecycle. Sharing a table would require extensive nullable columns and conflated status semantics.

**Alternatives considered**:
- Extend `VideoSuggestion` with additional nullable fields — rejected because it conflates two distinct domain concepts and makes queries/indexes harder to reason about.
- Use a generic "content" table — rejected for same reasons plus over-abstraction.

## R2: AI Generation Architecture — Per-Field Suggestion

**Decision**: Create a `suggestField` use-case that accepts a target field name, the current idea state, and a `SuggestionContext`, then calls `callLLM()` with a field-specific prompt.

**Rationale**: The spec requires individual field generation ("Suggest" button per field). A single use-case with a field discriminator is simpler than separate use-cases per field and naturally extends to "suggest all" by calling it in sequence or parallel.

**Alternatives considered**:
- Separate use-case per field (suggestTitle, suggestScript, etc.) — rejected as unnecessary duplication; the prompt structure varies only in the system instruction for the target field.
- Single "generate all" use-case only — rejected because spec explicitly requires per-field suggest buttons.

## R3: Context Building — Reuse buildContext from Suggestions

**Decision**: Reuse `buildContext()` from `lib/features/suggestions/use-cases/buildContext.ts` to assemble the `SuggestionContext` for AI field generation.

**Rationale**: `buildContext()` already gathers channel niche, content pillars, target audience, recent video titles + performance, and trending topics. These are exactly the signals the spec requires for idea generation. No need to duplicate this logic.

**Alternatives considered**:
- Copy and modify buildContext — rejected; violates code minimalism and creates maintenance burden.
- Create a shared module in `lib/shared/` — premature; only 2 consumers (suggestions + video-ideas). Can extract later if a third consumer appears.

## R4: Tab State Management

**Decision**: Add a `tab` state (`"published" | "planned"`) to `DashboardClient.tsx` and pass it down to `SplitPanel`. Each tab maintains its own selection state independently.

**Rationale**: Tab switching is purely client-side UI state. No URL routing needed (both tabs live at `/videos`). Keeping state in the existing `DashboardClient` avoids introducing new state management complexity.

**Alternatives considered**:
- URL-based tabs (`/videos?tab=planned`) — viable but adds complexity for MVP; can be added later for deep-linking.
- Separate routes (`/videos/published`, `/videos/planned`) — rejected; the Figma shows a single page with tab toggle, not separate pages.

## R5: SplitPanel Refactoring Approach

**Decision**: Refactor `SplitPanel` to accept a `tab` prop and conditionally render either `VideoList` or `PlannedIdeasList` in the left panel, and either `VideoDetailPanel`/`OverviewPanel` or `IdeaEditorPanel` in the right panel.

**Rationale**: The existing SplitPanel already handles the responsive left/right layout with mobile toggling. Adding tab awareness keeps the layout logic centralized. The component stays under 150 lines by delegating content to tab-specific sub-components.

**Alternatives considered**:
- Two separate SplitPanel instances toggled by tab — rejected; duplicates responsive layout logic.
- Create a generic TabSplitPanel abstraction — rejected; premature abstraction for 2 tabs.

## R6: Idea Persistence — API Route Pattern

**Decision**: Standard REST routes at `/api/me/channels/[channelId]/ideas/` following the existing suggestion route pattern. GET for list, POST for create, PATCH for update, DELETE for removal.

**Rationale**: Matches existing API conventions (`/api/me/channels/[channelId]/suggestions/`). Uses `createApiRoute()` middleware, `withValidation()` for Zod schemas, and `toApiError()` for error mapping — all already established patterns.

**Alternatives considered**:
- Server actions — viable but the project already uses route handlers consistently for mutations. Mixing patterns adds cognitive overhead.

## R7: Design System Mapping — Figma to CSS Variables

**Decision**: Map Figma colors to existing CSS variables:
- `#222a68` → `var(--color-imperial-blue)` (tab active bg, headings)
- `#ca1f7b` → `var(--color-hot-rose)` (selected state border, accents)
- `#f3f4fb` → `var(--color-lavender-mist)` (tab inactive bg, card bg)
- `#9599ba` → muted text (use `opacity` on imperial-blue)
- `#e8eafb` → card borders (already in existing card styles)

**Rationale**: The Figma colors directly correspond to the existing design system tokens. Using CSS variables ensures consistency and allows theme changes without touching component code.

## R8: Form Field Component Pattern

**Decision**: Create an `IdeaFormField` component that wraps a label, input/textarea, optional character counter, and optional "Suggest" button. Reuse the existing `Input` UI component where possible.

**Rationale**: The Figma shows a consistent pattern for all 6 fields: label + suggest link on the same row, then input below. A shared component avoids duplicating this layout 6 times while keeping each field configurable (textarea vs input, char limit, suggest action).

**Alternatives considered**:
- Inline each field directly in IdeaEditorPanel — rejected; 6 fields would push the component well over 150 lines.
- Use a form library (react-hook-form) — rejected; only 6 fields with no complex validation beyond char limit. State with `useState` is sufficient for MVP.

## R9: Planned Ideas Data Fetching

**Decision**: Fetch ideas on Planned tab activation using a `useVideoIdeas` hook (similar to `useVideoLoader`). Cache in component state. Refetch on save/delete actions.

**Rationale**: The ideas list is small (likely <100 items per channel) and only needed when the Planned tab is active. No need for server-side pagination or infinite scroll for MVP.

**Alternatives considered**:
- TanStack React Query — the project lists it in the constitution but the existing Videos page uses plain hooks with `useState` + `useEffect`. Matching the existing pattern for consistency. Can migrate to React Query later.
- Server-side rendering of ideas list — the tab content is client-side toggled, so server rendering adds complexity without benefit.
