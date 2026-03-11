# Data Model: Navigation & Routing Cleanup

**Branch**: `008-nav-routing-cleanup` | **Date**: 2026-03-11

## Overview

This feature involves no database schema changes. All changes are to in-memory configuration objects, UI components, and generated files.

## Entities

### Navigation Item (`NavItem`)

Existing type in `apps/web/lib/shared/nav-config.ts`. No changes to the type definition — only to the instances.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique identifier (e.g., `"dashboard"`, `"analyzer"`) |
| `label` | `string` | Display text in sidebar |
| `href` | `string` | Route path |
| `icon` | `NavIconType` | Icon type identifier |
| `channelScoped` | `boolean?` | Whether item requires channel context |
| `match` | `function?` | Custom pathname matching for active state |
| `featureFlag` | `FeatureFlagKey?` | Feature flag gating (removed from new items) |

**New primary nav item instances** (ordered):

| # | id | label | href | icon | channelScoped |
|---|-----|-------|------|------|---------------|
| 1 | `dashboard` | Dashboard | `/dashboard` | `home` | `true` |
| 2 | `videos` | Videos | `/videos` | `video` | `true` |
| 3 | `analyzer` | Analyzer | `/analyze` | `search` | `false` |
| 4 | `tags` | Tags | `/tags` | `tag` | `false` |
| 5 | `keywords` | Keywords | `/keywords` | `search` | `false` |
| 6 | `profile` | Profile | `/profile` | `user` | `false` |

### Serializable Nav Item (`SerializableNavItem`)

Existing type in `apps/web/lib/server/nav-config.server.ts`. Update match pattern union to remove `"competitors"` and `"trending"`.

```
matchPattern?: "videos" | "tags" | "keywords";
```

### Sidebar Icon Map

Existing constant in `apps/web/components/navigation/nav-utils.ts`.

| Item ID | SVG Path |
|---------|----------|
| `dashboard` | `/sidebar/dashboard.svg` |
| `videos` | `/sidebar/videos.svg` |
| `analyzer` | `/sidebar/analyze.svg` |
| `tags` | `/sidebar/tags.svg` |
| `keywords` | `/sidebar/keywords.svg` |

### Sidebar Visibility Rule (new logic)

```
showSidebar = isAuthenticated OR pathname starts with "/tags" OR pathname starts with "/keywords"
```

No data model — pure function in `AppShellLayout`.

## State Transitions

None. This feature modifies static configuration and conditional rendering, not stateful data.

## Validation Rules

None. No user input or data mutation involved.
