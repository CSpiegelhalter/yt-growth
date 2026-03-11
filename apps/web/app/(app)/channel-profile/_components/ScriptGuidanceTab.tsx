"use client";

import { useCallback } from "react";

import type { ChannelProfileInput } from "@/lib/features/channels/schemas";
import { SCRIPT_TONES } from "@/lib/features/channels/types";

import { ProfileInfoBanner } from "./ProfileInfoBanner";
import { ProfileQuestionField } from "./ProfileQuestionField";
import { ProfileSelect } from "./ProfileSelect";
import s from "./tab-content.module.css";

type Props = {
  input: ChannelProfileInput;
  onFieldChange: (input: ChannelProfileInput) => void;
  onSuggest: (field: string, section: string) => void;
  isFieldLoading: (field: string) => boolean;
};

export function ScriptGuidanceTab({ input, onFieldChange, onSuggest, isFieldLoading }: Props) {
  const guidance = input.scriptGuidance ?? {
    tone: "",
    structurePreference: "",
    styleNotes: "",
    neverInclude: "",
  };

  const updateGuidance = useCallback(
    (field: string, value: string) => {
      onFieldChange({
        ...input,
        scriptGuidance: { ...guidance, [field]: value },
      });
    },
    [input, guidance, onFieldChange],
  );

  return (
    <div className={s.tabContent} role="tabpanel">
      <h2 className={s.tabTitle}>Script Guidance</h2>

      <ProfileInfoBanner
        title="These sections are important to complete"
        description="Script guidance helps our AI write in your voice and follow your preferred structure when generating scripts and outlines."
      />

      <ProfileQuestionField label="Tone" showSuggest suggestLoading={isFieldLoading("tone")} onSuggest={() => onSuggest("tone", "scriptGuidance")}>
        <ProfileSelect
          options={SCRIPT_TONES}
          value={guidance.tone ?? ""}
          onChange={(v) => updateGuidance("tone", v)}
          placeholder="Select a tone..."
          ariaLabel="Tone"
        />
      </ProfileQuestionField>

      <ProfileQuestionField
        label="Script structure preference"
        showSuggest
        suggestLoading={isFieldLoading("structurePreference")}
        onSuggest={() => onSuggest("structurePreference", "scriptGuidance")}
      >
        <textarea
          className={s.textarea}
          value={guidance.structurePreference ?? ""}
          onChange={(e) =>
            updateGuidance("structurePreference", e.target.value)
          }
          placeholder="e.g., hook > story > lesson > CTA"
          maxLength={2000}
        />
      </ProfileQuestionField>

      <ProfileQuestionField
        label="Phrases or style notes"
        showSuggest
        suggestLoading={isFieldLoading("styleNotes")}
        onSuggest={() => onSuggest("styleNotes", "scriptGuidance")}
      >
        <textarea
          className={s.textarea}
          value={guidance.styleNotes ?? ""}
          onChange={(e) => updateGuidance("styleNotes", e.target.value)}
          placeholder="Any catchphrases, recurring segments, or stylistic notes our AI should know about?"
          maxLength={2000}
        />
      </ProfileQuestionField>

      <ProfileQuestionField
        label="Things to never include"
        showSuggest
        suggestLoading={isFieldLoading("neverInclude")}
        onSuggest={() => onSuggest("neverInclude", "scriptGuidance")}
      >
        <textarea
          className={s.textarea}
          value={guidance.neverInclude ?? ""}
          onChange={(e) => updateGuidance("neverInclude", e.target.value)}
          placeholder="Anything scripts should never contain? (e.g., clickbait, profanity, specific phrases)"
          maxLength={2000}
        />
      </ProfileQuestionField>
    </div>
  );
}
