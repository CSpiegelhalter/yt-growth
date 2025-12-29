"use client";

import s from "./style.module.css";
import type { Me } from "@/types/api";

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "ok" | "warn";
}) {
  return (
    <div className={`${s.stat} ${tone ? s[`tone-${tone}`] : ""}`}>
      <div className={s.statLabel}>{label}</div>
      <div className={s.statValue} title={value}>
        {value}
      </div>
    </div>
  );
}

function PlanBadge({ plan }: { plan: string }) {
  const isPro = plan?.toLowerCase() === "pro";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "4px 12px",
        fontSize: "0.75rem",
        fontWeight: 600,
        borderRadius: "9999px",
        background: isPro
          ? "linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)"
          : "#e5e7eb",
        color: isPro ? "white" : "#374151",
      }}
    >
      {isPro && (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      )}
      {plan?.charAt(0).toUpperCase() + plan?.slice(1) || "Free"}
    </span>
  );
}

function UsageBar({
  label,
  used,
  limit,
}: {
  label: string;
  used: number;
  limit: number;
}) {
  const remaining = Math.max(0, limit - used);
  const percentage = (remaining / limit) * 100;

  const getColor = () => {
    if (percentage > 50) return "#22c55e";
    if (percentage > 20) return "#f59e0b";
    return "#ef4444";
  };

  return (
    <div style={{ marginBottom: "8px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "0.75rem",
          color: "#64748b",
          marginBottom: "4px",
        }}
      >
        <span>{label}</span>
        <span>
          {remaining} of {limit} left
        </span>
      </div>
      <div
        style={{
          width: "100%",
          height: "6px",
          background: "#e5e7eb",
          borderRadius: "3px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${percentage}%`,
            backgroundColor: getColor(),
            borderRadius: "3px",
            transition: "width 0.3s ease",
          }}
        />
      </div>
    </div>
  );
}

export default function AccountStats({
  me,
  channelCount,
}: Readonly<{
  me: Me | null;
  channelCount: number;
}>) {
  const usage = me?.usage;

  return (
    <div className={s.grid}>
      <Stat label="Email" value={me?.email || "—"} />
      <div className={s.stat}>
        <div className={s.statLabel}>Plan</div>
        <div className={s.statValue}>
          <PlanBadge plan={me?.plan || "free"} />
        </div>
      </div>
      <Stat
        label="Status"
        value={me?.status || "—"}
        tone={me?.status === "active" ? "ok" : "warn"}
      />
      <Stat
        label="Channels Used"
        value={`${channelCount}/${me?.channel_limit ?? 1}`}
      />

      {/* Daily Usage Section */}
      {usage && (
        <div style={{ gridColumn: "1 / -1", marginTop: "16px" }}>
          <h4
            style={{
              fontSize: "0.875rem",
              fontWeight: 600,
              color: "#374151",
              marginBottom: "12px",
            }}
          >
            Today's Usage
          </h4>
          <UsageBar
            label="Video Analyses"
            used={usage.owned_video_analysis?.used ?? 0}
            limit={usage.owned_video_analysis?.limit ?? 5}
          />
          <UsageBar
            label="Competitor Analyses"
            used={usage.competitor_video_analysis?.used ?? 0}
            limit={usage.competitor_video_analysis?.limit ?? 5}
          />
          <UsageBar
            label="Idea Generations"
            used={usage.idea_generate?.used ?? 0}
            limit={usage.idea_generate?.limit ?? 10}
          />
          <UsageBar
            label="Channel Syncs"
            used={usage.channel_sync?.used ?? 0}
            limit={usage.channel_sync?.limit ?? 3}
          />
          {me?.resetAt && (
            <p
              style={{
                fontSize: "0.75rem",
                color: "#9ca3af",
                marginTop: "8px",
              }}
            >
              Resets at{" "}
              {new Date(me.resetAt).toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                timeZoneName: "short",
              })}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
