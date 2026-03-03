# Feature Specification: Frontend Component Audit & Refactor

**Feature Branch**: `001-frontend-refactor`
**Created**: 2026-03-03
**Status**: Draft
**Input**: Comprehensive audit and refactor of frontend directory structure and component logic

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Unified UI Component Library (Priority: P1)

A developer building a new page needs buttons, inputs, status badges,
and filter pills. Today they copy-paste styles from an existing page
(e.g., the gradient button from TrendingClient) because no shared
components exist for these patterns. This creates drift — the same
button has 3 slightly different CSS implementations across the app.

After this refactor, the developer imports shared components from the
centralized UI library. Buttons, inputs, status badges, and filter
pills all have consistent styling, hover states, and accessibility
out of the box. No CSS duplication is needed.

**Why this priority**: Duplicated UI patterns are the largest source
of visual inconsistency and wasted effort. The audit found 10+
repeated patterns across 20+ files. Consolidating these delivers the
highest ROI and unblocks all other refactoring work.

**Independent Test**: A developer can build a complete new page using
only shared UI components without writing any custom button, input,
badge, or pill CSS. All existing pages render identically after
migration.

**Acceptance Scenarios**:

1. **Given** a gradient CTA button exists in 3+ pages with
   slightly different CSS, **When** all pages are migrated to the
   shared Button component, **Then** button styling is defined in
   exactly one place and all instances render identically.
2. **Given** status chips/badges are implemented ad-hoc in 4+
   locations, **When** a shared StatusBadge component replaces them,
   **Then** all status indicators use consistent sizing, colors, and
   border-radius values.
3. **Given** text inputs and selects duplicate focus/border/padding
   styles in 5+ CSS modules, **When** shared Input and Select
   components are introduced, **Then** form element styling is
   defined once and all pages inherit it.
4. **Given** filter pills appear in 3+ pages with near-identical
   CSS, **When** a shared FilterPill component replaces them,
   **Then** active/inactive states are consistent across all filter
   surfaces.

---

### User Story 2 - Logic Extraction into Custom Hooks (Priority: P2)

A developer modifying the error-handling flow in one page discovers
the same loading/error/retry state pattern is duplicated in 6+ client
components. Changing the pattern requires updating each file
individually, risking missed updates and inconsistency.

After this refactor, common state patterns (async data fetching,
form error/loading management, search/filter state, polling) are
extracted into reusable custom hooks. Client components become "thin"
— focused on rendering, not state plumbing.

**Why this priority**: Logic duplication causes behavioral
inconsistency and inflates component file sizes. Several components
exceed 600+ lines because they inline state management that belongs
in hooks. Extracting hooks also makes components independently
testable.

**Independent Test**: Client components that previously managed their
own loading/error states delegate to shared hooks. Component files
drop below 150 lines. Behavior remains identical.

**Acceptance Scenarios**:

1. **Given** 6+ components implement their own loading/error state
   variables, **When** a shared async data hook replaces them,
   **Then** error handling and loading indicators behave identically
   across all pages.
2. **Given** multiple components manually read/write sessionStorage
   for state persistence, **When** they migrate to the existing
   shared `useSessionStorage` hook, **Then** storage
   logic is centralized and components only deal with state values.
3. **Given** 3+ components implement their own search/filter state
   management with URL sync, **When** a shared search state hook
   replaces them, **Then** URL parameters, filter state, and reset
   behavior are consistent.

---

### User Story 3 - CSS Hygiene & Design System Enforcement (Priority: P3)

A developer notices inconsistent typography across pages — some
components manually set `font-family` or `line-height` values that
duplicate or conflict with the global Fustat standard defined in
`globals.css`. The result is subtle visual inconsistencies that
erode brand quality.

After this refactor, all redundant font-family and line-height
declarations are removed from component CSS modules. Components
inherit the global design system values. New line-height design
tokens are available for cases that genuinely need variation.

**Why this priority**: While less visible than missing components,
CSS hygiene prevents long-term design drift. The audit found 15+
modules with hardcoded font-family and 40+ manual line-height
overrides.

**Independent Test**: A search across all CSS modules returns zero
redundant font-family declarations and zero line-height values that
do not reference design tokens. Visual regression testing confirms
no visible changes.

**Acceptance Scenarios**:

1. **Given** 15+ CSS modules contain manual `font-family`
   declarations matching the global Fustat standard, **When** those
   declarations are removed, **Then** components inherit the correct
   font from globals and render identically.
2. **Given** 40+ manual `line-height` overrides exist across CSS
   modules, **When** they are replaced with design system tokens or
   removed where redundant, **Then** typography spacing is
   consistent and traceable to the design system.

