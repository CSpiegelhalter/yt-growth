"use client";

import { useState } from "react";
import Link from "next/link";
import s from "./ProfileCard.module.css";
import { ChannelProfile } from "@/lib/channel-profile/types";

type Props = {
  profile: ChannelProfile | null;
  channelId: string | null;
  loading?: boolean;
};

export default function ProfileCard({
  profile,
  channelId,
  loading = false,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const aiProfile = profile?.aiProfile;
  const hasProfile = !!profile;
  const hasAI = !!aiProfile;

  // Loading skeleton
  if (loading) {
    return (
      <div className={s.card}>
        <div className={s.cardHeader}>
          <div>
            <h3 className={s.cardTitle}>
              <svg
                className={s.cardTitleIcon}
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              Channel Profile
            </h3>
          </div>
        </div>
        <div className={s.skeleton}>
          <div className={`${s.skeletonLine} ${s.skeletonTitle}`} />
          <div className={`${s.skeletonLine} ${s.skeletonDesc}`} />
          <div className={s.skeletonPillars}>
            <div className={`${s.skeletonLine} ${s.skeletonPillar}`} />
            <div className={`${s.skeletonLine} ${s.skeletonPillar}`} />
            <div className={`${s.skeletonLine} ${s.skeletonPillar}`} />
          </div>
        </div>
      </div>
    );
  }

  // No profile yet - show CTA
  if (!hasProfile) {
    return (
      <div className={s.card}>
        <div className={s.cardHeader}>
          <div>
            <h3 className={s.cardTitle}>
              <svg
                className={s.cardTitleIcon}
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              Channel Profile
            </h3>
            <p className={s.cardSubtitle}>Personalize your recommendations</p>
          </div>
        </div>
        <div className={s.emptyState}>
          <svg
            className={s.emptyIcon}
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
            <circle cx="8.5" cy="7" r="4" />
            <path d="M20 8v6M23 11h-6" />
          </svg>
          <h4 className={s.emptyTitle}>Create Your Channel Profile</h4>
          <p className={s.emptyDesc}>
            Help us understand your niche to improve video ideas, competitor
            suggestions, and insights.
          </p>
          <Link
            href={
              channelId
                ? `/channel-profile?channelId=${channelId}`
                : "/channel-profile"
            }
            className={s.ctaBtn}
          >
            Create Profile
          </Link>
        </div>
      </div>
    );
  }

  // Has profile - show compact summary with expand option
  return (
    <div className={`${s.card} ${s.compact}`}>
      <button
        className={s.compactHeader}
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        <div className={s.compactInfo}>
          <svg
            className={s.compactIcon}
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span className={s.compactLabel}>Channel Profile</span>
          {hasAI && (
            <span className={s.compactNiche}>{aiProfile.nicheLabel}</span>
          )}
        </div>
        <div className={s.compactActions}>
          <Link
            href={
              channelId
                ? `/channel-profile?channelId=${channelId}`
                : "/channel-profile"
            }
            className={s.editBtnCompact}
            onClick={(e) => e.stopPropagation()}
            aria-label="Edit channel profile"
          >
            Edit
          </Link>
          <svg
            className={`${s.expandIcon} ${expanded ? s.expanded : ""}`}
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </button>

      {expanded && (
        <div className={s.expandedContent}>
          {hasAI ? (
            <>
              <p className={s.nicheDescCompact}>{aiProfile.nicheDescription}</p>
              {aiProfile.contentPillars.length > 0 && (
                <div className={s.pillarsCompact}>
                  {aiProfile.contentPillars.slice(0, 4).map((pillar, i) => (
                    <span key={i} className={s.pillarCompact}>
                      {pillar.name}
                    </span>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <p className={s.nicheDescCompact}>
                {profile.input.description.slice(0, 150)}
                {profile.input.description.length > 150 ? "..." : ""}
              </p>
              <div className={s.pillarsCompact}>
                {profile.input.categories.slice(0, 3).map((cat, i) => (
                  <span key={i} className={s.pillarCompact}>
                    {cat}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
