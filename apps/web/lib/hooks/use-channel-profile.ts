"use client";

/**
 * useChannelProfile Hook
 *
 * Client-side hook for managing channel profile state.
 * Provides loading, saving, and AI generation functionality.
 */

import { useState, useEffect, useCallback } from "react";
import {
  ChannelProfile,
  ChannelProfileInput,
  ChannelProfileAI,
} from "@/lib/channel-profile/types";

type UseChannelProfileResult = {
  // State
  profile: ChannelProfile | null;
  loading: boolean;
  saving: boolean;
  generating: boolean;
  error: string | null;

  // Actions
  saveProfile: (input: ChannelProfileInput) => Promise<boolean>;
  generateAI: (force?: boolean) => Promise<ChannelProfileAI | null>;
  refresh: () => Promise<void>;
  clearError: () => void;
};

export function useChannelProfile(channelId: string | null): UseChannelProfileResult {
  const [profile, setProfile] = useState<ChannelProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch profile on mount and when channelId changes
  const fetchProfile = useCallback(async () => {
    if (!channelId) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/me/channels/${channelId}/profile`, {
        cache: "no-store",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to fetch profile");
      }

      const data = await res.json();
      setProfile(data.profile);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch profile");
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [channelId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Save profile input
  const saveProfile = useCallback(
    async (input: ChannelProfileInput): Promise<boolean> => {
      if (!channelId) {
        setError("No channel selected");
        return false;
      }

      setSaving(true);
      setError(null);

      try {
        const res = await fetch(`/api/me/channels/${channelId}/profile`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to save profile");
        }

        const data = await res.json();
        setProfile(data.profile);
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save profile");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [channelId]
  );

  // Generate AI profile
  const generateAI = useCallback(
    async (force = false): Promise<ChannelProfileAI | null> => {
      if (!channelId) {
        setError("No channel selected");
        return null;
      }

      setGenerating(true);
      setError(null);

      try {
        const res = await fetch(
          `/api/me/channels/${channelId}/profile/generate`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ force }),
          }
        );

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to generate AI profile");
        }

        const data = await res.json();

        // Update local profile state with new AI profile
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                aiProfile: data.aiProfile,
                lastGeneratedAt: new Date().toISOString(),
              }
            : null
        );

        return data.aiProfile;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to generate AI profile");
        return null;
      } finally {
        setGenerating(false);
      }
    },
    [channelId]
  );

  // Refresh profile from server
  const refresh = useCallback(async () => {
    await fetchProfile();
  }, [fetchProfile]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    profile,
    loading,
    saving,
    generating,
    error,
    saveProfile,
    generateAI,
    refresh,
    clearError,
  };
}
