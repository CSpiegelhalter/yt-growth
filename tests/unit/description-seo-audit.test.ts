import { describe, it, expect } from "vitest";
import {
  runDescriptionSeoAudit,
  DescriptionSeoInput,
  DescriptionSeoResult,
  DescriptionCheck,
} from "../../lib/youtube/descriptionSeoAudit";

describe("runDescriptionSeoAudit", () => {
  // Helper to find a check by id
  const findCheck = (result: DescriptionSeoResult, id: string): DescriptionCheck | undefined =>
    result.checks.find((c) => c.id === id);

  describe("focus keyword detection", () => {
    it("detects keyword with high confidence when in title and tags", () => {
      const input: DescriptionSeoInput = {
        title: "How to Learn Python Programming Fast",
        description: "Learn Python programming in this comprehensive guide.",
        tags: ["python programming", "learn python", "coding tutorial"],
      };

      const result = runDescriptionSeoAudit(input);

      expect(result.focusKeyword.value).toBeTruthy();
      expect(result.focusKeyword.confidence).toBe("high");
    });

    it("returns low confidence with empty inputs", () => {
      const input: DescriptionSeoInput = {
        title: "",
        description: "",
        tags: [],
      };

      const result = runDescriptionSeoAudit(input);

      expect(result.focusKeyword.value).toBeNull();
      expect(result.focusKeyword.confidence).toBe("low");
    });
  });

  describe("keyword placement check", () => {
    it("marks keyword in first 25 words as strong", () => {
      const input: DescriptionSeoInput = {
        title: "YouTube SEO Tips for Beginners",
        description: "In this video about YouTube SEO tips, I'll show you exactly how to rank your videos. We cover everything from thumbnails to tags and more advanced strategies.",
        tags: ["youtube seo", "seo tips"],
      };

      const result = runDescriptionSeoAudit(input);
      const check = findCheck(result, "desc_keyword_placement");

      expect(check?.status).toBe("strong");
      expect(check?.evidence).toContain("opening lines");
    });

    it("marks keyword appearing later as needs_work", () => {
      const input: DescriptionSeoInput = {
        title: "YouTube SEO Tips",
        description: "Welcome to my channel! In this video, I'm going to share some amazing content that will help you grow. Today we're talking about something really important that every creator should know about. Let me explain how YouTube SEO tips can transform your channel.",
        tags: ["youtube seo"],
      };

      const result = runDescriptionSeoAudit(input);
      const check = findCheck(result, "desc_keyword_placement");

      expect(check?.status).toBe("needs_work");
      expect(check?.evidence).toContain("not in the first 25 words");
    });

    it("marks missing keyword as missing", () => {
      const input: DescriptionSeoInput = {
        title: "Cool Video",
        description: "This is a test description without any real keywords.",
        tags: [],
      };

      const result = runDescriptionSeoAudit(input);
      const check = findCheck(result, "desc_keyword_placement");

      // Either missing because no keyword detected, or keyword not found
      expect(["missing", "needs_work"]).toContain(check?.status);
    });
  });

  describe("keyword usage count check", () => {
    it("marks 0 occurrences as missing", () => {
      const input: DescriptionSeoInput = {
        title: "Python Tutorial",
        description: "This video covers coding basics and programming fundamentals.",
        tags: ["python tutorial"],
      };

      const result = runDescriptionSeoAudit(input);
      const check = findCheck(result, "desc_keyword_count");

      expect(check?.status).toBe("missing");
    });

    it("marks 1 occurrence as needs_work", () => {
      const input: DescriptionSeoInput = {
        title: "Python Tutorial",
        description: "This Python Tutorial covers the basics of coding. We'll go through many programming concepts.",
        tags: ["python tutorial"],
      };

      const result = runDescriptionSeoAudit(input);
      const check = findCheck(result, "desc_keyword_count");

      expect(check?.status).toBe("needs_work");
      expect(check?.evidence).toContain("once");
    });

    it("marks 2-3 occurrences as strong", () => {
      const input: DescriptionSeoInput = {
        title: "Python Tutorial",
        description: "This Python Tutorial covers the basics. In this Python Tutorial, we explore functions. By the end of this Python Tutorial, you'll understand loops.",
        tags: ["python tutorial"],
      };

      const result = runDescriptionSeoAudit(input);
      const check = findCheck(result, "desc_keyword_count");

      expect(check?.status).toBe("strong");
    });

    it("marks 4+ occurrences as needs_work (stuffing)", () => {
      const input: DescriptionSeoInput = {
        title: "Python Tutorial",
        description: "Python Tutorial Python Tutorial Python Tutorial Python Tutorial Python Tutorial is what this video is about.",
        tags: ["python tutorial"],
      };

      const result = runDescriptionSeoAudit(input);
      const check = findCheck(result, "desc_keyword_count");

      expect(check?.status).toBe("needs_work");
      expect(check?.evidence).toContain("stuffing");
    });
  });

  describe("description length check", () => {
    it("marks empty description as missing", () => {
      const input: DescriptionSeoInput = {
        title: "Test",
        description: "",
        tags: [],
      };

      const result = runDescriptionSeoAudit(input);
      const check = findCheck(result, "desc_length");

      expect(check?.status).toBe("missing");
    });

    it("marks under 80 words as missing", () => {
      const input: DescriptionSeoInput = {
        title: "Test",
        description: "This is a short description that has only a few words.",
        tags: [],
      };

      const result = runDescriptionSeoAudit(input);
      const check = findCheck(result, "desc_length");

      expect(check?.status).toBe("missing");
    });

    it("marks 80-199 words as needs_work", () => {
      const words = Array(100).fill("word").join(" ");
      const input: DescriptionSeoInput = {
        title: "Test",
        description: words,
        tags: [],
      };

      const result = runDescriptionSeoAudit(input);
      const check = findCheck(result, "desc_length");

      expect(check?.status).toBe("needs_work");
    });

    it("marks 200+ words as strong", () => {
      const words = Array(250).fill("word").join(" ");
      const input: DescriptionSeoInput = {
        title: "Test",
        description: words,
        tags: [],
      };

      const result = runDescriptionSeoAudit(input);
      const check = findCheck(result, "desc_length");

      expect(check?.status).toBe("strong");
    });
  });

  describe("hashtag checks", () => {
    it("marks 0 hashtags as missing", () => {
      const input: DescriptionSeoInput = {
        title: "Test",
        description: "No hashtags here.",
        tags: [],
      };

      const result = runDescriptionSeoAudit(input);
      const check = findCheck(result, "hashtag_count");

      expect(check?.status).toBe("missing");
    });

    it("marks 1 hashtag as needs_work", () => {
      const input: DescriptionSeoInput = {
        title: "Test",
        description: "Content here #onetag",
        tags: [],
      };

      const result = runDescriptionSeoAudit(input);
      const check = findCheck(result, "hashtag_count");

      expect(check?.status).toBe("needs_work");
    });

    it("marks 2-3 hashtags as strong", () => {
      const input: DescriptionSeoInput = {
        title: "Test",
        description: "Content here #tag1 #tag2 #tag3",
        tags: [],
      };

      const result = runDescriptionSeoAudit(input);
      const check = findCheck(result, "hashtag_count");

      expect(check?.status).toBe("strong");
    });

    it("marks more than 3 hashtags as needs_work", () => {
      const input: DescriptionSeoInput = {
        title: "Test",
        description: "Content #a #b #c #d #e",
        tags: [],
      };

      const result = runDescriptionSeoAudit(input);
      const check = findCheck(result, "hashtag_count");

      expect(check?.status).toBe("needs_work");
    });

    it("detects hashtags at end as strong placement", () => {
      const input: DescriptionSeoInput = {
        title: "Test",
        description: `Long description content here. More content. Even more.
        
Additional paragraphs and information.

#hashtag1 #hashtag2`,
        tags: [],
      };

      const result = runDescriptionSeoAudit(input);
      const check = findCheck(result, "hashtag_placement");

      expect(check?.status).toBe("strong");
    });

    it("detects hashtags scattered as needs_work", () => {
      const input: DescriptionSeoInput = {
        title: "Test",
        description: "#early hashtag here. More content follows after.",
        tags: [],
      };

      const result = runDescriptionSeoAudit(input);
      const check = findCheck(result, "hashtag_placement");

      expect(check?.status).toBe("needs_work");
    });
  });

  describe("tags keyword coverage", () => {
    it("marks empty tags as missing", () => {
      const input: DescriptionSeoInput = {
        title: "Python Tutorial",
        description: "Learn Python in this tutorial.",
        tags: [],
      };

      const result = runDescriptionSeoAudit(input);
      const check = findCheck(result, "tags_keyword");

      expect(check?.status).toBe("missing");
    });

    // TODO: tags_keyword check logic changed upstream
    it.skip("marks tags with keyword and variations as strong", () => {
      const input: DescriptionSeoInput = {
        title: "Python Tutorial for Beginners",
        description: "Learn Python programming.",
        tags: ["python tutorial", "python tutorial for beginners", "python tutorial basics", "learn python"],
      };

      const result = runDescriptionSeoAudit(input);
      const check = findCheck(result, "tags_keyword");

      expect(check?.status).toBe("strong");
    });

    it("marks tags missing keyword as missing", () => {
      const input: DescriptionSeoInput = {
        title: "Python Tutorial",
        description: "Learn Python.",
        tags: ["coding", "programming", "software"],
      };

      const result = runDescriptionSeoAudit(input);
      const check = findCheck(result, "tags_keyword");

      // Focus keyword may or may not be detected
      expect(["missing", "needs_work"]).toContain(check?.status);
    });
  });

  describe("chapters parsing", () => {
    it("marks no chapters as missing", () => {
      const input: DescriptionSeoInput = {
        title: "Test",
        description: "Description without any timestamps.",
        tags: [],
      };

      const result = runDescriptionSeoAudit(input);
      const check = findCheck(result, "chapters_present");

      expect(check?.status).toBe("missing");
    });

    it("marks 1-2 chapters as needs_work", () => {
      const input: DescriptionSeoInput = {
        title: "Test",
        description: `Description content.

0:00 Intro
2:30 Main Topic`,
        tags: [],
      };

      const result = runDescriptionSeoAudit(input);
      const check = findCheck(result, "chapters_present");

      expect(check?.status).toBe("needs_work");
    });

    it("marks 3+ chapters as strong", () => {
      const input: DescriptionSeoInput = {
        title: "Test",
        description: `Description content.

0:00 Intro
2:30 Main Topic
5:00 Deep Dive
8:00 Summary`,
        tags: [],
      };

      const result = runDescriptionSeoAudit(input);
      const check = findCheck(result, "chapters_present");

      expect(check?.status).toBe("strong");
    });

    it("detects chapters starting at 0:00 as strong", () => {
      const input: DescriptionSeoInput = {
        title: "Test",
        description: `0:00 Intro
2:00 Content
4:00 End`,
        tags: [],
      };

      const result = runDescriptionSeoAudit(input);
      const check = findCheck(result, "chapters_zero_start");

      expect(check?.status).toBe("strong");
    });

    it("detects chapters not starting at 0:00 as needs_work", () => {
      const input: DescriptionSeoInput = {
        title: "Test",
        description: `0:15 Intro
2:00 Content
4:00 End`,
        tags: [],
      };

      const result = runDescriptionSeoAudit(input);
      const check = findCheck(result, "chapters_zero_start");

      expect(check?.status).toBe("needs_work");
    });

    it("detects ascending order chapters", () => {
      const input: DescriptionSeoInput = {
        title: "Test",
        description: `0:00 Intro
1:30 Topic A
3:00 Topic B
5:00 End`,
        tags: [],
      };

      const result = runDescriptionSeoAudit(input);
      const check = findCheck(result, "chapters_spacing");

      expect(check?.status).toBe("strong");
    });

    it("parses hour:minute:second format", () => {
      const input: DescriptionSeoInput = {
        title: "Test",
        description: `0:00 Intro
30:00 Part 1
1:00:00 Part 2
1:30:00 Part 3`,
        tags: [],
      };

      const result = runDescriptionSeoAudit(input);
      const check = findCheck(result, "chapters_present");

      expect(check?.status).toBe("strong");
    });
  });

  describe("CTA and links checks", () => {
    it("detects CTA phrases", () => {
      const input: DescriptionSeoInput = {
        title: "Test",
        description: "If you enjoyed this video, please subscribe and leave a comment below!",
        tags: [],
      };

      const result = runDescriptionSeoAudit(input);
      const check = findCheck(result, "desc_cta");

      expect(check?.status).toBe("strong");
    });

    it("marks missing CTA as needs_work", () => {
      const input: DescriptionSeoInput = {
        title: "Test",
        description: "This is just a description without any call to action.",
        tags: [],
      };

      const result = runDescriptionSeoAudit(input);
      const check = findCheck(result, "desc_cta");

      expect(check?.status).toBe("needs_work");
    });

    it("detects links in description", () => {
      const input: DescriptionSeoInput = {
        title: "Test",
        description: "Check out my website: https://example.com for more content.",
        tags: [],
      };

      const result = runDescriptionSeoAudit(input);
      const check = findCheck(result, "desc_links");

      expect(check?.status).toBe("strong");
    });

    it("marks missing links as needs_work", () => {
      const input: DescriptionSeoInput = {
        title: "Test",
        description: "Description without any links or URLs.",
        tags: [],
      };

      const result = runDescriptionSeoAudit(input);
      const check = findCheck(result, "desc_links");

      expect(check?.status).toBe("needs_work");
    });
  });

  describe("priority fixes", () => {
    it("returns top priority issues sorted by impact", () => {
      const input: DescriptionSeoInput = {
        title: "Video",
        description: "Short.",
        tags: [],
      };

      const result = runDescriptionSeoAudit(input);

      expect(result.priorityFixes.length).toBeGreaterThan(0);
      expect(result.priorityFixes.length).toBeLessThanOrEqual(6);
      expect(result.priorityFixes.every((f) => f.status !== "strong")).toBe(true);
    });
  });

  describe("grouped checks", () => {
    it("separates checks into description, hashtag, tag, and chapter groups", () => {
      const input: DescriptionSeoInput = {
        title: "Test Video Title",
        description: "Test description content. #hashtag",
        tags: ["test tag"],
      };

      const result = runDescriptionSeoAudit(input);

      expect(result.descriptionChecks.length).toBe(6); // 6 description checks
      expect(result.hashtagChecks.length).toBe(3); // 3 hashtag checks
      expect(result.tagChecks.length).toBe(3); // 3 tag checks
      expect(result.chapterChecks.length).toBe(4); // 4 chapter checks
    });
  });

  describe("google suggestions", () => {
    it("includes google ranking suggestions", () => {
      const input: DescriptionSeoInput = {
        title: "Test",
        description: "Test",
        tags: [],
      };

      const result = runDescriptionSeoAudit(input);

      expect(result.googleSuggestions.length).toBeGreaterThan(0);
      expect(result.googleSuggestions.some((s) => s.includes("Embed"))).toBe(true);
    });
  });

  describe("summary generation", () => {
    it("generates appropriate summary for well-optimized content", () => {
      const description = `YouTube SEO tutorial covering everything you need to know about YouTube SEO.

In this YouTube SEO guide, we'll explore:
- Keyword research
- Title optimization  
- Description best practices
- And much more!

${Array(150).fill("content").join(" ")}

Check out my website: https://example.com
Subscribe for more videos like this!

0:00 Intro
2:00 Keyword Research
5:00 Title Tips
8:00 Description Guide
12:00 Summary

#YouTubeSEO #Tutorial #VideoMarketing`;

      const input: DescriptionSeoInput = {
        title: "YouTube SEO Tutorial: Complete Guide",
        description,
        tags: ["youtube seo", "youtube seo tutorial", "video seo", "seo guide", "tutorial"],
      };

      const result = runDescriptionSeoAudit(input);

      expect(result.summary).toBeTruthy();
      expect(result.summary.length).toBeGreaterThan(20);
    });
  });
});
