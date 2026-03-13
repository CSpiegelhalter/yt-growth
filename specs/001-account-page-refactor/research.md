# Research: Account Page Refactor

**Date**: 2026-03-13
**Branch**: `001-account-page-refactor`

## Research Summary

This is a presentation-layer refactor with no unknowns requiring deep research. All dependencies exist in the codebase. The primary research was auditing existing components and mapping Figma design tokens to the existing design system.

---

## R1: Existing Account Page Structure

**Decision**: Refactor the current vertical stack layout into a two-column grid.

**Rationale**: The current `ProfileClient.tsx` renders 4 sections in a single column: Account Info card → Subscription section → Connected Channels card → Sign out button. The Figma design shows a two-column layout with account info + channels on the left and the upgrade CTA on the right. The refactor consolidates the left column into one card.

**Current structure**:
- `ProfileClient.tsx` — orchestrates all sections in a vertical `.grid` (flex column)
- `AccountStats` — grid of stat boxes (email, plan badge, status, channel count, usage bars)
- `BillingCTA` — wraps `UpgradeCard` for free users, shows subscription management for Pro users
- `ChannelListSection` — inline function rendering channel list with remove buttons
- Sign out button — inline in ProfileClient

**Alternatives considered**:
- Creating a new `AccountOverviewCard` wrapper component — rejected as unnecessary abstraction for a single-use layout change
- Splitting into separate route segments — rejected as over-engineering for a layout refactor

---

## R2: Reusable UpgradeCard / BillingCTA Component

**Decision**: Reuse `BillingCTA` as-is for the right column. It already delegates to `UpgradeCard` for non-subscribers.

**Rationale**: `BillingCTA` (`app/(app)/account/_components/BillingCTA.tsx`) already handles both states:
- **Free users**: renders `<UpgradeCard onPurchase={handleSubscribe} isPro={false} />` with Stripe checkout flow
- **Pro users**: renders subscription card with plan name, active/canceling badge, pricing, features, and "Manage Subscription" button

The `UpgradeCard` component (`components/pricing/UpgradeCard.tsx`) already matches the Figma right-card design:
- 2px imperial-blue border, 20px border-radius
- Gradient header (167deg, hot-rose to cool-sky)
- Feature checklist with check circle icons
- "$12/mo" pricing with purchase button

**No modifications needed** to either component.

**Alternatives considered**:
- Building a new CTA component for Account page — rejected per spec requirement to reuse shared component
- Extracting BillingCTA to `components/` — could be done later if reuse beyond Account page is needed, but not required now

---

## R3: Figma-to-Design-System Token Mapping

**Decision**: Figma design tokens map cleanly to existing CSS variables.

| Figma Value | CSS Variable | Notes |
|-------------|-------------|-------|
| `#222a68` (text, borders) | `var(--color-imperial-blue)` | Exact match |
| `#e8eafb` (left card border) | `var(--border)` or `var(--border-light)` | Close match; may use explicit value in card class |
| `#f3f4fb` (background, plan badge) | `var(--bg)` / `var(--surface-alt)` | Close match |
| `20px` border-radius | `var(--radius-lg)` | Maps to existing token |
| `8px` button border-radius | `var(--radius-md)` | Maps to existing token |
| `box-shadow: 0 4px 4px rgba(0,0,0,0.08)` | `var(--shadow-card)` | Use existing card shadow token |
| `#3e457b` (add channel border) | `var(--color-imperial-blue)` | Close enough; use semantic token |
| Gradient (167deg, hot-rose → cool-sky) | Already in `UpgradeCard.module.css` | Exact match |

**Rationale**: The Figma colors align closely with the existing brand palette. Using CSS variables ensures design system compliance per constitution principle IV.

---

## R4: Left Card Content — Figma vs. Current Implementation

**Decision**: The left card will show: Overview heading, Email, Plan (with Active badge), Channels list (with channel URLs), and Add Channel button. Daily usage bars will remain but be secondary.

**Figma shows**:
- "Overview" heading
- Email label + value
- Plan label + "Free" value + "Active" pill badge
- Channels label + list (channel name, youtube URL, settings icon per row)
- "Add Channel" outlined button

**Current implementation has**:
- Email, Plan badge, Status, Channels Used (as a stat grid)
- Daily usage bars (video analyses, competitor analyses, idea generations, channel syncs)
- Separate "Connected Channels" card with channel thumbnails, names, video counts, remove buttons

**Reconciliation**: Restructure `AccountStats` to display as labeled rows (Email → Plan → Channels) matching Figma, while preserving the daily usage section below. The channel list from `ChannelListSection` moves into the left card below the overview section.

**Alternatives considered**:
- Dropping daily usage entirely — rejected to preserve existing functionality per spec FR-008
- Creating a separate "Usage" card — rejected as unnecessary complexity; usage fits naturally below the overview in the left card
