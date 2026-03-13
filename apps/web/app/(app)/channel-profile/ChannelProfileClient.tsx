"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { ErrorBanner, PageContainer } from "@/components/ui";
import type { ChannelProfileInput } from "@/lib/features/channels/schemas";
import type { ProfileTabId } from "@/lib/features/channels/types";
import { DEFAULT_PROFILE_INPUT } from "@/lib/features/channels/types";
import { useChannelProfile } from "@/lib/hooks/use-channel-profile";

import { CompetitorsTab } from "./_components/CompetitorsTab";
import { DescriptionGuidanceTab } from "./_components/DescriptionGuidanceTab";
import { IdeaGuidanceTab } from "./_components/IdeaGuidanceTab";
import { OverviewTab } from "./_components/OverviewTab";
import { ProfileTabNav } from "./_components/ProfileTabNav";
import { ScriptGuidanceTab } from "./_components/ScriptGuidanceTab";
import { TagGuidanceTab } from "./_components/TagGuidanceTab";
import { useProfileSuggest } from "./_hooks/useProfileSuggest";
import s from "./style.module.css";

function SaveStatusIndicator({
  status,
}: {
  status: "idle" | "saving" | "saved" | "error";
}) {
  if (status === "idle") {
    return <div className={s.saveStatus} />;
  }

  const cls =
    status === "saving"
      ? s.saveStatusSaving
      : status === "saved"
        ? s.saveStatusSaved
        : s.saveStatusError;

  const text =
    status === "saving"
      ? "Saving..."
      : status === "saved"
        ? "Saved"
        : "Save failed";

  return (
    <div className={`${s.saveStatus} ${cls}`} role="status" aria-live="polite">
      {text}
    </div>
  );
}

export default function ChannelProfileClient() {
  const searchParams = useSearchParams();
  const channelId = searchParams.get("channelId");

  const {
    profile,
    loading,
    error,
    saveStatus,
    debouncedSave,
    cancelPendingSave,
    clearError,
  } = useChannelProfile(channelId);

  const [activeTab, setActiveTab] = useState<ProfileTabId>("overview");
  const [localInput, setLocalInput] = useState<ChannelProfileInput>(
    DEFAULT_PROFILE_INPUT,
  );
  const initializedRef = useRef(false);

  // Sync profile data to local state on initial load only
  useEffect(() => {
    if (profile && !initializedRef.current) {
      initializedRef.current = true;
      if (profile.input) {
        setLocalInput({ ...DEFAULT_PROFILE_INPUT, ...profile.input });
      }
    }
  }, [profile]);

  // Sync URL hash to tab state
  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (hash) {
      setActiveTab(hash as ProfileTabId);
    }
  }, []);

  const handleTabChange = useCallback((tabId: ProfileTabId) => {
    setActiveTab(tabId);
    window.history.replaceState(null, "", `#${tabId}`);
  }, []);

  const handleFieldChange = useCallback(
    (updatedInput: ChannelProfileInput) => {
      setLocalInput(updatedInput);
      debouncedSave(updatedInput);
    },
    [debouncedSave],
  );

  const { suggestField, isFieldLoading } = useProfileSuggest(channelId);

  const handleSuggest = useCallback(
    async (field: string, section: string) => {
      const value = await suggestField(field, section, localInput);
      if (!value) { return; }

      let updated: ChannelProfileInput | undefined;
      setLocalInput((prev) => {
        const sectionData =
          (prev[section as keyof ChannelProfileInput] as Record<string, unknown>) ?? {};
        updated = {
          ...prev,
          [section]: { ...sectionData, [field]: value },
        } as ChannelProfileInput;
        return updated;
      });
      if (updated) {
        debouncedSave(updated);
      }
    },
    [suggestField, localInput, debouncedSave],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => cancelPendingSave();
  }, [cancelPendingSave]);

  // No channel selected
  if (!channelId) {
    return (
      <PageContainer>
        <div className={s.emptyState}>
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
            <circle cx="8.5" cy="7" r="4" />
            <path d="M20 8v6M23 11h-6" />
          </svg>
          <h2>No Channel Selected</h2>
          <p>Please select a channel from your videos page first.</p>
          <Link href="/videos" className={s.backBtn}>
            Go to Videos
          </Link>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {error && (
        <ErrorBanner message={error} dismissible onDismiss={clearError} />
      )}

      <SaveStatusIndicator status={saveStatus} />

      {loading ? (
        <div className={s.loadingState}>
          <div className={s.spinner} />
          <p>Loading profile...</p>
        </div>
      ) : (
        <div className={s.layout}>
          <ProfileTabNav
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
          <div className={s.contentCard}>
            {activeTab === "overview" && (
              <OverviewTab
                input={localInput}
                onFieldChange={handleFieldChange}
              />
            )}
            {activeTab === "idea-guidance" && (
              <IdeaGuidanceTab
                input={localInput}
                onFieldChange={handleFieldChange}
                onSuggest={handleSuggest}
                isFieldLoading={isFieldLoading}
              />
            )}
            {activeTab === "script-guidance" && (
              <ScriptGuidanceTab
                input={localInput}
                onFieldChange={handleFieldChange}
                onSuggest={handleSuggest}
                isFieldLoading={isFieldLoading}
              />
            )}
            {activeTab === "tag-guidance" && (
              <TagGuidanceTab
                input={localInput}
                onFieldChange={handleFieldChange}
              />
            )}
            {activeTab === "description-guidance" && (
              <DescriptionGuidanceTab
                input={localInput}
                onFieldChange={handleFieldChange}
                onSuggest={handleSuggest}
                isFieldLoading={isFieldLoading}
              />
            )}
            {activeTab === "competitors" && (
              <CompetitorsTab
                input={localInput}
                onFieldChange={handleFieldChange}
                onSuggest={handleSuggest}
                isFieldLoading={isFieldLoading}
              />
            )}
          </div>
        </div>
      )}
    </PageContainer>
  );
}
