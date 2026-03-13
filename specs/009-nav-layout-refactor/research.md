# Research: Navigation & Layout Refactor

**Feature**: 009-nav-layout-refactor
**Date**: 2026-03-13

## R1: Current Layout Architecture

**Decision**: The app already has two route groups — `(marketing)` and `(app)` — but both render `AppShellServer` with sidebar. The marketing layout needs to be changed to render a new static-page top nav without sidebar.

**Rationale**: The `(marketing)/layout.tsx` currently wraps all content in `AppShellServer`, which renders `AppSidebar` + `AppHeader`. The `(app)/layout.tsx` uses `AppShellLayout` (which delegates to `AppShellServer` conditionally). The cleanest approach is to change `(marketing)/layout.tsx` to render a new `StaticNav` component instead of `AppShellServer`.

**Alternatives considered**:
- Adding a `hideSidebar` prop to AppShellServer → adds conditional complexity to an already complex component
- Using CSS to hide sidebar on static pages → leaves ghost containers and doesn't simplify the component tree

## R2: Static Top Nav Component

**Decision**: Create a new `StaticNav` component in `components/navigation/` that renders the marketing-style top nav (logo, Learn, Pricing, Get Started). This is separate from `AppHeader`.

**Rationale**: `AppHeader` is tightly coupled to app concerns (channel selector, user dropdown, mobile nav slot). A separate `StaticNav` component is simpler and avoids conditional logic in `AppHeader`. The two navbars have fundamentally different content and purpose.

**Alternatives considered**:
- Reuse `AppHeader` with conditional rendering → would add complexity to an already 440-line file
- Create a generic nav component used by both → over-engineering for two different use cases

## R3: Logo Reuse

**Decision**: Extract the ChannelBoost logo SVG into a shared `Logo` component in `components/navigation/Logo.tsx` and use it in both `AppSidebar` and `StaticNav`.

**Rationale**: The logo SVG is currently duplicated inline in `AppSidebar.tsx` and `MobileNav.tsx`. Extracting it follows the DRY principle and the constitution's "one component per file" rule.

**Alternatives considered**:
- Copy the SVG again into StaticNav → three copies of the same SVG is excessive
- Use an SVG file import → current pattern uses inline SVGs; stay consistent

## R4: Sidebar Bottom Section

**Decision**: Add a new bottom nav section in `AppSidebar` between the existing `nav` and `bottomSection` (legal links). The three items (Channel, Account, Support) use the existing `NavItemLink` pattern with existing `NavIcon` types.

**Rationale**: The sidebar already has a `bottomSection` with legal links and collapse toggle. Adding nav items above that section using the existing `navList` + `NavItemLink` pattern keeps styling consistent. The `NavIcon` component already supports `channel`, `user`, and `mail` icon types.

**Alternatives considered**:
- Add to `nav-config.ts` as secondary nav items → would show them in the middle of the sidebar, not at the bottom
- Absolute positioning → constitution says to avoid hacks; flex layout with `margin-top: auto` is cleaner

## R5: Routing Destinations

**Decision**:
- Channel → `/channel-profile` (existing route, channel-scoped)
- Account → `/profile` (existing route)
- Support → `/contact` (existing route under marketing)

**Rationale**: All three destination routes already exist in the codebase.

## R6: Pricing Page

**Decision**: Link to `/pricing` in the static nav. The page doesn't exist yet but the link should be present per spec assumptions.

**Rationale**: The spec states "The Pricing page route exists or will be created separately; this feature links to it regardless." The link is a simple `<Link href="/pricing">` — it will work when the page exists and show a 404 until then.

## R7: Get Started Button Destination

**Decision**: Route to `/auth/login?redirect=/videos` — the same destination as the existing "Sign in" button in `AppHeader`.

**Rationale**: "Get Started" is the marketing equivalent of "Sign in". Using the same auth flow with redirect to the app is the expected behavior.
