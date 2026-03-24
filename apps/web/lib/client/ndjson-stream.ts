// Shared NDJSON stream types and reader for the competitor search endpoint.

export type SearchStatusEvent = {
  type: "status";
  status: "searching" | "filtering" | "refilling" | "done";
  message: string;
  scannedCount: number;
  matchedCount: number;
};

export type SearchItemsEvent = {
  type: "items";
  items: Array<{
    videoId: string;
    title: string;
    channelId: string;
    channelTitle: string;
    channelThumbnailUrl: string | null;
    thumbnailUrl: string | null;
    publishedAt: string;
    durationSec?: number;
    stats: {
      viewCount: number;
      likeCount?: number;
      commentCount?: number;
    };
    derived: {
      viewsPerDay: number;
      daysSincePublished: number;
      velocity24h?: number;
      velocity7d?: number;
      engagementPerView?: number;
    };
  }>;
  totalMatched: number;
};

export type SearchCursor = {
  queryIndex: number;
  pageToken?: string;
  seenIds: string[];
  scannedCount: number;
};

export type SearchDoneEvent = {
  type: "done";
  summary: {
    scannedCount: number;
    returnedCount: number;
    cacheHit: boolean;
    timeMs: number;
    exhausted: boolean;
  };
  nextCursor?: SearchCursor;
};

export type SearchErrorEvent = {
  type: "error";
  error: string;
  code?: string;
  partial?: boolean;
};

export type SearchEvent =
  | SearchStatusEvent
  | SearchItemsEvent
  | SearchDoneEvent
  | SearchErrorEvent;

export async function readNdjsonStream(
  body: ReadableStream<Uint8Array>,
  onEvent: (event: SearchEvent) => void,
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) { break; }

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.trim()) { continue; }
      try {
        onEvent(JSON.parse(line) as SearchEvent);
      } catch {
        console.warn("[Stream] Failed to parse event:", line);
      }
    }
  }

  if (buffer.trim()) {
    try {
      onEvent(JSON.parse(buffer) as SearchEvent);
    } catch {
      // Ignore incomplete final chunk
    }
  }
}
