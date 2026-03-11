# Quickstart: Videos Page Refactor

**Feature**: 004-videos-page-refactor
**Branch**: `004-videos-page-refactor`

## Prerequisites

- Bun installed
- Supabase Postgres running (`make db-up`)
- `.env` configured (copy from `env.example`)
- OpenAI API key set in `.env` (for AI suggest feature)

## Setup

```bash
# Switch to feature branch
git checkout 004-videos-page-refactor

# Install dependencies
bun install

# Apply database migration (after adding VideoIdea model)
bunx prisma migrate dev --name add_video_ideas
bunx prisma generate

# Start dev server
make dev
```

## Development Workflow

```bash
# After every code change:
make preflight

# Database operations:
make db-studio    # Open Prisma Studio to inspect data
make db-migrate   # Run pending migrations
```

## Key Paths

| What | Path |
|------|------|
| Videos page entry | `apps/web/app/videos/page.tsx` |
| Client orchestrator | `apps/web/app/videos/DashboardClient.tsx` |
| Split panel layout | `apps/web/app/videos/components/SplitPanel.tsx` |
| Video ideas feature | `apps/web/lib/features/video-ideas/` |
| Ideas API routes | `apps/web/app/api/me/channels/[channelId]/ideas/` |
| Prisma schema | `apps/web/prisma/schema.prisma` |
| Suggestions (reuse) | `apps/web/lib/features/suggestions/` |
| LLM wrapper (reuse) | `apps/web/lib/llm.ts` |
| Design tokens | `apps/web/app/globals.css` |
| UI components | `apps/web/components/ui/` |

## Implementation Order

1. **Database**: Add `VideoIdea` model to Prisma schema, run migration
2. **Feature domain**: Create `lib/features/video-ideas/` (types, schemas, errors, use-cases)
3. **API routes**: Create `/api/me/channels/[channelId]/ideas/` routes
4. **Tab toggle**: Add `TabToggle` component, integrate into `SplitPanel`
5. **Planned list**: Create `PlannedIdeasList`, `NewIdeaCard`, `IdeaListItem`
6. **Idea editor**: Create `IdeaEditorPanel`, `IdeaFormField`, `AiHelpBanner`
7. **AI suggest**: Implement `suggestField` use-case and suggest API route
8. **Integration**: Wire everything into `DashboardClient` with tab state
9. **Polish**: Empty states, loading states, error states, mobile responsive
10. **Verify**: `make preflight` — zero regressions

## Testing the Feature

1. Navigate to `/videos` — should see Published tab active with existing video list
2. Click "Planned" tab — should see empty state with "Start a new idea" card
3. Click "Start a new idea" — should see the idea editor form in right panel
4. Fill in summary + title, click "Save Idea" — idea should appear in left list
5. Click the saved idea — editor should populate with saved values
6. Click "Suggest" on a field — should call AI and populate the field
7. Switch back to Published — existing video analysis should work unchanged
