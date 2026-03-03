# UI Component Contracts

**Branch**: `001-frontend-refactor` | **Date**: 2026-03-03

All components export named functions from `components/ui/index.ts`.
All use CSS modules + CSS custom properties. All follow the
established Tag component pattern.

---

## Button

```typescript
type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
type ButtonSize = "sm" | "md";

type ButtonProps = {
  variant?: ButtonVariant;       // default: "primary"
  size?: ButtonSize;             // default: "md"
  loading?: boolean;             // shows spinner, disables
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  as?: "button" | "a";          // render as link
  href?: string;                 // when as="a"
  onClick?: () => void;
  children: ReactNode;
  className?: string;
};
```

**CSS module classes**: `.button`, `.primary`, `.secondary`,
`.danger`, `.ghost`, `.sm`, `.md`, `.loading`, `.disabled`

**Visual spec**:
- `primary`: `linear-gradient(135deg, var(--color-cool-sky), var(--color-hot-rose))`
  with white text, shadow, hover lift (-2px translateY)
- `secondary`: `var(--color-border)` border, transparent bg,
  `var(--color-text)` text, hover: `var(--surface-alt)` bg
- `danger`: `var(--danger)` bg, white text
- `ghost`: transparent bg+border, `var(--color-text)` text,
  hover: `var(--surface-alt)` bg
- `sm`: 32px height, `var(--text-sm)` font, 8px 12px padding
- `md`: 44px height, `var(--text-sm)` font, 12px 16px padding
- `loading`: pointer-events none, opacity 0.7, inline spinner

**Accessibility**: `aria-disabled` when disabled/loading,
`role="button"` when `as="a"`, focus ring via `--color-focus-ring`.

---

## StatusBadge

```typescript
type StatusBadgeVariant =
  | "success" | "warning" | "error" | "info" | "processing";
type StatusBadgeSize = "sm" | "md";

type StatusBadgeProps = {
  variant: StatusBadgeVariant;
  size?: StatusBadgeSize;        // default: "md"
  dot?: boolean;                 // show colored dot indicator
  pulse?: boolean;               // animate dot (e.g. processing)
  children: ReactNode;
  className?: string;
};
```

**CSS module classes**: `.badge`, `.success`, `.warning`, `.error`,
`.info`, `.processing`, `.sm`, `.md`, `.dot`, `.pulse`

**Visual spec**:
- Each variant: light background tint + darker text color
  - `success`: `var(--success-light)` bg, `var(--color-stormy-teal)` text
  - `warning`: `var(--warning-light)` bg, `var(--warning)` text
  - `error`: `var(--danger-light)` bg, `var(--color-hot-rose)` text
  - `info`: `var(--info-light)` bg, `var(--color-cool-sky)` text
  - `processing`: `var(--secondary-light)` bg, `var(--color-cool-sky)` text
- `sm`: 24px height, `var(--text-xs)` font, 2px 8px padding
- `md`: 32px height, `var(--text-sm)` font, 4px 10px padding
- Border-radius: 9999px (full pill)
- Dot: 6px circle, variant color, before content
- Pulse: `@keyframes pulse` on dot

---

## FilterPill

```typescript
type FilterPillProps = {
  active?: boolean;              // default: false
  dismissible?: boolean;         // show X button
  onDismiss?: () => void;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
};
```

**CSS module classes**: `.pill`, `.active`, `.dismissible`

**Visual spec**:
- Inactive: 1px `var(--color-border)` border, transparent bg,
  `var(--color-text-secondary)` text, 999px radius
- Active: `var(--primary)` bg, white text, no border
- Height: 36px, padding: 8px 14px
- Dismiss button: 16px inline icon, `var(--text-tertiary)`,
  hover: `var(--text)`
- Hover (inactive): `var(--surface-alt)` bg
- Transition: all 0.15s

**Accessibility**: `role="option"` within filter group, `aria-selected`
for active, keyboard Enter/Space to toggle.

---

## Input

```typescript
type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  variant?: "default" | "error";
  label?: string;
  error?: string;
  helpText?: string;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  className?: string;
};
```

**CSS module classes**: `.wrapper`, `.input`, `.error`, `.label`,
`.helpText`, `.errorText`, `.iconLeft`, `.iconRight`

**Visual spec**:
- `var(--color-surface)` bg, 1px `var(--color-border)` border
- `var(--radius-md)` border-radius, 44px min-height
- Focus: `var(--color-primary)` border, 3px `var(--color-focus-ring)` shadow
- Error: `var(--danger)` border, error message below in `var(--danger)` text
- Icon slots: 16px, `var(--text-tertiary)`, absolute positioned
- Label: `var(--text-sm)`, `var(--text-secondary)`, 8px gap below

**Accessibility**: `htmlFor` on label, `aria-invalid` on error,
`aria-describedby` linking to help/error text.

---

## Select

```typescript
type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  variant?: "default" | "error";
  label?: string;
  error?: string;
  helpText?: string;
  children: ReactNode;           // <option> elements
  className?: string;
};
```

**Visual spec**: Same as Input. Native `<select>` with custom
chevron icon via `background-image` SVG data URI. Inherits all
Input spacing, focus, and error patterns.

---

## ErrorBanner

```typescript
type ErrorBannerVariant = "error" | "warning" | "info";

type ErrorBannerProps = {
  variant?: ErrorBannerVariant;  // default: "error"
  message: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  onRetry?: () => void;
  className?: string;
};
```

**CSS module classes**: `.banner`, `.error`, `.warning`, `.info`,
`.dismissBtn`, `.retryBtn`

**Visual spec**:
- Inline banner (not full-page like ErrorState)
- 4px border-left accent in variant color
- Light variant background tint
- Dismiss: X icon button, top-right
- Retry: text link, inline after message
- Padding: 12px 16px, `var(--radius-md)` radius
- Transition: height 0.2s for dismiss animation
