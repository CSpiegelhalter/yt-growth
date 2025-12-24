"use client";

import { useState } from "react";
import type { FeatureKey } from "@/lib/entitlements";

type UpgradeCalloutProps = {
  /** The feature that hit the limit */
  featureKey: FeatureKey;
  /** Current usage count */
  used: number;
  /** Maximum allowed */
  limit: number;
  /** When usage resets (ISO string) */
  resetAt: string;
  /** Whether to show inline (small) or as a card (larger) */
  variant?: "inline" | "card";
  /** Custom message override */
  message?: string;
};

/**
 * UpgradeCallout - Shows when user hits a usage limit
 *
 * Displays:
 * - How many uses consumed
 * - When usage resets
 * - Upgrade CTA for free users
 */
export default function UpgradeCallout({
  featureKey,
  used,
  limit,
  resetAt,
  variant = "card",
  message,
}: UpgradeCalloutProps) {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/integrations/stripe/checkout", {
        method: "POST",
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Checkout error:", err);
    } finally {
      setLoading(false);
    }
  };

  const resetDate = new Date(resetAt);
  const resetTimeStr = resetDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });

  const featureNames: Record<FeatureKey, string> = {
    channels_connected: "channel connections",
    owned_video_analysis: "video analyses",
    competitor_video_analysis: "competitor analyses",
    idea_generate: "idea generations",
    channel_sync: "channel syncs",
    keyword_research: "keyword research",
  };

  const featureName = featureNames[featureKey] || featureKey;
  const defaultMessage = `You've used all ${limit} daily ${featureName}.`;

  if (variant === "inline") {
    return (
      <div style={styles.inlineContainer}>
        <div style={styles.inlineIcon}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <span style={styles.inlineText}>
          {message || defaultMessage} Resets at {resetTimeStr}.
        </span>
        <button
          onClick={handleUpgrade}
          disabled={loading}
          style={styles.inlineBtn}
        >
          {loading ? "..." : "Upgrade"}
        </button>
      </div>
    );
  }

  return (
    <div style={styles.card}>
      <div style={styles.iconWrapper}>
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
      </div>
      <h3 style={styles.title}>Daily Limit Reached</h3>
      <p style={styles.message}>
        {message || defaultMessage}
      </p>
      <div style={styles.stats}>
        <div style={styles.stat}>
          <span style={styles.statValue}>{used}</span>
          <span style={styles.statLabel}>Used</span>
        </div>
        <div style={styles.statDivider}>/</div>
        <div style={styles.stat}>
          <span style={styles.statValue}>{limit}</span>
          <span style={styles.statLabel}>Limit</span>
        </div>
      </div>
      <p style={styles.reset}>
        Resets at {resetTimeStr}
      </p>
      <button
        onClick={handleUpgrade}
        disabled={loading}
        style={styles.upgradeBtn}
      >
        {loading ? "Loading..." : "Upgrade to Pro"}
      </button>
      <p style={styles.hint}>
        Get 100+ daily analyses, 200+ idea generations, and more
      </p>
    </div>
  );
}

/**
 * UsageIndicator - Shows remaining uses in a compact format
 */
export function UsageIndicator({
  featureKey,
  used,
  limit,
  resetAt,
}: {
  featureKey: FeatureKey;
  used: number;
  limit: number;
  resetAt: string;
}) {
  const remaining = Math.max(0, limit - used);
  const percentage = (remaining / limit) * 100;

  const getColor = () => {
    if (percentage > 50) return "#22c55e"; // green
    if (percentage > 20) return "#f59e0b"; // amber
    return "#ef4444"; // red
  };

  const featureLabels: Record<FeatureKey, string> = {
    channels_connected: "channels",
    owned_video_analysis: "analyses",
    competitor_video_analysis: "competitor analyses",
    idea_generate: "generations",
    channel_sync: "syncs",
    keyword_research: "searches",
  };

  return (
    <div style={styles.indicator}>
      <div style={styles.indicatorBar}>
        <div
          style={{
            ...styles.indicatorFill,
            width: `${percentage}%`,
            backgroundColor: getColor(),
          }}
        />
      </div>
      <span style={styles.indicatorText}>
        {remaining} {featureLabels[featureKey]} left today
      </span>
    </div>
  );
}

/**
 * FeatureLockedCallout - Shows when a feature is completely locked
 */
