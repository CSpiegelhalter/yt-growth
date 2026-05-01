import { KeywordResearchClient } from "./KeywordResearchClient";

type SearchParams = Promise<{ q?: string }>;

/**
 * /keywords — dedicated keyword research workbench.
 * Accepts ?q=<keyword> to pre-run a search (e.g. from a Trending gap card).
 */
export default async function KeywordsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { q } = await searchParams;
  const initialKeyword = typeof q === "string" && q.trim() ? q.trim() : undefined;
  return <KeywordResearchClient initialKeyword={initialKeyword} hideTrendingBar />;
}
