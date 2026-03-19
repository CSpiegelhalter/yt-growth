"use client";

import Link from "next/link";

import {
  getProfileCompletion,
  isProfileComplete,
} from "@/lib/features/channels/profile-completion";
import { useChannelProfile } from "@/lib/hooks/use-channel-profile";
import { useDismissable } from "@/lib/hooks/use-dismissable";
import { useLocalStorage } from "@/lib/hooks/use-local-storage";

import s from "./profile-completion-popup.module.css";

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

type Props = {
  channelId: string;
};

export function ProfileCompletionPopup({ channelId }: Props) {
  const { profile, loading } = useChannelProfile(channelId);
  const { isDismissed, dismiss, isHydrated: dismissHydrated } = useDismissable(
    "profile-completion",
    THREE_DAYS_MS,
  );
  const { value: hasVisited, setValue: setHasVisited, isHydrated: visitHydrated } =
    useLocalStorage<boolean>({
      key: `dashboard-visited:${channelId}`,
      defaultValue: false,
    });

  // Wait for hydration and data before deciding visibility
  if (loading || !dismissHydrated || !visitHydrated) {
    return null;
  }

  // First-visit suppression: mark as visited and don't show
  if (!hasVisited) {
    setHasVisited(true);
    return null;
  }

  // Don't show if dismissed
  if (isDismissed) {
    return null;
  }

  // No profile data at all — treat as fully incomplete
  const input = profile?.input;
  const sections = input
    ? getProfileCompletion(input, channelId)
    : getProfileCompletion(
        { description: "", categories: [] },
        channelId,
      );

  // Don't show if profile is fully complete
  if (input && isProfileComplete(sections)) {
    return null;
  }

  return (
    <div className={s.popup} role="region" aria-label="Profile completion">
      <div className={s.header}>
        <div className={s.headerText}>
          <h2 className={s.title}>Complete your profile to get better results!</h2>
          <p className={s.description}>
            Fill out your channel profile so we can tailor video suggestions,
            competitor insights, and growth recommendations to your specific
            niche and goals.
          </p>
        </div>
        <button
          className={s.dismissBtn}
          onClick={dismiss}
          aria-label="Dismiss for 3 days"
        >
          Dismiss for 3 days
          <svg
            className={s.closeIcon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className={s.checklist}>
        {sections.map((section) => (
          <Link
            key={section.sectionId}
            href={section.href}
            className={s.checklistItem}
          >
            {section.isComplete ? (
              <svg className={s.checkIcon} viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="9" fill="var(--color-imperial-blue)" />
                <path
                  d="M6 10l3 3 5-5"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <svg className={s.checkIcon} viewBox="0 0 20 20" fill="none">
                <circle
                  cx="10"
                  cy="10"
                  r="9"
                  stroke="var(--color-imperial-blue)"
                  strokeWidth="1.5"
                  opacity="0.4"
                />
              </svg>
            )}
            {section.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
