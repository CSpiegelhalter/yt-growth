"use client";

import { useCallback } from "react";

import type { ChannelProfileInput } from "@/lib/features/channels/schemas";
import { FORMAT_PREFERENCES } from "@/lib/features/channels/types";

import { ChipGroup } from "./ChipGroup";
import { ProfileInfoBanner } from "./ProfileInfoBanner";
import { ProfileQuestionField } from "./ProfileQuestionField";
import s from "./tab-content.module.css";

type Props = {
  input: ChannelProfileInput;
  onFieldChange: (input: ChannelProfileInput) => void;
  onSuggest: (field: string, section: string) => void;
  isFieldLoading: (field: string) => boolean;
};

export function IdeaGuidanceTab({ input, onFieldChange, onSuggest, isFieldLoading }: Props) {
  const guidance = input.ideaGuidance ?? {
    topicsToLeanInto: "",
    topicsToAvoid: "",
    idealVideo: "",
    formatPreferences: [],
    viewerFeeling: "",
  };

  const updateGuidance = useCallback(
    (field: string, value: unknown) => {
      onFieldChange({
        ...input,
        ideaGuidance: { ...guidance, [field]: value },
      });
    },
    [input, guidance, onFieldChange],
  );

  const toggleFormat = useCallback(
    (value: string) => {
      const current = guidance.formatPreferences ?? [];
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      updateGuidance("formatPreferences", updated);
    },
    [guidance.formatPreferences, updateGuidance],
  );

  return (
    <div className={s.tabContent} role="tabpanel">
      <h2 className={s.tabTitle}>New Idea Guidance</h2>

      <ProfileInfoBanner
        title="These sections are important to complete"
        description="The more we know about what content you want to create, the better our AI can generate video ideas that match your vision."
      />

      <ProfileQuestionField
        label="Topics to lean into"
        showSuggest
        suggestLoading={isFieldLoading("topicsToLeanInto")}
        onSuggest={() => onSuggest("topicsToLeanInto", "ideaGuidance")}
      >
        <textarea
          className={s.textarea}
          value={guidance.topicsToLeanInto ?? ""}
          onChange={(e) =>
            updateGuidance("topicsToLeanInto", e.target.value)
          }
          placeholder="e.g., budget travel tips, hidden gems in Europe, solo travel safety..."
          maxLength={2000}
        />
      </ProfileQuestionField>

      <ProfileQuestionField
        label="Topics to avoid"
        showSuggest
        suggestLoading={isFieldLoading("topicsToAvoid")}
        onSuggest={() => onSuggest("topicsToAvoid", "ideaGuidance")}
      >
        <textarea
          className={s.textarea}
          value={guidance.topicsToAvoid ?? ""}
          onChange={(e) => updateGuidance("topicsToAvoid", e.target.value)}
          placeholder="e.g., luxury hotels, sponsored content, political topics..."
          maxLength={2000}
        />
      </ProfileQuestionField>

      <ProfileQuestionField
        label="Ideal video description"
        showSuggest
        suggestLoading={isFieldLoading("idealVideo")}
        onSuggest={() => onSuggest("idealVideo", "ideaGuidance")}
      >
        <textarea
          className={s.textarea}
          value={guidance.idealVideo ?? ""}
          onChange={(e) => updateGuidance("idealVideo", e.target.value)}
          placeholder="Describe your ideal video — what does it look like, feel like, and accomplish?"
          maxLength={2000}
        />
      </ProfileQuestionField>

      <ProfileQuestionField label="Content format preferences">
        <ChipGroup
          options={FORMAT_PREFERENCES}
          selected={guidance.formatPreferences ?? []}
          onToggle={toggleFormat}
          ariaLabel="Select content format preferences"
        />
      </ProfileQuestionField>

      <ProfileQuestionField
        label="Viewer feeling"
        showSuggest
        suggestLoading={isFieldLoading("viewerFeeling")}
        onSuggest={() => onSuggest("viewerFeeling", "ideaGuidance")}
      >
        <input
          className={s.input}
          value={guidance.viewerFeeling ?? ""}
          onChange={(e) => updateGuidance("viewerFeeling", e.target.value)}
          placeholder="What should viewers feel after watching your content?"
          maxLength={500}
        />
      </ProfileQuestionField>
    </div>
  );
}
