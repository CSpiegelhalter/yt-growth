"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { apiFetchJson } from "@/lib/client/api";
import type { SearchEvent } from "@/lib/client/ndjson-stream";
import { readNdjsonStream } from "@/lib/client/ndjson-stream";
import type { SuggestionAction, VideoSuggestion } from "@/lib/features/suggestions/types";

// --- Response types ---

type SuggestionsResponse = {
  suggestions: VideoSuggestion[];
  total: number;
};

type ActionResponse = {
  suggestion: { id: string; status: string };
  replacement: VideoSuggestion;
  videoIdeaId?: string;
  ideaFlowUrl?: string;
};

type GenerateResponse = {
  suggestions: VideoSuggestion[];
  generationMode: string;
  competitorDataAvailable: boolean;
};

// --- Hook input/output ---

type UseSuggestionEngineInput = {
  channelId: string | null;
  youtubeChannelId: string | null;
  isPro: boolean;
};

export type SuggestionEngineState = {
  suggestions: VideoSuggestion[];
  loading: boolean;
  error: string | null;
  researchPhase: "idle" | "researching" | "generating";
  researchStatus: string | null;
  researchError: string | null;

  // Drawer state
  drawerSuggestionId: string | null;
  isDrawerOpen: boolean;

  // Discovery state
  needsDiscovery: boolean;

  // Actions
  handleAction: (suggestionId: string, action: SuggestionAction) => Promise<void>;
  handleRetry: () => Promise<void>;
  handleGenerate: () => Promise<void>;
  openDrawer: (suggestionId: string) => void;
  closeDrawer: () => void;
  onDiscoveryComplete: () => void;
  showPricing: boolean;
  setShowPricing: (v: boolean) => void;
};

export function useSuggestionEngine({
  channelId,
  youtubeChannelId,
  isPro,
}: UseSuggestionEngineInput): SuggestionEngineState {
  const [suggestions, setSuggestions] = useState<VideoSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [researchPhase, setResearchPhase] = useState<"idle" | "researching" | "generating">("idle");
  const [researchStatus, setResearchStatus] = useState<string | null>(null);
  const [researchError, setResearchError] = useState<string | null>(null);
  const [showPricing, setShowPricing] = useState(false);

  // Drawer state
  const [drawerSuggestionId, setDrawerSuggestionId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Discovery state — set after initial load if no competitor-backed suggestions
  const [needsDiscovery, setNeedsDiscovery] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const fetchSuggestions = useCallback(async () => {
    if (!channelId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await apiFetchJson<SuggestionsResponse>(
        `/api/me/channels/${channelId}/suggestions`,
      );
      setSuggestions(result.suggestions);

      // Check if any suggestions are competitor-backed
      const hasCompetitorBacked = result.suggestions.some((s) => {
        const ctx = s.sourceContext as Record<string, unknown>;
        return ctx?.generationMode === "competitor_backed";
      });
      setNeedsDiscovery(!hasCompetitorBacked && isPro);
    } catch {
      setError("Failed to load suggestions.");
    } finally {
      setLoading(false);
    }
  }, [channelId, isPro]);

  useEffect(() => {
    void fetchSuggestions();
  }, [fetchSuggestions]);

  const handleAction = useCallback(
    async (suggestionId: string, action: SuggestionAction) => {
      if (!channelId) return;
      const result = await apiFetchJson<ActionResponse>(
        `/api/me/channels/${channelId}/suggestions/${suggestionId}/action`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        },
      );

      setSuggestions((prev) => {
        const without = prev.filter((s) => s.id !== suggestionId);
        if (result.replacement?.id && !without.some((s) => s.id === result.replacement.id)) {
          return [...without, result.replacement];
        }
        return without;
      });

      if (action === "use" && result.ideaFlowUrl) {
        window.location.href = result.ideaFlowUrl;
      }
    },
    [channelId],
  );

  async function runNicheResearch(ytChannelId: string, signal: AbortSignal): Promise<{ success: boolean; error?: string }> {
    const response = await fetch("/api/competitors/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "search_my_niche", channelId: ytChannelId }),
      signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const msg = typeof errorData.error === "string" ? errorData.error
        : typeof errorData.message === "string" ? errorData.message
        : `HTTP ${response.status}`;
      return { success: false, error: msg };
    }

    if (!response.body) {
      return { success: false, error: "No response body" };
    }

    let errorMsg: string | undefined;

    await readNdjsonStream(response.body, (event: SearchEvent) => {
      switch (event.type) {
        case "status": {
          if (event.status === "searching") {
            setResearchStatus("Researching videos in your niche...");
          } else if (event.status === "filtering") {
            setResearchStatus("Identifying winning patterns...");
          }
          break;
        }
        case "error": {
          errorMsg = event.error;
          break;
        }
        case "done": {
          break;
        }
      }
    });

    if (errorMsg) return { success: false, error: errorMsg };
    return { success: true };
  }

  const handleGenerate = useCallback(async () => {
    if (!channelId || !youtubeChannelId) return;

    if (!isPro) {
      setShowPricing(true);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setResearchError(null);
    setResearchPhase("generating");
    setResearchStatus("Generating ideas for your channel...");

    try {
      const result = await apiFetchJson<GenerateResponse>(
        `/api/me/channels/${channelId}/suggestions/generate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ count: 3 }),
        },
      );

      if (result.competitorDataAvailable) {
        setSuggestions(result.suggestions);
        setResearchPhase("idle");
        setResearchStatus(null);
        setNeedsDiscovery(false);
        return;
      }

      setSuggestions(result.suggestions);

      if (controller.signal.aborted) return;
      setResearchPhase("researching");
      setResearchStatus("Researching videos in your niche...");

      const research = await runNicheResearch(youtubeChannelId, controller.signal);
      if (controller.signal.aborted) return;

      if (!research.success) {
        setResearchError(research.error ?? "Research failed");
        setResearchPhase("idle");
        setResearchStatus(null);
        return;
      }

      setResearchPhase("generating");
      setResearchStatus("Generating ideas from your competitors...");

      const result2 = await apiFetchJson<GenerateResponse>(
        `/api/me/channels/${channelId}/suggestions/generate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ count: 3 }),
        },
      );

      if (controller.signal.aborted) return;
      setSuggestions(result2.suggestions);
      setResearchPhase("idle");
      setResearchStatus(null);
      setNeedsDiscovery(false);
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setResearchError(err instanceof Error ? err.message : "Something went wrong");
      setResearchPhase("idle");
      setResearchStatus(null);
    }
  }, [channelId, youtubeChannelId, isPro]);

  const openDrawer = useCallback((suggestionId: string) => {
    setDrawerSuggestionId(suggestionId);
    setIsDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setIsDrawerOpen(false);
    setDrawerSuggestionId(null);
  }, []);

  const onDiscoveryComplete = useCallback(() => {
    setNeedsDiscovery(false);
    // Regenerate to pick up newly saved competitors
    void handleGenerate();
  }, [handleGenerate]);

  return {
    suggestions,
    loading,
    error,
    researchPhase,
    researchStatus,
    researchError,
    drawerSuggestionId,
    isDrawerOpen,
    needsDiscovery,
    handleAction,
    handleRetry: fetchSuggestions,
    handleGenerate,
    openDrawer,
    closeDrawer,
    onDiscoveryComplete,
    showPricing,
    setShowPricing,
  };
}
