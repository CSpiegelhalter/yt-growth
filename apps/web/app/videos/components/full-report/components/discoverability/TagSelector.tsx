"use client";

import { useCallback, useState } from "react";

import { copyToClipboard } from "../../ui/copy-to-clipboard";
import s from "./discoverability.module.css";

type TagSelectorProps = {
  tags: string[];
};

export function TagSelector({ tags }: TagSelectorProps) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set(tags));
  const [copyLabel, setCopyLabel] = useState("Copy Selected Tags");

  const toggleTag = useCallback((tag: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) {
        next.delete(tag);
      } else {
        next.add(tag);
      }
      return next;
    });
  }, []);

  const handleCopy = useCallback(() => {
    const text = tags.filter((t) => selected.has(t)).join(", ");
    void copyToClipboard(text, setCopyLabel, "Copy Selected Tags");
  }, [tags, selected]);

  if (tags.length === 0) { return null; }

  return (
    <div className={s.tagSelectorWrap}>
      <div className={s.tagPills}>
        {tags.map((tag) => (
          <button
            key={tag}
            type="button"
            className={`${s.tagPill} ${selected.has(tag) ? s.tagPillSelected : ""}`}
            onClick={() => toggleTag(tag)}
            aria-pressed={selected.has(tag)}
          >
            {tag}
          </button>
        ))}
      </div>
      <button type="button" className={s.copyBtn} onClick={handleCopy}>
        {copyLabel}
      </button>
    </div>
  );
}
