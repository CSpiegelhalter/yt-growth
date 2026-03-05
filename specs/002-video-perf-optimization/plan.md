# Implementation Plan: Video Insights & Full Report Performance Optimization

**Branch**: `002-video-perf-optimization` | **Date**: 2026-03-04 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-video-perf-optimization/spec.md`

## Summary

The videos page suffers from slow loading due to sequential API calls, zero caching on full reports, uncached transcript fetches, and redundant DataForSEO SERP calls. The plan introduces three new Prisma cache models (TranscriptCache, FullReportSectionCache, ReportGenerationLock), parallelizes serial database queries in `resolveInsightContext`, routes competitive context calls through the existing `KeywordCache`, deduplicates SERP calls within a single request, and adds in-memory request deduplication for concurrent full-report requests. The existing NDJSON streaming infrastructure is preserved — optimization focuses on reducing what needs to be computed, not how results are delivered.

## Technical Context

**Language/Version**: TypeScript 5.6.0, React 19.0.0, Node 18+
**Primary Dependencies**: Next.js 16.0.0, Prisma 5.22.0, Zod 3.23.8, OpenAI (LLM), SerpAPI (transcripts), DataForSEO (SERP/trends)
**Storage**: Supabase Postgres with pgvector (via Prisma)
**Testing**: `make preflight` (build, lint, knip, madge, depcruise, jscpd)
**Target Platform**: Web (Next.js App Router on Vercel)
**Project Type**: Web application (monorepo: `apps/web` + `apps/worker`)
**Performance Goals**: Cold-cache insights <5s, cached insights <1s, cold-cache first report section <8s, cached full report <2s, 40% total report time reduction
**Constraints**: Hexagonal architecture (ports + adapters), `'use client'` only where needed, bun runtime
**Scale/Scope**: Single-user-at-a-time typical, but shared cache benefits all users viewing same video

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Hexagonal Architecture | PASS | All new cache logic lives in `lib/adapters/` behind port interfaces. Domain logic stays in `lib/features/`. No layer violations. |
| II. Verified-Change Workflow | PASS | `make preflight` will run after every change. |
| III. Server-First Rendering | PASS | All caching is server-side. No new client components needed. Existing `'use client'` hooks are only modified to handle cached responses. |
| IV. Design System Compliance | PASS | Minimal UI changes (per-section retry button). Uses existing `SectionError` component pattern. |
| V. Code Minimalism | PASS | New files are focused single-purpose modules (<150 lines). No speculative abstractions. |

No violations. No complexity tracking needed.

## Project Structure

### Documentation (this feature)

```text
specs/002-video-perf-optimization/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── full-report-cache-api.md
└── tasks.md
```

### Source Code (repository root)

```text
apps/web/
├── prisma/
│   └── schema.prisma                          # +3 new models: TranscriptCache, FullReportSectionCache, ReportGenerationLock
│
├── lib/
│   ├── server/
│   │   └── video-insight-context.ts           # MODIFY: parallelize Q2+Q3
│   │
│   ├── features/
│   │   ├── full-report/
│   │   │   └── use-cases/
│   │   │       ├── gather-report-data.ts      # MODIFY: inject transcript cache reads/writes
│   │   │       └── stream-full-report.ts      # MODIFY: check section cache, stream cached sections, dedup requests
│   │   │
│   │   ├── transcript-analysis/
│   │   │   └── use-cases/
│   │   │       └── run-transcript-analysis.ts # MODIFY: cache chunk analyses + synthesis
│   │   │
│   │   └── video-insights/
│   │       └── use-cases/
│   │           └── fetchCompetitiveContext.ts  # MODIFY: deduplicate SERP call, route through KeywordCache port
│   │
│   ├── adapters/
│   │   ├── serpapi/
│   │   │   └── client.ts                     # MODIFY: add transcript cache read/write
│   │   └── dataforseo/
│   │       └── youtube-serp.ts               # (no change — caching happens at use-case level via port)
│   │
│   └── ports/
│       └── SerpApiPort.ts                    # MODIFY: extend with cached transcript methods
│
├── app/
│   └── api/me/channels/[channelId]/videos/[videoId]/
│       └── full-report/
│           └── route.ts                      # MODIFY: handle cache-hit fast path, return cached sections via NDJSON
│
└── app/videos/components/
    └── full-report/
        ├── use-full-report.ts                # MODIFY: handle cached report response (immediate section display)
        └── SectionError.tsx                  # MODIFY: add per-section retry callback support
```

**Structure Decision**: All changes fit within the existing hexagonal architecture. New Prisma models are the only structural additions. No new directories needed.
