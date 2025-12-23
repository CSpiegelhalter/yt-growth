// lib/youtube-mock.ts
/**
 * YouTube API mock layer.
 *
 * Goal: return objects shaped like the REAL YouTube APIs (Data API v3 + Analytics v2)
 * so our app can run normal codepaths without consuming quota.
 *
 * Enable with: YT_MOCK_MODE=1
 */

type AnyJson = any;

function randHash(seed: string): number {
  // Simple deterministic hash for stable mock outputs.
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pick<T>(arr: T[], seed: string): T {
  return arr[randHash(seed) % arr.length]!;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function isoDaysAgo(daysAgo: number): string {
  return new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
}

function makeDurationSec(seed: string): number {
  const h = randHash(seed);
  // 2m-22m
  return 120 + (h % (20 * 60));
}

function toIsoDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  let out = "PT";
  if (h) out += `${h}H`;
  if (m) out += `${m}M`;
  if (s || (!h && !m)) out += `${s}S`;
  return out;
}

type MockVideo = {
  id: string;
  channelId: string;
  channelTitle: string;
  title: string;
  description: string;
  publishedAt: string;
  tags: string[];
  categoryId: string;
  durationSec: number;
  thumbnails: {
    default: { url: string };
    medium: { url: string };
    high: { url: string };
    maxres: { url: string };
  };
  statistics: {
    viewCount: string;
    likeCount: string;
    commentCount: string;
  };
};

type MockChannel = {
  id: string;
  title: string;
  description: string;
  thumbnails: {
    default: { url: string };
    medium: { url: string };
    high: { url: string };
  };
  uploadsPlaylistId: string;
};

type MockDb = {
  channels: MockChannel[];
  videosById: Map<string, MockVideo>;
  videosByChannel: Map<string, MockVideo[]>;
  channelById: Map<string, MockChannel>;
  channelIdByUploadsPlaylistId: Map<string, string>;
};

let MOCK_DB: MockDb | null = null;

function stableVideoId(channelId: string, idx: number): string {
  // 11-ish chars (similar to YouTube IDs), deterministic.
  const h = randHash(`${channelId}-${idx}`);
  const base = h.toString(36).padStart(10, "0").slice(0, 10);
  return `m${base}`; // 11 chars
}

function ensureDb(): MockDb {
  if (MOCK_DB) return MOCK_DB;

  const topics = [
    "YouTube growth",
    "thumbnail teardown",
    "editing workflow",
    "AI tools",
    "shorts strategy",
    "content ideation",
    "retention hacks",
    "script writing",
    "creator business",
    "camera setup",
  ];

  const tones = [
    "practical walkthrough",
    "myth-busting breakdown",
    "case study",
    "step-by-step tutorial",
    "experiment recap",
    "deep dive",
  ];

  const channels: MockChannel[] = Array.from({ length: 30 }).map((_, i) => {
    const id = `mock-channel-${String(i + 1).padStart(2, "0")}`;
    const title = `Mock Creator ${i + 1}`;
    const uploads = `UU_${id}`;
    return {
      id,
      title,
      description: `Channel about ${pick(topics, id)}. ${pick(
        tones,
        id
      )} content for creators.`,
      thumbnails: {
        default: { url: `https://yt3.ggpht.com/${id}/default.jpg` },
        medium: { url: `https://yt3.ggpht.com/${id}/medium.jpg` },
        high: { url: `https://yt3.ggpht.com/${id}/high.jpg` },
      },
      uploadsPlaylistId: uploads,
    };
  });

  const videosById = new Map<string, MockVideo>();
  const videosByChannel = new Map<string, MockVideo[]>();

  const tagPool = [
    "youtube growth",
    "creator tips",
    "content strategy",
    "thumbnail",
    "titles",
    "retention",
    "editing",
    "analytics",
    "shorts",
    "ai tools",
    "script",
  ];

  for (const ch of channels) {
    const vids: MockVideo[] = [];
    for (let i = 0; i < 120; i++) {
      const vid = `${ch.id}-vid-${String(i + 1).padStart(3, "0")}`;
      // IMPORTANT: topic must be derived from videoId so it is consistent across workers
      // (e.g. playlistItems snippet title and videos.list detail must match).
      const topic = pick(topics, vid);
      const tone = pick(tones, `${vid}-tone`);
      const durationSec = makeDurationSec(vid);
      const views = 10_000 + (randHash(`${vid}-views`) % 2_000_000);
      const likes = Math.floor(
        views * (0.02 + (randHash(`${vid}-likes`) % 20) / 1000)
      );
      const comments = Math.floor(
        views * (0.002 + (randHash(`${vid}-com`) % 8) / 1000)
      );

      const tags = Array.from({ length: 6 }).map((__, t) =>
        pick(tagPool, `${vid}-tag-${t}`)
      );

      const publishedAt = isoDaysAgo(i); // newest = i=0
      const version = randHash(`${vid}-ver`) % 2 === 0 ? "2025" : "Updated";
      const title = `${topic}: ${tone} (${version})`;
      const description =
        `In this video we cover ${topic} with a ${tone}.\n\n` +
        `What you’ll learn:\n` +
        `- The core idea\n- Common mistakes\n- A repeatable checklist\n\n` +
        `Tags: ${tags.join(", ")}\n` +
        `#${topic.replace(/\s+/g, "")}`;

      const thumbs = {
        default: { url: `https://i.ytimg.com/vi/${vid}/default.jpg` },
        medium: { url: `https://i.ytimg.com/vi/${vid}/mqdefault.jpg` },
        high: { url: `https://i.ytimg.com/vi/${vid}/hqdefault.jpg` },
        maxres: { url: `https://i.ytimg.com/vi/${vid}/maxresdefault.jpg` },
      };

      const v: MockVideo = {
        id: vid,
        channelId: ch.id,
        channelTitle: ch.title,
        title,
        description,
        publishedAt,
        tags,
        categoryId: "27", // Education
        durationSec,
        thumbnails: thumbs,
        statistics: {
          viewCount: String(views),
          likeCount: String(likes),
          commentCount: String(comments),
        },
      };
      vids.push(v);
      videosById.set(vid, v);
    }
    videosByChannel.set(ch.id, vids);
  }

  const channelById = new Map(channels.map((c) => [c.id, c]));
  const channelIdByUploadsPlaylistId = new Map(
    channels.map((c) => [c.uploadsPlaylistId, c.id])
  );

  MOCK_DB = {
    channels,
    videosById,
    videosByChannel,
    channelById,
    channelIdByUploadsPlaylistId,
  };
  return MOCK_DB;
}

function ensureChannel(db: MockDb, id: string): MockChannel {
  const existing = db.channelById.get(id);
  if (existing) return existing;

  const topics = [
    "YouTube growth",
    "thumbnail teardown",
    "editing workflow",
    "AI tools",
    "shorts strategy",
    "content ideation",
    "retention hacks",
    "script writing",
    "creator business",
    "camera setup",
  ];
  const tones = [
    "practical walkthrough",
    "myth-busting breakdown",
    "case study",
    "step-by-step tutorial",
    "experiment recap",
    "deep dive",
  ];
  const tagPool = [
    "youtube growth",
    "creator tips",
    "content strategy",
    "thumbnail",
    "titles",
    "retention",
    "editing",
    "analytics",
    "shorts",
    "ai tools",
    "script",
  ];

  const title = id.startsWith("UC")
    ? `Mock ${id.slice(0, 8)}`
    : `Mock Channel ${id}`;
  const uploadsPlaylistId = `UU_${id}`;

  const ch: MockChannel = {
    id,
    title,
    description: `Auto-generated mock channel for ${id}. Focus: ${pick(
      topics,
      id
    )}.`,
    thumbnails: {
      default: { url: `https://yt3.ggpht.com/${id}/default.jpg` },
      medium: { url: `https://yt3.ggpht.com/${id}/medium.jpg` },
      high: { url: `https://yt3.ggpht.com/${id}/high.jpg` },
    },
    uploadsPlaylistId,
  };

  // Generate a realistic set of uploads for this arbitrary channel.
  const vids: MockVideo[] = [];
  for (let i = 0; i < 120; i++) {
    const vid = stableVideoId(id, i);
    // IMPORTANT: derive topic from videoId for cross-worker consistency
    const topic = pick(topics, vid);
    const tone = pick(tones, `${vid}-tone`);
    const version = randHash(`${vid}-ver`) % 2 === 0 ? "2025" : "Updated";
    const durationSec = makeDurationSec(vid);
    const views = 10_000 + (randHash(`${vid}-views`) % 2_000_000);
    const likes = Math.floor(
      views * (0.02 + (randHash(`${vid}-likes`) % 20) / 1000)
    );
    const comments = Math.floor(
      views * (0.002 + (randHash(`${vid}-com`) % 8) / 1000)
    );
    const tags = Array.from({ length: 6 }).map((__, t) =>
      pick(tagPool, `${vid}-tag-${t}`)
    );
    const publishedAt = isoDaysAgo(i);

    const thumbs = {
      default: { url: `https://i.ytimg.com/vi/${vid}/default.jpg` },
      medium: { url: `https://i.ytimg.com/vi/${vid}/mqdefault.jpg` },
      high: { url: `https://i.ytimg.com/vi/${vid}/hqdefault.jpg` },
      maxres: { url: `https://i.ytimg.com/vi/${vid}/maxresdefault.jpg` },
    };

    const v: MockVideo = {
      id: vid,
      channelId: ch.id,
      channelTitle: ch.title,
      title: `${topic}: ${tone} (${version})`,
      description:
        `In this video we cover ${topic} with a ${tone}.\n\n` +
        `What you’ll learn:\n- The core idea\n- Common mistakes\n- A repeatable checklist\n\n` +
        `Tags: ${tags.join(", ")}\n`,
      publishedAt,
      tags,
      categoryId: "27",
      durationSec,
      thumbnails: thumbs,
      statistics: {
        viewCount: String(views),
        likeCount: String(likes),
        commentCount: String(comments),
      },
    };
    vids.push(v);
    db.videosById.set(vid, v);
  }

  db.channels.push(ch);
  db.channelById.set(ch.id, ch);
  db.channelIdByUploadsPlaylistId.set(ch.uploadsPlaylistId, ch.id);
  db.videosByChannel.set(ch.id, vids);

  return ch;
}

function ensureVideo(db: MockDb, videoId: string): MockVideo {
  const existing = db.videosById.get(videoId);
  if (existing) return existing;

  const topics = [
    "YouTube growth",
    "thumbnail teardown",
    "editing workflow",
    "AI tools",
    "shorts strategy",
    "content ideation",
    "retention hacks",
    "script writing",
    "creator business",
    "camera setup",
  ];
  const tones = [
    "practical walkthrough",
    "myth-busting breakdown",
    "case study",
    "step-by-step tutorial",
    "experiment recap",
    "deep dive",
  ];
  const tagPool = [
    "youtube growth",
    "creator tips",
    "content strategy",
    "thumbnail",
    "titles",
    "retention",
    "editing",
    "analytics",
    "shorts",
    "ai tools",
    "script",
  ];

  // Derive a stable channel for the video so metadata is consistent.
  const derivedChannelId = `UC_${randHash(`${videoId}-ch`)
    .toString(36)
    .slice(0, 16)}`;
  const ch = ensureChannel(db, derivedChannelId);

  const durationSec = makeDurationSec(videoId);
  const views = 10_000 + (randHash(`${videoId}-views`) % 2_500_000);
  const likes = Math.floor(
    views * (0.02 + (randHash(`${videoId}-likes`) % 20) / 1000)
  );
  const comments = Math.floor(
    views * (0.002 + (randHash(`${videoId}-com`) % 8) / 1000)
  );
  const tags = Array.from({ length: 6 }).map((__, t) =>
    pick(tagPool, `${videoId}-tag-${t}`)
  );

  const v: MockVideo = {
    id: videoId,
    channelId: ch.id,
    channelTitle: ch.title,
    title: `${pick(topics, videoId)}: ${pick(tones, `${videoId}-tone`)} (${
      randHash(`${videoId}-ver`) % 2 === 0 ? "2025" : "Updated"
    })`,
    description:
      `Auto-generated mock video for ${videoId}.\n\n` +
      `Topic: ${pick(topics, videoId)}\nFormat: ${pick(
        tones,
        `${videoId}-tone`
      )}\n\n` +
      `Tags: ${tags.join(", ")}\n`,
    publishedAt: isoDaysAgo(randHash(`${videoId}-age`) % 120),
    tags,
    categoryId: "27",
    durationSec,
    thumbnails: {
      default: { url: `https://i.ytimg.com/vi/${videoId}/default.jpg` },
      medium: { url: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg` },
      high: { url: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` },
      maxres: { url: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg` },
    },
    statistics: {
      viewCount: String(views),
      likeCount: String(likes),
      commentCount: String(comments),
    },
  };

  db.videosById.set(videoId, v);
  // Add to channel list for completeness (newest first).
  const list = db.videosByChannel.get(ch.id) ?? [];
  list.unshift(v);
  db.videosByChannel.set(ch.id, list);
  return v;
}

function parseCommaList(s: string | null): string[] {
  return (s ?? "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

function pageTokenToOffset(token: string | null): number {
  if (!token) return 0;
  const m = /^mock-page-(\d+)$/.exec(token);
  return m ? parseInt(m[1]!, 10) : 0;
}

function offsetToPageToken(offset: number): string {
  return `mock-page-${offset}`;
}

function makeYouTubeErrorQuotaExceeded(): AnyJson {
  return {
    error: {
      code: 403,
      message:
        'The request cannot be completed because you have exceeded your <a href="/youtube/v3/getting-started#quota">quota</a>.',
      errors: [
        {
          message:
            'The request cannot be completed because you have exceeded your <a href="/youtube/v3/getting-started#quota">quota</a>.',
          domain: "youtube.quota",
          reason: "quotaExceeded",
        },
      ],
    },
  };
}

export function mockYouTubeApiResponse(urlStr: string): AnyJson {
  const db = ensureDb();
  const url = new URL(urlStr);
  const host = url.host;
  const pathname = url.pathname;

  // Optional: allow simulating quotaExceeded responses
  if (process.env.YT_MOCK_QUOTA_EXCEEDED === "1") {
    // Return error-shaped body (callers may have logic expecting ok responses though)
    return makeYouTubeErrorQuotaExceeded();
  }

  // Data API v3
  if (host.includes("googleapis.com") && pathname.includes("/youtube/v3/")) {
    const p = pathname.split("/youtube/v3/")[1] ?? "";
    const resource = p.split("/")[0] ?? "";

    if (resource === "channels") {
      const ids = parseCommaList(url.searchParams.get("id"));
      const items = ids
        .map((id) => ensureChannel(db, id))
        .map((ch) => ({
          kind: "youtube#channel",
          etag: `etag-${ch!.id}`,
          id: ch!.id,
          snippet: {
            title: ch!.title,
            description: ch!.description,
            thumbnails: ch!.thumbnails,
          },
          contentDetails: {
            relatedPlaylists: {
              uploads: ch!.uploadsPlaylistId,
            },
          },
        }));

      return {
        kind: "youtube#channelListResponse",
        etag: "etag-channels",
        pageInfo: { totalResults: items.length, resultsPerPage: items.length },
        items,
      };
    }

    if (resource === "playlistItems") {
      const playlistId = url.searchParams.get("playlistId") ?? "";
      const maxResults = clamp(
        parseInt(url.searchParams.get("maxResults") ?? "5", 10),
        1,
        50
      );
      const offset = pageTokenToOffset(url.searchParams.get("pageToken"));
      let channelId = db.channelIdByUploadsPlaylistId.get(playlistId);
      if (!channelId && playlistId.startsWith("UU_")) {
        const derivedChannelId = playlistId.slice(3);
        ensureChannel(db, derivedChannelId);
        channelId = db.channelIdByUploadsPlaylistId.get(playlistId);
      }
      const vids = channelId ? db.videosByChannel.get(channelId) ?? [] : [];

      const page = vids.slice(offset, offset + maxResults);
      const items = page.map((v) => ({
        kind: "youtube#playlistItem",
        etag: `etag-${v.id}`,
        id: `PLI-${v.id}`,
        snippet: {
          publishedAt: v.publishedAt,
          channelId: v.channelId,
          title: v.title,
          description: v.description,
          thumbnails: v.thumbnails,
          channelTitle: v.channelTitle,
        },
        contentDetails: {
          videoId: v.id,
        },
      }));

      const nextOffset = offset + maxResults;
      const nextPageToken =
        nextOffset < vids.length ? offsetToPageToken(nextOffset) : undefined;

      return {
        kind: "youtube#playlistItemListResponse",
        etag: "etag-playlistItems",
        nextPageToken,
        pageInfo: {
          totalResults: vids.length,
          resultsPerPage: maxResults,
        },
        items,
      };
    }

    if (resource === "videos") {
      const ids = parseCommaList(url.searchParams.get("id"));
      const part = url.searchParams.get("part") ?? "";
      const wantSnippet = part.includes("snippet");
      const wantContent = part.includes("contentDetails");
      const wantStats = part.includes("statistics");

      const items = ids
        .map((id) => ensureVideo(db, id))
        .map((v) => {
          const out: AnyJson = {
            kind: "youtube#video",
            etag: `etag-${v!.id}`,
            id: v!.id,
          };
          if (wantSnippet) {
            out.snippet = {
              title: v!.title,
              description: v!.description,
              publishedAt: v!.publishedAt,
              channelId: v!.channelId,
              channelTitle: v!.channelTitle,
              tags: v!.tags,
              categoryId: v!.categoryId,
              thumbnails: v!.thumbnails,
            };
          }
          if (wantContent) {
            out.contentDetails = {
              duration: toIsoDuration(v!.durationSec),
            };
          }
          if (wantStats) {
            out.statistics = v!.statistics;
          }
          return out;
        });

      return {
        kind: "youtube#videoListResponse",
        etag: "etag-videos",
        pageInfo: { totalResults: items.length, resultsPerPage: items.length },
        items,
      };
    }

    if (resource === "search") {
      const type = url.searchParams.get("type") ?? "video";
      const maxResults = clamp(
        parseInt(url.searchParams.get("maxResults") ?? "5", 10),
        1,
        50
      );
      const offset = pageTokenToOffset(url.searchParams.get("pageToken"));
      const q = (url.searchParams.get("q") ?? "").toLowerCase();
      const channelId = url.searchParams.get("channelId");
      const publishedAfter = url.searchParams.get("publishedAfter");
      const publishedAfterMs = publishedAfter
        ? new Date(publishedAfter).getTime()
        : 0;

      if (type === "channel") {
        let filtered = db.channels.filter((c) =>
          q ? `${c.title} ${c.description}`.toLowerCase().includes(q) : true
        );
        // Behave more like real YouTube search: if exact substring match yields nothing,
        // still return something relevant-ish (rather than empty).
        if (filtered.length === 0) filtered = db.channels;
        const page = filtered.slice(offset, offset + maxResults);
        const items = page.map((c) => ({
          kind: "youtube#searchResult",
          etag: `etag-${c.id}`,
          id: { kind: "youtube#channel", channelId: c.id },
          snippet: {
            title: c.title,
            description: c.description,
            thumbnails: c.thumbnails,
          },
        }));
        const nextOffset = offset + maxResults;
        const nextPageToken =
          nextOffset < filtered.length
            ? offsetToPageToken(nextOffset)
            : undefined;
        return {
          kind: "youtube#searchListResponse",
          etag: "etag-search-channels",
          nextPageToken,
          pageInfo: {
            totalResults: filtered.length,
            resultsPerPage: maxResults,
          },
          items,
        };
      }

      // type=video
      const base = channelId
        ? (() => {
            if (!db.videosByChannel.has(channelId))
              ensureChannel(db, channelId);
            return db.videosByChannel.get(channelId)!;
          })()
        : [...db.videosById.values()];
      const filtered = base.filter((v) => {
        if (
          publishedAfterMs &&
          new Date(v.publishedAt).getTime() < publishedAfterMs
        ) {
          return false;
        }
        if (!q) return true;
        const hay = `${v.title} ${v.description} ${v.tags.join(
          " "
        )}`.toLowerCase();
        return hay.includes(q);
      });

      // In real API, `order=viewCount` sorts by views. We’ll sort that way for realism.
      filtered.sort(
        (a, b) =>
          parseInt(b.statistics.viewCount, 10) -
          parseInt(a.statistics.viewCount, 10)
      );

      const page = filtered.slice(offset, offset + maxResults);
      const items = page.map((v) => ({
        kind: "youtube#searchResult",
        etag: `etag-${v.id}`,
        id: { kind: "youtube#video", videoId: v.id },
        snippet: {
          title: v.title,
          description: v.description,
          publishedAt: v.publishedAt,
          channelId: v.channelId,
          channelTitle: v.channelTitle,
          thumbnails: v.thumbnails,
        },
      }));

      const nextOffset = offset + maxResults;
      const nextPageToken =
        nextOffset < filtered.length
          ? offsetToPageToken(nextOffset)
          : undefined;

      return {
        kind: "youtube#searchListResponse",
        etag: "etag-search-videos",
        nextPageToken,
        pageInfo: { totalResults: filtered.length, resultsPerPage: maxResults },
        items,
      };
    }

    if (resource === "commentThreads") {
      const videoId = url.searchParams.get("videoId") ?? "unknown";
      const maxResults = clamp(
        parseInt(url.searchParams.get("maxResults") ?? "20", 10),
        1,
        100
      );

      // Realistic comment templates that mimic actual YouTube comments
      const commentTemplates = [
        // Positive/appreciation
        "This completely changed my perspective on this topic. Thank you for breaking it down so clearly!",
        "I've been doing this wrong for years. Wish I found this video sooner.",
        "Finally someone explains this in a way that actually makes sense. Subscribed!",
        "The part about {topic} at {time} was exactly what I needed to hear.",
        "This is genuinely one of the best videos I've watched on this subject. No fluff, just value.",
        "I took notes throughout this entire video. So much actionable advice.",
        "Came here from your other video and this channel is a goldmine.",
        "I've watched a lot of videos on this topic but yours is by far the most practical.",
        "Your editing and pacing is perfect. Kept me engaged the whole time.",
        "This deserves way more views. The algorithm needs to push this!",
        // Questions/requests
        "Can you do a follow-up video on how to apply this to {topic}?",
        "Would love to see a deep dive into the {topic} you mentioned at {time}.",
        "What software/tools do you use to create these videos? The quality is amazing.",
        "How long did it take you to learn all of this? Any tips for beginners?",
        "Do you have a course or community where we can learn more?",
        // Sharing results
        "I tried this and it actually worked! My {metric} increased by {number}%.",
        "Been implementing your advice for 2 weeks now and already seeing results.",
        "After watching this 3 times, I finally understand why my approach wasn't working.",
        "Applied your framework and got {outcome}. Can't thank you enough!",
        // Discussion
        "I'd add that {insight} is also really important for this.",
        "Great video! Though I'd slightly disagree on the point about {topic}.",
        "This reminded me of what {person} said about {topic}. Similar principles.",
        "Interesting take. In my experience, {alternative} also works well.",
        // Timestamps
        "{time} - This part was gold! Rewatched it 3 times.",
        "For anyone wondering, the key insight is at {time}.",
        "Skip to {time} if you want the main strategy.",
        // Emotional
        "I needed to hear this today. Thank you ❤️",
        "This video came at the perfect time for me.",
        "You have no idea how much this helped me. Seriously.",
        "Crying a little because this is exactly what I've been struggling with.",
      ];

      const authorNames = [
        "Alex Chen",
        "Sarah Mitchell",
        "Mike Johnson",
        "Emma Davis",
        "Chris Taylor",
        "Jordan Lee",
        "Sam Parker",
        "Morgan Williams",
        "Casey Brown",
        "Riley Anderson",
        "Drew Wilson",
        "Jamie Martinez",
        "Pat Thompson",
        "Quinn Roberts",
        "Avery Garcia",
        "Blake Johnson",
        "Cameron White",
        "Dana Harris",
        "Elliott Moore",
        "Frankie Clark",
      ];

      const topics = [
        "retention",
        "growth",
        "analytics",
        "thumbnails",
        "titles",
        "hooks",
        "editing",
        "scripting",
        "niching down",
        "monetization",
      ];
      const times = [
        "2:34",
        "5:12",
        "8:45",
        "3:21",
        "6:08",
        "10:15",
        "4:30",
        "7:22",
        "1:45",
        "9:33",
      ];
      const metrics = [
        "views",
        "engagement",
        "CTR",
        "watch time",
        "subscribers",
      ];
      const numbers = ["20", "35", "50", "75", "100", "150", "200"];
      const outcomes = [
        "my first viral video",
        "10K subscribers",
        "partner program acceptance",
        "my best performing video",
      ];
      const persons = [
        "MrBeast",
        "Paddy Galloway",
        "Colin and Samir",
        "Think Media",
      ];

      // Generate deterministic but realistic comments
      const items = Array.from({ length: maxResults }).map((_, i) => {
        const seed = `${videoId}-c-${i}`;
        const likeCount = Math.floor(
          Math.pow(1.5, randHash(`${seed}-likes`) % 10) *
            ((randHash(`${seed}-mult`) % 20) + 1)
        );

        // Pick a template and fill in placeholders
        let text = commentTemplates[randHash(seed) % commentTemplates.length];
        text = text.replace(
          "{topic}",
          topics[randHash(`${seed}-topic`) % topics.length]
        );
        text = text.replace(
          "{time}",
          times[randHash(`${seed}-time`) % times.length]
        );
        text = text.replace(
          "{metric}",
          metrics[randHash(`${seed}-metric`) % metrics.length]
        );
        text = text.replace(
          "{number}",
          numbers[randHash(`${seed}-number`) % numbers.length]
        );
        text = text.replace(
          "{outcome}",
          outcomes[randHash(`${seed}-outcome`) % outcomes.length]
        );
        text = text.replace(
          "{person}",
          persons[randHash(`${seed}-person`) % persons.length]
        );
        text = text.replace(
          "{insight}",
          topics[(randHash(`${seed}-insight`) + 3) % topics.length]
        );
        text = text.replace(
          "{alternative}",
          topics[(randHash(`${seed}-alt`) + 5) % topics.length]
        );

        const authorName =
          authorNames[randHash(`${seed}-author`) % authorNames.length];

        return {
          kind: "youtube#commentThread",
          etag: `etag-${seed}`,
          id: `CT_${seed}`,
          snippet: {
            topLevelComment: {
              kind: "youtube#comment",
              etag: `etag-${seed}-c`,
              id: `C_${seed}`,
              snippet: {
                authorDisplayName: authorName,
                textDisplay: text,
                likeCount,
                publishedAt: isoDaysAgo((randHash(`${seed}-age`) % 30) + 1),
              },
            },
          },
        };
      });

      return {
        kind: "youtube#commentThreadListResponse",
        etag: "etag-commentThreads",
        pageInfo: { totalResults: 500, resultsPerPage: maxResults },
        items,
      };
    }
  }

  // Analytics API v2
  if (
    host.includes("youtubeanalytics.googleapis.com") &&
    pathname.startsWith("/v2/reports")
  ) {
    const dimensions = url.searchParams.get("dimensions") ?? "";
    const metrics = url.searchParams.get("metrics") ?? "";
    const filters = url.searchParams.get("filters") ?? "";
    const startDate = url.searchParams.get("startDate") ?? "";
    const endDate = url.searchParams.get("endDate") ?? "";

    // Retention curve
    if (
      dimensions.includes("elapsedVideoTimeRatio") &&
      metrics.includes("audienceWatchRatio")
    ) {
      const rows: Array<[number, number]> = [];
      for (let i = 0; i <= 100; i += 2) {
        const ratio = i / 100;
        // smooth-ish curve
        const base = ratio < 0.1 ? 1 - ratio * 2.5 : 0.75 - (ratio - 0.1) * 0.7;
        const jitter = ((randHash(`${filters}-${i}`) % 100) - 50) / 2000;
        const retention = clamp(base + jitter, 0.08, 1);
        rows.push([ratio, retention]);
      }
      return {
        kind: "youtubeAnalytics#resultTable",
        columnHeaders: [
          {
            name: "elapsedVideoTimeRatio",
            columnType: "DIMENSION",
            dataType: "FLOAT",
          },
          {
            name: "audienceWatchRatio",
            columnType: "METRIC",
            dataType: "FLOAT",
          },
        ],
        rows,
      };
    }

    function parseVideoIdsFromFilters(f: string): string[] {
      const m = /^video==(.+)$/.exec(f.trim());
      if (!m) return [];
      return m[1]!
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }

    function metricValue(
      videoId: string,
      metricName: string,
      idx: number
    ): number {
      const n = randHash(`${videoId}-${metricName}-${idx}`);
      const base = 120_000 - idx * 2_000 + (n % 15_000);
      switch (metricName) {
        case "views":
          return clamp(base + (n % 60_000), 0, 10_000_000);
        case "likes":
          return clamp(Math.floor((base + (n % 20_000)) * 0.05), 0, 2_000_000);
        case "dislikes":
          // Dislikes are typically ~2-5% of likes
          return clamp(Math.floor((base + (n % 5_000)) * 0.002), 0, 100_000);
        case "comments":
          return clamp(Math.floor((base + (n % 10_000)) * 0.006), 0, 400_000);
        case "shares":
          return clamp(Math.floor((base + (n % 10_000)) * 0.002), 0, 300_000);
        case "subscribersGained":
          return clamp(Math.floor((base + (n % 10_000)) * 0.003), 0, 300_000);
        case "subscribersLost":
          return clamp(Math.floor((base + (n % 5_000)) * 0.0003), 0, 60_000);
        case "estimatedMinutesWatched":
          return clamp(Math.floor((base + (n % 20_000)) * 0.4), 0, 80_000_000);
        case "averageViewDuration":
          return clamp(90 + (n % 220), 10, 1200);
        case "averageViewPercentage":
          return clamp(25 + (n % 55), 1, 100);
        case "engagedViews":
          return clamp(Math.floor((base + (n % 20_000)) * 0.35), 0, 10_000_000);
        case "redViews":
          // YouTube Premium views typically 5-15% of total views
          return clamp(Math.floor((base + (n % 15_000)) * 0.08), 0, 1_000_000);
        case "videosAddedToPlaylists":
          return clamp(Math.floor((base + (n % 8_000)) * 0.001), 0, 50_000);
        case "videosRemovedFromPlaylists":
          // Removals are typically ~10-20% of additions
          return clamp(Math.floor((base + (n % 4_000)) * 0.0002), 0, 10_000);
        case "cardImpressions":
          // Card impressions are shown to viewers who get far enough in the video
          return clamp(Math.floor((base + (n % 20_000)) * 0.6), 0, 5_000_000);
        case "cardClicks":
          // Card click rate is typically 0.5-3%
          return clamp(Math.floor((base + (n % 5_000)) * 0.012), 0, 100_000);
        case "cardClickRate":
          // Return as percentage (0.5-3%)
          return clamp(0.5 + (n % 250) / 100, 0.1, 5);
        case "annotationImpressions":
          // End screen impressions (fewer than card impressions)
          return clamp(Math.floor((base + (n % 15_000)) * 0.4), 0, 3_000_000);
        case "annotationClicks":
          // End screen click rate is typically 1-5%
          return clamp(Math.floor((base + (n % 8_000)) * 0.015), 0, 150_000);
        case "annotationClickThroughRate":
          // Return as percentage (1-5%)
          return clamp(1 + (n % 400) / 100, 0.5, 8);
        case "estimatedRevenue":
        case "estimatedAdRevenue":
        case "grossRevenue":
          // Revenue in dollars (realistic RPM of $1-5)
          return clamp(
            Math.floor((base / 1000) * (1 + (n % 400) / 100)),
            0,
            500_000
          );
        case "playbackBasedCpm":
        case "cpm":
          // CPM typically $2-10
          return clamp(2 + (n % 800) / 100, 1, 20);
        case "monetizedPlaybacks":
          // Typically 40-70% of views are monetized
          return clamp(Math.floor((base + (n % 10_000)) * 0.55), 0, 10_000_000);
        case "adImpressions":
          return clamp(Math.floor((base + (n % 20_000)) * 0.6), 0, 50_000_000);
        default:
          return clamp(base + (n % 10_000), 0, 100_000_000);
      }
    }

    function dateRangeDays(start: string, end: string): string[] {
      const s = new Date(start);
      const e = new Date(end);
      if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return [];
      const days: string[] = [];
      const cur = new Date(
        Date.UTC(s.getUTCFullYear(), s.getUTCMonth(), s.getUTCDate())
      );
      const endUTC = new Date(
        Date.UTC(e.getUTCFullYear(), e.getUTCMonth(), e.getUTCDate())
      );
      const max = 90; // keep bounded
      for (let i = 0; i < max; i++) {
        if (cur.getTime() > endUTC.getTime()) break;
        days.push(cur.toISOString().slice(0, 10));
        cur.setUTCDate(cur.getUTCDate() + 1);
      }
      return days;
    }

    // Owned-video insights uses dimensions=day (daily) and no dimensions (totals).
    const videoIds = parseVideoIdsFromFilters(filters);
    const metricList = metrics
      .split(",")
      .map((m) => m.trim())
      .filter(Boolean);

    if (videoIds.length === 1 && dimensions === "day") {
      const days = dateRangeDays(startDate, endDate);
      const columnHeaders = [
        { name: "day", columnType: "DIMENSION", dataType: "STRING" },
        ...metricList.map((name) => ({
          name,
          columnType: "METRIC",
          dataType: "INTEGER",
        })),
      ];
      const rows = days.map((d, idx) => {
        const vals = metricList.map((m) => metricValue(videoIds[0]!, m, idx));
        return [d, ...vals];
      });
      return { kind: "youtubeAnalytics#resultTable", columnHeaders, rows };
    }

    if (videoIds.length === 1 && dimensions === "") {
      const columnHeaders = metricList.map((name) => ({
        name,
        columnType: "METRIC",
        dataType: "INTEGER",
      }));
      const vals = metricList.map((m) => metricValue(videoIds[0]!, m, 0));
      return {
        kind: "youtubeAnalytics#resultTable",
        columnHeaders,
        rows: [vals],
      };
    }

    // Generic video metrics report
    if (dimensions === "video") {
      const ids = parseCommaList(filters.replace(/^video==/, ""));
      const headers = ["video", ...metrics.split(",")].filter(Boolean);
      const columnHeaders = headers.map((name) => ({
        name,
        columnType: name === "video" ? "DIMENSION" : "METRIC",
        dataType: name === "video" ? "STRING" : "INTEGER",
      }));
      const rows = ids.slice(0, 50).map((videoId, idx) => {
        const metricVals = metrics
          .split(",")
          .map((m) => m.trim())
          .filter(Boolean)
          .map((m) => metricValue(videoId, m, idx));
        return [videoId, ...metricVals];
      });
      return { kind: "youtubeAnalytics#resultTable", columnHeaders, rows };
    }

    // Fallback analytics shape
    return {
      kind: "youtubeAnalytics#resultTable",
      columnHeaders: [],
      rows: [],
    };
  }

  // Unknown URL: return empty object (still JSON)
  return {};
}
