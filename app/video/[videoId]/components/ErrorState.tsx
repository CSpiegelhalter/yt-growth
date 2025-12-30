"use client";

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
 */
export function ErrorState({
  error,
  channelId,
  backLink,
  onRetry,
}: ErrorStateProps) {
  const router = useRouter();

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
      return `You used ${error.used}/${error.limit} video analyses today. You can analyze more after ${formatResetAt(error.resetAt)}.`;
    }
    if (error?.kind === "youtube_permissions") {
      return "Your Google connection is missing YouTube Analytics permissions (often because permissions were denied). Reconnect Google and allow the requested access.";
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
          {error?.kind === "youtube_permissions" && (
            <a className={s.backBtn} href="/api/integrations/google/start">
              Reconnect Google
            </a>
          )}

          {(error?.kind === "limit_reached" ||
            error?.kind === "upgrade_required") && (
            <a className={s.backBtn} href="/api/integrations/stripe/checkout">
              Upgrade to Pro — {formatUsd(SUBSCRIPTION.PRO_MONTHLY_PRICE_USD)}/{SUBSCRIPTION.PRO_INTERVAL}
            </a>
          )}

          <button onClick={onRetry} className={s.secondaryBtn} type="button">
            Try Again
          </button>

          <button
            onClick={() => router.back()}
            className={s.secondaryBtn}
            type="button"
          >
            Go Back
          </button>
        </div>
      </div>
    </main>
  );
}

