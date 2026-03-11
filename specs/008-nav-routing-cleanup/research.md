# Research: Navigation & Routing Cleanup

**Branch**: `008-nav-routing-cleanup` | **Date**: 2026-03-11

## R-001: Current Sidebar Item Configuration

**Decision**: Modify `apps/web/lib/shared/nav-config.ts` `primaryNavItems` array to contain exactly 6 items in the specified order.

**Current State**:
- `primaryNavItems` has 9 items: Dashboard, Videos, Goals, Competitors, Trending (flagged), Thumbnails (flagged), Tags, Keywords, Analyzer
- `secondaryNavItems` has 2 items: Channel Profile, Learn
- `accountNavItems` has 2 items: Profile & Billing, Contact Support
- Profile lives in `accountNavItems`, not `primaryNavItems`

**Required Changes**:
1. Reorder/filter `primaryNavItems` to: Dashboard, Videos, Analyzer, Tags, Keywords, Profile
2. Remove: Goals, Competitors, Trending, Thumbnails from primary nav
3. Move Profile from `accountNavItems` to `primaryNavItems` (position 6)
4. Remove `secondaryNavItems` entries (Channel Profile, Learn) from sidebar — these are no longer sidebar items
5. Keep removed items available as exports for potential future re-linking

**Rationale**: Direct spec requirement. Only 6 items should appear.
**Alternatives considered**: Keeping items and hiding via feature flags — rejected because spec wants a clean 6-item sidebar, not conditional display.

---

## R-002: Icon Mapping Strategy

**Decision**: Add `dashboard` and `analyzer` to the `SIDEBAR_ICON_MAP` in `nav-utils.ts`, pointing to the specified SVGs.

**Current State**:
- `nav-utils.ts` `SIDEBAR_ICON_MAP` maps item IDs to SVG paths for: videos, goals, competitors, tags, keywords, channel-profile, learn
- Dashboard (`home` icon type) uses `NavIcon` fallback (inline SVG)
- Analyzer (`search` icon type) uses `NavIcon` fallback
- `SidebarIcon` component: checks map first, falls back to `NavIcon`

**Required Changes**:
1. Add `dashboard: "/sidebar/dashboard.svg"` to `SIDEBAR_ICON_MAP`
2. Add `analyzer: "/sidebar/analyze.svg"` to `SIDEBAR_ICON_MAP`
3. Remove unused entries: `goals`, `competitors`, `channel-profile`, `learn`
4. Add `profile` entry if a profile SVG exists (or use NavIcon fallback)

**Rationale**: The SVG files already exist at the specified paths. Adding them to the map ensures `SidebarIcon` picks them up automatically.

---

## R-003: Sidebar Icon Coloring

**Decision**: Apply CSS `filter` or use CSS `color` inheritance to make all sidebar icons render in Hot Rose.

**Current State**:
- SVG icons are rendered via `next/image` (`<Image>`) — these are raster-rendered and don't inherit CSS `color`
- Icons using `NavIcon` (inline SVGs) can inherit `currentColor`
- The `.navIcon` class has no color override — icons display in their source colors
- Text color: `.navLink` uses `var(--text)` which is `var(--color-imperial-blue)` — already correct for default text
- Hover: `.navLink:hover` already uses `color: var(--color-hot-rose)` — correct for hover text

**Required Changes**:
1. Since SVG sidebar icons are loaded via `<Image>`, they can't use `currentColor`. Options:
   - **Option A**: Edit each SVG file to use Hot Rose color directly — simplest
   - **Option B**: Use CSS `filter` to colorize — fragile
   - **Option C**: Convert to inline SVGs — more work but supports `currentColor`
2. For text: already correct (Imperial Blue default, Hot Rose hover)
3. Need to ensure icon color is ALWAYS Hot Rose (even on hover/active), while only text changes

**Decision**: Use Option A — ensure SVG files use `#CA1F7B` (Hot Rose) as their fill/stroke color. This is the simplest approach since the icons should always be Hot Rose regardless of state. Verify the existing SVGs and update if needed.

