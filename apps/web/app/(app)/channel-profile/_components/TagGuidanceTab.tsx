"use client";

import { useCallback, useState } from "react";

import type { ChannelProfileInput } from "@/lib/features/channels/schemas";
import { TAG_STYLE_PREFERENCES } from "@/lib/features/channels/types";

import { ProfileInfoBanner } from "./ProfileInfoBanner";
import { ProfileQuestionField } from "./ProfileQuestionField";
import { ProfileSelect } from "./ProfileSelect";
import s from "./tab-content.module.css";

type Props = {
  input: ChannelProfileInput;
  onFieldChange: (input: ChannelProfileInput) => void;
};

function TagInput({
  tags,
  onAdd,
  onRemove,
  placeholder,
  maxItems,
}: {
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (tag: string) => void;
  placeholder: string;
  maxItems: number;
}) {
  const [value, setValue] = useState("");

  const handleAdd = () => {
    const trimmed = value.trim();
    if (!trimmed || tags.length >= maxItems || tags.includes(trimmed)) {
      return;
    }
    onAdd(trimmed);
    setValue("");
  };

  return (
    <>
      <div className={s.tagInputWrapper}>
        {tags.map((tag) => (
          <span key={tag} className={s.tagChip}>
            {tag}
            <button
              type="button"
              className={s.tagRemove}
              onClick={() => onRemove(tag)}
              aria-label={`Remove ${tag}`}
            >
              x
            </button>
          </span>
        ))}
      </div>
      <input
        className={s.input}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleAdd();
          }
        }}
        placeholder={placeholder}
        maxLength={100}
      />
    </>
  );
}

export function TagGuidanceTab({ input, onFieldChange }: Props) {
  const guidance = input.tagGuidance ?? {
    primaryKeywords: [],
    nicheTerms: [],
    tagStylePreference: "",
  };

  const updateGuidance = useCallback(
    (field: string, value: unknown) => {
      onFieldChange({
        ...input,
        tagGuidance: { ...guidance, [field]: value },
      });
    },
    [input, guidance, onFieldChange],
  );

  return (
    <div className={s.tabContent} role="tabpanel">
      <h2 className={s.tabTitle}>Tag Guidance</h2>

      <ProfileInfoBanner
        title="These sections are important to complete"
        description="Keywords and tag preferences help our AI generate discoverable, relevant tags for each video you publish."
      />

      <ProfileQuestionField label="Primary keywords">
        <TagInput
          tags={guidance.primaryKeywords ?? []}
          onAdd={(tag) =>
            updateGuidance("primaryKeywords", [
              ...(guidance.primaryKeywords ?? []),
              tag,
            ])
          }
          onRemove={(tag) =>
            updateGuidance(
              "primaryKeywords",
              (guidance.primaryKeywords ?? []).filter((t) => t !== tag),
            )
          }
          placeholder="Type a keyword and press Enter..."
          maxItems={30}
        />
      </ProfileQuestionField>

      <ProfileQuestionField label="Niche terms">
        <TagInput
          tags={guidance.nicheTerms ?? []}
          onAdd={(tag) =>
            updateGuidance("nicheTerms", [
              ...(guidance.nicheTerms ?? []),
              tag,
            ])
          }
          onRemove={(tag) =>
            updateGuidance(
              "nicheTerms",
              (guidance.nicheTerms ?? []).filter((t) => t !== tag),
            )
          }
          placeholder="Any niche-specific terms or jargon your audience searches for?"
          maxItems={30}
        />
      </ProfileQuestionField>

      <ProfileQuestionField label="Tag style preference">
        <ProfileSelect
          options={TAG_STYLE_PREFERENCES}
          value={guidance.tagStylePreference ?? ""}
          onChange={(v) => updateGuidance("tagStylePreference", v)}
          placeholder="Select tag style..."
          ariaLabel="Tag style preference"
        />
      </ProfileQuestionField>
    </div>
  );
}
