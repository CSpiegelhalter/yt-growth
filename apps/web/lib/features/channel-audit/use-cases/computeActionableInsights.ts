import type {
  ActionableInsight,
  InsightVideoInput,
  VideoPublishMarker,
} from "../types";

// ── Helpers ──────────────────────────────────────────────────

function median(values: number[]): number {
  if (values.length === 0) {return 0;}
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function fmt(n: number): string {
  if (n >= 1_000_000) {return `${(n / 1_000_000).toFixed(1)}M`;}
  if (n >= 1_000) {return `${(n / 1_000).toFixed(1)}K`;}
  return n.toLocaleString("en-US", { maximumFractionDigits: 1 });
}

function daysBetween(a: string, b: string): number {
  return Math.abs(
    (new Date(a).getTime() - new Date(b).getTime()) / 86_400_000,
  );
}

// ── Individual insight builders ──────────────────────────────

function buildUploadCadence(
  markers: VideoPublishMarker[],
): ActionableInsight | null {
  if (markers.length < 2) {return null;}

  const sorted = [...markers].sort(
    (a, b) =>
      new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime(),
  );

  const gaps: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    gaps.push(daysBetween(sorted[i].publishedAt, sorted[i - 1].publishedAt));
  }

  const avgGap = gaps.reduce((s, g) => s + g, 0) / gaps.length;
  const maxGap = Math.max(...gaps);
  const count = markers.length;

  let title: string;
  let fix: string;

  if (avgGap <= 10) {
    title = "Upload Cadence: Consistent";
    fix =
      "Keep it up. Consistent uploading compounds growth over time.";
  } else if (avgGap <= 21) {
    title = "Upload Cadence: Irregular";
    fix =
      "Aim for a consistent weekly upload. Channels that upload regularly grow 2-3x faster.";
  } else {
    title = "Upload Cadence: Dormant";
    fix =
      "Start with a realistic schedule you can sustain -- even biweekly is better than sporadic bursts.";
  }

  const explanation =
    `You uploaded ${count} times recently, averaging ${Math.round(avgGap)} days apart.${ 
    maxGap > avgGap * 1.5
      ? ` Your longest gap was ${Math.round(maxGap)} days.`
      : ""}`;

  return { id: "cadence", title, explanation, fix, priority: 1 };
}

function buildRetentionHealth(
  videos: InsightVideoInput[],
): ActionableInsight | null {
  const withRetention = videos.filter((v) => v.avgViewPercentage != null);
  if (withRetention.length < 2) {return null;}

  const values = withRetention.map((v) => v.avgViewPercentage!);
  const med = median(values);
  const weak = withRetention.filter((v) => v.avgViewPercentage! < 30);

  let title: string;
  let fix: string;

  if (med >= 50) {
    title = "Retention: Strong";
    fix =
      "Your audience is staying. Study your best-performing hooks and replicate the pattern.";
  } else if (med >= 35) {
    title = "Retention: Average";
    fix =
      "Tighten your hooks in the first 30 seconds and cut filler sections to push retention above 50%.";
  } else {
    title = "Retention: Needs Work";
    fix =
      "Strengthen your opening hook -- the first 30 seconds determine who stays. Front-load value, cut long intros.";
  }

  let explanation = `Your median retention is ${med.toFixed(0)}% across ${withRetention.length} videos.`;
  if (weak.length > 0) {
    const names = weak
      .slice(0, 2)
      .map((v) => `"${v.title ?? "Untitled"}"`)
      .join(" and ");
    explanation += ` ${weak.length} video${weak.length > 1 ? "s" : ""} ${weak.length > 1 ? "are" : "is"} below 30% (${names}).`;
  }

  return { id: "retention", title, explanation, fix, priority: 2 };
}

function buildSubConversion(
  videos: InsightVideoInput[],
): ActionableInsight | null {
  const withSubs = videos.filter(
    (v) => v.subscribersGained != null && v.views > 0,
  );
  if (withSubs.length < 2) {return null;}

  const rates = withSubs.map(
    (v) => (v.subscribersGained! / v.views) * 1000,
  );
  const med = median(rates);

  const best = withSubs.reduce((top, v) => {
    const rate = (v.subscribersGained! / v.views) * 1000;
    const topRate = (top.subscribersGained! / top.views) * 1000;
    return rate > topRate ? v : top;
  });
  const bestRate = (best.subscribersGained! / best.views) * 1000;

  let title: string;
  let fix: string;

  if (med >= 3) {
    title = "Subscriber Conversion: Strong";
    fix = `Study what made "${best.title ?? "your top video"}" convert at ${bestRate.toFixed(1)} subs/1K views and replicate it.`;
  } else if (med >= 1) {
    title = "Subscriber Conversion: Average";
    fix =
      "Add a clear subscribe CTA mid-video and use end screens to prompt subscriptions.";
  } else {
    title = "Subscriber Conversion: Low";
    fix =
      "Your content may be reaching the wrong audience. Refine your titles and thumbnails to attract viewers likely to subscribe.";
  }

  const explanation = `You're gaining ${med.toFixed(1)} subs per 1K views (benchmark: 3+ is excellent).`;

  return {
    id: "sub-conversion",
    title,
    explanation,
    fix,
    priority: 3,
  };
}

