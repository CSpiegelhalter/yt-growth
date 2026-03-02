import type { TranscriptSegment } from "@/lib/ports/SerpApiPort";

import type { DropOffPoint, TranscriptChunk } from "../types";

const CHUNK_TARGET_SEC = 600; // 10 minutes

function isSentenceEnd(text: string): boolean {
  const trimmed = text.trimEnd();
  return trimmed.endsWith(".") || trimmed.endsWith("!") || trimmed.endsWith("?");
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function tagDropOffs(
  startTimeSec: number,
  endTimeSec: number,
  dropOffPoints: DropOffPoint[] | undefined,
): DropOffPoint[] {
  if (!dropOffPoints || dropOffPoints.length === 0) {
    return [];
  }
  return dropOffPoints.filter(
    (d) => d.timeSec >= startTimeSec && d.timeSec <= endTimeSec,
  );
}

export function segmentTranscript(
  segments: TranscriptSegment[],
  dropOffPoints?: DropOffPoint[],
): TranscriptChunk[] {
  if (segments.length === 0) {
    return [];
  }

  const chunks: TranscriptChunk[] = [];
  let chunkSegments: TranscriptSegment[] = [];
  let chunkStartTimeSec = segments[0].start;
  let reachedThreshold = false;

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    chunkSegments.push(seg);

    const chunkEndTimeSec = seg.start + seg.duration;
    const chunkDuration = chunkEndTimeSec - chunkStartTimeSec;

    if (chunkDuration >= CHUNK_TARGET_SEC) {
      reachedThreshold = true;
    }

    const isLast = i === segments.length - 1;
    const shouldSplit = reachedThreshold && (isSentenceEnd(seg.text) || isLast);

    if (shouldSplit || isLast) {
      const text = chunkSegments.map((s) => s.text).join(" ");
      const endTimeSec = chunkEndTimeSec;

      chunks.push({
        index: chunks.length,
        startTimeSec: chunkStartTimeSec,
        endTimeSec,
        text,
        segments: chunkSegments,
        wordCount: countWords(text),
        dropOffPoints: tagDropOffs(chunkStartTimeSec, endTimeSec, dropOffPoints),
      });

      chunkSegments = [];
      reachedThreshold = false;
      if (i + 1 < segments.length) {
        chunkStartTimeSec = segments[i + 1].start;
      }
    }
  }

  return chunks;
}

const DROP_THRESHOLD = 0.08;

export function extractDropOffPoints(
  retentionPoints: Array<{ elapsedRatio: number; audienceWatchRatio: number }>,
  videoDurationSec: number,
): DropOffPoint[] {
  if (retentionPoints.length < 2) {
    return [];
  }

  const dropOffs: DropOffPoint[] = [];

  for (let i = 1; i < retentionPoints.length; i++) {
    const prev = retentionPoints[i - 1];
    const curr = retentionPoints[i];
    const delta = prev.audienceWatchRatio - curr.audienceWatchRatio;

    if (delta > DROP_THRESHOLD) {
      dropOffs.push({
        timeSec: Math.round(curr.elapsedRatio * videoDurationSec),
        severityPct: Math.round(delta * 100),
      });
    }
  }

  return dropOffs;
}
