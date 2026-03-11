# Implementation Plan: Analyze Page

**Branch**: `007-analyze-page` | **Date**: 2026-03-10 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/007-analyze-page/spec.md`

## Summary

Build a new `/analyze` page within the authenticated app shell that provides a two-state same-page experience: (1) URL input state where users paste a YouTube video URL, and (2) analyzed results state showing actionable video analysis with collapsible sections. The page reuses the existing `analyzeVideo` use-case from the competitors feature, the `ReportAccordion` component from the full-report system, and the URL input pattern from the Tags marketing page. DataForSEO enrichment (competitive context, keyword data, trends) is already integrated into the competitor analysis pipeline and will surface automatically.

## Technical Context

**Language/Version**: TypeScript 5.x
**Primary Dependencies**: React 19, Next.js 15 (App Router), Zod, next-auth
**Storage**: PostgreSQL via Prisma (read-only for this feature — analysis caching handled by existing competitor pipeline)
**Testing**: `make preflight` (build, lint, knip, madge, depcruise, jscpd)
**Target Platform**: Web (desktop + mobile)
**Project Type**: Web application (Next.js App Router)
**Performance Goals**: Analysis results in <30s for typical videos
**Constraints**: Must reuse existing analysis pipeline; no new DB schema; must pass all 6 preflight checks
**Scale/Scope**: 1 new page route, ~8-12 new files, 2-3 modified files

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Notes |
|------|--------|-------|
| I. Hexagonal Architecture | PASS | New route in `app/(app)/analyze/`, domain logic stays in `lib/features/competitors/`, no new adapters needed |
| II. Verified-Change Workflow | PASS | Will run `make preflight` after implementation |
| III. Server-First Rendering | PASS | Page server component delegates to client component for interactive state (URL input, view transitions). Minimizes `use client` surface. |
| IV. Design System Compliance | PASS | Will use CSS variables, Fustat typography, 4pt grid, CSS Modules. Reuses `ReportAccordion` from full-report system. |
| V. Code Minimalism | PASS | Reuses existing `analyzeVideo` use-case, `ReportAccordion`, and URL validation pattern. No new abstractions beyond what's needed. |

## Project Structure

### Documentation (this feature)

```text
specs/007-analyze-page/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── contracts/           # Phase 1 output
    └── analyze-api.md   # API contract for the analyze endpoint
```

### Source Code (repository root)

```text
apps/web/
├── app/(app)/analyze/
│   ├── page.tsx                    # Server component (thin: metadata + bootstrap + render)
│   ├── AnalyzeClient.tsx           # Client component (state machine: input → loading → results → back)
│   ├── _components/
│   │   ├── AnalyzeInput.tsx        # URL input card (adapted from Tags pattern)
│   │   ├── AnalyzeResults.tsx      # Results container (video header + sections)
│   │   ├── VideoHeader.tsx         # Thumbnail + title + stats (extracted from VideoDetailShell)
│   │   ├── CommentAnalysis.tsx     # Truncated comments with expand (new)
│   │   └── AnalysisSection.tsx     # Collapsible section wrapper (uses ReportAccordion)
│   └── style.module.css            # Page-specific styles
├── app/api/analyze/
│   └── route.ts                    # POST endpoint wrapping existing analyzeVideo use-case
├── lib/shared/
│   └── nav-config.ts               # Modified: add "analyzer" nav item
└── lib/shared/
    └── youtube-url.ts              # Extracted: shared YouTube URL validation (used by Tags + Analyze)
```

**Structure Decision**: Follows existing app/(app) pattern. The analyze page lives as a new route alongside competitors, tags, etc. The API route wraps the existing `analyzeVideo` use-case with a different entry point (accepts URL instead of videoId). Shared URL validation extracted to `lib/shared/` since both Tags and Analyze need it.

## Complexity Tracking

No constitution violations. No complexity justification needed.
