"use client";

import { useEffect, useState } from "react";

import { safeGetItem, safeSetItem } from "@/lib/client/safeLocalStorage";

import type { DiscoveredNiche } from "../types";

const SAVED_KEY = "discovery-saved-niches";
const DISMISSED_KEY = "discovery-dismissed-niches";

type UseSavedNichesReturn = {
  savedNiches: Set<string>;
  dismissedNiches: Set<string>;
  handleSave: (niche: DiscoveredNiche) => void;
  handleDismiss: (niche: DiscoveredNiche) => void;
};

export function useSavedNiches(): UseSavedNichesReturn {
  const [savedNiches, setSavedNiches] = useState<Set<string>>(new Set());
  const [dismissedNiches, setDismissedNiches] = useState<Set<string>>(
    new Set(),
  );

  useEffect(() => {
    try {
      const saved = safeGetItem(SAVED_KEY);
      if (saved) {
        setSavedNiches(new Set(JSON.parse(saved)));
      }
      const dismissed = safeGetItem(DISMISSED_KEY);
      if (dismissed) {
        setDismissedNiches(new Set(JSON.parse(dismissed)));
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  const handleSave = (niche: DiscoveredNiche) => {
    setSavedNiches((prev) => {
      const next = new Set(prev);
      if (next.has(niche.id)) {
        next.delete(niche.id);
      } else {
        next.add(niche.id);
      }
      safeSetItem(SAVED_KEY, JSON.stringify([...next]));
      return next;
    });
  };

  const handleDismiss = (niche: DiscoveredNiche) => {
    setDismissedNiches((prev) => {
      const next = new Set(prev);
      next.add(niche.id);
      safeSetItem(DISMISSED_KEY, JSON.stringify([...next]));
      return next;
    });
  };

  return { savedNiches, dismissedNiches, handleSave, handleDismiss };
}
