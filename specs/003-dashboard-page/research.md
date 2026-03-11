# Research: Dashboard Page

**Branch**: `003-dashboard-page` | **Date**: 2026-03-09

## R1: OverviewPanel Extraction Strategy

**Decision**: Extract OverviewPanel and child components to a shared location under `components/overview/`, keeping them fully reusable.

**Rationale**: The OverviewPanel and its children (OverviewChart, MetricPills, ActionableInsights, InsightCard) are already generic — they accept props and have no global state/context. The only tight coupling is the hardcoded API endpoint URL in OverviewPanel. Parameterizing this via prop makes the entire tree reusable.

**Alternatives considered**:
- Keep in `app/videos/components/` and import cross-page → rejected: violates component colocation conventions and creates hidden coupling.
- Duplicate for Dashboard → rejected: violates DRY and FR-015.
- Move to `lib/features/` → rejected: these are UI components, not domain logic.

**Extraction plan**:
- Move OverviewPanel, OverviewChart, MetricPills, ActionableInsights, InsightCard + CSS modules to `components/overview/`.
- Keep domain logic (`rank-metrics.ts`, `computeActionableInsights.ts`) in `lib/features/channel-audit/`.
- Update Videos page imports to use shared location.

## R2: Dashboard Route Pattern

**Decision**: Create `/dashboard` as a standalone route outside `(app)` and `(marketing)` groups, using the hybrid auth pattern from `/videos`.

**Rationale**: The `(app)` group hard-redirects to `/auth/login` if unauthenticated. The spec requires no redirect for logged-out users (FR-011). The `/videos` page already demonstrates this pattern using `getAppBootstrapOptional()`.

**Alternatives considered**:
- Inside `(app)` with auth bypass → rejected: requires modifying shared layout logic, fragile.
- Inside `(marketing)` → rejected: marketing layout has different chrome (footer, no sidebar).
- New route group `(hybrid)` → rejected: unnecessary abstraction for a single page currently.

**Implementation**: Mirror `/videos` directory structure with `layout.tsx` (AppShellServer with optional auth) and `page.tsx` (conditional render).

## R3: Video Idea Persistence Model

**Decision**: Create a new `VideoSuggestion` Prisma model separate from `SavedIdea`, with status tracking for active/saved/dismissed/used lifecycle.

**Rationale**: `SavedIdea` represents user-initiated bookmarks of ideas from the IdeaBoard. Dashboard suggestions are system-generated, have different lifecycle (active → dismissed/saved/used), need backfill logic, and should not pollute the SavedIdea table which has different semantics. Separate model keeps concerns clean and allows independent evolution.

**Alternatives considered**:
- Reuse `SavedIdea` with new status values → rejected: conflates user-saved ideas with system-generated suggestions; different query patterns and lifecycle.
- No persistence (client-side only) → rejected: spec requires persistent dismiss/save across sessions.

**Model fields**: userId, channelId, title, description, sourceContext (JSON — what signals informed the idea), status (active/saved/dismissed/used), generatedAt, actedAt.

## R4: Suggestion Generation Architecture

**Decision**: Create a `lib/features/suggestions/` domain module with a `generateSuggestions` use-case that aggregates creator context and produces video ideas. Use the existing LLM infrastructure pattern from `generateIdeas` and `generateKeywordIdeas`.

**Rationale**: The spec requires an extensible architecture (FR-010) where additional input sources can be added. A dedicated feature module with a `SuggestionContext` type allows new signal providers to be plugged in without modifying core generation logic.

**Alternatives considered**:
- Extend `saved-ideas` feature → rejected: different domain concern (generation vs. storage).
- Extend `video-insights` feature → rejected: video-insights is per-video analysis, not dashboard-level generation.

**Input sources (initial)**:
- Channel profile data (niche, audience, content pillars) — from `ChannelProfile` model.
- Recent video performance — from `Video` + `VideoMetrics` models.
- Trending data — from existing trending feature if available.

## R5: SEO & Discoverability Strategy

**Decision**: The `/dashboard` page will be publicly accessible but marked with `robots: { index: true }` and included in the sitemap. It serves as a product-awareness page for logged-out users.

**Rationale**: Unlike `/videos` (which shows user-specific data and is noindex), `/dashboard` will show generic value-proposition content for logged-out users, making it suitable for indexing.

**Changes needed**:
- `robots.ts`: Do NOT add `/dashboard/` to disallow list.
- `sitemap.ts`: Add `/dashboard` entry with priority ~0.8.
- `build-llms-txt.ts`: Add to `LLMS_PUBLIC_PAGES` since it's accessible without auth.

## R6: Auth Prompt Component

**Decision**: Create a reusable `AuthPrompt` component in `components/auth/` that can be composed into any page as a non-blocking overlay/banner.

**Rationale**: The spec requires this component to be reusable across pages (FR-012, SC-006). The existing `LoggedOutDashboardPreview` in `/components/dashboard/` is specific to the Videos page. A generic component with customizable messaging and redirect URL is more versatile.

**Alternatives considered**:
- Refactor `LoggedOutDashboardPreview` → rejected: too tightly coupled to Videos page preview content.
- Use a modal → rejected: modals block content and hurt SEO (content behind modal not rendered in HTML).

**Pattern**: Non-blocking banner/card that overlays or sits alongside page content, with sign-in and sign-up CTAs that include a `redirect` query parameter back to the current page.

## R7: Navigation Icon

**Decision**: Use the existing `"home"` icon type from `NavIcon.tsx` for the Dashboard nav item initially. Replace with a custom Figma-sourced icon during implementation if Figma specifies a different icon.

**Rationale**: The `"home"` icon (house with window/roof) is semantically appropriate for a Dashboard. A custom SVG can be added later via the `SIDEBAR_ICON_MAP` pattern if Figma shows something different.
