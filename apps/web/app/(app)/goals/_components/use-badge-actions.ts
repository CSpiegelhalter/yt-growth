"use client";

import { useState } from "react";

import type { BadgesApiResponse, BadgeWithProgress } from "@/lib/features/badges";

type UseBadgeActionsReturn = {
  selectedBadge: BadgeWithProgress | null;
  handleBadgeClick: (badge: BadgeWithProgress) => Promise<void>;
  closeModal: () => void;
};

export function useBadgeActions(
  activeChannelId: string | null,
  setBadgeData: React.Dispatch<React.SetStateAction<BadgesApiResponse | null>>,
): UseBadgeActionsReturn {
  const [selectedBadge, setSelectedBadge] = useState<BadgeWithProgress | null>(null);

  const handleBadgeClick = async (badge: BadgeWithProgress) => {
    setSelectedBadge(badge);

    if (badge.unlocked && !badge.seen && activeChannelId) {
      try {
        await fetch("/api/me/badges", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            badgeIds: [badge.id],
            channelId: activeChannelId,
          }),
        });
        setBadgeData((prev) =>
          prev
            ? {
                ...prev,
                badges: prev.badges.map((b) =>
                  b.id === badge.id ? { ...b, seen: true } : b
                ),
              }
            : prev
        );
      } catch {
        // Silently handle - badge seen status is non-critical
      }
    }
  };

  const closeModal = () => setSelectedBadge(null);

  return { selectedBadge, handleBadgeClick, closeModal };
}