function buildFormatSplit(
  videos: InsightVideoInput[],
): ActionableInsight | null {
  const shorts = videos.filter(
    (v) => v.durationSec != null && v.durationSec <= 60,
  );
  const longForm = videos.filter(
    (v) => v.durationSec != null && v.durationSec > 60,
  );

  if (shorts.length === 0 || longForm.length === 0) {return null;}
  if (shorts.length + longForm.length < 3) {return null;}

  const avgViews = (vids: InsightVideoInput[]) =>
    vids.reduce((s, v) => s + v.views, 0) / vids.length;

  const shortsAvg = avgViews(shorts);
  const longAvg = avgViews(longForm);

  const ratio = longAvg > 0 ? shortsAvg / longAvg : 0;

  let title: string;
  let fix: string;

  if (ratio > 1.5) {
    title = "Format Split: Shorts are winning";
    fix =
      "Shorts are outperforming long-form. Use them as entry points and link to longer content for deeper engagement.";
  } else if (ratio < 0.67) {
    title = "Format Split: Long-form is winning";
    fix =
      "Double down on long-form. Use Shorts as promotional clips to drive viewers to your main videos.";
  } else {
    title = "Format Split: Balanced";
    fix =
      "Both formats perform similarly. Keep experimenting and track which drives more subscribers.";
  }

  const explanation =
    `Your long-form videos average ${fmt(longAvg)} views (${longForm.length} videos) vs ${fmt(shortsAvg)} for Shorts (${shorts.length} videos).`;

  return { id: "format", title, explanation, fix, priority: 4 };
}

function buildEngagement(
  videos: InsightVideoInput[],
): ActionableInsight | null {
  const withViews = videos.filter((v) => v.views > 0);
  if (withViews.length < 2) {return null;}

  const likeRates = withViews.map((v) => v.likes / v.views);
  const commentRates = withViews.map((v) => (v.comments / v.views) * 1000);
  const medLikeRate = median(likeRates) * 100;
  const medCommentRate = median(commentRates);
  const medViews = median(withViews.map((v) => v.views));

  const highEngagement = medLikeRate >= 4;
  const lowViews = medViews < 1000;

  let title: string;
  let fix: string;

  if (highEngagement && lowViews) {
    title = "Engagement: Loyal Niche";
    fix =
      "Focus on SEO and packaging to get more impressions. Your content resonates -- you just need more eyeballs.";
  } else if (highEngagement) {
    title = "Engagement: Thriving";
    fix =
      "Your audience is highly engaged. Lean into community -- reply to comments, create content they request.";
  } else if (medLikeRate >= 2) {
    title = "Engagement: Average";
    fix =
      "Ask a question in your videos and pin the best comment. Active discussion signals quality to the algorithm.";
  } else {
    title = "Engagement: Passive Viewers";
    fix =
      "Add verbal CTAs asking viewers to like/comment. Pose a question early to spark discussion.";
  }

  const explanation =
    `Your median like rate is ${medLikeRate.toFixed(1)}% with ${medCommentRate.toFixed(1)} comments per 1K views across ${withViews.length} videos.`;

  return { id: "engagement", title, explanation, fix, priority: 5 };
}

function buildViewMomentum(
  videos: InsightVideoInput[],
): ActionableInsight | null {
  const withDates = videos.filter((v) => v.publishedAt && v.views > 0);
  if (withDates.length < 3) {return null;}

  const sorted = [...withDates].sort(
    (a, b) =>
      new Date(b.publishedAt!).getTime() - new Date(a.publishedAt!).getTime(),
  );

  const recentHalf = sorted.slice(0, Math.ceil(sorted.length / 2));
  const olderHalf = sorted.slice(Math.ceil(sorted.length / 2));

  if (olderHalf.length === 0) {return null;}

  const avgRecent =
    recentHalf.reduce((s, v) => s + v.views, 0) / recentHalf.length;
  const avgOlder =
    olderHalf.reduce((s, v) => s + v.views, 0) / olderHalf.length;

  if (avgOlder === 0) {return null;}

  const change = ((avgRecent - avgOlder) / avgOlder) * 100;

  let title: string;
  let fix: string;

  if (change > 20) {
    title = "View Momentum: Growing";
    fix =
      "Your recent videos are outperforming older ones. Keep refining what's working and increase upload frequency if you can.";
  } else if (change < -20) {
    title = "View Momentum: Declining";
    fix =
      "Recent videos are underperforming. Review your last 2-3 thumbnails and titles -- a packaging refresh may be needed.";
  } else {
    title = "View Momentum: Steady";
    fix =
      "Views are consistent. To break out, experiment with a new topic angle or format that might catch the algorithm.";
  }

  const explanation =
    `Your recent ${recentHalf.length} videos average ${fmt(avgRecent)} views vs ${fmt(avgOlder)} for the previous ${olderHalf.length} (${change > 0 ? "+" : ""}${change.toFixed(0)}%).`;

  return { id: "momentum", title, explanation, fix, priority: 6 };
}

// ── Main entry point ─────────────────────────────────────────

export function computeActionableInsights(
  videos: InsightVideoInput[],
  markers: VideoPublishMarker[],
): ActionableInsight[] {
  const insights: ActionableInsight[] = [];

  const cadence = buildUploadCadence(markers);
  if (cadence) {insights.push(cadence);}

  const retention = buildRetentionHealth(videos);
  if (retention) {insights.push(retention);}

  const subs = buildSubConversion(videos);
  if (subs) {insights.push(subs);}

  const format = buildFormatSplit(videos);
  if (format) {insights.push(format);}

  const engagement = buildEngagement(videos);
  if (engagement) {insights.push(engagement);}

  const momentum = buildViewMomentum(videos);
  if (momentum) {insights.push(momentum);}

  return insights.sort((a, b) => a.priority - b.priority);
}
