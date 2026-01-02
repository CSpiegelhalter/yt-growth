import { describe, it, expect } from "vitest";
import {
  parseYouTubeVideoId,
  isValidYouTubeUrl,
} from "@/lib/youtube-video-id";

describe("parseYouTubeVideoId", () => {
  describe("standard watch URLs", () => {
    it("parses youtube.com/watch?v=VIDEOID", () => {
      expect(
        parseYouTubeVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
      ).toBe("dQw4w9WgXcQ");
    });

    it("parses without www prefix", () => {
      expect(
        parseYouTubeVideoId("https://youtube.com/watch?v=dQw4w9WgXcQ")
      ).toBe("dQw4w9WgXcQ");
    });

    it("parses mobile URLs", () => {
      expect(
        parseYouTubeVideoId("https://m.youtube.com/watch?v=dQw4w9WgXcQ")
      ).toBe("dQw4w9WgXcQ");
    });

    it("parses with additional query params", () => {
      expect(
        parseYouTubeVideoId(
          "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30s&list=PLtest"
        )
      ).toBe("dQw4w9WgXcQ");
    });

    it("parses with v param not first", () => {
      expect(
        parseYouTubeVideoId(
          "https://www.youtube.com/watch?feature=share&v=dQw4w9WgXcQ"
        )
      ).toBe("dQw4w9WgXcQ");
    });
  });

  describe("youtu.be short URLs", () => {
    it("parses youtu.be/VIDEOID", () => {
      expect(parseYouTubeVideoId("https://youtu.be/dQw4w9WgXcQ")).toBe(
        "dQw4w9WgXcQ"
      );
    });

    it("parses with query params", () => {
      expect(parseYouTubeVideoId("https://youtu.be/dQw4w9WgXcQ?t=30")).toBe(
        "dQw4w9WgXcQ"
      );
    });

    it("parses http (non-https)", () => {
      expect(parseYouTubeVideoId("http://youtu.be/dQw4w9WgXcQ")).toBe(
        "dQw4w9WgXcQ"
      );
    });
  });

  describe("shorts URLs", () => {
    it("parses youtube.com/shorts/VIDEOID", () => {
      expect(
        parseYouTubeVideoId("https://www.youtube.com/shorts/dQw4w9WgXcQ")
      ).toBe("dQw4w9WgXcQ");
    });

    it("parses shorts with query params", () => {
      expect(
        parseYouTubeVideoId(
          "https://www.youtube.com/shorts/dQw4w9WgXcQ?feature=share"
        )
      ).toBe("dQw4w9WgXcQ");
    });
  });

  describe("embed URLs", () => {
    it("parses youtube.com/embed/VIDEOID", () => {
      expect(
        parseYouTubeVideoId("https://www.youtube.com/embed/dQw4w9WgXcQ")
      ).toBe("dQw4w9WgXcQ");
    });

    it("parses embed with autoplay param", () => {
      expect(
        parseYouTubeVideoId(
          "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
        )
      ).toBe("dQw4w9WgXcQ");
    });
  });

  describe("old embed format", () => {
    it("parses youtube.com/v/VIDEOID", () => {
      expect(
        parseYouTubeVideoId("https://www.youtube.com/v/dQw4w9WgXcQ")
      ).toBe("dQw4w9WgXcQ");
    });
  });

  describe("video IDs with special characters", () => {
    it("handles IDs with underscores", () => {
      expect(
        parseYouTubeVideoId("https://www.youtube.com/watch?v=abc_def_123")
      ).toBe("abc_def_123");
    });

    it("handles IDs with hyphens", () => {
      expect(
        parseYouTubeVideoId("https://www.youtube.com/watch?v=abc-def-123")
      ).toBe("abc-def-123");
    });
  });

  describe("raw video IDs", () => {
    it("returns a valid 11-character video ID as-is", () => {
      expect(parseYouTubeVideoId("dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    });

    it("returns null for invalid raw IDs (too short)", () => {
      expect(parseYouTubeVideoId("dQw4w9")).toBeNull();
    });

    it("returns null for invalid raw IDs (too long)", () => {
      expect(parseYouTubeVideoId("dQw4w9WgXcQabc")).toBeNull();
    });
  });

  describe("invalid inputs", () => {
    it("returns null for empty string", () => {
      expect(parseYouTubeVideoId("")).toBeNull();
    });

    it("returns null for whitespace only", () => {
      expect(parseYouTubeVideoId("   ")).toBeNull();
    });

    it("returns null for null-like values", () => {
      // @ts-expect-error - testing runtime behavior
      expect(parseYouTubeVideoId(null)).toBeNull();
      // @ts-expect-error - testing runtime behavior
      expect(parseYouTubeVideoId(undefined)).toBeNull();
    });

    it("returns null for non-YouTube URLs", () => {
      expect(parseYouTubeVideoId("https://vimeo.com/12345678")).toBeNull();
      expect(
        parseYouTubeVideoId("https://example.com/watch?v=dQw4w9WgXcQ")
      ).toBeNull();
    });

    it("returns null for malformed URLs", () => {
      expect(parseYouTubeVideoId("not-a-url")).toBeNull();
      expect(parseYouTubeVideoId("https://")).toBeNull();
    });

    it("returns null for YouTube URLs without video ID", () => {
      expect(parseYouTubeVideoId("https://www.youtube.com/")).toBeNull();
      expect(parseYouTubeVideoId("https://www.youtube.com/watch")).toBeNull();
      expect(
        parseYouTubeVideoId("https://www.youtube.com/channel/UCtest")
      ).toBeNull();
    });

    it("returns null for invalid video ID format in URL", () => {
      expect(
        parseYouTubeVideoId("https://www.youtube.com/watch?v=tooshort")
      ).toBeNull();
      expect(
        parseYouTubeVideoId("https://www.youtube.com/watch?v=contains$pecial!")
      ).toBeNull();
    });
  });

  describe("whitespace handling", () => {
    it("trims leading whitespace", () => {
      expect(
        parseYouTubeVideoId("  https://www.youtube.com/watch?v=dQw4w9WgXcQ")
      ).toBe("dQw4w9WgXcQ");
    });

    it("trims trailing whitespace", () => {
      expect(
        parseYouTubeVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ  ")
      ).toBe("dQw4w9WgXcQ");
    });
  });
});

describe("isValidYouTubeUrl", () => {
  it("returns true for valid YouTube URLs", () => {
    expect(isValidYouTubeUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(
      true
    );
    expect(isValidYouTubeUrl("https://youtu.be/dQw4w9WgXcQ")).toBe(true);
    expect(isValidYouTubeUrl("https://www.youtube.com/shorts/dQw4w9WgXcQ")).toBe(
      true
    );
  });

  it("returns false for invalid URLs", () => {
    expect(isValidYouTubeUrl("")).toBe(false);
    expect(isValidYouTubeUrl("https://vimeo.com/12345678")).toBe(false);
    expect(isValidYouTubeUrl("not-a-url")).toBe(false);
  });
});
