"use client";

import { useCallback, useEffect, useState } from "react";

import { apiFetchJson } from "@/lib/client/api";
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
  channelId?: string | null;
};

type SavedCompetitorRow = {
  id: string;
  ytChannelId: string;
  channelTitle: string;
  thumbnailUrl: string | null;
  subscriberCount: number | null;
  type: string;
  source: string;
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

function SavedCompetitorsSection({ channelId }: { channelId: string }) {
  const [competitors, setCompetitors] = useState<SavedCompetitorRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCompetitors = useCallback(async () => {
    try {
      const result = await apiFetchJson<{ competitors: SavedCompetitorRow[] }>(
        `/api/me/channels/${channelId}/competitors`,
      );
      setCompetitors(result.competitors);
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, [channelId]);

  useEffect(() => {
    void fetchCompetitors();
  }, [fetchCompetitors]);

  async function handleToggleType(id: string, currentType: string) {
    const newType = currentType === "competitor" ? "inspiration" : "competitor";
    try {
      await apiFetchJson(`/api/me/channels/${channelId}/competitors/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: newType }),
      });
      setCompetitors((prev) =>
        prev.map((c) => (c.id === id ? { ...c, type: newType } : c)),
      );
    } catch {
      // Silently fail
    }
  }

  async function handleRemove(id: string) {
    try {
      await apiFetchJson(`/api/me/channels/${channelId}/competitors/${id}`, {
        method: "DELETE",
      });
      setCompetitors((prev) => prev.filter((c) => c.id !== id));
    } catch {
      // Silently fail
    }
  }

  if (loading) {
    return (
      <div style={{ padding: "var(--space-4) 0" }}>
        <p style={{ color: "var(--text-tertiary)", fontSize: "var(--text-sm)" }}>
          Loading saved competitors...
        </p>
      </div>
    );
  }

  if (competitors.length === 0) {
    return (
      <div style={{ padding: "var(--space-4) 0" }}>
        <p style={{ color: "var(--text-tertiary)", fontSize: "var(--text-sm)" }}>
          No saved competitors yet. They&apos;ll appear here once you discover them from the Dashboard.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
      {competitors.map((comp) => (
        <div
          key={comp.id}
          style={{
            alignItems: "center",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
            display: "flex",
            gap: "var(--space-3)",
            padding: "var(--space-2) var(--space-3)",
          }}
        >
          {comp.thumbnailUrl ? (
            <img
              src={comp.thumbnailUrl}
              alt=""
              style={{ borderRadius: "50%", height: 32, width: 32, objectFit: "cover" }}
              loading="lazy"
            />
          ) : (
            <span
              style={{
                alignItems: "center",
                background: "var(--surface-alt)",
                borderRadius: "50%",
                color: "var(--text-tertiary)",
                display: "flex",
                fontSize: "var(--text-sm)",
                fontWeight: "var(--font-bold)",
                height: 32,
                justifyContent: "center",
                width: 32,
              }}
            >
              {comp.channelTitle.charAt(0).toUpperCase()}
            </span>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: "var(--text)", fontSize: "var(--text-sm)", fontWeight: "var(--font-medium)" }}>
              {comp.channelTitle}
            </div>
            {comp.subscriberCount && (
              <div style={{ color: "var(--text-tertiary)", fontSize: "var(--text-xs)" }}>
                {comp.subscriberCount >= 1000
                  ? `${(comp.subscriberCount / 1000).toFixed(1)}K subs`
                  : `${comp.subscriberCount} subs`}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => handleToggleType(comp.id, comp.type)}
            style={{
              background: comp.type === "inspiration" ? "color-mix(in srgb, var(--color-warm-gold) 12%, transparent)" : "var(--surface-alt)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
              color: comp.type === "inspiration" ? "var(--color-warm-gold)" : "var(--text-secondary)",
              cursor: "pointer",
              font: "inherit",
              fontSize: "var(--text-xs)",
              padding: "2px 8px",
            }}
          >
            {comp.type === "inspiration" ? "Inspiration" : "Competitor"}
          </button>
          <button
            type="button"
            onClick={() => handleRemove(comp.id)}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-tertiary)",
              cursor: "pointer",
              fontSize: "var(--text-sm)",
              padding: "var(--space-1)",
            }}
            aria-label={`Remove ${comp.channelTitle}`}
          >
            &times;
          </button>
        </div>
      ))}
      <p style={{ color: "var(--text-tertiary)", fontSize: "var(--text-xs)", margin: 0 }}>
        {competitors.length}/5 competitors saved
      </p>
    </div>
  );
}

export function CompetitorsTab({ input, onFieldChange, onSuggest, isFieldLoading, channelId }: Props) {
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

      {/* Saved Competitors from the suggestion engine */}
      {channelId && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          <h3 style={{ color: "var(--color-imperial-blue)", fontSize: "var(--text-base)", fontWeight: "var(--font-bold)", margin: 0 }}>
            Saved Competitors
          </h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "var(--text-sm)", margin: 0 }}>
            Channels powering your idea suggestions. Add from the Dashboard or Analyze page.
          </p>
          <SavedCompetitorsSection channelId={channelId} />
        </div>
      )}

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
