import { describe, expect, test } from "bun:test";
import {
  findTagSource,
  filterTraceableTags,
  isForbiddenTag,
  type ContentContext,
} from "@/lib/tag-filter";

describe("findTagSource", () => {
  test("finds tag in title", () => {
    const content: ContentContext = {
      title: "How to Build a React App",
      description: "Some description",
    };
    expect(findTagSource("react", content)).toBe("title");
    expect(findTagSource("React App", content)).toBe("title");
    expect(findTagSource("build", content)).toBe("title");
  });

  test("finds tag in description", () => {
    const content: ContentContext = {
      title: "My Video",
      description: "Learn TypeScript and React in this tutorial",
    };
    expect(findTagSource("typescript", content)).toBe("description");
    expect(findTagSource("tutorial", content)).toBe("description");
  });

  test("finds tag in transcript", () => {
    const content: ContentContext = {
      title: "Coding Tutorial",
      description: "Basic intro",
      transcript: "Today we're going to learn about NextJS and serverless functions",
    };
    expect(findTagSource("nextjs", content)).toBe("transcript");
    expect(findTagSource("serverless", content)).toBe("transcript");
  });

  test("finds tag in existing tags", () => {
    const content: ContentContext = {
      title: "My Video",
      existingTags: ["programming", "coding tutorial", "web development"],
    };
    expect(findTagSource("programming", content)).toBe("existing_tag");
    expect(findTagSource("coding tutorial", content)).toBe("existing_tag");
  });

  test("finds tag in user context", () => {
    const content: ContentContext = {
      title: "Developer Setup Guide",
      userContext: {
        platform: "mac",
        tooling: "homebrew",
        audience: "beginner",
      },
    };
    expect(findTagSource("mac", content)).toBe("context");
    expect(findTagSource("homebrew", content)).toBe("context");
    expect(findTagSource("beginner", content)).toBe("context");
  });

  test("returns null for tags not found anywhere", () => {
    const content: ContentContext = {
      title: "React Tutorial",
      description: "Learn React",
    };
    expect(findTagSource("angular", content)).toBeNull();
    expect(findTagSource("python", content)).toBeNull();
    expect(findTagSource("windows", content)).toBeNull();
  });
});

describe("filterTraceableTags", () => {
  test("keeps tags found in content", () => {
    const content: ContentContext = {
      title: "React TypeScript Tutorial",
      description: "Build web apps with React",
    };
    const tags = ["react", "typescript", "web apps", "angular", "vue"];
    const result = filterTraceableTags(tags, content);
    
    expect(result).toHaveLength(3);
    expect(result.map((t) => t.tag)).toContain("react");
    expect(result.map((t) => t.tag)).toContain("typescript");
    expect(result.map((t) => t.tag)).toContain("web apps");
    expect(result.map((t) => t.tag)).not.toContain("angular");
    expect(result.map((t) => t.tag)).not.toContain("vue");
  });

  test("removes duplicate tags", () => {
    const content: ContentContext = {
      title: "React Tutorial",
    };
    const tags = ["react", "React", "REACT", "react tutorial"];
    const result = filterTraceableTags(tags, content);
    
    // Should only have unique normalized tags
    const tagTexts = result.map((t) => t.tag.toLowerCase());
    const unique = [...new Set(tagTexts)];
    expect(unique.length).toBe(result.length);
  });

  test("filters platform-specific tags without context", () => {
    const content: ContentContext = {
      title: "Developer Setup Guide",
      description: "Set up your development environment",
    };
    const tags = ["developer setup", "windows setup", "macos setup", "linux setup"];
    const result = filterTraceableTags(tags, content);
    
    // Should not include platform-specific tags without user context
    expect(result.map((t) => t.tag)).not.toContain("windows setup");
    expect(result.map((t) => t.tag)).not.toContain("macos setup");
    expect(result.map((t) => t.tag)).not.toContain("linux setup");
  });

  test("allows platform-specific tags with context", () => {
    const content: ContentContext = {
      title: "Developer Setup Guide",
      description: "Set up your development environment",
      userContext: {
        platform: "mac",
      },
    };
    const tags = ["developer setup", "macos", "mac setup guide"];
    const result = filterTraceableTags(tags, content);
    
    // mac is in context, so mac-related tags should be allowed
    expect(result.map((t) => t.tag)).toContain("macos");
  });

  test("filters tooling-specific tags without context", () => {
    const content: ContentContext = {
      title: "Package Manager Tutorial",
      description: "Learn about package managers",
    };
    const tags = ["package manager", "homebrew", "chocolatey", "npm"];
    const result = filterTraceableTags(tags, content);
    
    // npm is not tooling-specific, should be included if found
    // homebrew and chocolatey are tooling-specific, should be filtered
    expect(result.map((t) => t.tag)).not.toContain("homebrew");
    expect(result.map((t) => t.tag)).not.toContain("chocolatey");
  });

  test("includes source field for each tag", () => {
    const content: ContentContext = {
      title: "React Tutorial",
      description: "Learn TypeScript",
      transcript: "Today we build with NextJS",
    };
    const tags = ["react", "typescript", "nextjs"];
    const result = filterTraceableTags(tags, content);
    
    const reactTag = result.find((t) => t.tag === "react");
    const tsTag = result.find((t) => t.tag === "typescript");
    const nextTag = result.find((t) => t.tag === "nextjs");
    
    expect(reactTag?.source).toBe("title");
    expect(tsTag?.source).toBe("description");
    expect(nextTag?.source).toBe("transcript");
  });
});

describe("isForbiddenTag", () => {
  test("rejects generic spam tags", () => {
    expect(isForbiddenTag("viral")).toBe(true);
    expect(isForbiddenTag("trending")).toBe(true);
    expect(isForbiddenTag("fyp")).toBe(true);
    expect(isForbiddenTag("youtube")).toBe(true);
    expect(isForbiddenTag("subscribe")).toBe(true);
  });

  test("rejects just-a-year tags", () => {
    expect(isForbiddenTag("2024")).toBe(true);
    expect(isForbiddenTag("2025")).toBe(true);
  });

  test("allows legitimate tags", () => {
    expect(isForbiddenTag("react tutorial")).toBe(false);
    expect(isForbiddenTag("web development")).toBe(false);
    expect(isForbiddenTag("coding 2024")).toBe(false); // year as part of phrase is ok
    expect(isForbiddenTag("typescript")).toBe(false);
  });

  test("is case-insensitive", () => {
    expect(isForbiddenTag("VIRAL")).toBe(true);
    expect(isForbiddenTag("Trending")).toBe(true);
    expect(isForbiddenTag("FYP")).toBe(true);
  });
});
