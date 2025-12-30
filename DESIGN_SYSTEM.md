# ChannelBoost Design System

A cohesive visual system for the ChannelBoost YouTube growth analytics platform.

---

## Philosophy

### Visual Consistency Principles
1. **App pages are calm and content-focused** - Uniform backgrounds, emphasis through cards and typography
2. **Marketing pages can be expressive** - Hero sections with gradients, accent backgrounds allowed
3. **Transitions between modes are clear** - When moving from marketing to app, the visual shift is intentional

### UX Principles
- **User-centricity**: UI solves creator problems quickly
- **Consistency**: Same patterns across all screens
- **Hierarchy & clarity**: Guide eyes to important content
- **Accessibility**: Keyboard nav, focus states, ARIA, contrast

---

## Design Tokens

All tokens are defined in `app/globals.css` as CSS custom properties.

### Color Tokens

#### Backgrounds
```css
--bg: #fafafa;              /* Main app background */
--bg-elevated: #ffffff;     /* Modals, dropdowns */
--surface: #ffffff;         /* Card background */
--surface-hover: #f8fafc;   /* Card hover */
--surface-alt: #f8fafc;     /* Secondary surface */
--surface-active: #f1f5f9;  /* Active/selected */
```

#### Text
```css
--text: #0f172a;            /* Primary text */
--text-secondary: #64748b;  /* Secondary/muted */
--text-tertiary: #94a3b8;   /* Hints, placeholders */
--text-inverse: #ffffff;    /* On dark backgrounds */
```

#### Borders
```css
--border: #e2e8f0;          /* Default */
--border-light: #f1f5f9;    /* Subtle */
--border-hover: #cbd5e1;    /* Hover state */
--border-focus: #6366f1;    /* Focus state */
```

#### Brand Colors
```css
--primary: #6366f1;         /* Primary actions (indigo) */
--primary-hover: #4f46e5;
--primary-light: #eef2ff;
--primary-contrast: #ffffff;

--secondary: #2563eb;       /* Secondary actions (blue) */
--secondary-hover: #1d4ed8;
--secondary-light: #dbeafe;
```

#### Status Colors
```css
--success: #059669;
--success-light: #d1fae5;

--warning: #d97706;
--warning-light: #fef3c7;

--danger: #dc2626;
--danger-light: #fee2e2;

--info: #0284c7;
--info-light: #e0f2fe;
```

### Spacing Scale

```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
```

### Typography

```css
/* Font families */
--font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", ...;
--font-mono: "SF Mono", Monaco, Consolas, ...;

/* Font sizes */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */

/* Font weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### Border Radius

```css
--radius-xs: 4px;
--radius-sm: 6px;
--radius-md: 10px;
--radius-lg: 16px;
--radius-xl: 20px;
--radius-full: 9999px;
```

### Shadows

```css
--shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.06), ...;
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.08), ...;
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.08), ...;

/* Specialty shadows */
--shadow-card: 0 1px 3px rgba(0, 0, 0, 0.04), ...;
--shadow-card-hover: 0 8px 24px rgba(0, 0, 0, 0.08);
```

### Focus States

```css
--focus-ring: 0 0 0 3px rgba(99, 102, 241, 0.15);
--focus-ring-danger: 0 0 0 3px rgba(220, 38, 38, 0.15);
```

---

## Components

### PageContainer

Wraps page content with consistent max-width, padding, and background.

```tsx
import { PageContainer } from '@/components/ui/PageContainer';

<PageContainer>
  <h1>Page Title</h1>
  <p>Page content...</p>
</PageContainer>

// With narrow width (for article pages)
<PageContainer narrow>
  <article>...</article>
</PageContainer>
```

### SectionCard

Consistent card styling for content sections.

```tsx
import { SectionCard } from '@/components/ui/SectionCard';

<SectionCard>
  <h2>Section Title</h2>
  <p>Card content...</p>
</SectionCard>

// With custom padding
<SectionCard padding="lg">
  <h2>More Spacious</h2>
</SectionCard>
```

### PageHeader

Standardized page header with title and subtitle.

```tsx
import { PageHeader } from '@/components/ui/PageHeader';

<PageHeader
  title="Your Videos"
  subtitle={<>Showing videos from <strong>{channelName}</strong></>}
