# Research: Analyze Page

## R1: Reusing the Competitor Video Analysis Pipeline

**Decision**: Reuse the existing `analyzeVideo` use-case from `lib/features/competitors/use-cases/analyzeVideo.ts` as the analysis backend.

**Rationale**: This use-case already orchestrates the full pipeline: cache lookup → YouTube fetch → comments fetch → LLM analysis → strategic insights → response assembly. It returns a `CompetitorVideoAnalysis` object containing all the sections we need: video metadata, comments analysis, what's driving performance, portable patterns, remix ideas, title patterns, and data limitations. DataForSEO enrichment (competitive context, trends) is already wired in through the `gather-report-data` pipeline.

**Alternatives considered**:
- **Build a new analysis pipeline**: Rejected — would duplicate 90%+ of the competitor analysis logic and violate FR-015 (no duplication).
- **Create a thin wrapper use-case in a new `lib/features/analyze/` domain**: Considered but deferred — the current competitor pipeline accepts `videoId` + `channelId` which is sufficient. If the Analyze page later diverges significantly (e.g., different LLM prompts, saved analysis), a new domain can be extracted then.

**Key adaptation needed**: The existing `analyzeVideo` requires `channelId` (the user's channel). The new Analyze page will extract the `videoId` from the pasted URL (client-side) and pass the user's active channel ID (from session/bootstrap). The API route must resolve a YouTube URL to a `videoId` server-side if the client passes a raw URL.

## R2: URL Input Pattern (Tags Page Reference)

**Decision**: Adapt the Tags page URL input pattern (`TagExtractorClient` + `TagsInput` components) for the Analyze page.

**Rationale**: The Tags page already implements: URL text input → client-side validation (youtube.com, youtu.be, m.youtube.com) → form submit → loading state → results display. The Analyze page needs the same flow with different results rendering.

**Alternatives considered**:
- **Build from scratch**: Rejected — unnecessary duplication of URL validation and input UX.
- **Extract a shared `YouTubeUrlInput` component**: Considered, but the Tags page is a marketing page with different styling. Better to extract just the URL validation logic to `lib/shared/youtube-url.ts` and build a new input component styled to match the Figma design.

**What to extract**: The `validateUrl` function from `TagExtractorClient.tsx` should move to `lib/shared/youtube-url.ts` as a shared utility. Both Tags and Analyze pages will import from there.

## R3: Collapsible Sections (ReportAccordion)

**Decision**: Reuse the `ReportAccordion` component from `app/videos/components/full-report/ui/ReportAccordion.tsx`.

**Rationale**: This component uses native `<details>/<summary>` HTML for collapse/expand, accepts `title`, `defaultOpen`, `variant`, and `badge` props. It matches the Figma design's collapsible sections with chevron icons. It's already styled consistently with the Videos page reports (FR-008).

**Alternatives considered**:
- **Build custom collapsible with React state**: Rejected — `ReportAccordion` already works and uses native HTML which is more accessible and performant.
- **Move `ReportAccordion` to `components/ui/`**: Ideal for long-term reuse, but would increase scope. Can be a follow-up refactor. For now, import directly from the full-report module.

## R4: Comment Truncation Strategy

**Decision**: Use CSS `line-clamp` (3 lines) with a "Show more" toggle per comment.

**Rationale**: Line-clamp provides consistent visual density regardless of comment length. 3 lines (~120-150 chars visible) gives enough context to understand the comment without dominating layout. The expand toggle uses a simple boolean state per comment.

**Alternatives considered**:
- **Character count truncation (e.g., 150 chars)**: Rejected — inconsistent visual height since character width varies.
- **Fixed-height container with fade overlay**: Considered but more complex to implement and less accessible.
- **No truncation, just limit to top 5 comments**: Rejected — spec requires truncation as a deliberate design choice (FR-009, FR-010).

## R5: Same-Page State Architecture

**Decision**: Client component with a discriminated union state machine: `"input" | "loading" | "results" | "error"`.

**Rationale**: The page needs interactive state transitions (input → loading → results → back to input) which requires client-side state. A discriminated union makes states explicit, prevents invalid combinations, and is easy to extend (e.g., adding a "saved" state later). The server component (`page.tsx`) remains thin — just metadata + bootstrap + render of the client component.

**Alternatives considered**:
- **URL search params for state**: Rejected — spec says "analysis results are not persisted in the URL" and browser back should return to input state.
- **React Server Actions with `useFormStatus`**: Considered but insufficient — we need to store the full analysis result in client state for the results view, and server actions don't naturally support the "back to input" flow.
- **Zustand store**: Overkill for single-page local state. `useState` is sufficient.

**State shape**:
```
type PageState =
  | { view: "input" }
  | { view: "loading" }
  | { view: "results"; data: CompetitorVideoAnalysis }
  | { view: "error"; message: string }
```

## R6: DataForSEO / SerpAPI Enrichment Assessment

**Decision**: DataForSEO enrichment comes for free through the existing competitor analysis pipeline. No additional integration needed. SerpAPI continues its existing role (transcript extraction).

**Rationale**: The `analyzeVideo` use-case already calls `fetchCompetitiveContext` which uses DataForSEO to get:
- `searchRankings`: How the video ranks for search terms (position, expected vs actual CTR)
- `topicTrends`: Whether the topic is rising/falling/stable with recent interest score
- `similarVideos`: Other videos competing for the same audience

This data is already included in the `CompetitorVideoAnalysis` response via `publicSignals` and `strategicInsights`. The Analyze page just needs to render it with actionable framing.

**What's NOT needed**:
- No new DataForSEO API calls
- No new SerpAPI integration beyond transcript extraction
- No new adapter code

**How enrichment surfaces on the Analyze page**:
- `strategicInsights.competitionDifficulty` → "How hard to compete" section
- `strategicInsights.postingTiming` → Timing insights
- `strategicInsights.engagementBenchmarks` → Engagement context
- `publicSignals.videoAgeDays` → Age context for velocity calculations

## R7: Video ID Extraction from URL

**Decision**: Extract YouTube video ID from URL server-side in the API route, client-side for validation.

**Rationale**: YouTube URLs come in multiple formats: `youtube.com/watch?v=ID`, `youtu.be/ID`, `youtube.com/shorts/ID`, `m.youtube.com/watch?v=ID`. The ID extraction logic should be shared between client validation and server-side processing.

**Extraction patterns**:
- `youtube.com/watch?v=VIDEO_ID`
- `youtu.be/VIDEO_ID`
- `youtube.com/shorts/VIDEO_ID`
- `m.youtube.com/watch?v=VIDEO_ID`
- `youtube.com/embed/VIDEO_ID`

This will be part of the `lib/shared/youtube-url.ts` utility.
