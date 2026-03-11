"use client";

import { useCallback } from "react";

import type { ChannelProfileInput } from "@/lib/features/channels/schemas";
import { SEO_PRIORITIES } from "@/lib/features/channels/types";

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

export function DescriptionGuidanceTab({ input, onFieldChange, onSuggest, isFieldLoading }: Props) {
  const guidance = input.descriptionGuidance ?? {
    descriptionFormat: "",
    standardLinks: "",
    seoPriority: "",
  };

  const updateGuidance = useCallback(
    (field: string, value: string) => {
      onFieldChange({
        ...input,
        descriptionGuidance: { ...guidance, [field]: value },
      });
    },
    [input, guidance, onFieldChange],
  );

  return (
    <div className={s.tabContent} role="tabpanel">
      <h2 className={s.tabTitle}>Description Guidance</h2>

      <ProfileInfoBanner
        title="These sections are important to complete"
        description="Description preferences help our AI structure video descriptions with your preferred format, links, and SEO approach."
      />

      <ProfileQuestionField
        label="Description format"
        showSuggest
        suggestLoading={isFieldLoading("descriptionFormat")}
        onSuggest={() => onSuggest("descriptionFormat", "descriptionGuidance")}
      >
        <textarea
          className={s.textarea}
          value={guidance.descriptionFormat ?? ""}
          onChange={(e) =>
            updateGuidance("descriptionFormat", e.target.value)
          }
          placeholder="e.g., summary > timestamps > links > social"
          maxLength={2000}
        />
      </ProfileQuestionField>

      <ProfileQuestionField
        label="Standard links/CTAs"
        showSuggest
        suggestLoading={isFieldLoading("standardLinks")}
        onSuggest={() => onSuggest("standardLinks", "descriptionGuidance")}
      >
        <textarea
          className={s.textarea}
          value={guidance.standardLinks ?? ""}
          onChange={(e) => updateGuidance("standardLinks", e.target.value)}
          placeholder="What links, calls-to-action, or standard text should appear in every description?"
          maxLength={2000}
        />
      </ProfileQuestionField>

      <ProfileQuestionField label="SEO priority">
        <ProfileSelect
          options={SEO_PRIORITIES}
          value={guidance.seoPriority ?? ""}
          onChange={(v) => updateGuidance("seoPriority", v)}
          placeholder="Select SEO priority..."
          ariaLabel="SEO priority"
        />
      </ProfileQuestionField>
    </div>
  );
}
