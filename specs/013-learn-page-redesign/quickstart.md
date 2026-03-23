# Quickstart: Learn Page Redesign

**Branch**: `013-learn-page-redesign` | **Date**: 2026-03-20

## Prerequisites

- Bun installed
- On branch `013-learn-page-redesign`

## Setup

```bash
cd apps/web
bun install
```

## Development

```bash
make dev
# Visit http://localhost:3000/learn to see the learn page
# Visit http://localhost:3000 to verify landing page hero is intact
```

## Implementation Order

### Step 1: Create shared MarketingHeroBand component
1. Create `apps/web/components/marketing/MarketingHeroBand.tsx` — server component rendering gradient band + texture + icon
2. Create `apps/web/components/marketing/MarketingHeroBand.module.css` — extract hero band styles from `globals.css`

### Step 2: Refactor Landing page to use MarketingHeroBand
1. Modify `apps/web/app/(marketing)/page.tsx` — replace inline hero JSX with `<MarketingHeroBand>` wrapping the existing welcome text + title
2. Remove extracted hero band styles from `globals.css` (keep non-hero landing styles)
3. Verify Landing page looks identical: `http://localhost:3000`

### Step 3: Redesign Learn page layout
1. Modify `apps/web/app/(marketing)/learn/page.tsx` — use `<MarketingHeroBand>` for hero, restructure sections per Figma
2. Modify `apps/web/app/(marketing)/learn/style.module.css` — update styles for 2×2 value props, start-here card, 2-column article grid

### Step 4: Validate
```bash
make preflight
# Compare against .agent/baseline.json — no regressions allowed
```

## Verification Checklist

- [ ] `/learn` hero matches Figma: gradient band + texture + icon on right
- [ ] `/learn` value props in 2×2 grid with checkmark icons
- [ ] `/learn` start-here section is a white card with pill buttons
- [ ] `/learn` article grid is 2-column (desktop), 1-column (mobile)
- [ ] `/` landing page hero unchanged visually
- [ ] Both pages use `MarketingHeroBand` component
- [ ] All existing `/learn` text content preserved
- [ ] Responsive: mobile (<640px), tablet (640-900px), desktop (≥900px)
- [ ] `make preflight` passes with no regressions
