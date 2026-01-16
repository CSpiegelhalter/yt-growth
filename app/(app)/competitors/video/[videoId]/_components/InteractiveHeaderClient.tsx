"use client";

import { useState, useCallback, memo } from "react";
import { copyToClipboard } from "@/components/ui/Toast";
import s from "../style.module.css";

type TagsInlineProps = {
  tags: string[];
};

/**
 * TagsInline - Client component for interactive tags display.
 *
 * Handles:
 * - Show more/less tags toggle
 * - Copy all tags to clipboard with feedback
 */
export const TagsInline = memo(function TagsInline({ tags }: TagsInlineProps) {
  const [showAllTags, setShowAllTags] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyAll = useCallback(async () => {
    const success = await copyToClipboard(tags.join(", "));
    if (success) {
      setCopiedId("all-tags");
      setTimeout(() => setCopiedId(null), 1500);
    }
  }, [tags]);

  if (tags.length === 0) {
    return null;
  }

  const visibleTags = showAllTags ? tags : tags.slice(0, 12);
  const hasMoreTags = tags.length > 12;

  return (
    <div className={s.tagsInline}>
      <div className={s.tagsChips}>
        {visibleTags.map((tag, i) => (
          <span key={i} className={s.tagChip}>
            {tag}
          </span>
        ))}
        {hasMoreTags && !showAllTags && (
          <button
            className={s.showMoreTagsBtn}
            onClick={() => setShowAllTags(true)}
          >
            +{tags.length - 12} more
          </button>
        )}
      </div>
      <button className={s.copyAllTagsBtn} onClick={handleCopyAll}>
        {copiedId === "all-tags" ? "Copied" : "Copy all"}
      </button>
    </div>
  );
});

type CopyButtonProps = {
  text: string;
  label?: string;
  copiedLabel?: string;
  className?: string;
};

/**
 * CopyButton - Generic copy-to-clipboard button with feedback.
 */
export const CopyButton = memo(function CopyButton({
  text,
  label = "Copy",
  copiedLabel = "Copied!",
  className,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }, [text]);

  return (
    <button className={className ?? s.copyBtn} onClick={handleCopy}>
      {copied ? copiedLabel : label}
    </button>
  );
});

type HookQuoteCopyProps = {
  quote: string;
};

/**
 * HookQuoteCopy - Copy button for hook inspiration quotes.
 */
export const HookQuoteCopy = memo(function HookQuoteCopy({
  quote,
}: HookQuoteCopyProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    const success = await copyToClipboard(quote);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }, [quote]);

  return (
    <div className={s.hookQuote}>
      <span className={s.quoteText}>&ldquo;{quote}&rdquo;</span>
      <button className={s.copyQuoteBtn} onClick={handleCopy}>
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
});

type RemixCardCopyProps = {
  remix: {
    title: string;
    hook: string;
    overlayText: string;
    angle: string;
  };
};

/**
 * RemixCardCopy - Copy button for remix idea cards.
 */
export const RemixCardCopy = memo(function RemixCardCopy({
  remix,
}: RemixCardCopyProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    const text = `Title: ${remix.title}\nHook: ${remix.hook}\nThumbnail: ${remix.overlayText}\nAngle: ${remix.angle}`;
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }, [remix]);

  return (
    <button className={s.copyBtn} onClick={handleCopy}>
      {copied ? "Copied!" : "Copy Idea"}
    </button>
  );
});
