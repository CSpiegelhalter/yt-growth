#!/usr/bin/env bun
/**
 * find_new_short_channels.ts
 *
 * Finds YouTube channels that:
 * - Were created within the last N days
 * - Have fewer than M total public videos
 * - Have posted Shorts (<=60s) within the last N days
 * - Those Shorts have at least X views
 *
 * Usage:
 *   YT_API_KEY=... bun run scripts/find_new_short_channels.ts [options]
 *
 * Run --help for options or --selfTest for unit tests.
 */

// ============================================================================
// Types
// ============================================================================

interface CliArgs {
  days: number;
  maxChannelVideos: number;
  minViews: number;
  region: string;
  pagesPerQuery: number;
  maxQueries: number;
  queries: string[];
  useTrends: boolean;
  trendsGeo: string;
  out: string;
  help: boolean;
  selfTest: boolean;
}

interface VideoDetails {
  videoId: string;
  channelId: string;
  title: string;
  publishedAt: string;
  durationSeconds: number;
  viewCount: number;
  query: string;
}

interface ChannelDetails {
  channelId: string;
  title: string;
  publishedAt: string;
  videoCount: number;
}

interface QualifiedChannel {
  channelId: string;
  channelTitle: string;
  channelUrl: string;
  channelCreatedAt: string;
  channelAgeDays: number;
  channelVideoCount: number;
  breakoutVideoId: string;
  breakoutVideoUrl: string;
  breakoutTitle: string;
  breakoutPublishedAt: string;
  breakoutViews: number;
  queryMatched: string;
}

interface Summary {
  totalQueries: number;
  videosScanned: number;
  shortsQualified: number;
  channelsQualified: number;
  csvPath: string;
}

// ============================================================================
// Constants
// ============================================================================

const YT_API_BASE = "https://www.googleapis.com/youtube/v3";
const TRENDS_RSS_BASE = "https://trends.google.com/trending/rss";
const MAX_BATCH_SIZE = 50;
const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1000;

// ============================================================================
// ISO 8601 Duration Parsing
// ============================================================================

/**
 * Parse ISO 8601 duration (e.g., PT1M30S, PT2H5M, PT45S) to seconds.
 * Returns 0 if parsing fails.
 */
export function parseISO8601Duration(duration: string): number {
  if (!duration || typeof duration !== "string") {return 0;}

  // Match PT[#H][#M][#S] format
  const match = duration.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!match) {return 0;}

  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  const seconds = parseInt(match[3] || "0", 10);

  return hours * 3600 + minutes * 60 + seconds;
}

// ============================================================================
// CLI Argument Parsing
// ============================================================================

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    days: 15,
    maxChannelVideos: 30,
    minViews: 300_000,
    region: "US",
    pagesPerQuery: 1,
    maxQueries: 25,
    queries: [],
    useTrends: true,
    trendsGeo: "US",
    out: "new_short_channels.csv",
    help: false,
    selfTest: false,
  };

  for (const arg of argv) {
    if (arg === "--help" || arg === "-h") {
      args.help = true;
    } else if (arg === "--selfTest") {
      args.selfTest = true;
    } else if (arg.startsWith("--days=")) {
      args.days = parseInt(arg.slice(7), 10);
    } else if (arg.startsWith("--maxChannelVideos=")) {
      args.maxChannelVideos = parseInt(arg.slice(19), 10);
    } else if (arg.startsWith("--minViews=")) {
      args.minViews = parseInt(arg.slice(11), 10);
    } else if (arg.startsWith("--region=")) {
      args.region = arg.slice(9);
    } else if (arg.startsWith("--pagesPerQuery=")) {
      args.pagesPerQuery = parseInt(arg.slice(16), 10);
    } else if (arg.startsWith("--maxQueries=")) {
      args.maxQueries = parseInt(arg.slice(13), 10);
    } else if (arg.startsWith("--q=")) {
      args.queries.push(arg.slice(4));
    } else if (arg.startsWith("--useTrends=")) {
      args.useTrends = arg.slice(12).toLowerCase() === "true";
    } else if (arg.startsWith("--trendsGeo=")) {
      args.trendsGeo = arg.slice(12);
    } else if (arg.startsWith("--out=")) {
      args.out = arg.slice(6);
    }
  }

  return args;
}

