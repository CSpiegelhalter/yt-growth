# Research: AccessGate Component

## R-001: Current Auth Guard Architecture

**Decision**: Replace three layers of auth protection with a single component-level pattern.

**Current state** — three layers exist:

1. **Edge middleware** (`proxy.ts:67-137`): `isProtectedPath()` checks prefixes (`/channels`, `/audit`, `/profile`, `/subscriber-insights`, `/competitors`, `/video`, `/admin`, `/api/private`, `/api/me`) and redirects to `/auth/login?redirect=...` if no JWT token.

2. **Layout-level guard** (`app/(app)/layout.tsx:24-28`): Server component calls `getCurrentUserServer()` and redirects to `/auth/login` if null. All pages under `(app)` route group are protected.

3. **Page-level guards** (`app/(app)/thumbnails/page.tsx:32`, `app/(app)/thumbnails/editor/[projectId]/page.tsx:27`): Additional redirect calls directly in page components.

**What already uses the optional pattern** (no redirect):
- `app/videos/page.tsx` — uses `getAppBootstrapOptional()`, renders `LoggedOutDashboardPreview` if null
- `app/dashboard/page.tsx` — uses `getAppBootstrapOptional()`, renders `DashboardLoggedOut` if null
- `app/dashboard/layout.tsx` — uses `getAppBootstrapOptional()`, renders guest shell if null

**Rationale**: The optional pattern (videos, dashboard) is already the target pattern. The AccessGate component standardizes this approach across all pages.

**Alternatives considered**:
- Middleware-only approach: rejected because it forces redirects, breaking SEO
- Layout-only guard: rejected because different pages need different gating (auth-only vs auth+channel)

---

## R-002: Existing Auth Prompt Components (Consolidation Candidates)

**Decision**: Consolidate three existing components into AccessGate.

| Component | Location | Purpose | Status |
|-----------|----------|---------|--------|
| `AuthPrompt` | `components/auth/auth-prompt.tsx` | Card with sign-in/sign-up buttons | **Absorb into AccessGate** |
| `ConnectChannelPrompt` | `components/ui/ConnectChannelPrompt.tsx` | EmptyState wrapper for channel connection | **Absorb into AccessGate** |
| `LoggedOutDashboardPreview` | `components/dashboard/LoggedOutDashboardPreview/` | Full preview page with blurred cards for /videos | **Replace with AccessGate** |
| `DashboardLoggedOut` | `app/dashboard/components/dashboard-logged-out.tsx` | Thin wrapper around AuthPrompt for /dashboard | **Replace with AccessGate** |

**Rationale**: AuthPrompt and ConnectChannelPrompt contain the correct design patterns. AccessGate wraps both into a single component with wrapper semantics. LoggedOutDashboardPreview is a heavier component with preview cards — per spec, the gate UI should be clean and minimal (no mock content behind it), so it gets replaced.

---

## R-003: Auth State Detection

**Decision**: Use server-side `getAppBootstrapOptional()` as the primary data source.

**How it works**:
- `getCurrentUserServer()` → returns `{ id, email, name }` or `null`
- `getChannelsServer(userId)` → returns `Channel[]`
- `getAppBootstrapOptional()` → returns `{ me, channels, activeChannelId, activeChannel }` or `null`

**AccessGate data flow**:
- `null` bootstrap → STATE 1 (not logged in)
- Bootstrap with `channels.length === 0` → STATE 2 (no channel)
- Bootstrap with channels → STATE 3 (render children)

**Rationale**: This is already the established server-side pattern. No new infrastructure needed.

---

## R-004: Pages Requiring AccessGate

**Decision**: Categorize pages into three groups.

### Group A: Currently in `(app)` route group (redirect-protected)
These need to move out of `(app)` or the `(app)` layout guard needs removal:

| Page | Path | Needs Channel? |
|------|------|---------------|
| Goals | `/goals` | Yes |
| Competitors | `/competitors` | Yes |
| Competitor Video | `/competitors/video/[videoId]` | Yes |
| Subscriber Insights | `/subscriber-insights` | Yes |
| Thumbnails | `/thumbnails` | Yes (+ feature flag) |
| Thumbnail Editor | `/thumbnails/editor/[projectId]` | Yes (+ feature flag) |
| Trending | `/trending` | No (auth-only + feature flag) |
| Profile | `/profile` | No (auth-only) |
| Channel Profile | `/channel-profile` | Yes |
| Admin YouTube Usage | `/admin/youtube-usage` | No (admin-only) |

### Group B: Already using optional pattern
| Page | Path | Current logged-out UX |
|------|------|----------------------|
| Videos | `/videos` | `LoggedOutDashboardPreview` |
| Dashboard | `/dashboard` | `DashboardLoggedOut` → `AuthPrompt` |

### Group C: Public pages (no changes needed)
- All `(marketing)` pages (homepage, learn, privacy, terms, contact)
- Auth pages (`/auth/*`)

---

## R-005: Proxy.ts Protected Paths

**Decision**: Remove page paths from `isProtectedPath()` in proxy.ts, keep API paths protected.

**Current protected prefixes**:
- `/channels` — page (remove)
- `/audit` — page (remove)
- `/profile` — page (remove)
- `/subscriber-insights` — page (remove)
- `/competitors` — page (remove)
- `/video` — page (remove)
- `/admin` — page (remove)
- `/api/private` — API (keep)
- `/api/me` — API (keep)

**Rationale**: API routes must remain auth-protected (they return 401 without token). Page routes should always render and let AccessGate handle the UI. The admin page has its own `isAdminUser()` check.

---

## R-006: Layout Strategy

**Decision**: Modify the `(app)` layout to use the optional pattern instead of redirecting.

**Option A** (selected): Change `(app)/layout.tsx` to use `getAppBootstrapOptional()` and pass auth state down. Pages use AccessGate component.

**Option B** (rejected): Move all pages out of `(app)` route group. Too many file moves, high risk.

**Rationale**: Option A is minimally invasive. The layout still fetches data server-side but no longer redirects. Each page wraps content in `<AccessGate>`.

---

## R-007: AccessGate Component Design

**Decision**: Server component that receives bootstrap data as props.

```
AccessGate props:
- bootstrap: BootstrapData | null (from getAppBootstrapOptional)
- requireChannel?: boolean (default: true)
- children: ReactNode
```

**Rendering logic**:
1. `bootstrap === null` → sign-in prompt (centered, above midpoint)
2. `bootstrap && requireChannel && channels.length === 0` → connect-channel prompt
3. Otherwise → render children

**Styling**: Full-page centered layout using `min-height: calc(100dvh - 200px)` with `padding-bottom: 10vh` (matching existing `dashboard-logged-out.module.css` pattern for "slightly above center").

**Rationale**: Server component avoids `'use client'` (constitution: Server-First Rendering). Props-based approach keeps it simple and testable.
