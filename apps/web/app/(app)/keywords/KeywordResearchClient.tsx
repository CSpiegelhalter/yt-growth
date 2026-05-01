"use client";

import { useEffect, useRef } from "react";

import { AuthModal } from "@/components/auth";
import { PageContainer } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";

import { KeywordEmptyState } from "./components/KeywordEmptyState";
import { KeywordPaywall } from "./components/KeywordPaywall";
import { KeywordSearchForm } from "./components/KeywordSearchForm";
import { ResearchTab } from "./components/ResearchTab";
import { SearchHistoryBar } from "./components/SearchHistoryBar";
import { TrendingNowBar } from "./components/TrendingNowBar";
import { DATABASE_OPTIONS } from "./constants";
import s from "./keywords.module.css";
import { handleKeyDown, useKeywordInput } from "./use-keyword-input";
import { useKeywordSearch } from "./use-keyword-search";

type Props = {
  hideTrendingBar?: boolean;
  initialKeyword?: string;
};

function pickCurrentKeyword(searched: string[], current: string[]): string {
  return searched[0] || current[0] || "";
}

/**
 * Run an initial search exactly once when the page mounts with a `?q=` param.
 * The latest executeSearch + database are stashed in refs (updated in effects,
 * not during render) so the trigger effect's dep list stays just the keyword.
 */
function useAutoRunInitialKeyword(
  initialKeyword: string | undefined,
  executeSearch: (keywords: string[], database: string) => void,
  database: string,
) {
  const executeSearchRef = useRef(executeSearch);
  const databaseRef = useRef(database);
  const ranRef = useRef(false);

  useEffect(() => {
    executeSearchRef.current = executeSearch;
  });
  useEffect(() => {
    databaseRef.current = database;
  });

  useEffect(() => {
    if (ranRef.current) {return;}
    if (!initialKeyword) {return;}
    ranRef.current = true;
    executeSearchRef.current([initialKeyword], databaseRef.current);
  }, [initialKeyword]);
}

export function KeywordResearchClient({
  hideTrendingBar = false,
  initialKeyword,
}: Props = {}) {
  const { toast } = useToast();

  const input = useKeywordInput(toast);
  const search = useKeywordSearch(toast);

  function executeSearch(kws: string[], db: string, addToHistory = true) {
    if (kws.length === 0) {return;}
    search.resetResults();
    search.setError(null);
    search.setShowPaywall(false);
    input.setSearchedKeywords(kws);
    if (addToHistory) {input.pushHistory(kws);}
    void search.fetchRelatedKeywords(kws, db);
    void search.fetchRankings(kws[0], db);
    void search.fetchTrends(kws[0], db);
  }

  function handleSearch() {
    const allKeywords = input.collectAndClearKeywords();
    if (allKeywords.length === 0) { toast("Please add at least one keyword", "error"); return; }
    executeSearch(allKeywords, input.database);
  }

  function handleSubmit(e: React.FormEvent) { e.preventDefault(); handleSearch(); }

  function handleAuthSuccess() {
    const pending = search.consumePendingRequest();
    if (pending) {
      setTimeout(() => { executeSearch([pending.keyword], pending.database); }, 500);
    }
  }

  function handleKeywordClick(kw: string) {
    input.collectAndClearKeywords();
    executeSearch([kw], input.database);
  }

  function handleHistoryClick(index: number) {
    const historyEntry = input.searchHistory[index];
    if (!historyEntry) {return;}
    input.truncateHistory(index);
    search.resetResults();
    search.setError(null);
    input.setSearchedKeywords(historyEntry);
    void search.fetchRelatedKeywords(historyEntry, input.database);
    void search.fetchRankings(historyEntry[0], input.database);
    void search.fetchTrends(historyEntry[0], input.database);
  }

  function handleGoBack() {
    if (input.searchHistory.length > 1) {handleHistoryClick(input.searchHistory.length - 2);}
  }

  function handleClearHistory() {
    input.clearHistory();
    search.resetResults();
  }

  function handleTrendingTopicClick(query: string) {
    input.collectAndClearKeywords();
    executeSearch([query], input.database);
  }

  useAutoRunInitialKeyword(initialKeyword, executeSearch, input.database);

  return (
    <PageContainer>
      {!hideTrendingBar && <TrendingNowBar onTopicClick={handleTrendingTopicClick} />}

      <KeywordSearchForm
        inputRef={input.inputRef}
        inputValue={input.inputValue}
        setInputValue={input.setInputValue}
        keywords={input.keywords}
        database={input.database}
        setDatabase={input.setDatabase}
        databaseOptions={DATABASE_OPTIONS}
        isLoading={search.isLoading}
        onSubmit={handleSubmit}
        onKeyDown={(e) => handleKeyDown(e, input.inputValue, input.keywords, input.addKeyword, input.removeKeyword, handleSearch)}
        onRemoveKeyword={input.removeKeyword}
      />

      {input.searchHistory.length > 0 && (
        <SearchHistoryBar
          searchHistory={input.searchHistory}
          canGoBack={input.canGoBack}
          onGoBack={handleGoBack}
          onHistoryClick={handleHistoryClick}
          onClearHistory={handleClearHistory}
        />
      )}

      {search.error && (
        <div className={s.errorCard}>
          <h3>{search.error.title}</h3>
          <p>{search.error.message}</p>
          <button onClick={handleSearch} className={s.retryButton}>Try again</button>
        </div>
      )}

      {(search.hasResults || search.isLoading) && !search.error && (
        <ResearchTab
          keyword={pickCurrentKeyword(input.searchedKeywords, input.currentSearch)}
          relatedKeywords={search.relatedKeywords}
          rankings={search.rankings}
          trends={search.trends}
          loadingKeywords={search.loadingKeywords}
          loadingRankings={search.loadingRankings}
          loadingTrends={search.loadingTrends}
          onKeywordClick={handleKeywordClick}
          onSignInClick={() => search.setShowAuthModal(true)}
        />
      )}

      {!search.hasResults && !search.isLoading && !search.error && input.searchHistory.length === 0 && (
        <KeywordEmptyState onAddKeyword={input.addKeyword} />
      )}

      {search.showPaywall && (
        <KeywordPaywall onClose={() => search.setShowPaywall(false)} />
      )}

      <AuthModal
        isOpen={search.showAuthModal}
        onClose={() => search.setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
        title="Sign in to search"
        description="Create a free account to search keywords and get video ideas."
      />
    </PageContainer>
  );
}
