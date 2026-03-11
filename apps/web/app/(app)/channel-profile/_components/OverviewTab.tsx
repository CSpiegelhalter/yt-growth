"use client";

import { useCallback, useState } from "react";

import type { ChannelProfileInput } from "@/lib/features/channels/schemas";
import {
  CONTENT_STYLES,
  CREATOR_STRENGTHS,
} from "@/lib/features/channels/types";

import { ChipGroup } from "./ChipGroup";
import { ProfileInfoBanner } from "./ProfileInfoBanner";
import { ProfileQuestionField } from "./ProfileQuestionField";
import s from "./tab-content.module.css";

type Props = {
  input: ChannelProfileInput;
  onFieldChange: (input: ChannelProfileInput) => void;
};

export function OverviewTab({ input, onFieldChange }: Props) {
  const overview = input.overview ?? {
    channelDescription: "",
    coreTopics: [],
    knownFor: "",
    contentStyles: [],
    creatorStrengths: [],
  };

  const [topicInput, setTopicInput] = useState("");

  const updateOverview = useCallback(
    (field: string, value: unknown) => {
      onFieldChange({
        ...input,
        overview: { ...overview, [field]: value },
      });
    },
    [input, overview, onFieldChange],
  );

  const addTopic = useCallback(() => {
    const trimmed = topicInput.trim();
    if (!trimmed) {
      return;
    }
    const current = overview.coreTopics ?? [];
    if (current.length >= 20 || current.includes(trimmed)) {
      return;
    }
    updateOverview("coreTopics", [...current, trimmed]);
    setTopicInput("");
  }, [topicInput, overview.coreTopics, updateOverview]);

  const removeTopic = useCallback(
    (topic: string) => {
      const current = overview.coreTopics ?? [];
      updateOverview(
        "coreTopics",
        current.filter((t) => t !== topic),
      );
    },
    [overview.coreTopics, updateOverview],
  );

  const toggleChip = useCallback(
    (field: "contentStyles" | "creatorStrengths", value: string) => {
      const current = (overview[field] as string[]) ?? [];
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      updateOverview(field, updated);
    },
    [overview, updateOverview],
  );

  return (
    <div className={s.tabContent} role="tabpanel">
      <h2 className={s.tabTitle}>Overview</h2>

      <ProfileInfoBanner
        title="These sections are important to complete"
        description="Filling out your channel identity helps us understand who you are and what you create, so we can provide better video ideas and strategy suggestions."
      />

      <ProfileQuestionField label="Channel description">
        <textarea
          className={s.textarea}
          value={overview.channelDescription ?? ""}
          onChange={(e) =>
            updateOverview("channelDescription", e.target.value)
          }
          placeholder="In 2-3 sentences, describe what your channel is about and who it's for..."
          maxLength={2000}
        />
      </ProfileQuestionField>

      <ProfileQuestionField label="Core topics">
        <div className={s.tagInputWrapper}>
          {(overview.coreTopics ?? []).map((topic) => (
            <span key={topic} className={s.tagChip}>
              {topic}
              <button
                type="button"
                className={s.tagRemove}
                onClick={() => removeTopic(topic)}
                aria-label={`Remove ${topic}`}
              >
                x
              </button>
            </span>
          ))}
        </div>
        <input
          className={s.input}
          value={topicInput}
          onChange={(e) => setTopicInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTopic();
            }
          }}
          placeholder="Type a topic and press Enter..."
          maxLength={100}
        />
      </ProfileQuestionField>

      <ProfileQuestionField label="Known for">
        <input
          className={s.input}
          value={overview.knownFor ?? ""}
          onChange={(e) => updateOverview("knownFor", e.target.value)}
          placeholder="What do you want your channel to be known for?"
          maxLength={500}
        />
      </ProfileQuestionField>

      <ProfileQuestionField label="Content style">
        <ChipGroup
          options={CONTENT_STYLES}
          selected={overview.contentStyles ?? []}
          onToggle={(v) => toggleChip("contentStyles", v)}
          ariaLabel="Select content styles"
        />
      </ProfileQuestionField>

      <ProfileQuestionField label="Creator strengths">
        <ChipGroup
          options={CREATOR_STRENGTHS}
          selected={overview.creatorStrengths ?? []}
          onToggle={(v) => toggleChip("creatorStrengths", v)}
          ariaLabel="Select creator strengths"
        />
      </ProfileQuestionField>
    </div>
  );
}
