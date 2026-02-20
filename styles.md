# Design System

Single source of truth for colors, typography, and reusable UI components.
**All UI work must follow this document.** See also `.cursor/rules/design-system.mdc` for automated enforcement.

---

## Brand Color Palette

| Name           | CSS Variable               | Hex       | Usage                         |
|----------------|----------------------------|-----------|-------------------------------|
| Hot Rose       | `--color-hot-rose`         | `#CA1F7B` | Accents, highlights, CTA      |
| Imperial Blue  | `--color-imperial-blue`    | `#222A68` | Dark accents, headings         |
| Lavender Mist  | `--color-lavender-mist`    | `#F8F1FF` | Light backgrounds, tints       |
| Cool Sky       | `--color-cool-sky`         | `#35A7FF` | Links, positive signals        |
| Stormy Teal    | `--color-stormy-teal`      | `#0F7173` | Secondary accents, neutral tag |

### Gradient Tokens

| Name              | CSS Variable            | Value                               |
|-------------------|-------------------------|--------------------------------------|
| Positive gradient | `--gradient-positive`   | `linear-gradient(90deg, #D03688, #5BB8FF)` |
| Negative gradient | `--gradient-negative`   | `linear-gradient(90deg, #D03688, #222A68)` |
| Neutral gradient  | `--gradient-neutral`    | `linear-gradient(90deg, #35A7FF, #0F7173)` |

### Global Utility Classes

```css
.color-hot-rose      { color: var(--color-hot-rose); }
.color-imperial-blue { color: var(--color-imperial-blue); }
.color-lavender-mist { color: var(--color-lavender-mist); }
.color-cool-sky      { color: var(--color-cool-sky); }
.color-stormy-teal   { color: var(--color-stormy-teal); }

.bg-hot-rose         { background-color: var(--color-hot-rose); }
.bg-imperial-blue    { background-color: var(--color-imperial-blue); }
.bg-lavender-mist    { background-color: var(--color-lavender-mist); }
.bg-cool-sky         { background-color: var(--color-cool-sky); }
.bg-stormy-teal      { background-color: var(--color-stormy-teal); }
```

---

## Typography

**Font**: Fustat (Google Fonts), loaded via `next/font/google`.

- CSS variable: `--font-fustat`
- Set as default body font via `--font-sans: var(--font-fustat)`
- Inter remains available via `--font-inter` for fallback/specific uses

### Brand Type Scale

| Role         | Font    | Weight | Size  | Line Height | Letter Spacing |
|--------------|---------|--------|-------|-------------|----------------|
| Big Header   | Fustat  | 600    | 32px  | 1.0         | 0              |
| Subtitle     | Fustat  | 700    | 22px  | 1.0         | 0              |
| Primary Text | Fustat  | 400    | 18px  | 1.0         | 0              |

### CSS Classes

```css
.text-h1       /* Big Header: 32px / 600 / 1.0 */
.text-subtitle /* Subtitle: 22px / 700 / 1.0 */
.text-body     /* Primary text: 18px / 400 / 1.0 */
```

### React Components

```tsx
import { H1, Subtitle, Text } from '@/components/ui';

<H1>Page Title</H1>                     {/* renders <h1> by default */}
<Subtitle>Section heading</Subtitle>     {/* renders <h2> by default */}
<Text>Body content here.</Text>          {/* renders <p> by default */}

{/* Override the rendered element with `as` */}
<H1 as="span">Inline heading</H1>
<Text as="div">Block container</Text>
```

### General-Purpose Size Tokens

These remain available for supporting UI (labels, captions, meta text):

| Token          | Size   |
|----------------|--------|
| `--text-xs`    | 12px   |
| `--text-sm`    | 14px   |
| `--text-base`  | 16px   |
| `--text-lg`    | 18px   |
| `--text-xl`    | 20px   |
| `--text-2xl`   | 24px   |
| `--text-3xl`   | 30px   |
| `--text-4xl`   | 36px   |

---

## Tag / Pill Component

A single reusable component for all tag/badge/chip/pill UI.

### Spec

- **Height**: 40px
- **Border radius**: 20px
- **Border width**: 2px (gradient)
- **Background**: transparent (no fill)

### Variants

| Variant    | Border gradient             | Text color         |
|------------|-----------------------------|--------------------|
| `positive` | `#D03688` → `#5BB8FF`      | Hot Rose           |
| `negative` | `#D03688` → `#222A68`      | Imperial Blue      |
| `neutral`  | `#35A7FF` → `#0F7173`      | Stormy Teal        |

### Usage

```tsx
import { Tag } from '@/components/ui';

<Tag variant="positive">Growing</Tag>
<Tag variant="negative">Declining</Tag>
<Tag variant="neutral">Stable</Tag>
```

### Implementation

- Component: `apps/web/components/ui/Tag.tsx`
- Styles: `apps/web/components/ui/Tag.module.css`
- Gradient border uses a `::before` / `::after` pseudo-element technique (outer gradient + inner mask)

---

## Do / Don't

### Do

- Use `var(--color-hot-rose)` etc. for brand colors
- Use `.text-h1`, `.text-subtitle`, `.text-body` or `<H1>`, `<Subtitle>`, `<Text>` for brand typography
- Use `<Tag variant="positive">` for all pill/badge/chip UI
- Keep all token definitions in `globals.css` `:root`
- Update this document when adding new tokens or components

### Don't

- Hardcode brand hex values (`#CA1F7B`, `#222A68`, etc.) in components or CSS modules
- Create ad-hoc `.badge`, `.chip`, `.pill`, or `.tag` classes in CSS modules
- Introduce arbitrary font sizes — use the existing scale or brand tokens
- Copy/paste tag gradient styles into page-specific CSS

---

## File Map

| File                                            | Purpose                            |
|-------------------------------------------------|------------------------------------|
| `apps/web/app/globals.css`                      | CSS variables (tokens), utility classes |
| `apps/web/app/layout.tsx`                       | Font loading (Fustat + Inter)      |
| `apps/web/components/ui/Tag.tsx`                | Tag component                      |
| `apps/web/components/ui/Tag.module.css`         | Tag styles                         |
| `apps/web/components/ui/Typography.tsx`         | H1, Subtitle, Text components      |
| `apps/web/components/ui/index.ts`               | Barrel exports                     |
| `.cursor/rules/design-system.mdc`               | Cursor agent enforcement rule      |
| `.cursor/rules/style.mdc`                       | General UI quality rule            |
| `styles.md`                                     | This document                      |