function validateArgs(args: CliArgs): void {
  if (args.days < 1 || args.days > 365) {
    throw new Error("--days must be between 1 and 365");
  }
  if (args.maxChannelVideos < 1) {
    throw new Error("--maxChannelVideos must be at least 1");
  }
  if (args.minViews < 0) {
    throw new Error("--minViews cannot be negative");
  }
  if (args.pagesPerQuery < 1 || args.pagesPerQuery > 10) {
    throw new Error("--pagesPerQuery must be between 1 and 10");
  }
  if (args.maxQueries < 1 || args.maxQueries > 100) {
    throw new Error("--maxQueries must be between 1 and 100");
  }
}

function printHelp(): void {
  console.log(`
find_new_short_channels.ts - Find new YouTube channels with breakout Shorts

Usage:
  YT_API_KEY=... bun run scripts/find_new_short_channels.ts [options]

Options:
  --days=N              Channel age and video recency filter (default: 15)
  --maxChannelVideos=N  Max videos a qualifying channel can have (default: 30)
  --minViews=N          Minimum views for a Short to qualify (default: 300000)
  --region=XX           YouTube region code (default: US)
  --pagesPerQuery=N     Pages of search results per query (default: 1)
  --maxQueries=N        Max search queries to run (default: 25)
  --q="keyword"         Custom search query (repeatable)
  --useTrends=bool      Use Google Trends for queries (default: true)
  --trendsGeo=XX        Google Trends geo code (default: US)
  --out=filename        Output CSV filename (default: new_short_channels.csv)
  --selfTest            Run unit tests
  --help                Show this help

Examples:
  # Use trending keywords
  YT_API_KEY=xxx bun run scripts/find_new_short_channels.ts

  # Custom queries only
  YT_API_KEY=xxx bun run scripts/find_new_short_channels.ts --useTrends=false --q="cooking" --q="recipes"

  # More relaxed filters
  YT_API_KEY=xxx bun run scripts/find_new_short_channels.ts --days=30 --minViews=100000

Environment:
  YT_API_KEY    Required. Your YouTube Data API v3 key.
`);
}

// ============================================================================
// HTTP Utilities with Retry
// ============================================================================

async function fetchWithRetry(
  url: string,
  options: { maxRetries?: number } = {}
): Promise<Response> {
  const maxRetries = options.maxRetries ?? MAX_RETRIES;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url);

      // Success or client error (don't retry 4xx except 429)
      if (response.ok || (response.status >= 400 && response.status < 500 && response.status !== 429)) {
        return response;
      }

      // Retry on 429 or 5xx
      if (response.status === 429 || response.status >= 500) {
        if (attempt < maxRetries) {
          const backoff = INITIAL_BACKOFF_MS * Math.pow(2, attempt);
          console.error(`  [Retry] Status ${response.status}, waiting ${backoff}ms...`);
          await sleep(backoff);
          continue;
        }
      }

      return response;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < maxRetries) {
        const backoff = INITIAL_BACKOFF_MS * Math.pow(2, attempt);
        console.error(`  [Retry] Network error, waiting ${backoff}ms...`);
        await sleep(backoff);
      }
    }
  }

  throw lastError ?? new Error("Request failed after retries");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================================
// Google Trends RSS Fetching
// ============================================================================

async function fetchTrendingKeywords(geo: string, maxKeywords: number): Promise<string[]> {
  const url = `${TRENDS_RSS_BASE}?geo=${encodeURIComponent(geo)}`;

  try {
    const response = await fetchWithRetry(url);
    if (!response.ok) {
      console.error(`  [Trends] Failed to fetch (${response.status}), using fallback keywords`);
      return getFallbackKeywords();
    }

    const xml = await response.text();

    // Simple regex extraction of <title> from RSS items
    // Skip the first <title> which is the feed title
    const titleMatches = xml.match(/<item>[\s\S]*?<title>([^<]+)<\/title>/g) || [];
    const keywords: string[] = [];

    for (const match of titleMatches) {
      const titleMatch = match.match(/<title>([^<]+)<\/title>/);
      if (titleMatch && titleMatch[1]) {
        const title = titleMatch[1].trim();
        if (title && !keywords.includes(title)) {
          keywords.push(title);
        }
      }
      if (keywords.length >= maxKeywords) {break;}
    }

    if (keywords.length === 0) {
      console.error("  [Trends] No keywords extracted, using fallback");
      return getFallbackKeywords();
    }

    return keywords.slice(0, maxKeywords);
  } catch (err) {
    console.error(`  [Trends] Error: ${err instanceof Error ? err.message : err}`);
    return getFallbackKeywords();
  }
}

