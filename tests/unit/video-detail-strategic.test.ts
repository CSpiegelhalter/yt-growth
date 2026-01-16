/**
 * Unit tests for competitor video detail strategic functions.
 *
 * Tests pure functions: deriveKeywordsFromText, fallbackWhatItsAbout,
 * computeStrategicInsights (basic integration).
 */

import { describe, it, expect } from "vitest";
import {
  deriveKeywordsFromText,
  fallbackWhatItsAbout,
  computeStrategicInsights,
  commonWords,
} from "@/lib/competitors/video-detail/strategic";
import type { CompetitorVideo } from "@/types/api";

describe("deriveKeywordsFromText", () => {
  it("extracts relevant keywords from text", () => {
    const text = "Ultimate guide to Python programming for beginners with examples";
    const keywords = deriveKeywordsFromText(text);

    expect(keywords).toContain("ultimate");
    expect(keywords).toContain("guide");
    expect(keywords).toContain("python");
    expect(keywords).toContain("programming");
    expect(keywords).toContain("beginners");
    expect(keywords).toContain("examples");
  });

  it("filters out common words", () => {
    const text = "The quick brown fox jumps over the lazy dog";
    const keywords = deriveKeywordsFromText(text);

    // Common words should not be included
    expect(keywords).not.toContain("the");
    expect(keywords).not.toContain("over");
    // Short words are filtered
    expect(keywords).not.toContain("fox");
    expect(keywords).not.toContain("dog");
  });

  it("filters out words with 4 or fewer characters", () => {
    const text = "code tips help java rust test";
    const keywords = deriveKeywordsFromText(text);

    expect(keywords).not.toContain("code");
    expect(keywords).not.toContain("tips");
    expect(keywords).not.toContain("help");
    expect(keywords).not.toContain("java");
    expect(keywords).not.toContain("rust");
    expect(keywords).not.toContain("test");
  });

  it("returns top 10 keywords by frequency", () => {
    const text = Array(20)
      .fill("keyword1 keyword2 keyword3")
      .join(" ")
      .concat(" unique1 unique2 unique3 unique4 unique5 unique6 unique7 unique8");
    const keywords = deriveKeywordsFromText(text);

    expect(keywords.length).toBeLessThanOrEqual(10);
    // Most frequent keywords should come first
    expect(keywords[0]).toBe("keyword1");
    expect(keywords[1]).toBe("keyword2");
    expect(keywords[2]).toBe("keyword3");
  });

  it("handles empty text", () => {
    const keywords = deriveKeywordsFromText("");
    expect(keywords).toEqual([]);
  });

  it("handles text with only common/short words", () => {
    const text = "the and for with this that from have you";
    const keywords = deriveKeywordsFromText(text);
    expect(keywords).toEqual([]);
  });
});

describe("commonWords", () => {
  it("contains expected common words", () => {
    expect(commonWords.has("the")).toBe(true);
    expect(commonWords.has("and")).toBe(true);
    expect(commonWords.has("youtube")).toBe(true);
    expect(commonWords.has("subscribe")).toBe(true);
    expect(commonWords.has("video")).toBe(true);
  });

  it("does not contain uncommon words", () => {
    expect(commonWords.has("programming")).toBe(false);
    expect(commonWords.has("tutorial")).toBe(false);
    expect(commonWords.has("review")).toBe(false);
  });
});

describe("fallbackWhatItsAbout", () => {
  it("picks first meaningful sentence from description", () => {
    const result = fallbackWhatItsAbout({
      title: "My Video Title",
      description:
        "Short intro. This is a comprehensive guide to building web applications with React that covers all the fundamentals you need to know. More content here.",
      tags: [],
    });

    expect(result).toBe(
      "This is a comprehensive guide to building web applications with React that covers all the fundamentals you need to know."
    );
  });

  it("ignores sentences that are too short", () => {
    const result = fallbackWhatItsAbout({
      title: "My Video",
      description: "Hi! Short. This is a much longer sentence that provides actual context about what the video content is going to cover in detail.",
      tags: ["programming", "tutorial"],
    });

    // Should pick the longer sentence or fall back to tags
    expect(result.length).toBeGreaterThan(30);
  });

  it("uses tags when description lacks good sentences", () => {
    const result = fallbackWhatItsAbout({
      title: "My Video",
      description: "Short.",
      tags: ["react", "javascript", "web development"],
    });

    expect(result).toContain("react");
    expect(result).toContain("javascript");
    expect(result).toContain("web development");
  });

  it("returns generic fallback when no good content available", () => {
    const result = fallbackWhatItsAbout({
      title: "My Video",
      description: "",
      tags: [],
    });

    expect(result).toBe(
      "A video that explores the core topic implied by the title, focusing on the main promise and viewer takeaway."
    );
  });

  it("strips URLs and timestamps from description", () => {
    const result = fallbackWhatItsAbout({
      title: "My Video",
      description:
        "https://example.com Check out my website! 0:00 Intro 1:30 Main topic This is a comprehensive guide to building web applications with React that covers all the fundamentals you need to know.",
      tags: [],
    });

    expect(result).not.toContain("https://");
    expect(result).not.toContain("example.com");
    // The meaningful sentence should still be found
    expect(result).toContain("comprehensive guide");
  });
});

