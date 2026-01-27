import { KeywordResearchClient } from "./KeywordResearchClient";

/**
 * /keywords - Unified Keyword Research Tool
 *
 * Single page for:
 * - Keyword metrics (volume, difficulty, trend)
 * - YouTube rankings (who ranks for this keyword)
 * - Related keywords (filterable/sortable)
 * - Video ideas (AI-generated, on-demand)
 */
export default function KeywordsPage() {
  return <KeywordResearchClient />;
}