function getFallbackKeywords(): string[] {
  return [
    "viral",
    "trending",
    "shorts",
    "tiktok",
    "challenge",
    "funny",
    "satisfying",
    "asmr",
    "life hack",
    "tutorial",
  ];
}

// ============================================================================
// YouTube API Calls
// ============================================================================

async function searchVideos(
  apiKey: string,
  query: string,
  publishedAfter: string,
  regionCode: string,
  maxResults: number,
  pageToken?: string
): Promise<{ videoIds: string[]; nextPageToken?: string }> {
  const params = new URLSearchParams({
    key: apiKey,
    part: "id",
    type: "video",
    order: "viewCount",
    publishedAfter,
    regionCode,
    maxResults: String(maxResults),
    videoDuration: "short", // Coarse filter: videos < 4 minutes
    q: query,
  });

  if (pageToken) {
    params.set("pageToken", pageToken);
  }

  const url = `${YT_API_BASE}/search?${params}`;
  const response = await fetchWithRetry(url);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`YouTube search API error (${response.status}): ${text.slice(0, 200)}`);
  }

  const data = await response.json();
  const videoIds: string[] = [];

  for (const item of data.items || []) {
    if (item.id?.videoId) {
      videoIds.push(item.id.videoId);
    }
  }

  return { videoIds, nextPageToken: data.nextPageToken };
}

async function getVideoDetails(
  apiKey: string,
  videoIds: string[]
): Promise<Map<string, { channelId: string; title: string; publishedAt: string; durationSeconds: number; viewCount: number }>> {
  const results = new Map<string, { channelId: string; title: string; publishedAt: string; durationSeconds: number; viewCount: number }>();

  // Batch in groups of 50
  for (let i = 0; i < videoIds.length; i += MAX_BATCH_SIZE) {
    const batch = videoIds.slice(i, i + MAX_BATCH_SIZE);
    const params = new URLSearchParams({
      key: apiKey,
      part: "snippet,contentDetails,statistics",
      id: batch.join(","),
    });

    const url = `${YT_API_BASE}/videos?${params}`;
    const response = await fetchWithRetry(url);

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`YouTube videos API error (${response.status}): ${text.slice(0, 200)}`);
    }

    const data = await response.json();

    for (const item of data.items || []) {
      const videoId = item.id;
      const channelId = item.snippet?.channelId;
      const title = item.snippet?.title || "";
      const publishedAt = item.snippet?.publishedAt || "";
      const duration = item.contentDetails?.duration || "";
      const viewCount = parseInt(item.statistics?.viewCount || "0", 10);

      if (videoId && channelId) {
        results.set(videoId, {
          channelId,
          title,
          publishedAt,
          durationSeconds: parseISO8601Duration(duration),
          viewCount,
        });
      }
    }
  }

  return results;
}

async function getChannelDetails(
  apiKey: string,
  channelIds: string[]
): Promise<Map<string, ChannelDetails>> {
  const results = new Map<string, ChannelDetails>();

  // Batch in groups of 50
  for (let i = 0; i < channelIds.length; i += MAX_BATCH_SIZE) {
    const batch = channelIds.slice(i, i + MAX_BATCH_SIZE);
    const params = new URLSearchParams({
      key: apiKey,
      part: "snippet,statistics",
      id: batch.join(","),
    });

    const url = `${YT_API_BASE}/channels?${params}`;
    const response = await fetchWithRetry(url);

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`YouTube channels API error (${response.status}): ${text.slice(0, 200)}`);
    }

    const data = await response.json();

    for (const item of data.items || []) {
      const channelId = item.id;
      const title = item.snippet?.title || "";
      const publishedAt = item.snippet?.publishedAt || "";
      const videoCount = parseInt(item.statistics?.videoCount || "0", 10);

      if (channelId) {
        results.set(channelId, {
          channelId,
          title,
          publishedAt,
          videoCount,
        });
      }
    }
  }

  return results;
}

