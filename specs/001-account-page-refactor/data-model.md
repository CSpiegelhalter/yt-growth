# Data Model: Account Page Refactor

**Date**: 2026-03-13
**Branch**: `001-account-page-refactor`

## Overview

No new data entities or schema changes. This is a presentation-layer refactor. All data flows use existing types and APIs.

## Existing Entities (read-only)

### Me (User Account)

**Source**: `types/api.d.ts` — `Me` type
**Fetched by**: `getAppBootstrapOptional()` in server component

| Field | Type | Used In |
|-------|------|---------|
| `id` | `number` | Internal reference |
| `email` | `string` | Left card — Email row |
| `plan` | `"free" \| "pro" \| "team" \| string` | Left card — Plan row with badge |
| `status` | `"active" \| "past_due" \| "canceled" \| "inactive" \| string` | Left card — Active badge |
| `subscription.isActive` | `boolean` | Determines right card state (UpgradeCard vs subscription management) |
| `subscription.currentPeriodEnd` | `string \| null` | BillingCTA — billing date display |
| `subscription.cancelAtPeriodEnd` | `boolean` | BillingCTA — canceling state |
| `subscription.cancelAt` | `string \| null` | BillingCTA — cancel date |
| `usage` | `object \| undefined` | Left card — Daily usage bars |
| `resetAt` | `string \| undefined` | Left card — Usage reset time |

### Channel (Connected Channel)

**Source**: `types/api.d.ts` — `Channel` type
**Fetched by**: `getAppBootstrapOptional()` in server component

| Field | Type | Used In |
|-------|------|---------|
| `channel_id` | `string` | Channel row key, remove action |
| `title` | `string \| null` | Left card — Channel name (bold) |
| `thumbnailUrl` | `string \| null` | Left card — Channel avatar |
| `totalVideoCount` / `videoCount` | `number \| null` | Left card — Channel stats |
| `planCount` | `number \| null` | Left card — Channel stats |

## Data Flow

```
page.tsx (server)
  └─ getAppBootstrapOptional()  →  { me: Me, channels: Channel[] }
      └─ ProfileClient (client)
           ├─ Left card: uses me.email, me.plan, me.status, me.usage, channels[]
           └─ Right card: BillingCTA uses me.subscription, me.plan, me.status
```

No new API calls, no new data fetching. All existing data flows are preserved.
