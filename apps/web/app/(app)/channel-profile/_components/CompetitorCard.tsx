"use client";

import type { CompetitorEntry } from "@/lib/features/channels/types";

import s from "./CompetitorCard.module.css";

type Props = {
  entry: CompetitorEntry;
  categoryLabel: string;
  onRemove?: () => void;
};

function CompetitorCard({ entry, categoryLabel, onRemove }: Props) {
  return (
    <div className={s.card}>
      <p className={s.categoryLabel}>{categoryLabel}</p>
      <p className={s.channelName}>
        {entry.channelName || entry.channelUrl}
      </p>
      {onRemove && (
        <button
          type="button"
          className={s.removeBtn}
          onClick={onRemove}
          aria-label={`Remove ${entry.channelName || "competitor"}`}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

type CardRowProps = {
  entries: CompetitorEntry[];
  categoryLabel: string;
  onRemove: (index: number) => void;
};

export function CompetitorCardRow({
  entries,
  categoryLabel,
  onRemove,
}: CardRowProps) {
  if (entries.length === 0) {
    return null;
  }

  return (
    <div className={s.cardRow}>
      {entries.map((entry, index) => (
        <CompetitorCard
          key={entry.channelUrl || index}
          entry={entry}
          categoryLabel={categoryLabel}
          onRemove={() => onRemove(index)}
        />
      ))}
    </div>
  );
}
