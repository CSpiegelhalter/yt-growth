"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useChannelProfile } from "@/lib/hooks/use-channel-profile";

type Props = {
  channelId: string | null;
};

/**
 * ProfileTip - Small dismissable banner suggesting users complete their channel profile.
 * Used on pages where the profile improves results (competitors, trending, ideas).
 */
export function ProfileTip({ channelId }: Props) {
  const { profile, loading } = useChannelProfile(channelId);
  const [dismissed, setDismissed] = useState(false);

  // Check if previously dismissed (session-only)
  useEffect(() => {
    try {
      const key = `profile-tip-dismissed-${channelId ?? "none"}`;
      if (sessionStorage.getItem(key) === "1") {
        setDismissed(true);
      }
    } catch {
      // Ignore storage errors
    }
  }, [channelId]);

  const handleDismiss = () => {
    setDismissed(true);
    try {
      const key = `profile-tip-dismissed-${channelId ?? "none"}`;
      sessionStorage.setItem(key, "1");
    } catch {
      // Ignore storage errors
    }
  };

  // Don't show if loading, already has profile, dismissed, or no channel
  if (loading || profile || dismissed || !channelId) {
    return null;
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "10px 14px",
        background: "var(--accent-light, #eff6ff)",
        border: "1px solid var(--accent, #3b82f6)",
        borderRadius: "8px",
        fontSize: "0.8125rem",
        color: "var(--text-secondary)",
        marginBottom: "16px",
      }}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--accent, #3b82f6)"
        strokeWidth="2"
        style={{ flexShrink: 0 }}
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4M12 8h.01" />
      </svg>
      <span style={{ flex: 1 }}>
        <strong style={{ color: "var(--text)", fontWeight: 500 }}>
          Improve your results
        </strong>{" "}
        — Complete your{" "}
        <Link
          href={`/channel-profile?channelId=${channelId}`}
          style={{
            color: "var(--primary)",
            textDecoration: "underline",
            fontWeight: 500,
          }}
        >
          channel profile
        </Link>{" "}
        for better recommendations tailored to your niche.
      </span>
      <button
        onClick={handleDismiss}
        aria-label="Dismiss"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "24px",
          height: "24px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          color: "var(--text-tertiary)",
          borderRadius: "4px",
          flexShrink: 0,
        }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export default ProfileTip;