---

### User Story 4 - File Structure Reorganization (Priority: P4)

A developer looking for the CompetitorVideoCard component must scan
through 5+ flat files in the competitors folder. In the videos
section, 27 component files are nested in a deep structure that mixes
page-private components with potentially reusable ones. There is no
consistent convention for where "private" page components live.

After this refactor, page folders follow a consistent convention:
page-private components live in `_components/` subdirectories (max 5
flat files per folder), and globally-reusable components remain in
the shared `components/` directory. Single-page components currently
scattered in `components/` are co-located with their pages.

**Why this priority**: Structural reorganization is lower urgency
than functional changes but improves navigability and enforces the
project's architectural boundaries long-term.

**Independent Test**: Every page folder has at most 5 flat component
files. Page-private components are co-located under `_components/`.
All imports resolve correctly after moves.

**Acceptance Scenarios**:

1. **Given** the competitors folder contains 5 flat component files,
   **When** page-private components move to `_components/`, **Then**
   the folder root contains only the page entry and client wrapper.
2. **Given** components like BadgeArt and BadgeDetailModal in
   `components/badges/` are only used by GoalsClient, **When** they
   are co-located with the goals page, **Then** the global
   `components/` directory only contains genuinely shared components.
3. **Given** the `_components/` pattern is used inconsistently (only
   in learn/ and competitors/video/), **When** all page folders
   adopt the convention, **Then** a developer can predict where
   page-private components live without searching.

---

### User Story 5 - PageContainer Adoption Across All Pages (Priority: P5)

A developer creating a new page must manually set up the page shell
(max-width container, padding, responsive breakpoints) by copying
boilerplate from another page. The PageContainer and PageHeader
components already exist but are only used by one page (GoalsClient).

After this refactor, all app pages use PageContainer and PageHeader
for their shell layout. Developers creating new pages get consistent
margins, padding, and responsive behavior automatically.

**Why this priority**: The PageContainer already exists and works —
this story is about adoption, not creation. It has the lowest risk
of all stories and prevents future layout drift.

**Independent Test**: All pages under `(app)/` use PageContainer.
Manual `<main className={s.page}>` wrappers with custom max-width
and padding are eliminated. Layout is visually identical.

**Acceptance Scenarios**:

1. **Given** 8+ client components create their own
   `<main className={s.page}>` with custom max-width/padding,
   **When** they are migrated to PageContainer, **Then** layout
   properties are defined in one place.
2. **Given** some pages manually render header sections with title
   and subtitle, **When** they adopt PageHeader, **Then** page
   headers have consistent typography, spacing, and optional action
   slots.

---

### Edge Cases

- What happens when a component needs a button variant not covered
  by the shared Button component? The component system MUST support
  extension via new variants rather than one-off overrides.
- How does the system handle pages that need a non-standard layout
  width (e.g., the thumbnail editor needs full-width)? PageContainer
  MUST support opt-out or alternative width modes.
- What happens to components that are currently used by exactly 2
  pages — are they "global" or "private"? The threshold for shared
  components MUST be clearly defined (2+ pages = global).
- How are CSS module class name references maintained during file
  moves? All imports MUST be updated and verified by the build
  system.
- What happens to pages that use default exports for their client
  components? Migration MUST convert to named exports per project
  convention.

---

### User Story 6 - Client Boundary Enforcement (Priority: P2)

A page loads over 100kb of First Load JS because large client
components (600-1300 lines) include "use client" at the page wrapper
level, hydrating entire component trees unnecessarily. The codebase
has 126 "use client" files, many at intermediate/page levels rather
than leaf components.

After this refactor, "use client" directives are pushed to leaf-level
components only (buttons, inputs, toggles, interactive widgets).
Data fetching happens in Server Components via async/await.
A First Load JS budget is enforced to prevent regression.

**Why this priority**: Elevated to P2 alongside hook extraction
because both touch the same files. Extracting hooks without fixing
client boundaries would leave oversized client bundles intact.

**Independent Test**: First Load JS for key pages is measured before
and after. All pages stay under the budget. Server Components fetch
data directly without useEffect.

**Acceptance Scenarios**:

1. **Given** client components wrap entire pages with "use client",
   **When** they are decomposed into a server parent + client leaf
   children, **Then** only interactive elements are hydrated on the
   client.
2. **Given** some components use useEffect for data fetching,
   **When** data fetching is moved to Server Components,
   **Then** the data is available without client-side round-trips.
3. **Given** no First Load JS budget exists, **When** a budget is
   established and enforced, **Then** regressions are caught before
   merge.

