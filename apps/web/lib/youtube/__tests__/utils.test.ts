/**
 * YouTube API Utils Unit Tests
 */
import { describe, it, expect } from "vitest";
import {
  decodeHtmlEntities,
  parseDuration,
  chunk,
  mapLimit,
  yyyyMmDd,
  daysSince,
} from "../utils";

describe("decodeHtmlEntities", () => {
  it("decodes numeric character references", () => {
    expect(decodeHtmlEntities("Hello&#39;World")).toBe("Hello'World");
    expect(decodeHtmlEntities("Test&#33;")).toBe("Test!");
  });

  it("decodes hex character references", () => {
    expect(decodeHtmlEntities("Hello&#x27;World")).toBe("Hello'World");
    expect(decodeHtmlEntities("&#x41;BC")).toBe("ABC");
  });

  it("decodes named entities", () => {
    expect(decodeHtmlEntities("&amp;")).toBe("&");
    expect(decodeHtmlEntities("&lt;div&gt;")).toBe("<div>");
    expect(decodeHtmlEntities("&quot;quoted&quot;")).toBe('"quoted"');
    expect(decodeHtmlEntities("&apos;apostrophe&apos;")).toBe("'apostrophe'");
  });

  it("handles mixed entities", () => {
    expect(decodeHtmlEntities("Tom &amp; Jerry&#39;s &#x3C;show&#x3E;")).toBe(
      "Tom & Jerry's <show>"
    );
  });

  it("returns unchanged text without entities", () => {
    expect(decodeHtmlEntities("Hello World")).toBe("Hello World");
  });
});

describe("parseDuration", () => {
  it("parses hours, minutes, and seconds", () => {
    expect(parseDuration("PT1H30M45S")).toBe(5445);
  });

  it("parses minutes and seconds only", () => {
    expect(parseDuration("PT4M13S")).toBe(253);
  });

  it("parses seconds only", () => {
    expect(parseDuration("PT30S")).toBe(30);
  });

  it("parses hours only", () => {
    expect(parseDuration("PT2H")).toBe(7200);
  });

  it("parses minutes only", () => {
    expect(parseDuration("PT15M")).toBe(900);
  });

  it("returns 0 for invalid format", () => {
    expect(parseDuration("invalid")).toBe(0);
    expect(parseDuration("")).toBe(0);
  });
});

describe("chunk", () => {
  it("splits array into equal chunks", () => {
    expect(chunk([1, 2, 3, 4, 5, 6], 2)).toEqual([
      [1, 2],
      [3, 4],
      [5, 6],
    ]);
  });

  it("handles remainder in last chunk", () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it("handles array smaller than chunk size", () => {
    expect(chunk([1, 2], 5)).toEqual([[1, 2]]);
  });

  it("handles empty array", () => {
    expect(chunk([], 3)).toEqual([]);
  });

  it("handles chunk size of 1", () => {
    expect(chunk([1, 2, 3], 1)).toEqual([[1], [2], [3]]);
  });
});

describe("mapLimit", () => {
  it("processes items and preserves order", async () => {
    const items = [1, 2, 3, 4, 5];
    const result = await mapLimit(items, 2, async (n) => n * 2);
    expect(result).toEqual([2, 4, 6, 8, 10]);
  });

  it("respects concurrency limit", async () => {
    let concurrent = 0;
    let maxConcurrent = 0;

    const items = [1, 2, 3, 4, 5, 6];
    await mapLimit(items, 2, async (n) => {
      concurrent++;
      maxConcurrent = Math.max(maxConcurrent, concurrent);
      await new Promise((r) => setTimeout(r, 10));
      concurrent--;
      return n;
    });

    expect(maxConcurrent).toBeLessThanOrEqual(2);
  });

  it("handles empty array", async () => {
    const result = await mapLimit([], 2, async (n) => n);
    expect(result).toEqual([]);
  });

  it("handles limit of 1", async () => {
    let concurrent = 0;
    let maxConcurrent = 0;

    const items = [1, 2, 3];
    await mapLimit(items, 1, async (n) => {
      concurrent++;
      maxConcurrent = Math.max(maxConcurrent, concurrent);
      await new Promise((r) => setTimeout(r, 5));
      concurrent--;
      return n;
    });

    expect(maxConcurrent).toBe(1);
  });

  it("handles limit larger than array", async () => {
    const items = [1, 2, 3];
    const result = await mapLimit(items, 10, async (n) => n * 2);
    expect(result).toEqual([2, 4, 6]);
  });

  it("provides correct index to callback", async () => {
    const items = ["a", "b", "c"];
    const indices: number[] = [];
    await mapLimit(items, 2, async (_, index) => {
      indices.push(index);
      return null;
    });
    expect(indices.sort()).toEqual([0, 1, 2]);
  });
});

describe("yyyyMmDd", () => {
  it("formats date as YYYY-MM-DD", () => {
    const date = new Date("2024-03-15T10:30:00Z");
    expect(yyyyMmDd(date)).toBe("2024-03-15");
  });

  it("pads month and day with zeros", () => {
    const date = new Date("2024-01-05T00:00:00Z");
    expect(yyyyMmDd(date)).toBe("2024-01-05");
  });
});

describe("daysSince", () => {
  it("calculates days since a date", () => {
    const nowMs = new Date("2024-03-15T00:00:00Z").getTime();
    const isoDate = "2024-03-10T00:00:00Z";
    expect(daysSince(isoDate, nowMs)).toBe(5);
  });

  it("returns at least 1 for same day", () => {
    const nowMs = new Date("2024-03-15T00:00:00Z").getTime();
    const isoDate = "2024-03-15T00:00:00Z";
    expect(daysSince(isoDate, nowMs)).toBe(1);
  });

  it("returns at least 1 for future dates", () => {
    const nowMs = new Date("2024-03-15T00:00:00Z").getTime();
    const isoDate = "2024-03-20T00:00:00Z";
    expect(daysSince(isoDate, nowMs)).toBe(1);
  });
});
