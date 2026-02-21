"use client";

import { useEffect, useRef, useCallback } from "react";
import BadgeArt from "./BadgeArt";
import type { BadgeWithProgress } from "@/lib/features/badges";
import { getBadgeChain, getGoalsForBadge } from "@/lib/features/badges";
import s from "./BadgeDetailModal.module.css";

type Props = {
  badge: BadgeWithProgress | null;
  onClose: () => void;
};

const RARITY_LABELS: Record<string, string> = {
  common: "Common",
  rare: "Rare",
  epic: "Epic",
  legendary: "Legendary",
};

const RARITY_COLORS: Record<string, string> = {
  common: "#60a5fa",
  rare: "#a78bfa",
  epic: "#f472b6",
  legendary: "#fbbf24",
};

export default function BadgeDetailModal({ badge, onClose }: Props) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  // Focus trap and escape handler
  useEffect(() => {
    if (!badge) return;

    // Store current focus
    previousFocus.current = document.activeElement as HTMLElement;

    // Focus modal
    modalRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
      // Focus trap
      if (e.key === "Tab" && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      previousFocus.current?.focus();
    };
  }, [badge, onClose]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  const handleShare = useCallback(() => {
    if (!badge) return;
    const text = badge.unlocked
      ? `I just unlocked the "${badge.name}" badge! 🏆`
      : `Working toward the "${badge.name}" badge...`;
    navigator.clipboard.writeText(text);
  }, [badge]);

  if (!badge) return null;

  const chain = getBadgeChain(badge.id);
  const relatedGoals = getGoalsForBadge(badge.id);
  const rarityColor = RARITY_COLORS[badge.rarity];

  return (
    <div
      className={s.backdrop}
      onClick={handleBackdropClick}
      aria-hidden="true"
    >
      <div
        ref={modalRef}
        className={s.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="badge-title"
        tabIndex={-1}
      >
        <button
          className={s.closeBtn}
          onClick={onClose}
          aria-label="Close badge details"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        {/* Badge Art */}
        <div className={s.badgeArtWrap}>
          <BadgeArt
            badgeId={badge.id}
            icon={badge.icon}
            rarity={badge.rarity}
            unlocked={badge.unlocked}
            size="xl"
          />
          {badge.unlocked && !badge.seen && (
            <span className={s.newPill}>NEW!</span>
          )}
        </div>

        {/* Badge Info */}
        <div className={s.badgeInfo}>
          <span
            className={s.rarityBadge}
            style={{ backgroundColor: rarityColor }}
          >
            {RARITY_LABELS[badge.rarity]}
          </span>
          <h2 id="badge-title" className={s.badgeName}>
            {badge.name}
          </h2>
          <p className={s.badgeDesc}>{badge.description}</p>
        </div>

        {/* Progress */}
        <div className={s.progressSection}>
          <h3 className={s.sectionTitle}>
            {badge.unlocked ? "Completed" : "Progress"}
          </h3>
          
          {badge.unlocked ? (
            <div className={s.unlockedInfo}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                <path d="M22 4L12 14.01l-3-3" />
              </svg>
              <span>
                Unlocked{" "}
                {badge.unlockedAt &&
                  new Date(badge.unlockedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
              </span>
            </div>
          ) : badge.progress.lockedReason ? (
            <div className={s.lockedInfo}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
              <span>{badge.progress.lockedReason}</span>
            </div>
          ) : (
            <div className={s.progressInfo}>
              <div className={s.progressBar}>
                <div
                  className={s.progressFill}
                  style={{
                    width: `${badge.progress.percent}%`,
                    backgroundColor: rarityColor,
                  }}
                />
              </div>
              <div className={s.progressText}>
                <span>{badge.progress.currentLabel}</span>
                <span className={s.progressDivider}>/</span>
                <span>{badge.progress.targetLabel}</span>
              </div>
            </div>
          )}
        </div>

        {/* How to Unlock */}
        {!badge.unlocked && !badge.progress.lockedReason && relatedGoals.length > 0 && (
          <div className={s.howToUnlock}>
            <h3 className={s.sectionTitle}>How to unlock</h3>
            <ul className={s.goalsList}>
              {relatedGoals.map((goal) => (
                <li key={goal.id} className={s.goalItem}>
                  <span className={s.goalTitle}>{goal.title}</span>
                  <span className={s.goalDesc}>{goal.whyItMatters}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Badge Chain */}
        {chain.length > 1 && (
          <div className={s.chainSection}>
            <h3 className={s.sectionTitle}>Badge Chain</h3>
            <div className={s.chainList}>
              {chain.map((b, i) => (
                <div
                  key={b.id}
                  className={`${s.chainBadge} ${b.id === badge.id ? s.current : ""}`}
                >
                  <BadgeArt
                    badgeId={b.id}
                    icon={b.icon}
                    rarity={b.rarity}
                    unlocked={false}
                    size="sm"
                  />
                  {i < chain.length - 1 && (
                    <div className={s.chainArrow}>→</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className={s.actions}>
          {badge.unlocked && (
            <button className={s.shareBtn} onClick={handleShare}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
                <polyline points="16 6 12 2 8 6" />
                <line x1="12" y1="2" x2="12" y2="15" />
              </svg>
              Copy Share Text
            </button>
          )}
          <button className={s.closeModalBtn} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
