# Data Model: AccessGate Component

## Overview

No new database entities. AccessGate relies entirely on existing data models.

## Existing Entities Used

### BootstrapData (runtime type)

Returned by `getAppBootstrapOptional()` from `lib/server/bootstrap.ts`.

| Field | Type | Source |
|-------|------|--------|
| me | Me | User profile + subscription |
| channels | Channel[] | Connected YouTube channels |
| activeChannelId | string \| null | Resolved from URL param or first channel |
| activeChannel | Channel \| null | Resolved channel object |

Returns `null` when user is not authenticated.

### AccessState (derived, not persisted)

Computed from BootstrapData at render time:

| State | Condition | UI |
|-------|-----------|-----|
| `unauthenticated` | `bootstrap === null` | Sign-in prompt |
| `no-channel` | `bootstrap !== null && channels.length === 0` | Connect-channel prompt |
| `ready` | `bootstrap !== null && channels.length > 0` | Render children |

### Me (existing type from `types/api.d.ts`)

| Field | Type |
|-------|------|
| id | number |
| email | string |
| name | string \| null |
| plan | string |
| status | string |
| channel_limit | number |
| subscription | SubscriptionStatus |

### Channel (existing type from `types/api.d.ts`)

| Field | Type |
|-------|------|
| channel_id | string |
| id | number |
| title | string |
| thumbnailUrl | string \| null |
| subscriberCount | number \| null |
| connectedAt | string |
| syncStatus | string |

## State Transitions

```
[Page Load]
    │
    ▼
getAppBootstrapOptional()
    │
    ├── null ────────────► STATE: unauthenticated
    │                      Action: Sign in → /auth/login?redirect={current_path}
    │
    └── BootstrapData
         │
         ├── channels.length === 0 ──► STATE: no-channel
         │                             Action: Connect → /api/integrations/google/start
         │
         └── channels.length > 0 ───► STATE: ready
                                       Action: Render children
```

## No Schema Changes

- No database migrations required
- No new Prisma models
- No new API endpoints
- No new Zod schemas
