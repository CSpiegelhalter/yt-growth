import { describe, expect, test } from "bun:test";
import {
  sanitizeUtmParam,
  validateUtmParam,
  normalizeUtmMedium,
  generateDefaultCampaign,
  buildUtmUrl,
  UTM_MEDIUM_OPTIONS,
} from "@/lib/utm-sanitizer";

describe("sanitizeUtmParam", () => {
  test("converts to lowercase", () => {
    expect(sanitizeUtmParam("TWITTER")).toBe("twitter");
    expect(sanitizeUtmParam("MyNewsletter")).toBe("mynewsletter");
  });

  test("replaces spaces with underscores", () => {
    expect(sanitizeUtmParam("my newsletter")).toBe("my_newsletter");
    expect(sanitizeUtmParam("launch week 2024")).toBe("launch_week_2024");
  });

  test("removes invalid characters", () => {
    expect(sanitizeUtmParam("twitter!@#$%")).toBe("twitter");
    expect(sanitizeUtmParam("social-media")).toBe("socialmedia");
    expect(sanitizeUtmParam("email.campaign")).toBe("emailcampaign");
  });

  test("trims to max length", () => {
    const longString = "a".repeat(100);
    expect(sanitizeUtmParam(longString).length).toBe(50);
    expect(sanitizeUtmParam(longString, 20).length).toBe(20);
  });

  test("handles empty string", () => {
    expect(sanitizeUtmParam("")).toBe("");
  });

  test("handles already valid input", () => {
    expect(sanitizeUtmParam("twitter")).toBe("twitter");
    expect(sanitizeUtmParam("launch_week_2024")).toBe("launch_week_2024");
  });
});

describe("validateUtmParam", () => {
  test("returns null for valid input", () => {
    expect(validateUtmParam("twitter")).toBeNull();
    expect(validateUtmParam("launch_week_2024")).toBeNull();
    expect(validateUtmParam("")).toBeNull(); // Empty is allowed
  });

  test("returns error for too long input", () => {
    const longString = "a".repeat(51);
    expect(validateUtmParam(longString)).toBe("Maximum 50 characters");
  });

  test("returns error for invalid characters", () => {
    expect(validateUtmParam("social-media")).toBe(
      "Only letters, numbers, and underscores allowed"
    );
    expect(validateUtmParam("email.campaign")).toBe(
      "Only letters, numbers, and underscores allowed"
    );
  });
});

describe("normalizeUtmMedium", () => {
  test("returns valid medium options unchanged", () => {
    for (const option of UTM_MEDIUM_OPTIONS) {
      expect(normalizeUtmMedium(option)).toBe(option);
    }
  });

  test("corrects common typos", () => {
    // "socail" typo should be corrected to "social"
    expect(normalizeUtmMedium("socail")).toBe("social");
    expect(normalizeUtmMedium("soical")).toBe("social");
    expect(normalizeUtmMedium("socal")).toBe("social");
    
    // Email typos
    expect(normalizeUtmMedium("emial")).toBe("email");
    expect(normalizeUtmMedium("emal")).toBe("email");
    
    // Community typos
    expect(normalizeUtmMedium("comunity")).toBe("community");
    expect(normalizeUtmMedium("communtiy")).toBe("community");
    
    // Referral typos
    expect(normalizeUtmMedium("referal")).toBe("referral");
    expect(normalizeUtmMedium("refferal")).toBe("referral");
    
    // Paid typos
    expect(normalizeUtmMedium("payed")).toBe("paid");
    
    // Organic typos
    expect(normalizeUtmMedium("organc")).toBe("organic");
    expect(normalizeUtmMedium("orgainc")).toBe("organic");
  });

  test("handles case-insensitive input", () => {
    expect(normalizeUtmMedium("SOCIAL")).toBe("social");
    expect(normalizeUtmMedium("Social")).toBe("social");
    expect(normalizeUtmMedium("SOCAIL")).toBe("social");
  });

  test("returns sanitized custom values", () => {
    expect(normalizeUtmMedium("custom_medium")).toBe("custom_medium");
    expect(normalizeUtmMedium("My Custom Medium")).toBe("my_custom_medium");
  });
});

describe("generateDefaultCampaign", () => {
  test("generates slug from video title", () => {
    expect(generateDefaultCampaign("My Amazing Video")).toBe("my_amazing_video");
    expect(generateDefaultCampaign("How to Build a React App")).toBe(
      "how_to_build_a_react_app"
    );
  });

  test("removes special characters", () => {
    expect(generateDefaultCampaign("What's New in 2024!?")).toBe(
      "what_s_new_in_2024"
    );
    expect(generateDefaultCampaign("React vs Vue: Which is Better?")).toBe(
      "react_vs_vue_which_is_better"
    );
  });

  test("truncates long titles", () => {
    const longTitle = "This is a very long video title that should be truncated";
    const result = generateDefaultCampaign(longTitle);
    expect(result.length).toBeLessThanOrEqual(40);
  });

  test("handles empty title", () => {
    const result = generateDefaultCampaign("");
    expect(result).toMatch(/^video_\d{8}$/);
  });
});

describe("buildUtmUrl", () => {
  const baseUrl = "https://youtu.be/abc123";

  test("builds URL with all parameters", () => {
    const result = buildUtmUrl(baseUrl, {
      source: "twitter",
      medium: "social",
      campaign: "launch_week",
    });
    expect(result).toBe(
      "https://youtu.be/abc123?utm_source=twitter&utm_medium=social&utm_campaign=launch_week"
    );
  });

  test("sanitizes parameters", () => {
    const result = buildUtmUrl(baseUrl, {
      source: "TWITTER",
      medium: "Social Media",
      campaign: "Launch Week!",
    });
    expect(result).toContain("utm_source=twitter");
    expect(result).toContain("utm_medium=social_media");
    expect(result).toContain("utm_campaign=launch_week");
  });

  test("handles partial parameters", () => {
    const result = buildUtmUrl(baseUrl, { source: "twitter" });
    expect(result).toBe("https://youtu.be/abc123?utm_source=twitter");
    expect(result).not.toContain("utm_medium");
    expect(result).not.toContain("utm_campaign");
  });

  test("handles no parameters", () => {
    const result = buildUtmUrl(baseUrl, {});
    expect(result).toBe(baseUrl);
  });
});
