"use client";

import { useCallback, useState } from "react";

import type { ChannelProfileInput } from "@/lib/features/channels/schemas";
import type { CompetitorEntry } from "@/lib/features/channels/types";

import { CompetitorCardRow } from "./CompetitorCard";
import { ProfileInfoBanner } from "./ProfileInfoBanner";
import { ProfileQuestionField } from "./ProfileQuestionField";
import s from "./tab-content.module.css";

type Props = {
  input: ChannelProfileInput;
  onFieldChange: (input: ChannelProfileInput) => void;
  onSuggest: (field: string, section: string) => void;
  isFieldLoading: (field: string) => boolean;
};

type CompetitorTier = "closeToSize" | "aspirational" | "nicheHero";

type TierConfig = {
  key: CompetitorTier;
  title: string;
  description: string;
  cardLabel: string;
};

const TIER_CONFIGS: TierConfig[] = [
  {
    key: "closeToSize",
    title: "Who are you inspired by but is close to you in size",
    description:
      "Channels at a similar subscriber count or growth stage that inspire your content direction.",
    cardLabel: "Peer",
  },
  {
    key: "aspirational",
    title: "Who are you inspired by at a larger scale",
    description:
      "Bigger channels whose content style, production quality, or strategy you want to emulate.",
    cardLabel: "Aspirational",
  },
  {
    key: "nicheHero",
    title: "Who is your niche hero",
    description:
      "The top creator in your niche — the channel that defines excellence in your space.",
    cardLabel: "Niche Hero",
  },
];

function CompetitorSection({
  config,
  entries,
  onAdd,
  onRemove,
  onSuggest,
  isFieldLoading,
}: {
  config: TierConfig;
  entries: CompetitorEntry[];
  onAdd: (entry: CompetitorEntry) => void;
  onRemove: (index: number) => void;
  onSuggest?: (field: string, section: string) => void;
  isFieldLoading?: (field: string) => boolean;
}) {
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [admire, setAdmire] = useState("");

  const handleAdd = () => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl || entries.length >= 3) {
      return;
    }
    onAdd({
      channelUrl: trimmedUrl,
      channelName: name.trim() || trimmedUrl,
      whatYouAdmire: admire.trim(),
    });
    setUrl("");
    setName("");
    setAdmire("");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <ProfileQuestionField label={config.title}>
        <p
          style={{
            color: "var(--color-imperial-blue)",
            fontSize: "var(--text-sm)",
            fontWeight: "var(--font-medium)",
            letterSpacing: "0.03em",
            lineHeight: "var(--leading-normal)",
            margin: 0,
          }}
        >
          {config.description}
        </p>
      </ProfileQuestionField>

      <CompetitorCardRow
        entries={entries}
        categoryLabel={config.cardLabel}
        onRemove={onRemove}
      />

      {entries.length < 3 && (
        <>
          <ProfileQuestionField label="Channel name" showSuggest suggestLoading={isFieldLoading?.("channelName")} onSuggest={() => onSuggest?.("channelName", "competitors")}>
            <input
              className={s.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., MKBHD"
              maxLength={200}
            />
          </ProfileQuestionField>

          <ProfileQuestionField label="Channel URL">
            <input
              className={s.input}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="youtube.com/channelURL"
              maxLength={500}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAdd();
                }
              }}
            />
          </ProfileQuestionField>

          <ProfileQuestionField label="What do you admire?">
            <textarea
              className={s.textarea}
              value={admire}
              onChange={(e) => setAdmire(e.target.value)}
              placeholder="What specifically do you admire about their content?"
              maxLength={1000}
              onBlur={handleAdd}
            />
          </ProfileQuestionField>
        </>
      )}
    </div>
  );
}

export function CompetitorsTab({ input, onFieldChange, onSuggest, isFieldLoading }: Props) {
  const competitors = input.competitors ?? {
    closeToSize: [],
    aspirational: [],
    nicheHero: [],
    differentiation: "",
  };

  const updateCompetitors = useCallback(
    (field: string, value: unknown) => {
      onFieldChange({
        ...input,
        competitors: { ...competitors, [field]: value },
      });
    },
    [input, competitors, onFieldChange],
  );

  const handleAdd = useCallback(
    (tier: CompetitorTier, entry: CompetitorEntry) => {
      const current = competitors[tier] ?? [];
      if (current.length >= 3) {
        return;
      }
      updateCompetitors(tier, [...current, entry]);
    },
    [competitors, updateCompetitors],
  );

  const handleRemove = useCallback(
    (tier: CompetitorTier, index: number) => {
      const current = competitors[tier] ?? [];
      updateCompetitors(
        tier,
        current.filter((_, i) => i !== index),
      );
    },
    [competitors, updateCompetitors],
  );

  return (
    <div className={s.tabContent} role="tabpanel">
      <h2 className={s.tabTitle}>Competitors</h2>

      <ProfileInfoBanner
        title="These sections are important to complete"
        description="Adding competitors and inspirations enables competitor-aware recommendations and helps us understand your positioning goals."
      />

      {TIER_CONFIGS.map((config) => (
        <CompetitorSection
          key={config.key}
          config={config}
          entries={competitors[config.key] ?? []}
          onAdd={(entry) => handleAdd(config.key, entry)}
          onRemove={(index) => handleRemove(config.key, index)}
          onSuggest={onSuggest}
          isFieldLoading={isFieldLoading}
        />
      ))}

      <ProfileQuestionField label="What makes you different?">
        <textarea
          className={s.textarea}
          value={competitors.differentiation ?? ""}
          onChange={(e) =>
            updateCompetitors("differentiation", e.target.value)
          }
          placeholder="What should make your channel clearly different from all of them?"
          maxLength={2000}
        />
      </ProfileQuestionField>
    </div>
  );
}