// ============================================================================
// Main Logic
// ============================================================================

function calculateAgeDays(publishedAt: string): number {
  const created = new Date(publishedAt);
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function generateCSV(channels: QualifiedChannel[]): string {
  const headers = [
    "channelId",
    "channelTitle",
    "channelUrl",
    "channelCreatedAt",
    "channelAgeDays",
    "channelVideoCount",
    "breakoutVideoId",
    "breakoutVideoUrl",
    "breakoutTitle",
    "breakoutPublishedAt",
    "breakoutViews",
    "queryMatched",
  ];

  const rows = [headers.join(",")];

  for (const ch of channels) {
    rows.push(
      [
        ch.channelId,
        escapeCSV(ch.channelTitle),
        ch.channelUrl,
        ch.channelCreatedAt,
        String(ch.channelAgeDays),
        String(ch.channelVideoCount),
        ch.breakoutVideoId,
        ch.breakoutVideoUrl,
        escapeCSV(ch.breakoutTitle),
        ch.breakoutPublishedAt,
        String(ch.breakoutViews),
        escapeCSV(ch.queryMatched),
      ].join(",")
    );
  }

  return rows.join("\n");
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printHelp();
    process.exit(0);
  }

  if (args.selfTest) {
    runSelfTests();
    process.exit(0);
  }

  const apiKey = process.env.YT_API_KEY;
  if (!apiKey) {
    console.error("Error: YT_API_KEY environment variable is required");
    process.exit(1);
  }

  try {
    validateArgs(args);
  } catch (err) {
    console.error(`Error: ${err instanceof Error ? err.message : err}`);
    process.exit(1);
  }

  console.log("=== Find New Short Channels ===");
  console.log(`Days: ${args.days}`);
  console.log(`Max channel videos: ${args.maxChannelVideos}`);
  console.log(`Min views: ${args.minViews.toLocaleString()}`);
  console.log(`Region: ${args.region}`);
  console.log(`Pages per query: ${args.pagesPerQuery}`);
  console.log(`Max queries: ${args.maxQueries}`);
  console.log(`Use trends: ${args.useTrends}`);
  console.log(`Output: ${args.out}`);
  console.log("");

  // Determine search queries
  let queries = [...args.queries];

  if (args.useTrends && queries.length === 0) {
    console.log(`Fetching trending keywords for ${args.trendsGeo}...`);
    queries = await fetchTrendingKeywords(args.trendsGeo, args.maxQueries);
    console.log(`  Found ${queries.length} keywords`);
  }

  if (queries.length === 0) {
    console.error("Error: No search queries available. Provide --q or use --useTrends=true");
    process.exit(1);
  }

  queries = queries.slice(0, args.maxQueries);
  console.log(`Running ${queries.length} queries: ${queries.slice(0, 5).join(", ")}${queries.length > 5 ? "..." : ""}`);
  console.log("");

  // Calculate publishedAfter date
  const publishedAfter = new Date();
  publishedAfter.setDate(publishedAfter.getDate() - args.days);
  const publishedAfterISO = publishedAfter.toISOString();

  // Collect video IDs from search
  const videoToQuery = new Map<string, string>();
  let totalSearches = 0;

  for (const query of queries) {
    console.log(`Searching: "${query}"`);
    let pageToken: string | undefined;

    for (let page = 0; page < args.pagesPerQuery; page++) {
      try {
        const result = await searchVideos(
          apiKey,
          query,
          publishedAfterISO,
          args.region,
          50,
          pageToken
        );

        // Track searches for debugging (unused but kept for potential logging)
        void totalSearches++;

        for (const videoId of result.videoIds) {
          if (!videoToQuery.has(videoId)) {
            videoToQuery.set(videoId, query);
          }
        }

        console.log(`  Page ${page + 1}: ${result.videoIds.length} videos`);

        pageToken = result.nextPageToken;
        if (!pageToken) {break;}
      } catch (err) {
        console.error(`  Error: ${err instanceof Error ? err.message : err}`);
        break;
      }
    }
  }

  console.log("");
  console.log(`Total unique videos found: ${videoToQuery.size}`);

  if (videoToQuery.size === 0) {
    console.log("No videos found. Try different queries or region.");
    await writeCSV(args.out, []);
    printSummary({
      totalQueries: queries.length,
      videosScanned: 0,
      shortsQualified: 0,
      channelsQualified: 0,
      csvPath: args.out,
    });
    return;
  }

  // Get video details
  console.log("Fetching video details...");
  const videoIds = Array.from(videoToQuery.keys());
  const videoDetails = await getVideoDetails(apiKey, videoIds);
  console.log(`  Retrieved details for ${videoDetails.size} videos`);

  // Filter to actual Shorts (<=60s) with minimum views
  const qualifyingVideos: VideoDetails[] = [];
  const channelIdsSet = new Set<string>();

  for (const [videoId, details] of videoDetails) {
    if (details.durationSeconds <= 60 && details.viewCount >= args.minViews) {
      qualifyingVideos.push({
        videoId,
        ...details,
        query: videoToQuery.get(videoId) || "",
      });
      channelIdsSet.add(details.channelId);
    }
  }

  console.log(`  Shorts <=60s with >=${args.minViews.toLocaleString()} views: ${qualifyingVideos.length}`);
  console.log(`  Unique channels: ${channelIdsSet.size}`);

  if (channelIdsSet.size === 0) {
    console.log("No qualifying Shorts found.");
    await writeCSV(args.out, []);
    printSummary({
      totalQueries: queries.length,
      videosScanned: videoDetails.size,
      shortsQualified: 0,
      channelsQualified: 0,
      csvPath: args.out,
    });
    return;
  }

  // Get channel details
  console.log("Fetching channel details...");
  const channelIds = Array.from(channelIdsSet);
  const channelDetails = await getChannelDetails(apiKey, channelIds);
  console.log(`  Retrieved details for ${channelDetails.size} channels`);

  // Filter channels by age and video count
  const qualifiedChannels: QualifiedChannel[] = [];
  const seenChannels = new Set<string>();

  // Sort videos by views descending to pick best breakout per channel
  qualifyingVideos.sort((a, b) => b.viewCount - a.viewCount);

  for (const video of qualifyingVideos) {
    if (seenChannels.has(video.channelId)) {continue;}

    const channel = channelDetails.get(video.channelId);
    if (!channel) {continue;}

    const channelAgeDays = calculateAgeDays(channel.publishedAt);

    if (channelAgeDays <= args.days && channel.videoCount < args.maxChannelVideos) {
      seenChannels.add(video.channelId);
      qualifiedChannels.push({
        channelId: channel.channelId,
        channelTitle: channel.title,
        channelUrl: `https://www.youtube.com/channel/${channel.channelId}`,
        channelCreatedAt: channel.publishedAt,
        channelAgeDays,
        channelVideoCount: channel.videoCount,
        breakoutVideoId: video.videoId,
        breakoutVideoUrl: `https://www.youtube.com/shorts/${video.videoId}`,
        breakoutTitle: video.title,
        breakoutPublishedAt: video.publishedAt,
        breakoutViews: video.viewCount,
        queryMatched: video.query,
      });
    }
  }

  console.log(`  Channels meeting all criteria: ${qualifiedChannels.length}`);
  console.log("");

  // Sort by views descending
  qualifiedChannels.sort((a, b) => b.breakoutViews - a.breakoutViews);

  // Write CSV
  await writeCSV(args.out, qualifiedChannels);

  // Print summary
  printSummary({
    totalQueries: queries.length,
    videosScanned: videoDetails.size,
    shortsQualified: qualifyingVideos.length,
    channelsQualified: qualifiedChannels.length,
    csvPath: args.out,
  });

  // Print top results
  if (qualifiedChannels.length > 0) {
    console.log("\n--- Top Results ---");
    for (const ch of qualifiedChannels.slice(0, 5)) {
      console.log(`${ch.channelTitle} (${ch.channelAgeDays}d old, ${ch.channelVideoCount} videos)`);
      console.log(`  Breakout: ${ch.breakoutViews.toLocaleString()} views - ${ch.breakoutTitle.slice(0, 50)}`);
      console.log(`  ${ch.breakoutVideoUrl}`);
    }
  }
}

