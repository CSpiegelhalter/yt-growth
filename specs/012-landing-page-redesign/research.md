# Research: Landing Page Redesign

## R1: Hero Gradient Texture/Background Image

**Decision**: Download the crowd/city texture image from the Figma design and save as `apps/web/public/hero-texture.webp`. Use it as a `mix-blend-multiply` overlay at 30% opacity on gradient bands.

**Rationale**: The Figma design uses a photographic texture overlay (flipped vertically, low opacity) on both gradient sections (hero and "How It Works") to add visual depth. Using a locally-hosted WebP image ensures fast loading and no external dependencies.

**Alternatives considered**:
- CSS-only gradient patterns: Would not match the Figma's textured look.
- External CDN image: Violates FR-010 (all assets locally hosted).
- Skip the texture: Would diverge from the Figma design.

## R2: Signup Card in Hero vs Current CTA

**Decision**: Replace the current simple CTA button in the hero with a signup card overlay matching the Figma layout. The card contains a form-like visual with "Start with a free account" heading, subtitle text, input fields (name, email, channel URL), and a "Create Free Account" button. Since we are preserving current functionality (Google OAuth login flow), the form fields will be presentational and the button links to the existing login/signup flow.

**Rationale**: The Figma clearly shows a white card with form fields overlapping the hero gradient. However, the actual signup flow uses Google OAuth (not email/password). The card should serve as a visual CTA that directs users to the OAuth flow.

**Alternatives considered**:
- Fully functional form: Not aligned with current OAuth-based auth. Would require backend changes out of scope.
- Keep current simple CTA button: Would not match Figma design.
- **Recommended approach**: Style the card as shown in Figma but make the entire card or its button link to the existing signup flow (`/videos` or login redirect), preserving the current conversion path.

## R3: Feature Cards Layout Change (5 → 2-column grid)

**Decision**: Change from the current 5-card flexible grid to a 2-column grid layout. The Figma shows 4 feature cards in a 2×2 grid. Since we have 5 features, we'll use a 2-column grid that wraps, with the 5th card centered on its own row.

**Rationale**: The Figma shows a clean 2-column layout. Our 5 features fit naturally as 2+2+1 (centered last card).

**Alternatives considered**:
- Drop one feature: Would lose SEO-valuable content.
- 3-column layout: Doesn't match Figma.
- Keep 5 in current responsive grid: Doesn't match Figma.

## R4: Guide Cards Layout

**Decision**: Show guide cards in a 2-column grid (matching Figma) instead of the current responsive grid. Featured guides get full cards; additional guides remain in compact list format below.

**Rationale**: Figma shows a clean 2-column guide card layout. Preserving the compact list for additional guides maintains all internal links for SEO.

## R5: Page Background Color

**Decision**: Use `#f3f4fb` as the page background. This is very close to `--color-lavender-mist` (#F8F1FF) but has a blue tint instead of purple. Add a new CSS variable `--color-page-bg: #f3f4fb` to maintain the design system pattern.

**Rationale**: The Figma explicitly uses `#f3f4fb` throughout. It's a distinct shade from lavender-mist and warrants its own token.

## R6: CSS Architecture

**Decision**: Keep landing page styles in `globals.css` (not extract to a CSS module). Update existing `.landing*` class rules to match the new Figma layout.

**Rationale**: The current approach inlines critical above-fold CSS in globals.css for performance (avoids CLS). Changing to a CSS module would require careful extraction and could impact FCP. Since all landing page classes are already prefixed with `.landing*`, there's no namespace collision risk.

## R7: Responsive Breakpoints

**Decision**: Use the existing breakpoint strategy (mobile-first, 480px / 768px / 1024px). The Figma shows a desktop layout at 1600px width. Responsive adaptations:
- Mobile (< 480px): Single column, hero card stacks below title, feature cards stack, steps stack.
- Tablet (480–768px): Single column with wider cards.
- Desktop (768px+): 2-column feature cards, 3-column steps, hero card beside title.

**Rationale**: Consistent with the rest of the app. The Figma only shows desktop; mobile/tablet layouts follow existing patterns.
