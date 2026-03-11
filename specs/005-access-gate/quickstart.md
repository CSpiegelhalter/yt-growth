# Quickstart: AccessGate Component

## Usage Pattern

### Basic usage (requires auth + channel)

```tsx
// app/(app)/goals/page.tsx
import { getAppBootstrapOptional } from "@/lib/server/bootstrap";
import { AccessGate } from "@/components/auth/AccessGate";

export default async function GoalsPage() {
  const bootstrap = await getAppBootstrapOptional();

  return (
    <AccessGate bootstrap={bootstrap}>
      <GoalsContent
        channels={bootstrap!.channels}
        activeChannelId={bootstrap!.activeChannelId}
      />
    </AccessGate>
  );
}
```

### Auth-only mode (no channel required)

```tsx
// app/(app)/profile/page.tsx
import { getAppBootstrapOptional } from "@/lib/server/bootstrap";
import { AccessGate } from "@/components/auth/AccessGate";

export default async function ProfilePage() {
  const bootstrap = await getAppBootstrapOptional();

  return (
    <AccessGate bootstrap={bootstrap} requireChannel={false}>
      <ProfileContent me={bootstrap!.me} />
    </AccessGate>
  );
}
```

## Component Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| bootstrap | BootstrapData \| null | required | Result from `getAppBootstrapOptional()` |
| requireChannel | boolean | true | Whether a connected YouTube channel is required |
| children | ReactNode | required | Page content (rendered only when access requirements met) |

## Key Files

| File | Purpose |
|------|---------|
| `components/auth/AccessGate.tsx` | Main component |
| `components/auth/access-gate.module.css` | Styles for gate states |
| `lib/server/bootstrap.ts` | `getAppBootstrapOptional()` data source |

## Migration Checklist

For each page currently in `(app)` route group:

1. Replace `getAppBootstrap()` with `getAppBootstrapOptional()` in the page
2. Wrap page content with `<AccessGate bootstrap={bootstrap}>`
3. Remove any direct `redirect()` calls
4. Set `requireChannel={false}` if page only needs auth (e.g., Profile)