---

## R-004: Auth Guard Pattern

**Decision**: No new auth guard patterns needed. The existing `AccessGate` component already handles the signed-out experience without redirects.

**Current State**:
- No middleware-level auth redirects exist
- No `redirect()` calls in page components for auth (only in OAuth callback API routes, which is correct)
- `AccessGate` component handles all access states:
  - Not authenticated → shows sign-in card
  - Authenticated, no channel → shows connect-channel card
  - Authenticated with channel → renders children
- Pages like Dashboard, Videos, Analyze already use `AccessGate`

**Finding**: The app already has no auth-guard redirects on page routes. The spec requirement is already met. We just need to confirm this remains true after changes.

---

## R-005: Sidebar Visibility Rules

**Decision**: Modify `AppShellLayout` to conditionally render the sidebar based on auth state + current route.

**Current State**:
- `AppShellLayout` always renders `AppShellServer` (which always renders `AppSidebar`)
- Guest users see the full sidebar with all nav items
- The sidebar renders even on pages where signed-out users only see `AccessGate`

**Required Changes**:
1. `AppShellLayout` needs to know the current pathname to decide sidebar visibility
2. Rules: show sidebar if authenticated OR pathname is `/tags*` or `/keywords*`
3. When sidebar is hidden (signed out + protected page), render only the page content (which will show `AccessGate`)
4. Implementation: Pass a `showSidebar` flag or conditionally render different shells

**Challenge**: `AppShellLayout` is a server component. It can access the pathname via `headers()` or by passing it from the page. Next.js App Router doesn't directly expose pathname in layouts, but we can use `headers()` to read the URL.

**Decision**: Use Next.js `headers()` to read `x-invoke-path` or similar, or restructure to pass visibility at route-group level. Simpler approach: create route groups — `(sidebar)` for Tags/Keywords and `(no-sidebar)` for protected pages. However, this is over-engineering. Instead, use `headers()` to get the pathname in the server component layout.

**Revised Decision**: The cleanest approach is to have `AppShellLayout` accept an optional `hideSidebar` boolean prop. Each layout.tsx that wraps protected pages can pass `hideSidebar` based on whether the user is signed out. But since `AppShellLayout` already fetches bootstrap, it knows the auth state. We just need to pass the "is this a public-sidebar page" context. The simplest way: add a `publicSidebar?: boolean` prop to `AppShellLayout`. Tags/Keywords layouts pass `publicSidebar={true}`. Other layouts don't. Then inside `AppShellLayout`: if not authenticated and not publicSidebar, don't render the shell at all — just render children directly.

**Wait — Tags and Keywords are inside the `(app)` route group alongside competitors, goals, etc.** They share the same layout. We need a way to differentiate at the layout level.

**Final Decision**: The layout structure is:
- `app/(app)/layout.tsx` → wraps tags, keywords, analyze, competitors, goals, channel-profile, etc.
- `app/videos/layout.tsx` → wraps videos
- `app/dashboard/layout.tsx` → wraps dashboard

Since Tags and Keywords are in `(app)` alongside other pages, the layout can't simply hide the sidebar for all `(app)` routes. Options:
1. Move Tags/Keywords out of `(app)` into their own route group with `publicSidebar`
2. Have `AppShellLayout` check the pathname and apply rules there

**Decision**: Option 2 — have `AppShellLayout` use the pathname (from headers) to determine sidebar visibility. This keeps the route structure unchanged and centralizes the logic. The function `shouldShowSidebar(pathname, isAuthenticated)` returns true if authenticated OR pathname matches `/tags*` or `/keywords*`.

---

## R-006: Competitors Route Preservation

**Decision**: Remove competitors from nav config and indexing files. Keep the route files and components in place.

**Current State**:
- Competitors route exists at `app/(app)/competitors/` with full page + components
- Referenced in: `nav-config.ts`, `nav-utils.ts` (match pattern), `nav-config.server.ts` (serialization), `robots.ts`, `llms.txt/build-llms-txt.ts`, `isChannelScopedPath()` helper
- Competitor feature code also exists in `lib/features/competitors/`