async function writeCSV(path: string, channels: QualifiedChannel[]): Promise<void> {
  const csv = generateCSV(channels);
  await Bun.write(path, csv);
  console.log(`CSV written to: ${path}`);
}

function printSummary(summary: Summary): void {
  console.log("\n=== Summary ===");
  console.log(`Total queries: ${summary.totalQueries}`);
  console.log(`Videos scanned: ${summary.videosScanned}`);
  console.log(`Shorts qualified: ${summary.shortsQualified}`);
  console.log(`Channels qualified: ${summary.channelsQualified}`);
  console.log(`CSV path: ${summary.csvPath}`);
}

// ============================================================================
// Self Tests
// ============================================================================

function runSelfTests(): void {
  console.log("Running self tests...\n");

  let passed = 0;
  let failed = 0;

  function test(name: string, fn: () => boolean): void {
    try {
      if (fn()) {
        console.log(`✓ ${name}`);
        passed++;
      } else {
        console.log(`✗ ${name}`);
        failed++;
      }
    } catch (err) {
      console.log(`✗ ${name}: ${err}`);
      failed++;
    }
  }

  // Duration parsing tests
  test("parseISO8601Duration: PT30S = 30", () => parseISO8601Duration("PT30S") === 30);
  test("parseISO8601Duration: PT1M = 60", () => parseISO8601Duration("PT1M") === 60);
  test("parseISO8601Duration: PT1M30S = 90", () => parseISO8601Duration("PT1M30S") === 90);
  test("parseISO8601Duration: PT2M5S = 125", () => parseISO8601Duration("PT2M5S") === 125);
  test("parseISO8601Duration: PT1H = 3600", () => parseISO8601Duration("PT1H") === 3600);
  test("parseISO8601Duration: PT1H30M = 5400", () => parseISO8601Duration("PT1H30M") === 5400);
  test("parseISO8601Duration: PT1H2M3S = 3723", () => parseISO8601Duration("PT1H2M3S") === 3723);
  test("parseISO8601Duration: PT59S = 59", () => parseISO8601Duration("PT59S") === 59);
  test("parseISO8601Duration: PT60S = 60", () => parseISO8601Duration("PT60S") === 60);
  test("parseISO8601Duration: PT61S = 61", () => parseISO8601Duration("PT61S") === 61);
  test("parseISO8601Duration: empty string = 0", () => parseISO8601Duration("") === 0);
  test("parseISO8601Duration: invalid = 0", () => parseISO8601Duration("invalid") === 0);
  test("parseISO8601Duration: null-ish = 0", () => parseISO8601Duration(null as unknown as string) === 0);
  test("parseISO8601Duration: PT = 0", () => parseISO8601Duration("PT") === 0);

  // Age calculation test
  test("calculateAgeDays: today = 0", () => {
    const today = new Date().toISOString();
    return calculateAgeDays(today) === 0;
  });

  test("calculateAgeDays: 5 days ago", () => {
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    return calculateAgeDays(fiveDaysAgo.toISOString()) === 5;
  });

  // CSV escaping tests
  test("escapeCSV: simple", () => escapeCSV("hello") === "hello");
  test("escapeCSV: with comma", () => escapeCSV("hello,world") === '"hello,world"');
  test("escapeCSV: with quotes", () => escapeCSV('say "hi"') === '"say ""hi"""');
  test("escapeCSV: with newline", () => escapeCSV("line1\nline2") === '"line1\nline2"');

  // Argument parsing tests
  test("parseArgs: defaults", () => {
    const args = parseArgs([]);
    return args.days === 15 && args.minViews === 300000 && args.useTrends === true;
  });

  test("parseArgs: custom values", () => {
    const args = parseArgs(["--days=30", "--minViews=100000", "--q=test", "--q=test2"]);
    return args.days === 30 && args.minViews === 100000 && args.queries.length === 2;
  });

  console.log(`\n${passed} passed, ${failed} failed`);

  if (failed > 0) {
    process.exit(1);
  }
}

// ============================================================================
// Entry Point
// ============================================================================

main().catch((err) => {
  console.error("Fatal error:", err instanceof Error ? err.message : err);
  process.exit(1);
});