export function FeatureLockedCallout({
  featureKey,
  message,
}: {
  featureKey: FeatureKey;
  message?: string;
}) {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/integrations/stripe/checkout", {
        method: "POST",
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Checkout error:", err);
    } finally {
      setLoading(false);
    }
  };

  const featureNames: Record<FeatureKey, string> = {
    channels_connected: "Multiple Channels",
    owned_video_analysis: "Video Analysis",
    competitor_video_analysis: "Competitor Analysis",
    idea_generate: "Idea Generation",
    channel_sync: "Channel Sync",
    keyword_research: "Keyword Research",
  };

  return (
    <div style={styles.lockedCard}>
      <div style={styles.lockedIcon}>
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0110 0v4" />
        </svg>
      </div>
      <h3 style={styles.lockedTitle}>
        {featureNames[featureKey]} - Pro Feature
      </h3>
      <p style={styles.lockedMessage}>
        {message || `${featureNames[featureKey]} is available on the Pro plan.`}
      </p>
      <button
        onClick={handleUpgrade}
        disabled={loading}
        style={styles.upgradeBtn}
      >
        {loading ? "Loading..." : "Upgrade to Pro"}
      </button>
    </div>
  );
}

// ============================================
// STYLES (inline for simplicity + mobile-first)
// ============================================

const styles: Record<string, React.CSSProperties> = {
  // Card variant
  card: {
    background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
    borderRadius: "12px",
    padding: "24px",
    textAlign: "center",
    maxWidth: "400px",
    margin: "0 auto",
  },
  iconWrapper: {
    display: "inline-flex",
    padding: "12px",
    borderRadius: "50%",
    background: "rgba(245, 158, 11, 0.2)",
    color: "#d97706",
    marginBottom: "16px",
  },
  title: {
    fontSize: "1.125rem",
    fontWeight: 600,
    color: "#92400e",
    margin: "0 0 8px",
  },
  message: {
    fontSize: "0.875rem",
    color: "#a16207",
    margin: "0 0 16px",
  },
  stats: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "16px",
    marginBottom: "12px",
  },
  stat: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  statValue: {
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "#92400e",
  },
  statLabel: {
    fontSize: "0.75rem",
    color: "#a16207",
  },
  statDivider: {
    fontSize: "1.5rem",
    color: "#a16207",
  },
  reset: {
    fontSize: "0.75rem",
    color: "#a16207",
    margin: "0 0 16px",
  },
  upgradeBtn: {
    display: "block",
    width: "100%",
    padding: "12px 24px",
    fontSize: "1rem",
    fontWeight: 600,
    border: "none",
    borderRadius: "10px",
    background: "#1e3a5f",
    color: "white",
    cursor: "pointer",
    transition: "all 0.15s ease",
    marginBottom: "12px",
  },
  hint: {
    fontSize: "0.75rem",
    color: "#a16207",
    margin: 0,
  },

  // Inline variant
  inlineContainer: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 14px",
    background: "#fef3c7",
    borderRadius: "8px",
    fontSize: "0.875rem",
  },
  inlineIcon: {
    color: "#d97706",
    flexShrink: 0,
  },
  inlineText: {
    color: "#92400e",
    flex: 1,
  },
  inlineBtn: {
    padding: "6px 12px",
    fontSize: "0.75rem",
    fontWeight: 600,
    border: "none",
    borderRadius: "6px",
    background: "#1e3a5f",
    color: "white",
    cursor: "pointer",
    flexShrink: 0,
  },

  // Usage indicator
  indicator: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "0.75rem",
  },
  indicatorBar: {
    width: "60px",
    height: "6px",
    background: "#e5e7eb",
    borderRadius: "3px",
    overflow: "hidden",
  },
  indicatorFill: {
    height: "100%",
    borderRadius: "3px",
    transition: "width 0.3s ease",
  },
  indicatorText: {
    color: "#64748b",
    whiteSpace: "nowrap",
  },

  // Locked feature card
  lockedCard: {
    background: "linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)",
    borderRadius: "12px",
    padding: "24px",
    textAlign: "center",
    maxWidth: "400px",
    margin: "0 auto",
  },
  lockedIcon: {
    display: "inline-flex",
    padding: "12px",
    borderRadius: "50%",
    background: "rgba(100, 116, 139, 0.2)",
    color: "#475569",
    marginBottom: "16px",
  },
  lockedTitle: {
    fontSize: "1.125rem",
    fontWeight: 600,
    color: "#334155",
    margin: "0 0 8px",
  },
  lockedMessage: {
    fontSize: "0.875rem",
    color: "#64748b",
    margin: "0 0 16px",
  },
};

