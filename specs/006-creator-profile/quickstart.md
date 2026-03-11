# Quickstart: Creator Profile Builder

## Prerequisites

- Bun installed
- PostgreSQL running (`make db-up`)
- Database migrated (`make db-migrate`)
- `.env` configured (copy from `env.example`)

## Setup

```bash
# Start database
make db-up

# Install dependencies
bun install

# Start dev server
make dev
```

## Development Workflow

1. Navigate to `http://localhost:3000/channel-profile?channelId=<your-channel-id>`
2. The page should show the multi-tab profile form
3. Edit files in `apps/web/app/(app)/channel-profile/`

## Key Files

| File | Purpose |
|------|---------|
| `apps/web/app/(app)/channel-profile/page.tsx` | Server component entry point |
| `apps/web/app/(app)/channel-profile/ChannelProfileClient.tsx` | Client shell with tab state |
| `apps/web/app/(app)/channel-profile/_components/*.tsx` | Tab components and shared UI |
| `apps/web/lib/features/channels/schemas.ts` | Zod schema for profile input |
| `apps/web/lib/features/channels/types.ts` | Constants and type definitions |
| `apps/web/lib/hooks/use-channel-profile.ts` | Client hook for API calls |

## Verification

```bash
# Run all pre-flight checks
make preflight

# Build only
make build
```

## Architecture Notes

- **No database migration**: `inputJson` TEXT field stores expanded JSON
- **Backward compatible**: Old flat fields preserved alongside new section objects
- **Auto-save**: Debounced PUT to `/api/me/channels/[channelId]/profile` on blur/idle
- **Tab state**: Client-side `useState` with URL hash for deep-linking
