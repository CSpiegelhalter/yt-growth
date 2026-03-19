# Feature Specification: Profile Completion Popup

**Feature Branch**: `011-profile-completion-popup`
**Created**: 2026-03-19
**Status**: Draft
**Input**: User description: "Add a dismissable profile-completion popup to the Dashboard page that encourages users to complete their channel profile, with checklist progress, temporary dismissal, and reusable popup/dismissal patterns."

**Figma Reference**: `https://www.figma.com/design/FBUmzpPK0YTx1KpkaaMwth/channelboost?node-id=270-208&m=dev` (node 270:2, frame "Frame 29")

## Clarifications

### Session 2026-03-19

- Q: Should checklist items in the popup be clickable links to the corresponding profile section? → A: Yes — each item links to the relevant profile section.
- Q: Should the popup appear on the user's very first Dashboard visit (immediately after signup)? → A: No — skip the first session, show from the second visit onward.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See Profile Completion Nudge on Dashboard (Priority: P1)

A user who has not completed their channel profile visits the Dashboard and sees a prominent but non-intrusive popup at the top of the page. The popup shows a title ("Complete your profile to get better results!"), a brief explanation of why completing the profile matters, and a checklist of profile sections with visual indicators showing which are done and which remain.

**Why this priority**: This is the core value delivery — without the popup appearing, no other behavior matters. Users who have incomplete profiles need a clear, actionable prompt to finish setup.

**Independent Test**: Can be tested by logging in as a user with an incomplete profile and verifying the popup renders with the correct checklist state.

**Acceptance Scenarios**:

1. **Given** a user with no profile sections completed (past their first session), **When** they visit the Dashboard, **Then** the popup appears at the top of the page with all 6 checklist items unchecked.
2. **Given** a user with 3 of 6 profile sections completed, **When** they visit the Dashboard, **Then** the popup appears with those 3 items checked and the remaining 3 unchecked.
3. **Given** a user with all profile sections completed, **When** they visit the Dashboard, **Then** no popup is shown.
4. **Given** a brand-new user on their very first Dashboard visit, **When** the page loads, **Then** the popup is not shown regardless of profile completion state.
5. **Given** the popup is showing with unchecked items, **When** the user clicks an unchecked checklist item, **Then** they are navigated to the corresponding profile section.

---

### User Story 2 - Dismiss Popup Temporarily (Priority: P2)

A user sees the popup but does not want to complete their profile right now. They click the "Dismiss for 3 days" button. The popup disappears immediately. It does not reappear for 3 days. After 3 days, if the profile is still incomplete, the popup returns.

**Why this priority**: Dismissal is essential to making the popup feel helpful rather than annoying. Without it, users may feel nagged and develop negative associations with the feature.

**Independent Test**: Can be tested by dismissing the popup and verifying it does not reappear on page reload, then simulating time passage to confirm reappearance.

**Acceptance Scenarios**:

1. **Given** the popup is visible, **When** the user clicks "Dismiss for 3 days", **Then** the popup disappears immediately.
2. **Given** the popup was dismissed, **When** the user refreshes or navigates back to the Dashboard within 3 days, **Then** the popup does not appear.
3. **Given** the popup was dismissed 3+ days ago and the profile is still incomplete, **When** the user visits the Dashboard, **Then** the popup reappears.
4. **Given** the popup was dismissed and the user subsequently completes their profile within the 3-day window, **When** they visit the Dashboard, **Then** the popup does not reappear (even after 3 days).

---

### User Story 3 - Track Profile Completion Progress (Priority: P3)

As a user completes sections of their channel profile over time, the popup checklist reflects that progress accurately. Each section maps to a specific checklist item. The user can see at a glance how much is left to do.

**Why this priority**: Progress feedback reinforces positive behavior and motivates completion. Without it, the popup is a static nag rather than a dynamic progress indicator.

**Independent Test**: Can be tested by completing a profile section, returning to the Dashboard, and verifying the corresponding checklist item is now checked.

**Acceptance Scenarios**:

1. **Given** a user has just completed the "Overview" section of their profile, **When** they navigate to the Dashboard, **Then** the "Overview" checklist item in the popup appears checked.
2. **Given** a user completes the final remaining profile section, **When** they navigate to the Dashboard, **Then** the popup no longer appears.

---

### User Story 4 - Reusable Dismissal for Future Surfaces (Priority: P4)

The dismissal mechanism (dismiss for N days, persist state, resurface after expiry) is built as a reusable pattern so that future nudges (upgrade prompts, onboarding hints, feature education) can use the same logic without reimplementation.

**Why this priority**: Architectural quality — ensures this work pays dividends beyond the immediate feature. Lower priority because it does not affect user-facing behavior of this feature, but it is a hard requirement.

**Independent Test**: Can be tested by using the reusable dismissal hook/utility from a second, unrelated component and verifying it behaves identically.

**Acceptance Scenarios**:

1. **Given** a new popup surface that uses the reusable dismissal pattern with a 7-day window, **When** the user dismisses it, **Then** it stays hidden for 7 days and resurfaces afterward.
2. **Given** two independent popup surfaces using the reusable pattern, **When** the user dismisses one, **Then** the other is unaffected.

---

