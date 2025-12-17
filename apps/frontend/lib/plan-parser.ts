/**
 * Parser for "Decide-for-Me" plan markdown content
 * Extracts structured data from LLM-generated markdown
 */

export type TitleOption = {
  text: string;
  rationale: string;
  tags: string[];
};

export type ChecklistItem = {
  day: string;
  task: string;
  done: boolean;
};

export type ThumbnailGuidance = {
  points: string[];
};

export type StructuredPlan = {
  bestTopic: {
    title: string;
    rationale: string;
    confidence: "high" | "medium" | "exploratory";
  };
  alternateTopics: Array<{ title: string; angle?: string }>;
  titleOptions: TitleOption[];
  thumbnail: ThumbnailGuidance;
  keywords: string[];
  checklist: ChecklistItem[];
  rawMarkdown: string;
};

/**
 * Parse plan markdown into structured data
 */
export function parsePlanMarkdown(markdown: string): StructuredPlan {
  const plan: StructuredPlan = {
    bestTopic: { title: "", rationale: "", confidence: "high" },
    alternateTopics: [],
    titleOptions: [],
    thumbnail: { points: [] },
    keywords: [],
    checklist: [],
    rawMarkdown: markdown,
  };

  // Split by major sections
  const sections = markdown.split(/^## /m).filter(Boolean);

  for (const section of sections) {
    const lines = section.trim().split("\n");
    const header = lines[0]?.toLowerCase() || "";
    const content = lines.slice(1).join("\n").trim();

    if (header.includes("best next video") || header.includes("🎯")) {
      parseBestTopic(content, plan);
    } else if (header.includes("title option") || header.includes("📝")) {
      parseTitleOptions(content, plan);
    } else if (header.includes("thumbnail") || header.includes("🖼")) {
      parseThumbnail(content, plan);
    } else if (header.includes("tag") || header.includes("keyword") || header.includes("🏷")) {
      parseKeywords(content, plan);
    } else if (header.includes("checklist") || header.includes("✅")) {
      parseChecklist(content, plan);
    }
  }

  return plan;
}

function parseBestTopic(content: string, plan: StructuredPlan): void {
  const lines = content.split("\n");
  
  // Find the main topic title (usually in bold or first significant line)
  for (const line of lines) {
    const boldMatch = line.match(/\*\*"?(.+?)"?\*\*/);
    if (boldMatch && !plan.bestTopic.title) {
      plan.bestTopic.title = boldMatch[1].replace(/^["']|["']$/g, "");
      continue;
    }
    
    // Collect rationale (non-header, non-list lines)
    if (line.trim() && !line.startsWith("#") && !line.startsWith("-") && !line.match(/^\d+\./)) {
      if (plan.bestTopic.title && !plan.bestTopic.rationale) {
        plan.bestTopic.rationale = line.replace(/\*\*/g, "").trim();
      }
    }
  }

  // Parse alternate topics from subsection
  const altMatch = content.match(/### Alternative.*?\n([\s\S]*?)(?=###|$)/i);
  if (altMatch) {
    const altLines = altMatch[1].split("\n");
    for (const line of altLines) {
      const match = line.match(/^\d+\.\s*"?(.+?)"?(?:\s*[-–]\s*(.+))?$/);
      if (match) {
        plan.alternateTopics.push({
          title: match[1].replace(/^["']|["']$/g, ""),
          angle: match[2]?.trim(),
        });
      }
    }
  }
}

function parseTitleOptions(content: string, plan: StructuredPlan): void {
  const lines = content.split("\n");
  
  for (const line of lines) {
    // Match numbered list items with optional rationale after dash
    const match = line.match(/^\d+\.\s*"?(.+?)"?\s*(?:[-–]\s*(.+))?$/);
    if (match) {
      const text = match[1].replace(/^["']|["']$/g, "").trim();
      const rationale = match[2]?.trim() || "";
      
      // Extract implied tags from rationale
      const tags: string[] = [];
      const rationaleLC = rationale.toLowerCase();
      if (rationaleLC.includes("number") || rationaleLC.includes("specific")) tags.push("Specific");
      if (rationaleLC.includes("curiosity") || rationaleLC.includes("question")) tags.push("Curiosity");
      if (rationaleLC.includes("personal") || rationaleLC.includes("journey")) tags.push("Personal");
      if (rationaleLC.includes("challenge") || rationaleLC.includes("stop")) tags.push("Challenge");
      if (rationaleLC.includes("benefit") || rationaleLC.includes("outcome")) tags.push("Outcome");
      if (rationaleLC.includes("authority") || rationaleLC.includes("expert")) tags.push("Authority");
      if (rationaleLC.includes("timely") || rationaleLC.includes("2024") || rationaleLC.includes("2025")) tags.push("Timely");
      if (tags.length === 0 && rationale) tags.push("Proven");

      plan.titleOptions.push({ text, rationale, tags });
    }
  }
}

function parseThumbnail(content: string, plan: StructuredPlan): void {
  const lines = content.split("\n");
  
  for (const line of lines) {
    const cleaned = line.replace(/^[-•*]\s*/, "").trim();
    if (cleaned && !cleaned.startsWith("#")) {
      plan.thumbnail.points.push(cleaned);
    }
  }
}

function parseKeywords(content: string, plan: StructuredPlan): void {
  const lines = content.split("\n");
  
  for (const line of lines) {
    const match = line.match(/^\d+\.\s*(.+)$/);
    if (match) {
      plan.keywords.push(match[1].trim());
    }
  }
}

function parseChecklist(content: string, plan: StructuredPlan): void {
  const lines = content.split("\n");
  
  for (const line of lines) {
    // Match checklist items: - [ ] Day X: task or - [x] Day X: task
    const match = line.match(/^-\s*\[([ x])\]\s*(.+)$/i);
    if (match) {
      const done = match[1].toLowerCase() === "x";
      const taskContent = match[2].trim();
      
      // Try to extract day prefix
      const dayMatch = taskContent.match(/^(Day\s*\d+|Today|Tomorrow):\s*(.+)/i);
      if (dayMatch) {
        plan.checklist.push({
          day: dayMatch[1],
          task: dayMatch[2],
          done,
        });
      } else {
        plan.checklist.push({
          day: "",
          task: taskContent,
          done,
        });
      }
    }
  }
}

/**
 * Get cache status from plan dates
 */
export function getCacheStatus(
  createdAt: string,
  cachedUntil: string
): "fresh" | "cached" | "stale" {
  const now = new Date();
  const created = new Date(createdAt);
  const expires = new Date(cachedUntil);
  
  // Fresh if created within last hour
  const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  if (created > hourAgo) return "fresh";
  
  // Stale if past cache expiry
  if (now > expires) return "stale";
  
  return "cached";
}