---

### User Story 7 - Next.js Performance Configuration (Priority: P6)

The Next.js configuration does not enable several high-impact 2026
features: Turbopack for dev builds, React Compiler for
auto-memoization, Partial Prerendering for instant static shells,
and AVIF image format preference for 20% smaller images. Above-the-
fold images lack the `priority` attribute, hurting LCP scores.

After this refactor, high-yield Next.js configuration flags are
enabled, image optimization is configured, and LCP-critical images
use the `priority` attribute.

**Why this priority**: Configuration changes are low-risk, high-
reward quick wins that can be done independently of component work.

**Independent Test**: Dev server uses Turbopack. Build output
confirms React Compiler and PPR are active. Image responses serve
AVIF format. Lighthouse LCP scores improve.

**Acceptance Scenarios**:

1. **Given** Turbopack is not enabled, **When** it is configured
   for dev builds, **Then** HMR and build times measurably improve.
2. **Given** React Compiler is not enabled, **When** it is
   configured, **Then** manual memoization (useMemo, useCallback,
   React.memo) becomes unnecessary and re-renders are reduced
   automatically.
3. **Given** Partial Prerendering is not enabled, **When** PPR is
   configured with Suspense boundaries, **Then** pages serve an
   instant static shell while streaming dynamic content.
4. **Given** images default to WebP, **When** AVIF preference is
   configured, **Then** image responses are ~20% smaller.
5. **Given** above-the-fold images lack `priority`, **When** LCP-
   critical images receive the attribute, **Then** Largest
   Contentful Paint scores improve.

---

### User Story 8 - Page-Level Input Validation (Priority: P4)

Page components receive searchParams and route params but validate
them manually with ad-hoc parsing functions rather than Zod schemas.
This risks garbage input triggering expensive failing renders and
creates inconsistency — API routes use Zod validation but pages
do not.

After this refactor, all page components validate their searchParams
and route params with Zod schemas at the top of the component,
matching the pattern already established in API routes.

**Why this priority**: Aligns with US4 (file structure) since both
touch page files. Zod validation prevents downstream bugs and
aligns pages with the existing API route validation convention.

**Independent Test**: All page components use Zod schemas to
validate params. Invalid params produce graceful fallbacks instead
of errors.

**Acceptance Scenarios**:

1. **Given** page components manually parse searchParams with
   inline functions, **When** Zod schemas replace them, **Then**
   validation is consistent with the API route pattern.
2. **Given** invalid searchParams can reach page rendering logic,
   **When** Zod validation rejects them at the top of the page,
   **Then** the page falls back to safe defaults without error.

---

## Clarifications

### Session 2026-03-03

- Q: Should the spec be expanded to include Next.js performance optimization, or should those be a separate feature? → A: Expand this spec — add performance stories covering client boundary enforcement, config enablements, image optimization, and page-level validation.
- Q: What First Load JS budget per page should be enforced? → A: Strict 100kb — enforce immediately; block merges that exceed it.
- Q: Which experimental Next.js features should be enabled? → A: Enable all three: Turbopack (dev), React Compiler, and Partial Prerendering (PPR).
- Q: Should OpenTelemetry setup be included in this refactor? → A: Defer — note as a recommended follow-up but exclude from this refactor's scope.
- Q: Should manual memoization (useMemo, useCallback, React.memo) be stripped during hook extraction, relying on React Compiler? → A: Yes — strip manual memoization during extraction; rely on React Compiler for auto-optimization.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The UI library MUST provide a Button component with
  four variants: primary (gradient), secondary (outline), danger,
  and ghost.
- **FR-002**: The UI library MUST provide a StatusBadge component
  with variants for success, warning, error, info, and processing
  states.
- **FR-003**: The UI library MUST provide a FilterPill component
  with active/inactive states and an optional dismiss action.
- **FR-004**: The UI library MUST provide Input and Select form
  components with consistent focus, error, and disabled states.
- **FR-005**: The UI library MUST provide an ErrorBanner component
  with optional dismiss action and retry affordance.
- **FR-006**: All shared components MUST follow the existing design
  system (CSS variables for colors, 4pt spacing grid, Fustat
  typography).
- **FR-007**: All shared components MUST support the project's
  accessibility requirements (keyboard navigation, ARIA attributes,
  focus management).
- **FR-008**: Reusable hooks MUST be provided for common state
  patterns: async data fetching with loading/error, search/filter
  state with URL sync, polling with cleanup, and session storage
  persistence with TTL.
- **FR-008a**: Extracted hooks and refactored components MUST NOT
  contain manual memoization (useMemo, useCallback, React.memo).
  React Compiler handles optimization automatically.
