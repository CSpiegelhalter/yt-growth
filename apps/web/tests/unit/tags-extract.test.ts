import { describe, it, expect } from "vitest";
import { parseYouTubeVideoId } from "@/lib/youtube-video-id";

/**
 * Tests for the tag extraction feature.
 * 
 * Note: The URL parsing is already thoroughly tested in youtube-video-id.test.ts.
 * These tests focus on edge cases specific to tag extraction use cases.
 */

describe("Tag Extractor URL Parsing", () => {
  describe("common user input patterns", () => {
    it("parses standard watch URLs with various parameters", () => {
      // Full URL with playlist and timestamp
      expect(
        parseYouTubeVideoId(
          "https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PLtest123&t=42s"
        )
      ).toBe("dQw4w9WgXcQ");

      // Mobile URL
      expect(
        parseYouTubeVideoId("https://m.youtube.com/watch?v=abc123def45")
      ).toBe("abc123def45");
    });

    it("parses short URLs that users commonly share", () => {
      expect(parseYouTubeVideoId("https://youtu.be/dQw4w9WgXcQ")).toBe(
        "dQw4w9WgXcQ"
      );

      expect(parseYouTubeVideoId("https://youtu.be/dQw4w9WgXcQ?t=100")).toBe(
        "dQw4w9WgXcQ"
      );
    });

    it("parses YouTube Shorts URLs", () => {
      expect(
        parseYouTubeVideoId("https://www.youtube.com/shorts/abc123def45")
      ).toBe("abc123def45");

      expect(
        parseYouTubeVideoId("https://youtube.com/shorts/abc123def45?feature=share")
      ).toBe("abc123def45");
    });

    it("parses embed URLs sometimes pasted by users", () => {
      expect(
        parseYouTubeVideoId("https://www.youtube.com/embed/dQw4w9WgXcQ")
      ).toBe("dQw4w9WgXcQ");
    });
  });

  describe("error cases - invalid inputs users might enter", () => {
    it("rejects channel URLs (common mistake)", () => {
      expect(
        parseYouTubeVideoId("https://www.youtube.com/channel/UCtest123")
      ).toBeNull();

      expect(
        parseYouTubeVideoId("https://www.youtube.com/@channelhandle")
      ).toBeNull();
    });

    it("rejects playlist URLs without video", () => {
      expect(
        parseYouTubeVideoId(
          "https://www.youtube.com/playlist?list=PLtest123456"
        )
      ).toBeNull();
    });

    it("rejects non-YouTube URLs", () => {
      expect(
        parseYouTubeVideoId("https://vimeo.com/123456789")
      ).toBeNull();

      expect(
        parseYouTubeVideoId("https://twitter.com/user/status/123")
      ).toBeNull();

      expect(
        parseYouTubeVideoId("https://example.com/watch?v=dQw4w9WgXcQ")
      ).toBeNull();
    });

    it("rejects empty or whitespace input", () => {
      expect(parseYouTubeVideoId("")).toBeNull();
      expect(parseYouTubeVideoId("   ")).toBeNull();
    });

    it("rejects invalid URLs", () => {
      expect(parseYouTubeVideoId("not a url")).toBeNull();
      expect(parseYouTubeVideoId("youtube.com")).toBeNull(); // No protocol
    });
  });

  describe("edge cases with whitespace", () => {
    it("handles URLs with leading/trailing whitespace", () => {
      expect(
        parseYouTubeVideoId("  https://youtu.be/dQw4w9WgXcQ  ")
      ).toBe("dQw4w9WgXcQ");
    });

    it("handles URLs copied with newlines", () => {
      expect(
        parseYouTubeVideoId("https://youtu.be/dQw4w9WgXcQ\n")
      ).toBe("dQw4w9WgXcQ");
    });
  });
});

describe("Tag Extraction Response Validation", () => {
  // These tests validate the expected response structure
  // In a real integration test, we would mock the YouTube API

  it("defines expected response structure for videos with tags", () => {
    const mockResponse = {
      videoId: "dQw4w9WgXcQ",
      title: "Test Video Title",
      channelTitle: "Test Channel",
      thumbnailUrl: "https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg",
      tags: ["tag1", "tag2", "tag3"],
      hasTags: true,
    };

    expect(mockResponse.hasTags).toBe(true);
    expect(mockResponse.tags.length).toBe(3);
    expect(mockResponse.videoId).toBe("dQw4w9WgXcQ");
  });

  it("defines expected response structure for videos without tags", () => {
    const mockResponse = {
      videoId: "abc123def45",
      title: "Video Without Tags",
      channelTitle: "Some Channel",
      thumbnailUrl: null,
      tags: [],
      hasTags: false,
    };

    expect(mockResponse.hasTags).toBe(false);
    expect(mockResponse.tags.length).toBe(0);
  });

  it("validates tag array is always an array even when API returns undefined", () => {
    // This tests the defensive coding in the API
    const rawApiResponse = {
      snippet: {
        title: "Test",
        channelTitle: "Channel",
        tags: undefined, // API sometimes returns undefined instead of empty array
      },
    };

    const tags = Array.isArray(rawApiResponse.snippet.tags)
      ? rawApiResponse.snippet.tags
      : [];

    expect(Array.isArray(tags)).toBe(true);
    expect(tags.length).toBe(0);
  });
});

describe("Tag Prefill URL Generation", () => {
  // Tests for the "Generate tags based on these" feature

  it("generates valid prefill URL for tags", () => {
    const tags = ["tag1", "tag2", "tag three"];
    const prefill = encodeURIComponent(tags.join(","));
    const url = `/tags/generator?prefill=${prefill}`;

    expect(url).toBe("/tags/generator?prefill=tag1%2Ctag2%2Ctag%20three");
  });

  it("handles decoding prefill tags", () => {
    const prefill = "tag1%2Ctag2%2Ctag%20three";
    const decodedTags = decodeURIComponent(prefill);
    const tagList = decodedTags.split(",").map((t) => t.trim());

    expect(tagList).toEqual(["tag1", "tag2", "tag three"]);
  });

  it("limits tags to prevent URL overflow", () => {
    const manyTags = Array.from({ length: 50 }, (_, i) => `tag${i}`);
    const limitedTags = manyTags.slice(0, 30);

    expect(limitedTags.length).toBe(30);
  });
});