**Required Changes**:
1. Remove from `primaryNavItems` in `nav-config.ts`
2. Remove from `SIDEBAR_ICON_MAP` in `nav-utils.ts`
3. Remove match pattern from `isNavItemActive` in `nav-utils.ts`
4. Remove serialization case from `nav-config.server.ts`
5. Remove from `isChannelScopedPath()` in `AppShellServer.tsx`
6. Remove from `robots.ts` disallow list (already disallowed — remove since route is de-prioritized)
7. Remove from `LLMS_TOOLS` in `build-llms-txt.ts`
8. Keep: all files in `app/(app)/competitors/`, `lib/features/competitors/`

**Rationale**: De-routing without deletion preserves future optionality. The competitor pages will still render if visited directly (bookmarks), which is acceptable.

---

## R-007: Crawl/Indexing Updates

**Decision**: Update robots.txt, sitemap, and llms.txt to remove stale routes and align with current structure.

**robots.txt changes**:
- Remove `/competitors/` from disallow (route de-linked, no need to disallow)
- Remove `/goals/` from disallow (route de-linked from nav)
- Add `/analyze/` to disallow (private, not indexed)
- Add `/dashboard/` to disallow (shows AccessGate for signed-out, not useful for crawlers — WAIT: dashboard is currently in sitemap and is public/indexable per its metadata)
- Keep `/dashboard` in sitemap and allowed — it has public metadata and shows AccessGate which is a valid landing
- Add `/subscriber-insights/` to disallow (if not already)

**sitemap changes**:
- Dashboard: keep (public with auth prompt, has indexable metadata)
- Remove: nothing new to remove (competitors was never in sitemap)
- Add `/analyze` if we want it public — spec says Analyzer is in sidebar, but its page has `index: false`. Keep it out of sitemap.

**llms.txt changes**:
- Remove "Competitor Analysis" from `LLMS_TOOLS`
- Remove "Subscriber Insights" from `LLMS_TOOLS` (not in nav)
- Remove "Goals Tracker" from `LLMS_TOOLS` (not in nav)
- Remove "Thumbnail Generator" from `LLMS_TOOLS` (not in nav)
- Add "Analyzer" to tools or public pages
- Update "Channel Profile" → "Profile" if the naming changes
- Keep or remove "Channel Profile" from tools — it's being renamed to "Profile" in sidebar but the route is different (/channel-profile vs /profile)

**Wait — clarification needed**: The spec says sidebar should have "Profile" but the current "Profile & Billing" is at `/profile` (account nav) and "Channel Profile" is at `/channel-profile` (secondary nav). Which does the spec mean?

**Decision**: The spec sidebar order is: Dashboard, Videos, Analyzer, Tags, Keywords, Profile. Given that Profile is listed last (typical position for user account), this likely refers to `/profile` (Profile & Billing page). Channel Profile (`/channel-profile`) would not be in the sidebar. The `/profile` page already uses `AccessGate`.

---

## R-008: Profile Page Route

**Decision**: "Profile" in the sidebar refers to `/profile` (the Profile & Billing page currently in `accountNavItems`).

**Rationale**:
- `/profile` page exists at `apps/web/app/(app)/profile/page.tsx`
- It's the user account page (Profile & Billing)
- Moving it from account menu to primary sidebar nav makes sense as the 6th item
- Channel Profile (`/channel-profile`) is a separate feature and not included in the new sidebar

---

## R-009: SVG Icon Files Verification

**Decision**: Verify `dashboard.svg` and `analyze.svg` exist and check their colors.

**Files confirmed to exist** (from git status showing them as new untracked files):
- `apps/web/public/sidebar/analyze.svg` (?? in git status)
- `apps/web/public/sidebar/dashboard.svg` (?? in git status)

These SVGs need to be checked for Hot Rose color. If they use a different color, update them to use `#CA1F7B`.
