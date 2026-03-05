/**
 * SerpApi Port — contract for SerpApi-powered data access (transcripts, search, etc.).
 *
 * Ports are pure TypeScript interfaces — no runtime code, no implementations.
 * They define what features need from SerpApi without specifying how.
 *
 * Imported by:
 *   - lib/features/ (to declare dependency on transcript/search data)
 *   - lib/adapters/serpapi/ (to implement)
 *   - app/ or lib/server/ (to wire adapter to features)
 */

// ─── YouTube Transcript ──────────────────────────────────

export interface TranscriptParams {
  videoId: string;
  /** Language code (e.g. "en", "es"). Defaults to video's primary language. */
  lang?: string;
}

export interface TranscriptSegment {
  text: string;
  /** Start time in seconds. */
  start: number;
  /** Duration in seconds. */
  duration: number;
}

export interface TranscriptResult {
  videoId: string;
  segments: TranscriptSegment[];
  /** All segments joined into a single string. */
  fullText: string;
  meta: {
    fetchedAt: string;
  };
}

// ─── Transcript Cache ────────────────────────────────────

export interface TranscriptCacheData {
  segments: TranscriptSegment[];
  fullText: string;
  transcriptHash: string;
  analysisJson?: unknown;
  analysisHash?: string;
}

// ─── Port Interface ──────────────────────────────────────

export interface SerpApiPort {
  /** Fetch the transcript (captions) for a YouTube video. */
  getYouTubeTranscript(params: TranscriptParams): Promise<TranscriptResult>;

  /** Read cached transcript data (segments, hash, analysis) for a video. */
  getCachedTranscript(videoId: string): Promise<TranscriptCacheData | null>;

  /** Write transcript analysis results back to the cache. */
  cacheTranscriptAnalysis(
    videoId: string,
    analysisJson: unknown,
    analysisHash: string,
  ): Promise<void>;
}
