"use client";

import { useState } from "react";
import s from "../style.module.css";

type TagChipProps = {
  tag: string;
};

/**
 * TagChip - Clickable tag that copies to clipboard
 */
export function TagChip({ tag }: TagChipProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(tag);
    setCopied(true);
    setTimeout(() => setCopied(false), 900);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`${s.tagChipBtn} ${copied ? s.tagChipCopied : ""}`}
      aria-label={`Copy tag: ${tag}`}
      title={copied ? "Copied" : "Click to copy"}
    >
      {tag}
    </button>
  );
}

