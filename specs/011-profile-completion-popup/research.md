# Research: Profile Completion Popup

## Decision 1: Profile Completion Detection

**Decision**: Compute section-level completion from `ChannelProfileInput` by checking each section object for non-empty fields. A section is "complete" when at least one meaningful field in it has data.

**Rationale**: The `ChannelProfileInput` type has 6 clearly separated section objects (`overview`, `ideaGuidance`, `scriptGuidance`, `tagGuidance`, `descriptionGuidance`, `competitors`) with a well-defined `DEFAULT_PROFILE_INPUT` showing empty defaults. Checking for deviation from defaults is reliable and doesn't require schema changes.

**Alternatives considered**:
- Server-side completion field on ChannelProfile model — rejected: requires schema migration for a client-side nudge feature; violates spec constraint of no schema changes.
- Per-field completion tracking — rejected: over-granular for a section-level checklist; adds complexity without user value.

## Decision 2: Section Completion Rules

**Decision**: Per-section completion checks:

| Section | Complete when... |
|---------|-----------------|
| `overview` | `channelDescription` is non-empty OR `coreTopics.length > 0` |
| `ideaGuidance` | Any of `topicsToLeanInto`, `topicsToAvoid`, `idealVideo` is non-empty OR `formatPreferences.length > 0` |
| `scriptGuidance` | Any of `tone`, `structurePreference`, `styleNotes` is non-empty |
| `tagGuidance` | `primaryKeywords.length > 0` OR `nicheTerms.length > 0` |
| `descriptionGuidance` | `descriptionFormat` is non-empty OR `standardLinks` is non-empty |
| `competitors` | At least one competitor entry exists in any tier (`closeToSize`, `aspirational`, `nicheHero`) with a non-empty `channelUrl` |

**Rationale**: "At least one meaningful field" is forgiving — users who fill in any part of a section get credit. This encourages progress without demanding exhaustive completion of every field.

## Decision 3: Dismissal Persistence Mechanism

**Decision**: Create a `useLocalStorage` hook (mirroring existing `useSessionStorage` pattern) for localStorage with TTL support. Use localStorage instead of sessionStorage so dismissals persist across sessions.

**Rationale**: The existing `useSessionStorage` hook has the exact right pattern (TTL, envelope, hydration, error handling) but uses sessionStorage which clears on tab close. The spec requires cross-session persistence for 3-day dismissal. Creating a `useLocalStorage` hook from the same pattern keeps the codebase consistent and avoids ad-hoc localStorage usage.

**Alternatives considered**:
- Cookie-based persistence — rejected: more complex, no benefit over localStorage for this use case.
- Server-side dismissal state — rejected: over-engineered for a soft nudge; adds API calls.
- Extend `useSessionStorage` to support both storage backends — rejected: changes existing API surface; better to have a separate hook.

## Decision 4: First-Visit Detection

**Decision**: Track "has visited dashboard" in localStorage. On first render without this flag, set it and suppress the popup. On subsequent visits, allow popup logic to proceed.

**Rationale**: Simple, reliable, no API calls. The flag persists across sessions via localStorage. If the user clears storage, they get a "first visit" again, which is acceptable (they'd see the popup on the next visit anyway).

## Decision 5: Existing ProfileTip Relationship

**Decision**: Keep `ProfileTip` as-is for now (it's used on competitors/trending/ideas pages). The new dashboard popup is a richer, purpose-built component that replaces ProfileTip's role specifically on the Dashboard. A future cleanup task can consider unifying or deprecating ProfileTip.

**Rationale**: ProfileTip is a simple session-dismissed banner with inline styles — very different from the Figma-designed popup with a checklist, timed dismissal, and CSS Modules. Modifying ProfileTip to handle both use cases would violate code minimalism. The two serve different contexts (Dashboard vs. other pages).

## Decision 6: Reusable Hook Design

**Decision**: Create `useDismissable(key, durationMs)` hook that:
- Returns `{ isDismissed, dismiss, isHydrated }`
- Uses the new `useLocalStorage` hook internally with TTL
- Stores dismissal timestamp + duration in localStorage
- Auto-expires after the duration

**Rationale**: Keeps the dismissal logic decoupled from any specific component. Any future nudge surface can call `useDismissable("upgrade-nudge", 7 * 24 * 60 * 60 * 1000)` and get identical behavior.

## Decision 7: Component Architecture

**Decision**: Three new files:
1. `useLocalStorage` hook — reusable localStorage + TTL (mirrors `useSessionStorage`)
2. `useDismissable` hook — reusable timed-dismissal logic
3. `ProfileCompletionPopup` component — dashboard-specific, uses CSS Modules

Plus one utility:
4. `getProfileCompletion` function — computes section-level completion from `ChannelProfileInput`

**Rationale**: Follows constitution: one component per file, hooks in separate files, pure logic in separate files. Each piece is independently testable and reusable.
