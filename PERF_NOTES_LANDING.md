# Landing Page Performance Optimizations

This document describes the performance optimizations made to the landing page (`app/page.tsx`) to improve Lighthouse scores and eliminate CLS.

## Summary of Changes

### 1. Eliminated CLS from Auth-Aware CTAs

**Problem:** The `HeroCTAs` component was a client component that showed different content based on authentication state. It displayed a loading skeleton during the auth check, then switched to actual buttons. This caused significant layout shift (~0.234 CLS).

**Solution:** Created `HeroStaticCTAs` - a server-rendered component that always shows "Get Started" and "Sign In" buttons without client-side auth checks.

- Location: `components/HeroStaticCTAs.tsx`
- The landing page doesn't need auth-aware CTAs; signed-in users can navigate via the header
- Static rendering eliminates the skeleton → content transition that caused CLS

### 2. Font Loading Optimization

**Problem:** System font stack in CSS could cause FOUT (Flash of Unstyled Text) and layout shift during font loading.

**Solution:** Added `next/font` with Inter font in `app/layout.tsx`:
- Self-hosted font files (no external requests)
- `display: swap` with proper fallback stack
- Font CSS variable (`--font-inter`) used in globals.css
- Eliminates font swap CLS

### 3. Stable Layout Dimensions

**Problem:** The `<main>` element and hero section had no fixed dimensions, allowing content to shift.

**Solutions:**
- **Header:** Fixed height (`var(--header-height)`) prevents header resize during hydration
- **Auth Section:** Reserved minimum width (`100px` mobile, `260px` desktop) to prevent layout shift when auth state changes
- **Hero Section:** Added `min-height` values (420px mobile, 380px tablet, 400px desktop) to reserve above-fold space
- **CTA Container:** Fixed height (`116px` mobile stacked, `52px` desktop inline) with explicit button dimensions

### 4. Critical CSS Consolidation

**Problem:** Multiple CSS module chunks loaded on landing page causing render-blocking.

**Solution:** Moved critical above-fold styles to `app/globals.css`:
- Hero CTA button styles are now in globals (`.heroCtas`, `.heroCtas__primary`, `.heroCtas__secondary`)
- Removed dependency on `HeroCTAs.module.css` for landing page
- Fewer CSS chunks = faster critical path

### 5. Modern Browser Targeting

**Problem:** Unnecessary polyfills for baseline features (Array.prototype.at, Object.fromEntries, etc.) added ~14KB to bundle.

**Solution:** Added explicit `browserslist` in `package.json`:
```json
"browserslist": [
  "Chrome >= 90",
  "Firefox >= 90",
  "Safari >= 15",
  "Edge >= 90",
  "iOS >= 15",
  "not dead"
]
```

These targets support all baseline features without polyfills while maintaining ~98%+ global browser coverage.

## Files Changed

- `app/page.tsx` - Uses `HeroStaticCTAs` instead of `HeroCTAs`
- `app/layout.tsx` - Added `next/font` Inter with proper fallbacks
- `app/globals.css` - Added critical hero CTA styles, updated font-sans variable
- `app/home.module.css` - Added hero min-height, removed unused CTA overrides
- `components/HeroStaticCTAs.tsx` - New server-rendered CTA component
- `components/Header.module.css` - Fixed header height, auth section dimensions
- `package.json` - Added browserslist for modern browser targeting

## How to Prevent Regression

1. **Never add client-side state checks above the fold** on the landing page
   - If auth-aware content is needed, use server-side checks or place it below the fold

2. **Always use `next/font`** for font loading
   - Never use `@import` for Google Fonts in CSS
   - Always provide fallback fonts with similar metrics

3. **Reserve space for dynamic content**
   - Use `min-height` on containers
   - Use explicit `width`/`height` on images
   - Use `aspect-ratio` for responsive media

4. **Keep critical CSS minimal**
   - Above-fold styles should be in globals.css
   - Dynamic imports for below-fold components
   - Audit CSS chunks after adding new landing page components

5. **Test with Lighthouse regularly**
   - Run `npx lighthouse http://localhost:3000 --view` after changes
   - Target: CLS < 0.1, LCP < 2.5s, FCP < 1.8s

## Verification

Run locally:
```bash
npm run build && npm run start
```

Then test with Lighthouse:
```bash
npx lighthouse http://localhost:3000 --view
```

Expected improvements:
- CLS: ~0.234 → < 0.05
- Reduced render-blocking CSS
- Improved LCP/FCP from faster critical path
- Smaller JS bundle from reduced polyfills

