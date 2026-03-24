# Quickstart: Competitor-Backed Ideas

**Branch**: `014-competitor-backed-ideas` | **Date**: 2026-03-23

## Prerequisites

- Bun installed
- PostgreSQL running (`make db-up`)
- `.env` configured (copy from `env.example`)

## Setup

```bash
git checkout 014-competitor-backed-ideas
make db-migrate   # Apply new VideoIdea.sourceProvenanceJson column
make dev           # Start dev server
```

## Testing the Feature

### 1. Ensure competitor data exists

The competitor-backed suggestion system uses cached search results. You need at least one prior competitor search for the channel's niche:

1. Log in and select a channel
2. Navigate to `/analyze` or `/competitors`
3. Run a competitor search for the channel's niche
4. Wait for results to populate

### 2. Verify competitor-backed suggestions

1. Go to `/dashboard`
2. Suggestions should now show source evidence (competitor video titles, patterns, adaptation angles)
3. If no competitor data exists, suggestions fall back to profile-only mode with a prompt to run research

### 3. Test idea actions with provenance

1. Click "Use this idea" on a competitor-backed suggestion
2. Verify the planned idea editor shows source provenance (source videos, pattern, rationale)
3. Click "Save for later" on another suggestion — verify provenance is preserved

### 4. Test View Source flow

1. On a competitor-backed suggestion card, click "View source"
2. Verify source video details expand inline (thumbnail, title, stats, pattern)
3. Click "Analyze source" — verify navigation to `/competitors/video/[videoId]`

### 5. Test Make My Version

1. From a source view or competitor video analysis page, click "Make my version"
2. Verify a new planned idea is created with source provenance pre-populated
3. Verify AI field suggestions (title, script, etc.) incorporate the source context

### 6. Test on-demand generation

1. On the dashboard, click "Find ideas from my niche"
2. Verify new competitor-backed suggestions are generated
3. Repeat from the planned ideas tab

## Key Files

| Area | Path |
|------|------|
| Suggestion types | `apps/web/lib/features/suggestions/types.ts` |
| Context building | `apps/web/lib/features/suggestions/use-cases/buildContext.ts` |
| Generation logic | `apps/web/lib/features/suggestions/use-cases/generateSuggestions.ts` |
| Action handling | `apps/web/lib/features/suggestions/use-cases/actOnSuggestion.ts` |
| Idea types | `apps/web/lib/features/video-ideas/types.ts` |
| Field suggestions | `apps/web/lib/features/video-ideas/use-cases/suggestField.ts` |
| Dashboard UI | `apps/web/app/(app)/dashboard/` |
| Suggestion cards | `apps/web/app/(app)/dashboard/components/` |
| Idea editor | `apps/web/app/(app)/videos/components/` |
| Competitor detail | `apps/web/app/(app)/competitors/video/[videoId]/` |
| Prisma schema | `apps/web/prisma/schema.prisma` |

## Preflight

```bash
make preflight   # Must pass with no regressions vs baseline
```
