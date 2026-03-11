"use client";

import { useCallback, useRef, useState } from "react";

import { PageContainer } from "@/components/ui";
import { apiFetchJson, isApiClientError } from "@/lib/client/api";
import { validateYouTubeUrl } from "@/lib/shared/youtube-url";
import type { CompetitorVideoAnalysis } from "@/types/api";

import { AnalyzeInput } from "./_components/AnalyzeInput";
import { AnalyzeResults } from "./_components/AnalyzeResults";
import s from "./style.module.css";

type PageState =
  | { view: "input" }
  | { view: "loading" }
  | { view: "results"; data: CompetitorVideoAnalysis }
  | { view: "error"; message: string };

type Props = {
  activeChannelId: string | null;
};

const ERROR_MESSAGES: Record<string, string> = {
  VALIDATION_ERROR: "Please enter a valid YouTube video URL.",
  NOT_FOUND: "This video couldn't be found. It may be private or deleted.",
  RATE_LIMITED: "You've reached your analysis limit. Please try again later.",
  LIMIT_REACHED: "You've used all your daily analyses. Upgrade for more.",
  TIMEOUT: "Analysis took too long. Please try again.",
};

export function AnalyzeClient({ activeChannelId: _activeChannelId }: Props) {
  const [state, setState] = useState<PageState>({ view: "input" });
  const [url, setUrl] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);
  const topRef = useRef<HTMLDivElement>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      const validationError = validateYouTubeUrl(url);
      if (validationError) {
        setInputError(validationError);
        return;
      }

      setInputError(null);
      setState({ view: "loading" });

      try {
        const data = await apiFetchJson<CompetitorVideoAnalysis>("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: url.trim() }),
        });
        setState({ view: "results", data });
      } catch (error) {
        if (isApiClientError(error)) {
          const code = (error as { code?: string }).code ?? "";
          const message = ERROR_MESSAGES[code] ?? error.message ?? "Something went wrong. Please try again.";
          setState({ view: "error", message });
          return;
        }
        setState({ view: "error", message: "Something went wrong. Please try again." });
      }
    },
    [url],
  );

  const handleBack = useCallback(() => {
    setState({ view: "input" });
    topRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  return (
    <PageContainer>
    <div ref={topRef}>
      <header className={s.pageHeader}>
        <h1 className={s.pageHeading}>Analyze Video</h1>
        <p className={s.pageDescription}>
          Paste any YouTube video URL to get a breakdown of what&apos;s working
          &mdash; tags, comments, title patterns, and remix ideas you can use
          for your own content.
        </p>
      </header>

      <AnalyzeInput
        url={url}
        setUrl={(v) => { setUrl(v); setInputError(null); }}
        loading={state.view === "loading"}
        error={inputError}
        onSubmit={handleSubmit}
      />

      {state.view === "loading" && (
        <div className={s.loadingState}>
          <div className={s.loadingSpinner} />
          <p className={s.loadingText}>Analyzing video&hellip;</p>
        </div>
      )}

      {state.view === "results" && (
        <AnalyzeResults data={state.data} onBack={handleBack} />
      )}

      {state.view === "error" && (
        <div className={s.errorState}>
          <p className={s.errorMessage}>{state.message}</p>
          <button type="button" className={s.retryBtn} onClick={() => setState({ view: "input" })}>
            Try Again
          </button>
        </div>
      )}
    </div>
    </PageContainer>
  );
}
