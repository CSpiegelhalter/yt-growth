"use client";

import { useCallback, useEffect, useState } from "react";

import { OverviewPanel } from "@/components/overview";
import { PageContainer } from "@/components/ui";
import { apiFetchJson } from "@/lib/client/api";
import type { SuggestionAction, VideoSuggestion  } from "@/lib/features/suggestions/types";
import type { Channel } from "@/types/api";

import s from "./dashboard-client.module.css";
import { ProfileCompletionPopup } from "./profile-completion-popup";
import { SuggestionPanel } from "./suggestion-panel";

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

type DashboardClientProps = {
  initialChannels: Channel[];
  initialActiveChannelId: string | null;
};

export function DashboardClient({
  initialChannels,
  initialActiveChannelId,
}: DashboardClientProps) {
  const activeChannel = initialChannels.find(
    (c) => c.channel_id === initialActiveChannelId,
  );

  const [suggestions, setSuggestions] = useState<VideoSuggestion[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(true);
  const [suggestionsError, setSuggestionsError] = useState<string | null>(null);

  const fetchSuggestions = useCallback(async () => {
    if (!activeChannel) {return;}
    setSuggestionsLoading(true);
    setSuggestionsError(null);
    try {
      const result = await apiFetchJson<SuggestionsResponse>(
        `/api/me/channels/${activeChannel.id}/suggestions`,
      );
      setSuggestions(result.suggestions);
    } catch {
      setSuggestionsError("Failed to load suggestions.");
    } finally {
      setSuggestionsLoading(false);
    }
  }, [activeChannel]);

  useEffect(() => {
    void fetchSuggestions();
  }, [fetchSuggestions]);

  const handleAction = useCallback(
    async (suggestionId: string, action: SuggestionAction) => {
      if (!activeChannel) {return;}
      const result = await apiFetchJson<ActionResponse>(
        `/api/me/channels/${activeChannel.id}/suggestions/${suggestionId}/action`,
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
    [activeChannel],
  );

  return (
    <PageContainer>
      {initialActiveChannelId && (
        <ProfileCompletionPopup channelId={initialActiveChannelId} />
      )}
      <div className={s.grid}>
        <div className={`${s.leftPanel} ${s.panelCard}`}>
          <h2 className={s.panelTitle}>Performance Overview</h2>
          <OverviewPanel channelId={initialActiveChannelId!} />
        </div>
        <div className={`${s.rightPanel} ${s.panelCard}`}>
          <SuggestionPanel
            suggestions={suggestions}
            loading={suggestionsLoading}
            error={suggestionsError}
            onAction={handleAction}
            onRetry={fetchSuggestions}
          />
        </div>
      </div>
    </PageContainer>
  );
}
