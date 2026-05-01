"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { AnalyzeInput } from "@/app/(app)/analyze/_components/AnalyzeInput";
import s from "@/app/(app)/analyze/style.module.css";
import { AnalyzeResultsPublic } from "@/components/analyze/AnalyzeResultsPublic";
import { saveRecentAnalysis } from "@/components/analyze/RecentAnalyses";
import { UsageLimitBanner } from "@/components/analyze/UsageLimitBanner";
import { PageContainer } from "@/components/ui";
import { validateYouTubeUrl } from "@/lib/shared/youtube-url";
import type { CompetitorVideoAnalysis } from "@/types/api";

type PageState =
  | { view: "loading" }
  | { view: "results"; data: CompetitorVideoAnalysis }
  | { view: "error"; message: string };

type Props = {
  videoId: string;
};

export function AnalyzeShareClient({ videoId }: Props) {
  const [state, setState] = useState<PageState>({ view: "loading" });
  const [remaining, setRemaining] = useState<number | null>(null);
  const [quickUrl, setQuickUrl] = useState("");
  const [quickError, setQuickError] = useState<string | null>(null);
  const didFetch = useRef(false);

  const handleAnalyze = useCallback(async (url: string) => {
    setState({ view: "loading" });
    try {
      const res = await fetch("/api/analyze/public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const remainingHeader = res.headers.get("X-RateLimit-Remaining");
      if (remainingHeader !== null) {
        setRemaining(Number.parseInt(remainingHeader, 10));
      }

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const errorObj = (body as Record<string, unknown>)?.error;
        const message =
          (typeof errorObj === "object" && errorObj !== null
            ? (errorObj as Record<string, string>).message
            : null) ?? "Something went wrong. Please try again.";
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
    } catch {
      setState({ view: "error", message: "Something went wrong. Please try again." });
    }
  }, []);

  useEffect(() => {
    if (didFetch.current) {return;}
    didFetch.current = true;
    void handleAnalyze(`https://www.youtube.com/watch?v=${videoId}`);
  }, [videoId, handleAnalyze]);

  const handleQuickSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const validationError = validateYouTubeUrl(quickUrl);
      if (validationError) {
        setQuickError(validationError);
        return;
      }
      setQuickError(null);
      void handleAnalyze(quickUrl.trim());
    },
    [quickUrl, handleAnalyze],
  );

  return (
    <PageContainer>
      {state.view === "loading" && (
        <div className={s.loadingState}>
          <div className={s.loadingSpinner} />
          <p className={s.loadingText}>Analyzing video&hellip;</p>
        </div>
      )}

      {state.view === "results" && (
        <>
          <AnalyzeInput
            url={quickUrl}
            setUrl={(v) => { setQuickUrl(v); setQuickError(null); }}
            loading={false}
            error={quickError}
            onSubmit={handleQuickSubmit}
          />

          {remaining !== null && <UsageLimitBanner remaining={remaining} />}

          <AnalyzeResultsPublic data={state.data} />

          <div className={s.signupCta}>
            <h3 className={s.signupCtaTitle}>Want to analyze YOUR video?</h3>
            <AnalyzeInput
              url={quickUrl}
              setUrl={(v) => { setQuickUrl(v); setQuickError(null); }}
              loading={false}
              error={quickError}
              onSubmit={handleQuickSubmit}
            />
            <p className={s.signupCtaDesc}>
              <Link href="/auth/signup" className={s.signupCtaLink}>
                Sign up free
              </Link>
              {" "}to save analyses and get personalized remix ideas.
            </p>
          </div>
        </>
      )}

      {state.view === "error" && (
        <div className={s.errorState}>
          <p className={s.errorMessage}>{state.message}</p>
          <Link href="/analyze" className={s.retryBtn}>
            Try Another Video
          </Link>
        </div>
      )}
    </PageContainer>
  );
}
