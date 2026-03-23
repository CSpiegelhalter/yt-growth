# Research: Learn Page Redesign

**Branch**: `013-learn-page-redesign` | **Date**: 2026-03-20

## Research Tasks

### R1: Shared Hero Component Extraction Strategy

**Decision**: Extract a `MarketingHeroBand` server component that renders the gradient band, texture overlay, and landing icon, accepting children for the text content area.

**Rationale**:
- The Landing page and Learn page hero bands are visually identical in the Figma design: same gradient (`--hero-gradient`), same texture overlay (`hero-texture.webp`, 30% opacity, multiply blend, vertically flipped), same icon (`landing_icon.svg`) positioned on the right.
- The only difference is the text content inside the hero (title, badge, subtitle vs. welcome text and h1).
- A shared component with a `children` slot for the left-side text content is the simplest abstraction — it avoids over-engineering with excessive props while enabling both pages to compose their own content.

**Alternatives considered**:
- **Separate components**: Rejected — would create near-identical code in two places, violating DRY and Constitution V (Code Minimalism).
- **Configuration-driven hero with many props**: Rejected — over-engineered for 2 consumers. A `children` slot is simpler and more flexible.
- **CSS-only shared pattern (no component)**: Rejected — the texture overlay image and icon image rendering require JSX, making a shared component more appropriate than just shared CSS classes.

### R2: Figma Layout Mapping to Existing Design System

**Decision**: Map Figma absolute pixel values to existing CSS variable tokens and responsive breakpoints.

**Rationale**: The Figma design uses a 1600px canvas with absolute positioning. The implementation will use the existing `--page-max-width: 1200px` container, CSS Grid/Flexbox, and responsive breakpoints (640px, 768px, 900px). Specific mappings:

| Figma element | Figma value | Implementation |
|---------------|-------------|----------------|
| Page bg | `#f3f4fb` | `var(--color-page-bg)` (already set) |
| Hero gradient | `164.8deg, #CA1F7B 15%, #35A7FF 112%` | `var(--hero-gradient)` (existing, close match) |
| Texture opacity | 30% | Already used by Landing page hero at 30% |
| Icon size | 319×287px | Already used by Landing page (320×287) |
| Content width | ~950px within 1600px canvas | `var(--page-max-width)` with auto centering |
| Card border | `1px solid #e8eafb` | `var(--border-card)` or `var(--color-lavender-mist)` border |
| Card shadow | `0px 4px 4px rgba(0,0,0,0.08)` | Matches existing card shadow pattern |
| Card radius | 20px | `var(--radius-xl)` |
| Pill border | 2px solid `#d03688` | `var(--color-hot-rose)` border |
| Body text | 15px/24px Fustat Medium | `var(--text-sm)` / `var(--leading-relaxed)` |
| Section titles | 22px Fustat Bold | `var(--text-subtitle)` / `font-weight: 700` |
| Hero title | 50px Fustat ExtraBold | Custom (larger than `--text-4xl`), add `--text-5xl: 50px` or use direct value in hero scope |
| Badge text | 20px Fustat Medium | `var(--text-xl)` |
| Value prop icons | 30×30px checkmark | Inline SVG or existing checkmark pattern |

**Alternatives considered**:
- **Pixel-perfect Figma reproduction**: Rejected — would require hardcoded values and break responsive behavior. Adapting to design system tokens is the correct approach per Constitution IV.

### R3: Article Grid — 2-Column vs 3-Column

**Decision**: Change the articles grid from 3-column to 2-column on desktop, matching the Figma design.

**Rationale**: The Figma shows article cards in a 2-column grid at ~465px per card. The current implementation uses a 3-column grid. The 2-column layout gives each card more horizontal space for descriptions, improving readability. On mobile (<640px), cards will stack to single-column.

**Alternatives considered**:
- **Keep 3-column**: Rejected — doesn't match the Figma design, which is the source of truth for this task.
- **Auto-fit responsive grid**: Considered — a `grid-template-columns: repeat(auto-fit, minmax(400px, 1fr))` approach would naturally give 2 columns at 1200px and 1 column on mobile. This is the cleanest implementation.

### R4: Value Props Layout — 2×2 Grid with Icons

**Decision**: Change value propositions from a vertical bulleted list to a 2×2 grid with checkmark icons.

**Rationale**: The Figma shows 4 value props arranged in 2 rows of 2, each with a 30px checkmark icon to the left. The current implementation renders them as a `<ul>` with CSS checkmarks. The new layout requires CSS Grid (2 columns on desktop, 1 column on mobile) with each item being an icon + text pair.

**Alternatives considered**:
- **Keep as list**: Rejected — doesn't match Figma.
- **4-column row**: Rejected — Figma clearly shows 2×2 grid, not a single row.

### R5: Start Here Section — Card with Pill Buttons

**Decision**: Redesign the "Start Here" section as a white rounded card containing centered pill-style buttons with descriptions beneath each.

**Rationale**: The Figma shows this section as a single `950px × 325px` white card with `20px` border-radius, containing:
- Title: "New to YouTube Growth?"
- Description paragraph
- 3 pill buttons with `#d03688` (hot-rose) 2px border, 20px radius, 45px height
- Centered description text beneath each button

The current implementation uses `Link` cards. The new design uses inline pill buttons with centered helper text — simpler and more visually distinct.

### R6: Landing Page Hero Styles Location

**Decision**: Move landing hero-specific CSS from `globals.css` to `MarketingHeroBand.module.css`. Keep landing-page-specific content styles (signup card, value prop, pillars, etc.) in `globals.css` for now.

**Rationale**: The hero gradient band styles (`.landingHeroBand`, `.landingHeroTexture`, `.landingHeroInner`, `.landingHeroIcon`) are currently in `globals.css` because the Landing page doesn't use CSS Modules. Extracting these into the shared component's CSS Module is cleaner and follows the component colocation pattern. Non-hero landing styles can remain in `globals.css` to minimize scope of changes.

**Alternatives considered**:
- **Full landing page CSS Module extraction**: Rejected — too much scope creep. Only extract what's needed for the shared hero.
- **Keep hero styles in globals.css**: Rejected — the shared component should own its styles per standard CSS Module practice.
