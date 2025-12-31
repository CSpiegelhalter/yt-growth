"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import s from "../style.module.css";
import { formatResetAt } from "./helpers";
import { SUBSCRIPTION, formatUsd } from "@/lib/product";

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

type ErrorStateProps = {
  error: InsightsError | null;
  channelId?: string;
  backLink: { href: string; label: string };
  onRetry: () => void;
};

/**
 * ErrorState - Full-page error display with recovery options
 * Auto-redirects to Google OAuth for permission errors
 */
export function ErrorState({
  error,
  channelId,
  backLink,
  onRetry,
}: ErrorStateProps) {
  const router = useRouter();
  const [redirectCountdown, setRedirectCountdown] = useState(3);

  // Auto-redirect to Google OAuth for permission errors (but prevent infinite loop)
  useEffect(() => {
    if (error?.kind !== "youtube_permissions") return;

    // Check if we just came from OAuth (prevent redirect loop)
    const urlParams = new URLSearchParams(window.location.search);
    const justReconnected = urlParams.get("reconnected") === "1";
    const lastOAuthAttempt = sessionStorage.getItem("lastOAuthAttempt");
    const recentOAuth =
      lastOAuthAttempt && Date.now() - parseInt(lastOAuthAttempt) < 60000; // 1 minute

    if (justReconnected || recentOAuth) {
      // Don't auto-redirect - show the error message instead
      setRedirectCountdown(-1); // -1 = disabled
      return;
    }

    // Store OAuth attempt timestamp
    sessionStorage.setItem("lastOAuthAttempt", Date.now().toString());

    // Build reconnect URL with channelId so we update the RIGHT GoogleAccount
    const reconnectUrl = channelId
      ? `/api/integrations/google/start?channelId=${encodeURIComponent(
          channelId
        )}`
      : "/api/integrations/google/start";

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
  }, [error?.kind]);

  const getErrorTitle = () => {
    if (error?.kind === "limit_reached") return "Daily limit reached";
    if (error?.kind === "youtube_permissions") return "Permissions needed";
    if (error?.kind === "upgrade_required") return "Upgrade required";
    return "Couldn't load insights";
  };

  const getErrorDescription = () => {
    if (!channelId) {
      return "Please select a channel to view video insights.";
    }
    if (error?.kind === "limit_reached") {
      return `You used ${error.used}/${
        error.limit
      } video analyses today. You can analyze more after ${formatResetAt(
        error.resetAt
      )}.`;
    }
    if (error?.kind === "youtube_permissions") {
      if (redirectCountdown === -1) {
        // Already tried reconnecting - show helpful message
        return "The Google account you connected doesn't have access to this channel's analytics. Make sure you connect the Google account that OWNS this YouTube channel (the account you use to log into YouTube Studio for this channel).";
      }
      return `Your Google connection needs to be refreshed. Redirecting to Google in ${redirectCountdown}...`;
    }
    if (error?.kind === "upgrade_required") {
      return error.message;
    }
    if (error?.kind === "generic") {
      return error.message;
    }
    return "We couldn't analyze this video. Try again later.";
  };

  return (
    <main className={s.page}>
      <Link href={backLink.href} className={s.backLink}>
        ← {backLink.label}
      </Link>
      <div className={s.errorState}>
        <h2 className={s.errorTitle}>{getErrorTitle()}</h2>
        <p className={s.errorDesc}>{getErrorDescription()}</p>
        {error?.requestId && (
          <p className={s.muted} style={{ marginTop: 8 }}>
            Request ID: <code>{error.requestId}</code>
          </p>
        )}

        <div className={s.errorActions}>
          {error?.kind === "youtube_permissions" ? (
            redirectCountdown === -1 ? (
              // Already tried - show manual reconnect option
              <>
                <a
                  className={s.backBtn}
                  href={
                    channelId
                      ? `/api/integrations/google/start?channelId=${encodeURIComponent(
                          channelId
                        )}`
                      : "/api/integrations/google/start"
                  }
                >
                  Try a Different Google Account
                </a>
                <button
                  onClick={onRetry}
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
            ) : (
              // Auto-redirecting
              <>
                <div className={s.redirectingBox}>
                  <span className={s.spinner} />
                  Redirecting to Google...
                </div>
                <a
                  href={
                    channelId
                      ? `/api/integrations/google/start?channelId=${encodeURIComponent(
                          channelId
                        )}`
                      : "/api/integrations/google/start"
                  }
                  className={s.secondaryBtn}
                  style={{ marginTop: "0.5rem" }}
                >
                  Click here if not redirected
                </a>
              </>
            )
          ) : (
            <>
              {(error?.kind === "limit_reached" ||
                error?.kind === "upgrade_required") && (
                <a
                  className={s.backBtn}
                  href="/api/integrations/stripe/checkout"
                >
                  Upgrade to Pro —{" "}
                  {formatUsd(SUBSCRIPTION.PRO_MONTHLY_PRICE_USD)}/
                  {SUBSCRIPTION.PRO_INTERVAL}
                </a>
              )}

              <button
                onClick={onRetry}
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
          )}
        </div>
      </div>
    </main>
  );
}
