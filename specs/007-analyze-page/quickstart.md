# Quickstart: Analyze Page

## Prerequisites

- Bun installed
- Database running (`make db-up`)
- Environment variables configured (see `env.example`)
- At least one channel connected (for `channelId` context)

## Start Development

```bash
make dev
```

Navigate to `http://localhost:3000/analyze`

## Key Files to Understand

### Existing (reuse)

| File | Purpose |
|------|---------|
| `lib/features/competitors/use-cases/analyzeVideo.ts` | Core analysis pipeline (cache → YouTube → comments → LLM → insights) |
| `lib/features/competitors/types.ts` | `AnalyzeVideoInput`, `CompetitorVideoAnalysis` types |
| `types/api.d.ts` | `CompetitorVideoAnalysis` full type definition (line 579+) |
| `app/videos/components/full-report/ui/ReportAccordion.tsx` | Collapsible `<details>/<summary>` component |
| `app/(app)/competitors/video/[videoId]/_components/VideoDetailShell.tsx` | Reference for section rendering (VideoHeader, AnalysisSections) |
| `app/(app)/competitors/video/[videoId]/_components/InteractiveHeaderClient.tsx` | CommentsSection, TagsSection, WaysToOutperform components |
| `app/(marketing)/tags/TagExtractorClient.tsx` | Reference for URL input + validate + submit pattern |
| `lib/shared/nav-config.ts` | Navigation items (add new "Analyzer" entry) |
| `lib/api/route.ts`, `lib/api/withAuth.ts`, `lib/api/withValidation.ts` | API route composition pattern |

### New (to create)

| File | Purpose |
|------|---------|
| `app/(app)/analyze/page.tsx` | Server component — metadata + bootstrap + client render |
| `app/(app)/analyze/AnalyzeClient.tsx` | Client component — state machine (input/loading/results/error) |
| `app/(app)/analyze/_components/AnalyzeInput.tsx` | URL input card matching Figma input state |
| `app/(app)/analyze/_components/AnalyzeResults.tsx` | Results container with all sections |
| `app/(app)/analyze/_components/VideoHeader.tsx` | Video thumbnail + stats row |
| `app/(app)/analyze/_components/CommentAnalysis.tsx` | Truncated comments with expand toggle |
| `app/(app)/analyze/_components/AnalysisSection.tsx` | Thin wrapper around ReportAccordion for consistent section rendering |
| `app/(app)/analyze/style.module.css` | Page-specific CSS Modules styles |
| `app/api/analyze/route.ts` | POST endpoint — validate URL, extract videoId, call analyzeVideo |
| `lib/shared/youtube-url.ts` | Shared URL validation + videoId extraction |

## Testing

```bash
make preflight
```

All 6 checks must pass with no regressions against `.agent/baseline.json`.

## Design Reference

- Input state: [Figma 221:365](https://www.figma.com/design/FBUmzpPK0YTx1KpkaaMwth/channelboost?node-id=221-365&m=dev)
- Results state: [Figma 117:162](https://www.figma.com/design/FBUmzpPK0YTx1KpkaaMwth/channelboost?node-id=117-162&m=dev)
