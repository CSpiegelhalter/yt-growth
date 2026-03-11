import type { DropOffPoint, TranscriptReport } from "@/lib/features/transcript-analysis";
import { createLogger } from "@/lib/shared/logger";

import type { FullReportDeps, GatheredData, InsightContext, RetentionCurvePoint, VideoSignals } from "../types";

const log = createLogger({ subsystem: "full-report" });

type GatherInput = {
  userId: number;
  channelId: string;
  videoId: string;
  range: string;
};

export async function gatherReportData(
  input: GatherInput,
  insightContext: InsightContext,
  deps: FullReportDeps,
): Promise<GatheredData> {
  const { videoId } = input;
  const { derivedData } = insightContext;
  const video = derivedData.video;

  log.info("Gathering report data", { videoId });

  // ── Parallel fetches ────────────────────────────────────
  const [retentionCurve, seoResult, competitiveResult] = await Promise.all([
    // 1. Retention curve from YouTube Analytics
    deps
      .fetchRetentionCurve(input.userId, input.channelId, videoId)
      .catch((error) => {
        log.error("Retention curve fetch failed", { videoId, error });
        return [] as RetentionCurvePoint[];
      }),

    // 2. SEO analysis
    deps
      .generateSeoAnalysis(
        {
          video: {
            title: video.title,
            description: video.description ?? "",
            tags: video.tags ?? [],
            durationSec: video.durationSec,
          },
          totalViews: derivedData.derived.totalViews,
          trafficSources: derivedData.derived.trafficSources ?? null,
        },
        deps.callLlm,
      )
      .catch((error) => {
        log.error("SEO analysis failed", { videoId, error });
        return null;
      }),

    // 3. Competitive context
    fetchCompetitiveIfAvailable(videoId, derivedData, deps),
  ]);

  const dropOffPoints = retentionCurveToDropOffs(retentionCurve, video.durationSec);

  // 4. Transcript + analysis (needs drop-off points)
  const transcriptResult = await fetchTranscriptAnalysis(videoId, video, dropOffPoints, deps);

  const videoSignals = parseVideoSignals(
    video,
    transcriptResult.hasCaptions,
    transcriptResult.report,
  );

  return {
    insightContext,
    transcriptReport: transcriptResult.report,
    seoAnalysis: seoResult,
    competitiveContext: competitiveResult,
    hasCaptions: transcriptResult.hasCaptions,
    videoSignals,
  };
}

async function fetchTranscriptAnalysis(
  videoId: string,
  video: { title: string; durationSec: number },
  dropOffPoints: DropOffPoint[],
  deps: FullReportDeps,
): Promise<{ report: GatheredData["transcriptReport"]; hasCaptions: boolean }> {
  try {
    const transcript = await deps.getYouTubeTranscript({ videoId });
    if (transcript.segments.length === 0) {
      log.info("No captions available", { videoId });
      return { report: null, hasCaptions: false };
    }

    const report = await deps.runTranscriptAnalysis(
      {
        videoId,
        videoTitle: video.title,
        videoDurationSec: video.durationSec,
        segments: transcript.segments,
        dropOffPoints,
      },
      { callLlm: deps.callLlm, cache: deps.transcriptCache },
    );

    return { report, hasCaptions: true };
  } catch (error) {
    log.error("Transcript analysis failed", { videoId, error });
    return { report: null, hasCaptions: false };
  }
}

/**
 * Convert YouTube Analytics retention curve to drop-off points.
 * Finds significant drops in the audience watch ratio between consecutive points.
 */
function retentionCurveToDropOffs(
  curve: RetentionCurvePoint[],
  durationSec: number,
): DropOffPoint[] {
  if (curve.length < 2) { return []; }

  const DROP_THRESHOLD = 0.05; // 5% drop between points is significant
  const dropOffs: DropOffPoint[] = [];

  for (let i = 1; i < curve.length; i++) {
    const prev = curve[i - 1]!;
    const curr = curve[i]!;
    const drop = prev.audienceWatchRatio - curr.audienceWatchRatio;

    if (drop >= DROP_THRESHOLD) {
      dropOffs.push({
        timeSec: Math.round(curr.elapsedRatio * durationSec),
        severityPct: Math.round(drop * 100),
      });
    }
  }

  return dropOffs.slice(0, 10);
}

function parseVideoSignals(
  video: { title: string; description?: string; durationSec: number },
  hasCaptions: boolean,
  transcriptReport: TranscriptReport | null,
): VideoSignals {
  const description = video.description ?? "";

  const urlPattern = /https?:\/\/[^\s]+/g;
  const descriptionLinkCount = (description.match(urlPattern) ?? []).length;

  const timestampPattern = /\d{1,2}:\d{2}/;
  const hasTimestamps = timestampPattern.test(description);

  const hashtagPattern = /#\w+/g;
  const hashtagCount = (description.match(hashtagPattern) ?? []).length;

  const ctaCount = transcriptReport?.allCtas?.length ?? 0;

  return {
    descriptionLinkCount,
    hasTimestamps,
    hashtagCount,
    ctaCount,
    hasCaptions,
    titleLength: video.title.length,
  };
}

async function fetchCompetitiveIfAvailable(
  videoId: string,
  derivedData: InsightContext["derivedData"],
  deps: FullReportDeps,
): Promise<GatheredData["competitiveContext"]> {
  const searchTerms = derivedData.trafficDetail?.searchTerms;
  if (!searchTerms?.length) {
    return null;
  }

  try {
    return await deps.fetchCompetitiveContext({
      videoId,
      title: derivedData.video.title,
      tags: derivedData.video.tags ?? [],
      searchTerms: searchTerms.slice(0, 3),
      totalViews: derivedData.derived.totalViews,
    });
  } catch (error) {
    log.error("Competitive context failed", { videoId, error });
    return null;
  }
}
