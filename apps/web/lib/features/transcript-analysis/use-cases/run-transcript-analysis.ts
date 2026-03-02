import { createLogger } from "@/lib/shared/logger";

import { TranscriptAnalysisError } from "../errors";
import type {
  ChunkAnalysisResult,
  ChunkCta,
  RunTranscriptAnalysisDeps,
  RunTranscriptAnalysisInput,
  TranscriptReport,
} from "../types";
import { analyzeChunk } from "./analyze-chunk";
import { segmentTranscript } from "./segment-transcript";
import { synthesizeReport } from "./synthesize-report";

const log = createLogger({ subsystem: "transcript-analysis" });

function buildFallbackChunkResult(
  chunkIndex: number,
  startTimeSec: number,
  endTimeSec: number,
): ChunkAnalysisResult {
  return {
    chunkIndex,
    startTimeSec,
    endTimeSec,
    ctas: [],
    keywords: [],
    topicSummary: "",
    wordsPerMinute: 0,
    pacingDensity: "medium",
    dropOffHypothesis: null,
    frictionPoints: [],
    valueDensity: 5,
    verbatimOpening: null,
  };
}

function aggregateCtas(chunkAnalyses: ChunkAnalysisResult[]): ChunkCta[] {
  return chunkAnalyses
    .flatMap((c) => c.ctas)
    .sort((a, b) => a.timeSec - b.timeSec);
}

function aggregateKeywords(chunkAnalyses: ChunkAnalysisResult[]): string[] {
  const freq = new Map<string, number>();
  for (const chunk of chunkAnalyses) {
    for (const kw of chunk.keywords) {
      const lower = kw.toLowerCase();
      freq.set(lower, (freq.get(lower) ?? 0) + 1);
    }
  }
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([kw]) => kw)
    .slice(0, 15);
}

export async function runTranscriptAnalysis(
  input: RunTranscriptAnalysisInput,
  deps: RunTranscriptAnalysisDeps,
): Promise<TranscriptReport> {
  const { videoId, videoTitle, videoDurationSec, segments, dropOffPoints } =
    input;
  const { callLlm } = deps;

  if (!segments || segments.length === 0) {
    throw new TranscriptAnalysisError(
      "INVALID_INPUT",
      "No transcript segments provided",
    );
  }

  // Phase 1: Segment
  log.info("Segmenting transcript", {
    videoId,
    segmentCount: segments.length,
  });
  const chunks = segmentTranscript(segments, dropOffPoints);
  log.info("Segmentation complete", { videoId, chunkCount: chunks.length });

  // Phase 2: Map (parallel)
  log.info("Starting parallel chunk analysis", {
    videoId,
    chunkCount: chunks.length,
  });
  const chunkAnalyses = await Promise.all(
    chunks.map(async (chunk) => {
      try {
        return await analyzeChunk(chunk, videoTitle, callLlm, chunks.length);
      } catch (error) {
        log.error("Chunk analysis failed, using fallback", {
          videoId,
          chunkIndex: chunk.index,
          err: error,
        });
        return buildFallbackChunkResult(chunk.index, chunk.startTimeSec, chunk.endTimeSec);
      }
    }),
  );
  log.info("Chunk analysis complete", { videoId });

  // Phase 3: Reduce
  const totalWordCount = chunks.reduce((sum, c) => sum + c.wordCount, 0);
  log.info("Synthesizing report", { videoId, totalWordCount });

  const verbatimOpening = chunkAnalyses[0]?.verbatimOpening ?? null;

  const {
    hookAnalysis,
    contentStructure,
    dropOffDiagnoses,
    pacingScore,
    beatChecklist,
    videoFormat,
    retentionKillers,
    contentGaps,
    timeToValueSec,
  } = await synthesizeReport(
    {
      videoTitle,
      videoDurationSec,
      totalWordCount,
      chunkAnalyses,
      dropOffPoints: dropOffPoints ?? [],
      verbatimOpening,
    },
    callLlm,
  );
  log.info("Synthesis complete", { videoId });

  // Phase 4: Aggregate
  const allCtas = aggregateCtas(chunkAnalyses);
  const topKeywords = aggregateKeywords(chunkAnalyses);

  return {
    videoId,
    videoTitle,
    videoDurationSec,
    totalWordCount,
    chunkCount: chunks.length,
    videoFormat,
    hookAnalysis,
    contentStructure,
    dropOffDiagnoses,
    pacingScore,
    beatChecklist,
    retentionKillers,
    contentGaps,
    timeToValueSec,
    allCtas,
    topKeywords,
    chunkAnalyses,
  };
}
