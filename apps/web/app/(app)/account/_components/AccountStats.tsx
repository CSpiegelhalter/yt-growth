"use client";

import type { Me } from "@/types/api";

import s from "./AccountStats.module.css";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

type UsageBucket = { used: number; limit: number } | undefined | null;

function bucketUsed(bucket: UsageBucket, fallbackLimit: number) {
  return {
    used: bucket?.used ?? 0,
    limit: bucket?.limit ?? fallbackLimit,
  };
}

function usageBarColor(percentage: number): string {
  if (percentage > 50) {
    return "var(--color-stormy-teal)";
  }
  if (percentage > 20) {
    return "var(--color-cool-sky)";
  }
  return "var(--color-hot-rose)";
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function UsageBar({ label, used, limit }: { label: string; used: number; limit: number }) {
  const remaining = Math.max(0, limit - used);
  const percentage = (remaining / limit) * 100;

  return (
    <div className={s.usageBar}>
      <div className={s.usageBarHeader}>
        <span>{label}</span>
        <span>{remaining} of {limit} left</span>
      </div>
      <div className={s.usageBarTrack}>
        <div
          className={s.usageBarFill}
          style={{ width: `${percentage}%`, backgroundColor: usageBarColor(percentage) }}
        />
      </div>
    </div>
  );
}

function DailyUsageSection({ usage, resetAt }: { usage: NonNullable<Me["usage"]>; resetAt?: string }) {
  const videoAnalysis = bucketUsed(usage.owned_video_analysis, 5);
  const competitorAnalysis = bucketUsed(usage.competitor_video_analysis, 5);
  const ideaGen = bucketUsed(usage.idea_generate, 10);
  const channelSync = bucketUsed(usage.channel_sync, 3);

  return (
    <div className={s.usageSection}>
      <h4 className={s.usageHeading}>Today&apos;s Usage</h4>
      <UsageBar label="Video Analyses" used={videoAnalysis.used} limit={videoAnalysis.limit} />
      <UsageBar label="Competitor Analyses" used={competitorAnalysis.used} limit={competitorAnalysis.limit} />
      <UsageBar label="Idea Generations" used={ideaGen.used} limit={ideaGen.limit} />
      <UsageBar label="Channel Syncs" used={channelSync.used} limit={channelSync.limit} />
      {resetAt && (
        <p className={s.resetTime}>
          Resets at{" "}
          {new Date(resetAt).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            timeZoneName: "short",
          })}
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export default function AccountStats({ me }: Readonly<{ me: Me | null }>) {
  const email = me?.email || "—";
  const plan = me?.plan || "free";
  const displayPlan = plan.charAt(0).toUpperCase() + plan.slice(1);
  const isActive = me?.status === "active";
  const usage = me?.usage ?? null;
  const resetAt = me?.resetAt;

  return (
    <div className={s.overview}>
      <h3 className={s.overviewHeading}>Overview</h3>

      <div className={s.field}>
        <span className={s.fieldLabel}>Email</span>
        <span className={s.fieldValue} title={email}>{email}</span>
      </div>

      <div className={s.field}>
        <span className={s.fieldLabel}>Plan</span>
        <div className={s.planRow}>
          <span className={s.fieldValue}>{displayPlan}</span>
          {isActive && <span className={s.activeBadge}>Active</span>}
        </div>
      </div>

      {usage && <DailyUsageSection usage={usage} resetAt={resetAt} />}
    </div>
  );
}
