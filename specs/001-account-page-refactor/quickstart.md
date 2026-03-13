# Quickstart: Account Page Refactor

**Branch**: `001-account-page-refactor`

## Prerequisites

- Bun installed
- Database running (`make db-up`)
- Environment variables configured (copy `env.example` → `.env`)

## Setup

```bash
git checkout 001-account-page-refactor
bun install
make dev
```

## Development

Navigate to `http://localhost:3000/account` (requires authentication).

### Key files to modify

1. `apps/web/app/(app)/account/ProfileClient.tsx` — main layout restructure
2. `apps/web/app/(app)/account/style.module.css` — two-column grid styles
3. `apps/web/app/(app)/account/_components/AccountStats.tsx` — left card content restructure
4. `apps/web/app/(app)/account/_components/AccountStats.module.css` — left card styles

### Key files to reference (do not modify)

- `apps/web/components/pricing/UpgradeCard.tsx` — reusable CTA component
- `apps/web/app/(app)/account/_components/BillingCTA.tsx` — wraps UpgradeCard with checkout logic
- `apps/web/app/globals.css` — design tokens
- `styles.md` — design system reference

## Validation

```bash
make preflight
```

All 6 checks (build, lint, knip, madge, depcruise, jscpd) must pass with no regressions against `.agent/baseline.json`.

## Figma Reference

- URL: https://www.figma.com/design/FBUmzpPK0YTx1KpkaaMwth/channelboost?node-id=272-2&m=dev
- Key layout: Two equal-width cards side by side, sign out button below
