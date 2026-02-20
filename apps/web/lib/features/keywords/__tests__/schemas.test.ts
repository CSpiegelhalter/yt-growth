import { describe, it, expect } from "bun:test";
import {
  ResearchKeywordsBodySchema,
  KeywordTrendsBodySchema,
  YoutubeSerpBodySchema,
  KeywordIdeasBodySchema,
} from "../schemas";

describe("ResearchKeywordsBodySchema", () => {
  it("accepts valid combined request with single phrase", () => {
    const result = ResearchKeywordsBodySchema.safeParse({
      mode: "combined",
      phrase: "espresso machine",
      database: "us",
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid request with phrases array", () => {
    const result = ResearchKeywordsBodySchema.safeParse({
      mode: "related",
      phrases: ["espresso", "latte art"],
      database: "us",
    });
    expect(result.success).toBe(true);
  });

  it("rejects request with neither phrase nor phrases", () => {
    const result = ResearchKeywordsBodySchema.safeParse({
      mode: "overview",
      database: "us",
    });
    expect(result.success).toBe(false);
  });

  it("rejects phrase over 80 characters", () => {
    const result = ResearchKeywordsBodySchema.safeParse({
      mode: "overview",
      phrase: "a".repeat(81),
      database: "us",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty phrase", () => {
    const result = ResearchKeywordsBodySchema.safeParse({
      mode: "overview",
      phrase: "  ",
      database: "us",
    });
    expect(result.success).toBe(false);
  });

  it("rejects more than 10 phrases", () => {
    const result = ResearchKeywordsBodySchema.safeParse({
      mode: "related",
      phrases: Array.from({ length: 11 }, (_, i) => `keyword ${i + 1}`),
      database: "us",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid region code", () => {
    const result = ResearchKeywordsBodySchema.safeParse({
      mode: "overview",
      phrase: "test",
      database: "zz",
    });
    expect(result.success).toBe(false);
  });

  it("defaults database to 'us'", () => {
    const result = ResearchKeywordsBodySchema.safeParse({
      mode: "overview",
      phrase: "test keyword",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.database).toBe("us");
    }
  });

  it("rejects invalid mode", () => {
    const result = ResearchKeywordsBodySchema.safeParse({
      mode: "invalid",
      phrase: "test",
    });
    expect(result.success).toBe(false);
  });
});

describe("KeywordTrendsBodySchema", () => {
  it("accepts valid request", () => {
    const result = KeywordTrendsBodySchema.safeParse({
      keyword: "espresso",
      database: "us",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty keyword", () => {
    const result = KeywordTrendsBodySchema.safeParse({
      keyword: "",
      database: "us",
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional date range", () => {
    const result = KeywordTrendsBodySchema.safeParse({
      keyword: "coffee",
      database: "us",
      dateFrom: "2024-01-01",
      dateTo: "2024-12-31",
    });
    expect(result.success).toBe(true);
  });
});

describe("YoutubeSerpBodySchema", () => {
  it("accepts valid request", () => {
    const result = YoutubeSerpBodySchema.safeParse({
      keyword: "espresso tutorial",
      location: "us",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(10);
    }
  });

  it("rejects limit over 20", () => {
    const result = YoutubeSerpBodySchema.safeParse({
      keyword: "test",
      location: "us",
      limit: 25,
    });
    expect(result.success).toBe(false);
  });

  it("defaults location to 'us' and limit to 10", () => {
    const result = YoutubeSerpBodySchema.safeParse({
      keyword: "coffee brewing",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.location).toBe("us");
      expect(result.data.limit).toBe(10);
    }
  });
});

describe("KeywordIdeasBodySchema", () => {
  it("accepts valid request", () => {
    const result = KeywordIdeasBodySchema.safeParse({
      topicDescription: "How to make better coffee at home",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.audienceLevel).toBe("all");
      expect(result.data.formatPreference).toBe("mixed");
      expect(result.data.locationCode).toBe("us");
    }
  });

  it("rejects topic under 3 characters", () => {
    const result = KeywordIdeasBodySchema.safeParse({
      topicDescription: "ab",
    });
    expect(result.success).toBe(false);
  });

  it("rejects topic over 500 characters", () => {
    const result = KeywordIdeasBodySchema.safeParse({
      topicDescription: "a".repeat(501),
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid audienceLevel", () => {
    const result = KeywordIdeasBodySchema.safeParse({
      topicDescription: "coffee brewing",
      audienceLevel: "expert",
    });
    expect(result.success).toBe(false);
  });
});
