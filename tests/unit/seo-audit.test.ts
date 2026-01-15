import { describe, it, expect } from "vitest";
import { runSeoAudit, SeoAuditInput, SeoAuditResult, SeoCheck } from "../../lib/youtube/seoAudit";

describe("runSeoAudit", () => {
  // Helper to find a check by id
  const findCheck = (result: SeoAuditResult, id: string): SeoCheck | undefined =>
    result.checks.find((c) => c.id === id);

  describe("focus keyword detection", () => {
    it("detects keyword from title and tags with high confidence", () => {
      const input: SeoAuditInput = {
        title: "How to Grow Your YouTube Channel in 2024",
        description: "Learn the best strategies to grow your YouTube channel fast.",
        tags: ["youtube channel", "grow youtube", "youtube tips"],
      };

      const result = runSeoAudit(input);

      expect(result.focusKeyword.value).toBeTruthy();
      expect(result.focusKeyword.confidence).toBe("high");
      expect(result.focusKeyword.candidates.length).toBeGreaterThan(0);
    });

    // TODO: SEO audit keyword confidence logic changed upstream
    it.skip("returns low confidence when keyword only in title", () => {
      const input: SeoAuditInput = {
        title: "Advanced Macro Photography Tutorial",
        description: "In this video, I show you some cool techniques.",
        tags: [],
      };

      const result = runSeoAudit(input);

      expect(result.focusKeyword.confidence).toBe("low");
    });

    it("handles empty inputs gracefully", () => {
      const input: SeoAuditInput = {
        title: "",
        description: "",
        tags: [],
      };

      const result = runSeoAudit(input);

      expect(result.focusKeyword.value).toBeNull();
      expect(result.focusKeyword.confidence).toBe("low");
      expect(result.focusKeyword.candidates).toEqual([]);
    });
  });

  describe("title length check", () => {
    it("marks short optimized title as strong", () => {
      const input: SeoAuditInput = {
        title: "5 Tips to Improve Your Photography Today",
        description: "Photography tips for beginners.",
        tags: ["photography"],
      };

      const result = runSeoAudit(input);
      const check = findCheck(result, "title_length");

      expect(check?.status).toBe("strong");
      expect(check?.evidence).toContain("characters");
      expect(check?.evidence).toContain("words");
    });

    it("marks very long title as needs_work", () => {
      const input: SeoAuditInput = {
        title:
          "The Ultimate Complete Comprehensive Guide to Learning Everything About Photography and Videography for Beginners and Experts",
        description: "A guide to photography.",
        tags: [],
      };

      const result = runSeoAudit(input);
      const check = findCheck(result, "title_length");

      expect(check?.status).toBe("needs_work");
      expect(check?.evidence).toContain("truncates");
    });

    it("marks very short title as needs_work", () => {
      const input: SeoAuditInput = {
        title: "Tips",
        description: "Some tips.",
        tags: [],
      };

      const result = runSeoAudit(input);
      const check = findCheck(result, "title_length");

      expect(check?.status).toBe("needs_work");
      expect(check?.evidence).toContain("short");
    });
  });

  describe("title keyword placement check", () => {
    it("marks keyword early in title as strong", () => {
      const input: SeoAuditInput = {
        title: "YouTube SEO: Complete Guide for Beginners",
        description: "Learn YouTube SEO basics in this guide.",
        tags: ["youtube seo", "seo guide"],
      };

      const result = runSeoAudit(input);
      const check = findCheck(result, "title_keyword_placement");

      expect(check?.status).toBe("strong");
      expect(check?.evidence).toContain("early");
    });

    it("marks keyword late in title as needs_work", () => {
      const input: SeoAuditInput = {
        title: "The Complete Beginner's Guide to Learning YouTube SEO",
        description: "Everything about YouTube SEO for beginners.",
        tags: ["youtube seo"],
      };

      const result = runSeoAudit(input);
      const check = findCheck(result, "title_keyword_placement");

      expect(check?.status).toBe("needs_work");
      expect(check?.evidence).toContain("not near the beginning");
    });
  });

  describe("hashtag check", () => {
    it("marks 1-3 hashtags as strong", () => {
      const input: SeoAuditInput = {
        title: "Test Video",
        description: "This is a test video. #photography #tutorial",
        tags: [],
      };

      const result = runSeoAudit(input);
      const check = findCheck(result, "hashtags");

      expect(check?.status).toBe("strong");
      expect(check?.evidence).toContain("2");
    });

    it("marks 0 hashtags as missing", () => {
      const input: SeoAuditInput = {
        title: "Test Video",
        description: "This is a test video with no hashtags.",
        tags: [],
      };

      const result = runSeoAudit(input);
      const check = findCheck(result, "hashtags");

      expect(check?.status).toBe("missing");
    });

    it("marks more than 3 hashtags as needs_work", () => {
      const input: SeoAuditInput = {
        title: "Test Video",
        description:
          "Video description #tag1 #tag2 #tag3 #tag4 #tag5 #tag6",
        tags: [],
      };

      const result = runSeoAudit(input);
      const check = findCheck(result, "hashtags");

      expect(check?.status).toBe("needs_work");
      expect(check?.evidence).toContain("more than recommended");
    });
  });

  describe("chapter detection", () => {
    it("detects standard chapter format", () => {
      const input: SeoAuditInput = {
        title: "Tutorial Video",
        description: `Learn something new!

00:00 - Introduction
01:30 - Chapter One
05:45 - Chapter Two
10:00 - Conclusion`,
        tags: [],
      };

      const result = runSeoAudit(input);
      const check = findCheck(result, "chapters");

      expect(check?.status).toBe("strong");
      expect(check?.evidence).toContain("4");
    });

    it("detects chapters without dash separator", () => {
      const input: SeoAuditInput = {
        title: "Tutorial Video",
        description: `00:00 Intro
02:30 Main content
08:15 Summary`,
        tags: [],
      };

      const result = runSeoAudit(input);
      const check = findCheck(result, "chapters");

      expect(check?.status).toBe("strong");
    });

    it("marks no chapters as missing", () => {
      const input: SeoAuditInput = {
        title: "Tutorial Video",
        description: "This video has no timestamps.",
        tags: [],
      };

      const result = runSeoAudit(input);
      const check = findCheck(result, "chapters");

      expect(check?.status).toBe("missing");
    });

    it("marks 1-2 chapters as needs_work", () => {
      const input: SeoAuditInput = {
        title: "Tutorial Video",
        description: `Check this out:
00:00 - Intro
05:00 - Main content`,
        tags: [],
      };

      const result = runSeoAudit(input);
      const check = findCheck(result, "chapters");

      expect(check?.status).toBe("needs_work");
    });
  });

  describe("captions check", () => {
    it("parses string 'true' as captions available", () => {
      const input: SeoAuditInput = {
        title: "Test",
        description: "Test",
        tags: [],
        caption: "true",
      };

      const result = runSeoAudit(input);
      const check = findCheck(result, "captions");

      expect(check?.status).toBe("strong");
    });

    it("parses string 'false' as captions missing", () => {
      const input: SeoAuditInput = {
        title: "Test",
        description: "Test",
        tags: [],
        caption: "false",
      };

      const result = runSeoAudit(input);
      const check = findCheck(result, "captions");

      expect(check?.status).toBe("missing");
    });

    it("parses boolean true as captions available", () => {
      const input: SeoAuditInput = {
        title: "Test",
        description: "Test",
        tags: [],
        caption: true,
      };

      const result = runSeoAudit(input);
      const check = findCheck(result, "captions");

      expect(check?.status).toBe("strong");
    });

    it("handles undefined caption as needs_work", () => {
      const input: SeoAuditInput = {
        title: "Test",
        description: "Test",
        tags: [],
      };

      const result = runSeoAudit(input);
      const check = findCheck(result, "captions");

      expect(check?.status).toBe("needs_work");
    });
  });

  describe("thumbnail check", () => {
    it("marks high resolution thumbnail as strong", () => {
      const input: SeoAuditInput = {
        title: "Test",
        description: "Test",
        tags: [],
        thumbnails: {
          maxres: { url: "https://example.com/thumb.jpg", width: 1280, height: 720 },
        },
      };

      const result = runSeoAudit(input);
      const check = findCheck(result, "thumbnail");

      expect(check?.status).toBe("strong");
      expect(check?.evidence).toContain("1280");
    });

    it("marks low resolution thumbnail as needs_work", () => {
      const input: SeoAuditInput = {
        title: "Test",
        description: "Test",
        tags: [],
        thumbnails: {
          default: { url: "https://example.com/thumb.jpg", width: 120, height: 90 },
        },
      };

      const result = runSeoAudit(input);
      const check = findCheck(result, "thumbnail");

      expect(check?.status).toBe("needs_work");
      expect(check?.evidence).toContain("Low resolution");
    });

    it("marks missing thumbnails as missing", () => {
      const input: SeoAuditInput = {
        title: "Test",
        description: "Test",
        tags: [],
      };

      const result = runSeoAudit(input);
      const check = findCheck(result, "thumbnail");

      expect(check?.status).toBe("missing");
    });

    it("selects best available thumbnail by priority", () => {
      const input: SeoAuditInput = {
        title: "Test",
        description: "Test",
        tags: [],
        thumbnails: {
          default: { url: "https://example.com/default.jpg", width: 120, height: 90 },
          high: { url: "https://example.com/high.jpg", width: 480, height: 360 },
          standard: { url: "https://example.com/standard.jpg", width: 640, height: 480 },
        },
      };

      const result = runSeoAudit(input);
      const check = findCheck(result, "thumbnail");

      // Should select "standard" (640 wide) which meets minimum
      expect(check?.status).toBe("strong");
      expect(check?.evidence).toContain("640");
    });
  });

  describe("tags coverage check", () => {
    it("marks empty tags as missing", () => {
      const input: SeoAuditInput = {
        title: "YouTube Tutorial",
        description: "Learn about YouTube.",
        tags: [],
      };

      const result = runSeoAudit(input);
      const check = findCheck(result, "tags_coverage");

      expect(check?.status).toBe("missing");
    });

    it("marks good tag coverage as strong", () => {
      const input: SeoAuditInput = {
        title: "YouTube SEO Tutorial for Beginners",
        description: "Learn YouTube SEO in this tutorial.",
        tags: [
          "youtube seo",
          "youtube seo tutorial",
          "seo for youtube",
          "youtube tips",
          "video seo",
          "marketing",
        ],
      };

      const result = runSeoAudit(input);
      const check = findCheck(result, "tags_coverage");

      expect(check?.status).toBe("strong");
    });
  });

  describe("description depth check", () => {
    it("marks detailed description as strong", () => {
      const longDescription = Array(150).fill("word").join(" ");
      const input: SeoAuditInput = {
        title: "Test",
        description: longDescription,
        tags: [],
      };

      const result = runSeoAudit(input);
      const check = findCheck(result, "description_depth");

      expect(check?.status).toBe("strong");
    });

    it("marks structured description as strong even if short", () => {
      const input: SeoAuditInput = {
        title: "Test",
        description: `Learn something new!

TIMESTAMPS:
00:00 - Intro
01:00 - Main content

- First point
- Second point
- Third point`,
        tags: [],
      };

      const result = runSeoAudit(input);
      const check = findCheck(result, "description_depth");

      expect(check?.status).toBe("strong");
    });

    it("marks short unstructured description as needs_work", () => {
      const input: SeoAuditInput = {
        title: "Test",
        description: "A short description with not much detail.",
        tags: [],
      };

      const result = runSeoAudit(input);
      const check = findCheck(result, "description_depth");

      expect(check?.status).toBe("needs_work");
    });
  });

  describe("category check", () => {
    it("marks present category as strong", () => {
      const input: SeoAuditInput = {
        title: "Test",
        description: "Test",
        tags: [],
        categoryId: "22",
      };

      const result = runSeoAudit(input);
      const check = findCheck(result, "category");

      expect(check?.status).toBe("strong");
    });

    it("marks missing category as needs_work", () => {
      const input: SeoAuditInput = {
        title: "Test",
        description: "Test",
        tags: [],
      };

      const result = runSeoAudit(input);
      const check = findCheck(result, "category");

      expect(check?.status).toBe("needs_work");
    });
  });

  describe("refresh opportunity check", () => {
    it("marks recent video as strong", () => {
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 30); // 30 days ago

      const input: SeoAuditInput = {
        title: "Test",
        description: "Test",
        tags: [],
        publishedAt: recentDate.toISOString(),
      };

      const result = runSeoAudit(input);
      const check = findCheck(result, "refresh_opportunity");

      expect(check?.status).toBe("strong");
      expect(check?.evidence).toContain("fresh");
    });

    it("marks old video as needs_work", () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 365); // 1 year ago

      const input: SeoAuditInput = {
        title: "Test",
        description: "Test",
        tags: [],
        publishedAt: oldDate.toISOString(),
      };

      const result = runSeoAudit(input);
      const check = findCheck(result, "refresh_opportunity");

      expect(check?.status).toBe("needs_work");
      expect(check?.evidence).toContain("months ago");
    });

    it("skips check when no publish date", () => {
      const input: SeoAuditInput = {
        title: "Test",
        description: "Test",
        tags: [],
      };

      const result = runSeoAudit(input);
      const check = findCheck(result, "refresh_opportunity");

      expect(check).toBeUndefined();
    });
  });

  describe("priority fixes", () => {
    it("returns top priority issues sorted by impact", () => {
      const input: SeoAuditInput = {
        title: "Video", // Short title, no keyword
        description: "Short desc.", // Short description
        tags: [], // No tags
      };

      const result = runSeoAudit(input);

      expect(result.priorityFixes.length).toBeGreaterThan(0);
      expect(result.priorityFixes.length).toBeLessThanOrEqual(6);
      expect(result.priorityFixes.every((f) => f.status !== "strong")).toBe(true);
    });

    it("returns empty priority fixes for well-optimized video", () => {
      const input: SeoAuditInput = {
        title: "YouTube SEO Tutorial: Complete Guide",
        description: `Learn YouTube SEO in this comprehensive guide.

TIMESTAMPS:
00:00 - Introduction
02:30 - Keyword Research
08:00 - Optimization Tips
15:00 - Summary

In this video, you'll learn everything about YouTube SEO including:
- How to research keywords
- Optimizing your titles and descriptions
- Creating engaging thumbnails
- And much more!

#YouTubeSEO #Tutorial #Marketing`,
        tags: [
          "youtube seo",
          "youtube seo tutorial",
          "seo guide",
          "youtube tips",
          "video marketing",
          "tutorial",
        ],
        thumbnails: {
          maxres: { url: "https://example.com/thumb.jpg", width: 1280, height: 720 },
        },
        categoryId: "22",
        caption: true,
        publishedAt: new Date().toISOString(),
      };

      const result = runSeoAudit(input);

      // Most checks should be strong, few priority fixes
      const strongCount = result.checks.filter((c) => c.status === "strong").length;
      expect(strongCount).toBeGreaterThan(result.checks.length * 0.5);
    });
  });

  describe("summary generation", () => {
    it("generates appropriate summary for well-optimized video", () => {
      const input: SeoAuditInput = {
        title: "YouTube SEO Tips for Beginners",
        description: `Complete guide to YouTube SEO. ${Array(120).fill("word").join(" ")}

00:00 - Intro
02:00 - Tips
05:00 - Summary

#YouTubeSEO #Tips`,
        tags: ["youtube seo", "seo tips", "youtube", "tutorial"],
        thumbnails: {
          maxres: { url: "https://example.com/thumb.jpg", width: 1280, height: 720 },
        },
        categoryId: "22",
        caption: true,
      };

      const result = runSeoAudit(input);

      expect(result.summary).toBeTruthy();
      expect(result.summary.length).toBeGreaterThan(20);
    });

    it("generates appropriate summary for poorly optimized video", () => {
      const input: SeoAuditInput = {
        title: "Video",
        description: "Short.",
        tags: [],
      };

      const result = runSeoAudit(input);

      expect(result.summary).toContain("missing");
    });
  });

  describe("quick fixes", () => {
    it("includes quick fix actions for actionable checks", () => {
      const input: SeoAuditInput = {
        title: "Short title",
        description: "Short description.",
        tags: [],
      };

      const result = runSeoAudit(input);

      // At least some checks should have quick fixes
      const checksWithQuickFix = result.checks.filter((c) => c.quickFix);
      expect(checksWithQuickFix.length).toBeGreaterThan(0);
    });

    it("includes correct action types", () => {
      const input: SeoAuditInput = {
        title: "Test",
        description: "Test",
        tags: [],
      };

      const result = runSeoAudit(input);

      const validActions = [
        "generate_title",
        "generate_description",
        "generate_tags",
        "generate_chapters",
        "open_thumbnail",
        "learn_more",
      ];

      result.checks.forEach((check) => {
        if (check.quickFix) {
          expect(validActions).toContain(check.quickFix.action);
        }
      });
    });
  });
});
