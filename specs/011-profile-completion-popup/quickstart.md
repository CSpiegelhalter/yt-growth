# Quickstart: Profile Completion Popup

## Prerequisites

- `bun` installed
- Database running (`make db-up`)
- Environment configured (copy `env.example` → `.env`)

## Development

```bash
make dev          # Start Next.js dev server
make db-studio    # Prisma Studio (inspect ChannelProfile data)
```

## Testing the Popup

1. Log in with a test account
2. Navigate to Dashboard (`/dashboard`)
3. First visit: popup should NOT appear (first-visit grace period)
4. Refresh/revisit: popup should appear if profile is incomplete
5. Complete a profile section at `/channel-profile`, return to Dashboard — that item should be checked
6. Click "Dismiss for 3 days" — popup disappears, does not return on refresh
7. Clear localStorage key `dismissable:profile-completion` — popup returns
8. Complete all profile sections — popup never shows again

## Key Files

### New files to create:
- `apps/web/lib/hooks/use-local-storage.ts` — Reusable localStorage hook with TTL
- `apps/web/lib/hooks/use-dismissable.ts` — Reusable timed-dismissal hook
- `apps/web/lib/features/channels/profile-completion.ts` — Section completion logic
- `apps/web/app/dashboard/components/profile-completion-popup.tsx` — Popup component
- `apps/web/app/dashboard/components/profile-completion-popup.module.css` — Popup styles

### Existing files to modify:
- `apps/web/app/dashboard/components/dashboard-client.tsx` — Add popup to layout

## Validation

```bash
make preflight    # Must pass — compare against .agent/baseline.json
```