describe("computeStrategicInsights", () => {
  const baseVideo: CompetitorVideo = {
    videoId: "test123",
    title: "10 Tips for Better Code",
    channelId: "ch123",
    channelTitle: "Coding Channel",
    channelThumbnailUrl: null,
    videoUrl: "https://youtube.com/watch?v=test123",
    channelUrl: "https://youtube.com/channel/ch123",
    thumbnailUrl: "https://example.com/thumb.jpg",
    publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    durationSec: 600,
    stats: {
      viewCount: 50000,
      likeCount: 2000,
      commentCount: 150,
    },
    derived: {
      viewsPerDay: 7000,
    },
  };

  const baseVideoDetails = {
    title: "10 Tips for Better Code",
    description: "Learn 10 essential tips to write cleaner code.",
    tags: ["coding", "programming", "tips"],
    viewCount: 50000,
    likeCount: 2000,
    commentCount: 150,
    publishedAt: baseVideo.publishedAt,
    durationSec: 600,
  };

  it("detects number in title correctly", () => {
    const insights = computeStrategicInsights({
      video: baseVideo,
      videoDetails: baseVideoDetails,
    });

    expect(insights?.titleAnalysis.hasNumber).toBe(true);
    expect(insights?.titleAnalysis.numberAnalysis?.type).toBe("list_count");
    expect(insights?.titleAnalysis.numberAnalysis?.isPerformanceDriver).toBe(true);
  });

  it("calculates engagement benchmarks correctly", () => {
    const insights = computeStrategicInsights({
      video: baseVideo,
      videoDetails: baseVideoDetails,
    });

    // Like rate: 2000 / 50000 * 100 = 4%
    expect(insights?.engagementBenchmarks.likeRate).toBe(4);
    // Comment rate: 150 / 50000 * 1000 = 3
    expect(insights?.engagementBenchmarks.commentRate).toBe(3);
    // Like rate 4% is "Above Average" (4-6%)
    expect(insights?.engagementBenchmarks.likeRateVerdict).toBe("Above Average");
    // Comment rate 3 is "Above Average" (3-6)
    expect(insights?.engagementBenchmarks.commentRateVerdict).toBe("Above Average");
  });

  it("sets competition difficulty based on views", () => {
    const insights = computeStrategicInsights({
      video: baseVideo,
      videoDetails: baseVideoDetails,
    });

    // 50K views is "Medium" (10K-100K)
    expect(insights?.competitionDifficulty.score).toBe("Medium");
    expect(insights?.competitionDifficulty.whyThisScore).toBeDefined();
    expect(insights?.competitionDifficulty.whyThisScore!.length).toBeGreaterThan(0);
  });

  it("handles viral videos (1M+ views)", () => {
    const viralVideo = {
      ...baseVideo,
      stats: { ...baseVideo.stats, viewCount: 2000000 },
    };
    const viralDetails = {
      ...baseVideoDetails,
      viewCount: 2000000,
    };

    const insights = computeStrategicInsights({
      video: viralVideo,
      videoDetails: viralDetails,
    });

    expect(insights?.competitionDifficulty.score).toBe("Very Hard");
  });

  it("formats duration correctly", () => {
    const insights = computeStrategicInsights({
      video: baseVideo,
      videoDetails: baseVideoDetails,
    });

    // 600 seconds = 10 minutes
    expect(insights?.lengthAnalysis.durationSec).toBe(600);
    expect(insights?.lengthAnalysis.durationFormatted).toBe("10m");
    expect(insights?.lengthAnalysis.bucket).toBe("Medium");
  });

  it("detects missing chapters for long videos", () => {
    const longVideo = {
      ...baseVideo,
      durationSec: 900, // 15 minutes
    };
    const longDetails = {
      ...baseVideoDetails,
      durationSec: 900,
      description: "No timestamps here.",
    };

    const insights = computeStrategicInsights({
      video: longVideo,
      videoDetails: longDetails,
    });

    // Should have a gap about missing chapters
    expect(insights?.opportunityScore.gaps.some((g) => g.includes("chapter"))).toBe(
      true
    );
  });

  it("includes comment-based opportunities when available", () => {
    const insights = computeStrategicInsights({
      video: baseVideo,
      videoDetails: baseVideoDetails,
      commentsAnalysis: {
        topComments: [],
        sentiment: { positive: 80, neutral: 15, negative: 5 },
        themes: [{ theme: "helpful", count: 10, examples: [] }],
        viewerLoved: ["Great explanation"],
        viewerAskedFor: ["More advanced topics"],
        hookInspiration: [],
      },
    });

    expect(insights?.opportunityScore.gaps.some((g) => g.includes("Viewers asking for"))).toBe(
      true
    );
    expect(insights?.opportunityScore.scoreBreakdown?.commentOpportunity).toBeGreaterThan(0);
  });

  it("uses provided beat checklist over fallback", () => {
    const customChecklist = [
      { action: "Create a beginner-friendly version", difficulty: "Easy" as const, impact: "High" as const },
      { action: "Add live coding examples", difficulty: "Medium" as const, impact: "High" as const },
    ];

    const insights = computeStrategicInsights({
      video: baseVideo,
      videoDetails: baseVideoDetails,
      beatThisVideo: customChecklist,
    });

    expect(insights?.beatThisVideo[0].action).toBe("Create a beginner-friendly version");
    expect(insights?.beatThisVideo[1].action).toBe("Add live coding examples");
  });

  it("all confidence levels are set", () => {
    const insights = computeStrategicInsights({
      video: baseVideo,
      videoDetails: baseVideoDetails,
    });

    expect(insights?.titleAnalysis.confidence).toBeDefined();
    expect(insights?.competitionDifficulty.confidence).toBeDefined();
    expect(insights?.postingTiming.confidence).toBeDefined();
    expect(insights?.lengthAnalysis.confidence).toBeDefined();
    expect(insights?.engagementBenchmarks.confidence).toBeDefined();
    expect(insights?.opportunityScore.confidence).toBeDefined();
    expect(insights?.descriptionAnalysis.confidence).toBeDefined();
    expect(insights?.formatSignals.confidence).toBeDefined();
  });
});
