/**
 * SerpApi Adapter — YouTube transcript extraction and future SerpApi engines.
 *
 * Handles all HTTP communication with the SerpApi API.
 * Maps raw SerpApi response shapes to port-defined types.
 *
 * Must NOT contain business decisions — those belong in lib/features/.
 */

import "server-only";

import type {
  TranscriptParams,
  TranscriptResult,
  TranscriptSegment,
} from "@/lib/ports/SerpApiPort";
import { createLogger } from "@/lib/shared/logger";

const log = createLogger({ subsystem: "serpapi" });

const SERPAPI_BASE_URL = "https://serpapi.com";

function getSerpApiKey(): string {
  const key = process.env.SERPAPI_KEY;
  if (!key) {
    throw new Error("SERPAPI_KEY not configured");
  }
  return key;
}

// ─── Generic Fetch ───────────────────────────────────────

async function serpapiFetch<T>(params: Record<string, string>): Promise<T> {
  const apiKey = getSerpApiKey();
  const searchParams = new URLSearchParams({
    ...params,
    api_key: apiKey,
    output: "json",
  });

  const url = `${SERPAPI_BASE_URL}/search?${searchParams.toString()}`;

  log.info("SerpApi request", {
    engine: params.engine,
    params: Object.fromEntries(
      Object.entries(params).filter(([k]) => k !== "api_key"),
    ),
  });

  const res = await fetch(url);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    log.error("SerpApi error", {
      status: res.status,
      statusText: res.statusText,
      engine: params.engine,
      responseBody: text,
    });
    throw new Error(`SerpApi error ${res.status}: ${text}`);
  }

  const json = (await res.json()) as Record<string, unknown>;

  if (typeof json.error === "string") {
    log.error("SerpApi body error", {
      engine: params.engine,
      error: json.error,
    });
    throw new Error(`SerpApi error: ${json.error}`);
  }

  log.info("SerpApi success", { engine: params.engine });

  return json as T;
}

// ─── Raw Response Types ──────────────────────────────────

interface RawTranscriptSegment {
  snippet: string;
  start_ms: number;
  end_ms: number;
}

interface RawTranscriptResponse {
  transcript?: RawTranscriptSegment[];
  transcript_results?: RawTranscriptSegment[];
}

function extractRawSegments(raw: RawTranscriptResponse): RawTranscriptSegment[] {
  const segments = raw.transcript ?? raw.transcript_results;
  if (!segments || segments.length === 0) {
    log.warn("SerpApi transcript: no segments found", {
      responseKeys: Object.keys(raw),
    });
    return [];
  }
  return segments;
}

// ─── YouTube Transcript ──────────────────────────────────

function buildTranscriptParams(
  videoId: string,
  lang?: string,
): Record<string, string> {
  const params: Record<string, string> = {
    engine: "youtube_video_transcript",
    v: videoId,
  };
  if (lang) {
    params.lang = lang;
  }
  return params;
}

function mapSegments(raw: RawTranscriptSegment[]): TranscriptSegment[] {
  return raw.map((s) => ({
    text: s.snippet,
    start: s.start_ms / 1000,
    duration: (s.end_ms - s.start_ms) / 1000,
  }));
}

export async function getYouTubeTranscript(
  params: TranscriptParams,
): Promise<TranscriptResult> {
  let raw: RawTranscriptResponse;

  try {
    raw = await serpapiFetch<RawTranscriptResponse>(
      buildTranscriptParams(params.videoId, params.lang),
    );
  } catch (error) {
    if (!params.lang) {
      log.info("Retrying SerpApi transcript with lang=en", {
        videoId: params.videoId,
      });
      raw = await serpapiFetch<RawTranscriptResponse>(
        buildTranscriptParams(params.videoId, "en"),
      );
    } else {
      throw error;
    }
  }

  const rawSegments = extractRawSegments(raw);
  const segments = mapSegments(rawSegments);
  const fullText = segments.map((s) => s.text).join(" ");

  return {
    videoId: params.videoId,
    segments,
    fullText,
    meta: {
      fetchedAt: new Date().toISOString(),
    },
  };
}
