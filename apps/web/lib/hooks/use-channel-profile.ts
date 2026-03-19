"use client";

/**
 * useChannelProfile Hook
 *
 * Client-side hook for managing channel profile state.
 * Provides loading, saving, and AI generation functionality.
 */

import { useCallback,useEffect, useRef, useState } from "react";

import type { ChannelProfileAI,ChannelProfileInput } from "@/lib/features/channels/schemas";
import type { ChannelProfile } from "@/lib/features/channels/types";

type SaveStatus = "idle" | "saving" | "saved" | "error";

type UseChannelProfileResult = {
  // State
  profile: ChannelProfile | null;
  loading: boolean;
  saving: boolean;
  generating: boolean;
  error: string | null;
  saveStatus: SaveStatus;

  // Actions
  saveProfile: (input: ChannelProfileInput) => Promise<boolean>;
  debouncedSave: (input: ChannelProfileInput) => void;
  cancelPendingSave: () => void;
  generateAI: (force?: boolean) => Promise<ChannelProfileAI | null>;
  refresh: () => Promise<void>;
  clearError: () => void;
};

const DEBOUNCE_MS = 1500;

export function useChannelProfile(channelId: string | null): UseChannelProfileResult {
  const [profile, setProfile] = useState<ChannelProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingInputRef = useRef<ChannelProfileInput | null>(null);

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
        throw new Error(data.error?.message || data.error || "Failed to fetch profile");
      }

      const data = await res.json();
      setProfile(data.profile);
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : "Failed to fetch profile");
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [channelId]);

  useEffect(() => {
    void fetchProfile();
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
          throw new Error(data.error?.message || data.error || "Failed to save profile");
        }

        const data = await res.json();
        setProfile(data.profile);
        return true;
      } catch (error_) {
        setError(error_ instanceof Error ? error_.message : "Failed to save profile");
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
          throw new Error(data.error?.message || data.error || "Failed to generate AI profile");
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
      } catch (error_) {
        setError(error_ instanceof Error ? error_.message : "Failed to generate AI profile");
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

  // Debounced save — auto-saves after 1.5s of inactivity
  const debouncedSave = useCallback(
    (input: ChannelProfileInput) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (savedTimerRef.current) {
        clearTimeout(savedTimerRef.current);
      }
      pendingInputRef.current = input;
      setSaveStatus("saving");
      debounceTimerRef.current = setTimeout(() => {
        pendingInputRef.current = null;
        void saveProfile(input).then((success) => {
          if (success) {
            setSaveStatus("saved");
            savedTimerRef.current = setTimeout(() => setSaveStatus("idle"), 3000);
          } else {
            setSaveStatus("error");
          }
          return;
        });
      }, DEBOUNCE_MS);
    },
    [saveProfile],
  );

  // Flush pending save on page unload (e.g. refresh)
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (pendingInputRef.current && channelId) {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
          debounceTimerRef.current = null;
        }
        void fetch(`/api/me/channels/${channelId}/profile`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input: pendingInputRef.current }),
          keepalive: true,
        });
        pendingInputRef.current = null;
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [channelId]);

  // Cancel pending debounced save
  const cancelPendingSave = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    if (savedTimerRef.current) {
      clearTimeout(savedTimerRef.current);
      savedTimerRef.current = null;
    }
    pendingInputRef.current = null;
  }, []);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (savedTimerRef.current) {
        clearTimeout(savedTimerRef.current);
      }
    };
  }, []);

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
    saveStatus,
    saveProfile,
    debouncedSave,
    cancelPendingSave,
    generateAI,
    refresh,
    clearError,
  };
}
