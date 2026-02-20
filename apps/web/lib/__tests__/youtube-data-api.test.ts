/**
 * Unit tests for fetchVideoSnippetByApiKey (API-key-based video snippet fetcher)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchVideoSnippetByApiKey } from "../youtube/data-api";
import { ApiError } from "@/lib/api/errors";

const FAKE_API_KEY = "test-api-key-123";

function mockYouTubeResponse(
  items: unknown[],
  status = 200
): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve({ items }),
  } as unknown as Response;
}

describe("fetchVideoSnippetByApiKey", () => {
  const originalEnv = process.env.YOUTUBE_API_KEY;

  beforeEach(() => {
    process.env.YOUTUBE_API_KEY = FAKE_API_KEY;
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      mockYouTubeResponse([])
    );
  });

  afterEach(() => {
    process.env.YOUTUBE_API_KEY = originalEnv;
    vi.restoreAllMocks();
  });

  // ------------------------------------------------------------------
  // Success cases
  // ------------------------------------------------------------------

  it("returns the first item on a successful response", async () => {
    const snippet = {
      title: "Test Video",
      channelTitle: "Test Channel",
      tags: ["tag1", "tag2"],
      thumbnails: { medium: { url: "https://i.ytimg.com/thumb.jpg" } },
    };

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      mockYouTubeResponse([{ snippet }])
    );

    const result = await fetchVideoSnippetByApiKey("abc123");
    expect(result).toEqual({ snippet });
  });

  it("passes the correct URL with part, id, key, and fields", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      mockYouTubeResponse([{ snippet: { title: "T" } }])
    );

    await fetchVideoSnippetByApiKey("VIDEO_ID", {
      fields: "items/snippet(title,tags)",
    });

    const calledUrl = new URL(fetchSpy.mock.calls[0][0] as string);
    expect(calledUrl.pathname).toBe("/youtube/v3/videos");
    expect(calledUrl.searchParams.get("part")).toBe("snippet");
    expect(calledUrl.searchParams.get("id")).toBe("VIDEO_ID");
    expect(calledUrl.searchParams.get("key")).toBe(FAKE_API_KEY);
    expect(calledUrl.searchParams.get("fields")).toBe(
      "items/snippet(title,tags)"
    );
  });

  it("omits fields param when not provided", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      mockYouTubeResponse([{ snippet: { title: "T" } }])
    );

    await fetchVideoSnippetByApiKey("VIDEO_ID");

    const calledUrl = new URL(fetchSpy.mock.calls[0][0] as string);
    expect(calledUrl.searchParams.has("fields")).toBe(false);
  });

  it("returns null when items array is empty", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      mockYouTubeResponse([])
    );

    const result = await fetchVideoSnippetByApiKey("nonexistent");
    expect(result).toBeNull();
  });

  it("returns null when items is undefined", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
    } as unknown as Response);

    const result = await fetchVideoSnippetByApiKey("nonexistent");
    expect(result).toBeNull();
  });

  // ------------------------------------------------------------------
  // Error mapping
  // ------------------------------------------------------------------

  it("throws ApiError with INTERNAL when API key is missing", async () => {
    delete process.env.YOUTUBE_API_KEY;

    await expect(fetchVideoSnippetByApiKey("abc")).rejects.toThrow(ApiError);
    await expect(fetchVideoSnippetByApiKey("abc")).rejects.toMatchObject({
      code: "INTERNAL",
      status: 500,
      message: "YouTube API is not configured. Please contact support.",
    });
  });

  it("throws ApiError NOT_FOUND on YouTube 404", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      mockYouTubeResponse([], 404)
    );

    await expect(fetchVideoSnippetByApiKey("bad")).rejects.toMatchObject({
      code: "NOT_FOUND",
      status: 404,
      message: "Video not found. Please check the URL and try again.",
    });
  });

  it("throws ApiError FORBIDDEN on YouTube 403", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      mockYouTubeResponse([], 403)
    );

    await expect(fetchVideoSnippetByApiKey("private")).rejects.toMatchObject({
      code: "FORBIDDEN",
      status: 403,
      message:
        "Unable to access this video. It may be private or restricted.",
    });
  });

  it("throws ApiError INTERNAL on YouTube 500", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      mockYouTubeResponse([], 500)
    );

    await expect(fetchVideoSnippetByApiKey("err")).rejects.toMatchObject({
      code: "INTERNAL",
      status: 500,
      message: "Failed to fetch video data. Please try again.",
    });
  });

  it("throws ApiError INTERNAL on network failure", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(
      new TypeError("Failed to fetch")
    );

    await expect(fetchVideoSnippetByApiKey("net")).rejects.toMatchObject({
      code: "INTERNAL",
      status: 500,
      message: "Failed to fetch video data. Please try again.",
    });
  });
});