### Edge Cases

- What happens if the user clears their browser storage? The popup reappears (acceptable — better to re-nudge than to lose the mechanism entirely).
- What happens if the profile completion data cannot be loaded (network error, loading state)? The popup should not render until completion data is available — avoid showing a flash of incorrect state.
- What happens if the user has multiple browser tabs open and dismisses in one? The other tab will still show it until next navigation/refresh (acceptable — localStorage is not real-time synced).
- What happens if new profile sections are added in the future? The checklist mapping should be maintained in a single configuration so adding a section only requires updating one place.
- What happens on a brand-new user's first visit? The popup is suppressed for the first session to let the user explore without being immediately nudged. It appears starting from the second visit.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a profile-completion popup at the top of the Dashboard page when the user's channel profile is incomplete.
- **FR-002**: System MUST NOT display the popup when the user's channel profile is fully complete.
- **FR-003**: The popup MUST show a checklist of profile sections, where each item reflects the real completion state of the corresponding section.
- **FR-004**: The popup MUST include a "Dismiss for 3 days" action that hides it immediately.
- **FR-005**: System MUST persist the dismissal state so it survives page refresh and navigation.
- **FR-006**: System MUST resurface the popup after the dismissal period expires, unless the profile is now complete.
- **FR-007**: Profile completion MUST be determined from the actual channel profile data, not hardcoded values.
- **FR-008**: The dismissal mechanism (dismiss-for-duration, persist, resurface) MUST be implemented as a reusable utility/hook usable by future popup surfaces.
- **FR-009**: The popup component shell (card with title, body, checklist area, dismiss action) MUST be implemented as a reusable component pattern.
- **FR-010**: The checklist items MUST map to the following profile sections: Overview, Tag guidance, Script guidance, New idea guidance, Description guidance, Competitors.
- **FR-011**: The popup MUST not render during loading states — it should wait until profile completion data is resolved before deciding whether to show.
- **FR-012**: Dismissal state MUST be stored client-side keyed by a unique popup identifier, enabling multiple independent dismissable surfaces.
- **FR-013**: Each checklist item in the popup MUST be a clickable link that navigates the user to the corresponding profile section.
- **FR-014**: The popup MUST NOT appear on the user's very first Dashboard visit. It MUST be suppressed for the first session and shown starting from the second visit onward.

### Key Entities

- **Channel Profile**: The user's channel profile containing multiple sections. Each section can be independently complete or incomplete. Stored in the existing `ChannelProfile.inputJson` field.
- **Profile Section**: A discrete part of the channel profile (e.g., Overview, Tag guidance). Each maps to a checklist item.
- **Dismissal State**: A per-popup record of when the user dismissed it, how long it should stay hidden, and the popup identifier. Stored client-side.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users with incomplete profiles see the profile-completion popup on 100% of eligible Dashboard visits (not dismissed, not complete).
- **SC-002**: Users with complete profiles never see the popup.
- **SC-003**: After dismissal, the popup does not reappear for exactly the configured duration (3 days).
- **SC-004**: Checklist items accurately reflect the real-time completion state of each profile section with zero discrepancy.
- **SC-005**: The reusable dismissal utility can be instantiated with a different popup ID and duration, and functions correctly without code changes.
- **SC-006**: Adding a new profile section to the checklist requires updating only one configuration mapping.

## Assumptions

- **Dismissal duration**: 3 days, based on the Figma design showing "Dismiss for 3 days". This balances user autonomy with re-engagement.
- **Persistence mechanism**: localStorage is sufficient for dismissal state. Server-side persistence is not needed because the popup is a soft nudge, not a critical flow, and localStorage keeps the implementation simple with no API calls.
- **Profile sections**: The 6 checklist items (Overview, Tag guidance, Script guidance, New idea guidance, Description guidance, Competitors) map to identifiable sections/fields in the existing channel profile data structure (`ChannelProfile.inputJson`).
- **Section completion definition**: A section is considered "complete" if it has meaningful, non-empty data. The exact definition will be determined during implementation by auditing the channel profile data structure.
- **Popup placement**: The popup renders at the top of the Dashboard content area, above the greeting and main cards, as shown in the Figma reference.

## Figma Design Summary

Captured from Figma node 270:2 (frame "Frame 29") in file `FBUmzpPK0YTx1KpkaaMwth`:

- **Container**: White card, 2px solid border (#222a68 navy), 20px border-radius, subtle box shadow (0px 4px 4px rgba(0,0,0,0.08)), full content width (~850px in Figma)
- **Title**: "Complete your profile to get better results!" — Bold, 20px, navy (#222a68)
- **Description**: Supporting paragraph text — Medium, 15px, navy (#222a68)
- **Checklist**: 3-column x 2-row grid of items, each with a circular checkmark icon (20x20) and SemiBold 16px label
  - Row 1: Overview, Tag guidance, Script guidance
  - Row 2: New idea guidance, Description guidance, Competitors
- **Dismiss action**: Pill-shaped button in top-right — background #f3f4fb, 20px border-radius, containing "Dismiss for 3 days" text (Medium, 15px) and a close (X) icon (24x24)
- **Overall position**: Top of Dashboard, above the greeting ("Hi David!") and main content cards