/>
```

### Toolbar

Filter and search row styling.

```tsx
import { Toolbar } from '@/components/ui/Toolbar';

<Toolbar>
  <Toolbar.Search placeholder="Search videos..." />
  <Toolbar.Select options={sortOptions} />
  <Toolbar.Toggle active={showMagnets} onClick={toggle}>
    Show Magnets
  </Toolbar.Toggle>
</Toolbar>
```

### EmptyState

Unified empty state pattern.

```tsx
import { EmptyState } from '@/components/ui/EmptyState';

<EmptyState
  icon={<VideoIcon />}
  title="No videos yet"
  description="Connect a channel to see your videos."
  action={<Button onClick={connect}>Connect Channel</Button>}
/>
```

### Skeleton

Loading placeholders.

```tsx
import { Skeleton } from '@/components/ui/Skeleton';

<Skeleton variant="card" />
<Skeleton variant="text" width="60%" />
<Skeleton variant="thumbnail" />
```

---

## Page Patterns

### App Pages (Authenticated)
- Background: `var(--bg)` (#fafafa)
- Content in cards: `var(--surface)` (#ffffff)
- Consistent header spacing: `var(--page-header-margin)` (24px)
- Max width: `var(--page-max-width)` (1200px)

### Marketing Pages (Public)
- Can use expressive hero sections with gradients
- Body content should return to standard surfaces
- CTAs use brand gradients

### Learn Pages
- Hero: Expressive dark gradient allowed
- Body: Standard `var(--bg)` background
- Articles in cards: `var(--surface)`

---

## CSS Module Guidelines

### Always Use Tokens

```css
/* ❌ Don't use hardcoded values */
.title {
  color: #1e293b;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

/* ✅ Use design tokens */
.title {
  color: var(--text);
  background: var(--surface-alt);
  border: 1px solid var(--border);
}
```

### Consistent Page Styles

```css
/* Standard page wrapper */
.page {
  max-width: var(--page-max-width);
  margin: 0 auto;
  padding: var(--page-padding-mobile);
}

@media (min-width: 768px) {
  .page {
    padding: var(--page-padding-desktop);
  }
}

/* Standard header */
.header {
  margin-bottom: var(--page-header-margin);
}

.title {
  font-size: var(--page-title-size);
  font-weight: var(--page-title-weight);
  color: var(--text);
  margin: 0 0 var(--space-1);
}

@media (min-width: 640px) {
  .title {
    font-size: var(--page-title-size-lg);
  }
}

.subtitle {
  font-size: var(--page-subtitle-size);
  color: var(--text-secondary);
  margin: 0;
  line-height: var(--page-subtitle-line-height);
}
```

### Focus States

```css
/* All interactive elements need visible focus */
.button:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

.input:focus {
  outline: none;
  border-color: var(--border-focus);
  box-shadow: var(--focus-ring);
}
```

### Cards

```css
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  box-shadow: var(--shadow-card);
  transition: border-color var(--transition-base),
              box-shadow var(--transition-base);
}

.card:hover {
  border-color: var(--border-hover);
  box-shadow: var(--shadow-card-hover);
}

@media (min-width: 768px) {
  .card {
    padding: var(--space-6);
  }
}
```

---

## Accessibility Checklist

### Focus States
- [ ] All interactive elements have visible focus
- [ ] Focus ring uses `var(--focus-ring)`
- [ ] Tab order is logical

### Color Contrast
- [ ] Text on backgrounds meets WCAG AA (4.5:1)
- [ ] Interactive elements are distinguishable
- [ ] Don't rely on color alone

### Keyboard Navigation
- [ ] All actions accessible via keyboard
- [ ] Escape closes modals/dropdowns
- [ ] Arrow keys work in menus

### Screen Readers
- [ ] Images have alt text
- [ ] ARIA labels on icon buttons
- [ ] Role attributes on dialogs

---

## Dark Mode

Dark mode is **intentionally disabled** for this release. The design system is structured to support it in the future:

```css
/* Future dark mode support */
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #0f172a;
    --surface: #1e293b;
    --text: #f8fafc;
    /* ... */
  }
}
```

---

*Last updated: December 30, 2024*