- **FR-009**: All component CSS modules MUST NOT contain font-family
  declarations that duplicate the global standard.
- **FR-010**: All line-height values in CSS modules MUST either
  reference a design token or be justified by a specific layout
  need.
- **FR-011**: No page folder MUST contain more than 5 flat
  component files at its root level.
- **FR-012**: Components used by only one page MUST be co-located
  in that page's `_components/` subdirectory.
- **FR-013**: Components used by 2+ pages MUST remain in the shared
  `components/` directory.
- **FR-014**: All app pages MUST use the PageContainer component
  for their outermost layout wrapper.
- **FR-015**: Every migration MUST produce zero visual regressions
  — pages MUST render identically before and after.
- **FR-016**: Every migration MUST pass the pre-flight suite
  (`make preflight`) with no regressions against the baseline.
- **FR-017**: "use client" directives MUST be placed at the leaf
  component level only — not on page wrappers or intermediate
  layout components.
- **FR-018**: Data fetching MUST happen in Server Components via
  async/await. useEffect-based data fetching MUST be eliminated
  except for purely client-side user interactions.
- **FR-019**: A First Load JS budget of 100kb per page MUST be
  established and enforced. Merges that exceed this budget MUST
  be blocked.
- **FR-020**: All page components MUST validate searchParams and
  route params with Zod schemas at the top of the component.
- **FR-021**: Above-the-fold images MUST use the `priority`
  attribute for optimal LCP scores.
- **FR-022**: Image configuration MUST prefer AVIF format over
  WebP for reduced file sizes.
- **FR-023**: Turbopack MUST be enabled for dev builds.
- **FR-024**: React Compiler MUST be enabled for automatic
  memoization optimization.
- **FR-025**: Partial Prerendering (PPR) MUST be enabled with
  Suspense boundaries for instant static shells.

### Key Entities

- **UI Component**: A reusable, self-contained interface element
  with defined variants, props, and styling. Lives in the shared
  UI library.
- **Custom Hook**: A reusable unit of stateful logic extracted from
  client components. Encapsulates async operations, state
  persistence, or side effects.
- **Page-Private Component**: A component used by exactly one page.
  Co-located in that page's `_components/` subdirectory.
- **Shared Component**: A component used by 2+ pages. Lives in
  the top-level `components/` directory.

## Out of Scope

- **OpenTelemetry**: `@vercel/otel` instrumentation and server-side
  fetch tracing. Recommended as a dedicated follow-up feature after
  this refactor stabilizes. The existing `createLogger` utility and
  Vercel Analytics remain the observability baseline during this work.
- **useOptimistic adoption**: The `useOptimistic` hook for optimistic
  UI mutations is valuable but depends on server action patterns not
  yet established in this codebase. Defer to a future feature.

## Assumptions

- The existing PageContainer and PageHeader components are
  well-designed and suitable for adoption without redesign.
- The existing Tag component serves as the model for how new
  UI library components should be structured (CSS modules + CSS
  variables + variant props).
- Components that exceed 150 lines after hook extraction should be
  split into sub-components, but the specific decomposition will be
  determined during planning.
- Visual regression testing will be done manually by comparing
  screenshots before and after each migration batch.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The number of duplicated CSS patterns (buttons,
  inputs, badges, pills) drops from 10+ distinct implementations
  to 1 shared implementation per pattern.
- **SC-002**: All client components with 600+ lines are reduced
  to under 150 lines through hook extraction and sub-component
  decomposition.
- **SC-003**: Zero CSS modules contain font-family declarations
  that duplicate the global Fustat standard.
- **SC-004**: Every page folder contains at most 5 flat component
  files at root level.
- **SC-005**: 100% of app pages use PageContainer for their layout
  shell.
- **SC-006**: A new developer can build a standard CRUD page using
  only shared UI components, hooks, and PageContainer — without
  copying CSS from existing pages.
- **SC-007**: The pre-flight suite passes with zero regressions
  after each migration batch.
- **SC-008**: Total lines of duplicated CSS (as measured by jscpd)
  decreases by at least 30% from the current baseline.
- **SC-009**: All page-level searchParams are validated with Zod
  schemas — zero manual parsing functions remain.
- **SC-010**: Above-the-fold images serve AVIF format and use the
  `priority` attribute.
- **SC-011**: "use client" directives exist only on leaf components
  — zero page-wrapper or intermediate-level client boundaries
  remain.
- **SC-012**: Every page's First Load JS is under 100kb. Budget
  enforcement blocks merges that exceed this threshold.
