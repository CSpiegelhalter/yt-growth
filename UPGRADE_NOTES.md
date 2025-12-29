# Next.js v16 upgrade notes (in-place)

This repo’s Next.js app lives at the **repo root** (it does not have an `apps/frontend` directory). All changes were made in-place.

## Versions changed

- **next**: `14.2.5` → `16.1.1`
- **react / react-dom**: `18.2.0` → `19.2.3`
- **eslint-config-next**: `14.2.5` → `16.1.1`
- **eslint**: `8.57.0` → `9.39.2`
- **typescript**: `^5.4.0` → `^5.6.0`
- **bun-types**: added (for `bun:test` TypeScript typings)

Lockfile updated: `bun.lock`

## Config changes

- `next.config.js`
  - Added `images.remotePatterns` for:
    - `i.ytimg.com`
    - `yt3.ggpht.com`
  - Kept existing `experimental.serverActions.allowedOrigins` config (format normalized).

## Code migration notes (breaking/behavioral changes addressed)

- **Middleware naming**
  - Next.js v16 deprecates `middleware.ts`. Replaced it with `proxy.ts` (same behavior).

- **Route handlers param typing**
  - Next.js v16 types dynamic route handler `context.params` as a **Promise**.
  - Updated affected handlers under `app/api/**` to `await params` before validation/usage.

- **`headers()` is async**
  - Updated `lib/auth.ts` to `await headers()` before calling `.get(...)`.

- **`next/dynamic` with `ssr:false`**
  - Next.js v16 disallows `ssr: false` `dynamic()` usage inside Server Components.
  - Moved the `ssr:false` dynamic import into a small Client Component wrapper:
    - `app/video/[videoId]/VideoInsightsClientNoSSR.tsx`

## `<img>` → `next/image` migration

- Replaced all JSX `<img>` usage with `Image` from `next/image`.
- Added meaningful `alt` text where it was previously empty.
- Prevented layout shift by using:
  - `fill` in existing `position: relative` + `aspect-ratio` containers, or
  - explicit `width`/`height` for fixed-size thumbnails/avatars
- Removed a broken reference to `/placeholder-thumb.jpg` and replaced it with a real placeholder UI.

## Verification

Commands used:

```bash
bun install
bun run build
bun run typecheck
```


