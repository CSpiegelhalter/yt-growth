"use client";

import Link from "next/link";
import { useCallback, useState } from "react";

import { AnalyzeInput } from "@/app/(app)/analyze/_components/AnalyzeInput";
import s from "@/app/(app)/analyze/style.module.css";
import { PageContainer } from "@/components/ui";
import { extractVideoId, validateYouTubeUrl } from "@/lib/shared/youtube-url";
import type { CompetitorVideoAnalysis } from "@/types/api";

import { AnalyzeResultsPublic } from "./AnalyzeResultsPublic";
import { RecentAnalyses, saveRecentAnalysis } from "./RecentAnalyses";
import { UsageLimitBanner } from "./UsageLimitBanner";

type PageState =
  | { view: "input" }
  | { view: "loading" }
  | { view: "results"; data: CompetitorVideoAnalysis }
  | { view: "error"; message: string };

const ERROR_MESSAGES: Record<string, string> = {
  VALIDATION_ERROR: "Please enter a valid YouTube video URL.",
  NOT_FOUND:
    "This video couldn't be found. It may be private or deleted.",
  RATE_LIMITED:
    "You've reached your analysis limit. Please try again later.",
  LIMIT_REACHED:
    "You've used all your daily analyses. Upgrade for more.",
  TIMEOUT: "Analysis took too long. Please try again.",
};

export function AnalyzePublicClient() {
  const [state, setState] = useState<PageState>({ view: "input" });
  const [url, setUrl] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);

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
        const res = await fetch("/api/analyze/public", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: url.trim() }),
        });

        const remainingHeader = res.headers.get("X-RateLimit-Remaining");
        if (remainingHeader !== null) {
          setRemaining(Number.parseInt(remainingHeader, 10));
        }

        if (!res.ok) {
          const body = await res.json().catch(() => null);
          const code =
            (body as Record<string, Record<string, string>>)?.error?.code ?? "";
          const message =
            ERROR_MESSAGES[code] ??
            (body as Record<string, Record<string, string>>)?.error?.message ??
            "Something went wrong. Please try again.";
          setState({ view: "error", message });
          return;
        }

        const data = (await res.json()) as CompetitorVideoAnalysis;
        setState({ view: "results", data });

        saveRecentAnalysis({
          videoId: data.video.videoId,
          title: data.video.title,
          thumbnailUrl: data.video.thumbnailUrl,
          channelTitle: data.video.channelTitle,
          analyzedAt: new Date().toISOString(),
        });

        const videoId = extractVideoId(url);
        if (videoId) {
          window.history.replaceState(null, "", `/analyze/${videoId}`);
        }
      } catch {
        setState({
          view: "error",
          message: "Something went wrong. Please try again.",
        });
      }
    },
    [url],
  );

  return (
    <PageContainer>
      <div>
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

        {remaining !== null && state.view === "input" && (
          <UsageLimitBanner remaining={remaining} />
        )}

        {state.view === "input" && <RecentAnalyses />}

        {state.view === "loading" && (
          <div className={s.loadingState}>
            <div className={s.loadingSpinner} />
            <p className={s.loadingText}>Analyzing video&hellip;</p>
          </div>
        )}

        {state.view === "results" && (
          <>
            {remaining !== null && <UsageLimitBanner remaining={remaining} />}
            <AnalyzeResultsPublic data={state.data} />

            <div className={s.signupCta}>
              <h3 className={s.signupCtaTitle}>
                Get Unlimited Video Analysis
              </h3>
              <p className={s.signupCtaDesc}>
                Sign up for a free account to get personalized remix ideas
                tailored to your channel, unlimited analyses, and more.
              </p>
              <Link href="/auth/signup" className={s.analyzeBtn}>
                Sign Up Free
              </Link>
            </div>
          </>
        )}

        {state.view === "error" && (
          <div className={s.errorState}>
            <p className={s.errorMessage}>{state.message}</p>
            <button
              type="button"
              className={s.retryBtn}
              onClick={() => setState({ view: "input" })}
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
