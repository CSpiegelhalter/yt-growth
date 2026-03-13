# Data Model: Navigation & Layout Refactor

**Feature**: 009-nav-layout-refactor
**Date**: 2026-03-13

## Overview

This feature has no database changes. All changes are to UI components and layout files.

## Key Entities (UI-only)

### StaticNavItem

Represents a navigation link in the static-page top nav.

- `label`: Display text (e.g., "Learn", "Pricing")
- `href`: Route destination
- `variant`: `"link"` or `"button"` (determines rendering style)

### SidebarBottomItem

Represents a navigation link in the sidebar bottom section. Uses the existing `NavItem` type from `nav-config.ts`.

- `id`: Unique identifier (e.g., "channel", "account", "support")
- `label`: Display text
- `href`: Route destination
- `icon`: NavIconType (uses existing icon types: "channel", "user", "mail")
- `channelScoped`: boolean (only Channel is channel-scoped)

## State

No new client or server state. Sidebar bottom items are static configuration. The `StaticNav` component is stateless (no dropdowns, no auth-dependent rendering).
