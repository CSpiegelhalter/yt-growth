# Quickstart: Landing Page Redesign

## Prerequisites

- Bun installed
- Project dependencies installed (`bun install`)
- Figma MCP server connected (for design reference)

## Development

```bash
# Start dev server
make dev

# View landing page
open http://localhost:3000
```

## Key Files to Edit

1. `apps/web/app/(marketing)/page.tsx` — Landing page component (restructure sections)
2. `apps/web/app/globals.css` — Landing page CSS classes (update layout, spacing, colors)
3. `apps/web/public/hero-texture.webp` — New asset: hero gradient texture overlay

## Verification

```bash
# Run all pre-flight checks
make preflight

# Manual checks:
# 1. Compare landing page against Figma design at 1440px width
# 2. Verify all existing copy text is present
# 3. Test responsive at 375px, 768px, 1440px
# 4. Confirm no sidebar visible, only static top nav
# 5. Check all images load (no 404s in network tab)
# 6. Verify landing_icon.svg is visible in hero section
```

## Design Reference

Figma: https://www.figma.com/design/FBUmzpPK0YTx1KpkaaMwth/channelboost?node-id=287-115&m=dev
