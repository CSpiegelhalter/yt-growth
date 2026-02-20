"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import s from "./style.module.css";
import { formatResetAt } from "./components/helpers";
import { SUBSCRIPTION, formatUsd } from "@/lib/product";
import { ErrorState } from "@/components/ui/ErrorState";
import {
  canAttemptOAuth,
  recordOAuthAttempt,
} from "@/lib/storage/oauthAttemptTracker";

type InsightsError =
  | {
      kind: "limit_reached";
      used: number;
      limit: number;
      remaining: number;
      resetAt: string;
      upgrade: boolean;
      requestId?: string;
    }
  | { kind: "upgrade_required"; message: string; requestId?: string }
  | { kind: "youtube_permissions"; message: string; requestId?: string }
  | { kind: "generic"; message: string; status: number; requestId?: string };

type Props = {
  error: InsightsError;
  channelId?: string;
  backLink: { href: string; label: string };
};

/**
 * VideoInsightsError - Error page for video insights
 * Uses canonical ErrorState for card UI, adds page layout and OAuth auto-redirect.
 */
export function VideoInsightsError({ error, channelId, backLink }: Props) {
  const router = useRouter();
  const [redirectCountdown, setRedirectCountdown] = useState(3);

  const reconnectUrl = channelId
    ? `/api/integrations/google/start?channelId=${encodeURIComponent(channelId)}`
    : "/api/integrations/google/start";

  useEffect(() => {
    if (error.kind !== "youtube_permissions") return;

    const urlParams = new URLSearchParams(window.location.search);
    const justReconnected = urlParams.get("reconnected") === "1";

    if (justReconnected || !canAttemptOAuth()) {
      setRedirectCountdown(-1);
      return;
    }

    recordOAuthAttempt();

    const timer = setInterval(() => {
      setRedirectCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          window.location.href = reconnectUrl;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [error.kind, channelId, reconnectUrl]);

  const handleRetry = () => {
    router.refresh();
  };

  const getErrorTitle = () => {
    if (error.kind === "limit_reached") return "Daily limit reached";
    if (error.kind === "youtube_permissions") return "Permissions needed";
    if (error.kind === "upgrade_required") return "Upgrade required";
    return "Couldn't load insights";
  };

  const getErrorDescription = () => {
    if (error.kind === "limit_reached") {
      return `You used ${error.used}/${error.limit} video analyses today. You can analyze more after ${formatResetAt(error.resetAt)}.`;
    }
    if (error.kind === "youtube_permissions") {
      if (redirectCountdown === -1) {
        return "The Google account you connected doesn't have access to this channel's analytics. Make sure you connect the Google account that OWNS this YouTube channel (the account you use to log into YouTube Studio for this channel).";
      }
      return `Your Google connection needs to be refreshed. Redirecting to Google in ${redirectCountdown}...`;
    }
    if (error.kind === "upgrade_required") {
      return error.message;
    }
    if (error.kind === "generic") {
      return error.message;
    }
    return "We couldn't analyze this video. Try again later.";
  };

  const renderActions = () => {
    if (error.kind === "youtube_permissions") {
      if (redirectCountdown === -1) {
        return (
          <>
            <a className={s.backBtn} href={reconnectUrl}>
              Try a Different Google Account
            </a>
            <button
              onClick={handleRetry}
              className={s.secondaryBtn}
              type="button"
            >
              Try Again
            </button>
            <button
              onClick={() => router.back()}
              className={s.secondaryBtn}
              type="button"
            >
              Go Back
            </button>
          </>
        );
      }
      return (
        <>
          <div className={s.redirectingBox}>
            <span className={s.spinner} />
            Redirecting to Google...
          </div>
          <a
            href={reconnectUrl}
            className={s.secondaryBtn}
            style={{ marginTop: "0.5rem" }}
          >
            Click here if not redirected
          </a>
        </>
      );
    }

    return (
      <>
        {(error.kind === "limit_reached" ||
          error.kind === "upgrade_required") && (
          <a className={s.backBtn} href="/api/integrations/stripe/checkout">
            Upgrade to Pro —{" "}
            {formatUsd(SUBSCRIPTION.PRO_MONTHLY_PRICE_USD)}/
            {SUBSCRIPTION.PRO_INTERVAL}
          </a>
        )}
        <button
          onClick={handleRetry}
          className={s.secondaryBtn}
          type="button"
        >
          Try Again
        </button>
        <button
          onClick={() => router.back()}
          className={s.secondaryBtn}
          type="button"
        >
          Go Back
        </button>
      </>
    );
  };

  return (
    <main className={s.page}>
      <Link href={backLink.href} className={s.backLink}>
        ← {backLink.label}
      </Link>
      <ErrorState
        title={getErrorTitle()}
        description={getErrorDescription()}
        requestId={error.requestId}
        actions={renderActions()}
      />
    </main>
  );
}
