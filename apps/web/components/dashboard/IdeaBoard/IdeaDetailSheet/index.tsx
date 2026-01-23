"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import s from "../style.module.css";
import type { Idea } from "@/types/api";
import { uniqStrings } from "../helpers";
import { TitleOptionsSection } from "./TitleOptionsSection";
import { HooksSection } from "./HooksSection";
import { TagsSection } from "./TagsSection";
import {
  CreativeDirectionsSection,
  type CreativeDirections,
} from "./CreativeDirectionsSection";
import { ScriptOutlineSection } from "./ScriptOutlineSection";
import { VariationsSection } from "./VariationsSection";

type AiRemix = {
  title: string;
  hook: string;
  angle: string;
};

type IdeaDetailSheetProps = {
  idea: Idea;
  onCopy: (text: string, id: string) => void;
  copiedId: string | null;
  onClose: () => void;
  channelId?: string;
  onDetailsGenerated?: (payload: {
    titles: string[];
    hooks: string[];
    keywords: string[];
    creativeDirections?: CreativeDirections | null;
    remixes?: AiRemix[];
  }) => void;
};

/**
 * IdeaDetailSheet - Scrollable bottom sheet for idea details
 */
export function IdeaDetailSheet({
  idea,
  onCopy,
  copiedId,
  onClose,
  channelId,
  onDetailsGenerated,
}: IdeaDetailSheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [extraHooks, setExtraHooks] = useState<string[]>([]);
  const [extraTitles, setExtraTitles] = useState<string[]>([]);
  const [extraKeywords, setExtraKeywords] = useState<string[]>([]);
  const [creativeDirections, setCreativeDirections] =
    useState<CreativeDirections | null>(null);
  const [aiRemixes, setAiRemixes] = useState<AiRemix[]>([]);
  const [detailTitles, setDetailTitles] = useState<string[]>([]);
  const [detailHooks, setDetailHooks] = useState<string[]>([]);
  const [detailKeywords, setDetailKeywords] = useState<string[]>([]);
  const [showAllTitles, setShowAllTitles] = useState(false);
  const [showAllHooks, setShowAllHooks] = useState(false);
  const [showAllTags, setShowAllTags] = useState(false);

  // Lock body scroll
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  // Focus management (a11y): focus close button on open, restore focus on close.
  useEffect(() => {
    restoreFocusRef.current =
      (document.activeElement as HTMLElement | null) ?? null;
    closeBtnRef.current?.focus();
    return () => {
      restoreFocusRef.current?.focus?.();
    };
  }, []);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  // Reset details when switching ideas
  useEffect(() => {
    setDetailsError(null);
    setDetailTitles(
      Array.isArray((idea as any)?.titles)
        ? ((idea as any).titles as any[])
            .map((t) => String(t?.text ?? "").trim())
            .filter(Boolean)
        : []
    );
    setDetailHooks(
      Array.isArray((idea as any)?.hooks)
        ? ((idea as any).hooks as any[])
            .map((h) => String(h?.text ?? "").trim())
            .filter(Boolean)
        : []
    );
    setDetailKeywords(
      Array.isArray((idea as any)?.keywords)
        ? ((idea as any).keywords as any[])
            .map((k) => String(k?.text ?? "").trim())
            .filter(Boolean)
        : []
    );
    setCreativeDirections(null);
    setAiRemixes([]);
    setExtraHooks([]);
    setExtraTitles([]);
    setExtraKeywords([]);
    setShowAllTitles(false);
    setShowAllHooks(false);
    setShowAllTags(false);
  }, [idea.id]);

  const fetchDetails = useCallback(async () => {
    if (!channelId) return;
    if (detailsLoading) return;
    setDetailsError(null);

    const controller = new AbortController();
    setDetailsLoading(true);
    try {
      const res = await fetch(`/api/me/channels/${channelId}/ideas/more`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          seed: {
            ideaId: idea.id,
            title: idea.title,
            summary: idea.angle,
            keywords: [],
            hooks: [],
          },
        }),
      });

      if (!res.ok) {
        setDetailsError(`Failed to generate suggestions (${res.status}).`);
        return;
      }

      const data = await res.json();

      const titles = Array.isArray(data.titles)
        ? data.titles.map((t: any) => String(t ?? "").trim()).filter(Boolean)
        : [];
      const hooks = Array.isArray(data.hooks)
        ? data.hooks.map((h: any) => String(h ?? "").trim()).filter(Boolean)
        : [];
      const keywords = Array.isArray(data.keywords)
        ? data.keywords.map((k: any) => String(k ?? "").trim()).filter(Boolean)
        : [];

      setDetailTitles(titles);
      setDetailHooks(hooks);
      setDetailKeywords(keywords);

      let directions: CreativeDirections | null = null;
      if (data.packaging) {
        const normalizeArr = (v: unknown) =>
          Array.isArray(v)
            ? (v.map((x) => String(x ?? "").trim()).filter(Boolean) as string[])
            : [];
        directions = {
          titleAngles: normalizeArr(data.packaging.titleAngles),
          hookSetups: normalizeArr(data.packaging.hookSetups),
          visualMoments: normalizeArr(data.packaging.visualMoments),
        };
        setCreativeDirections(directions);
      }
      const remixes = Array.isArray(data.remixes)
        ? data.remixes
            .map((r: any) => ({
              title: String(r?.title ?? "").trim(),
              hook: String(r?.hook ?? "").trim(),
              angle: String(r?.angle ?? "").trim(),
            }))
            .filter((r: any) => r.title || r.hook || r.angle)
        : [];
      if (remixes.length) setAiRemixes(remixes.slice(0, 6));

      onDetailsGenerated?.({
        titles,
        hooks,
        keywords,
        creativeDirections: directions,
        remixes,
      });
    } catch (err: any) {
      if (err?.name === "AbortError") return;
      setDetailsError("Failed to generate suggestions. Please try again.");
    } finally {
      setDetailsLoading(false);
      controller.abort();
    }
  }, [
    channelId,
    detailsLoading,
    idea.angle,
    idea.id,
    idea.title,
    onDetailsGenerated,
  ]);

  // Check if idea already has embedded data (from initial generation)
  const ideaHasEmbeddedData =
    Array.isArray((idea as any)?.titles) && (idea as any).titles.length > 0 ||
    Array.isArray((idea as any)?.hooks) && (idea as any).hooks.length > 0 ||
    Array.isArray((idea as any)?.keywords) && (idea as any).keywords.length > 0;

  // Auto-fetch details on open (separate LLM call from initial idea generation)
  // Only fetch if the idea doesn't already have embedded data
  useEffect(() => {
    if (!channelId) return;
    if (detailsLoading) return;
    // If the idea already has embedded data, don't fetch
    if (ideaHasEmbeddedData) return;
    // If we already have details from a previous fetch, don't refetch
    if (detailTitles.length || detailHooks.length || detailKeywords.length)
      return;
    fetchDetails();
  }, [
    channelId,
    detailHooks.length,
    detailKeywords.length,
    detailTitles.length,
    detailsLoading,
    fetchDetails,
    ideaHasEmbeddedData,
  ]);

  const allHooks = uniqStrings([...detailHooks, ...extraHooks])
    .map((h) => String(h ?? "").trim())
    .filter(Boolean);
  const allTitles = uniqStrings([...detailTitles, ...extraTitles])
    .map((t) => String(t ?? "").trim())
    .filter(Boolean);
  const allTags = uniqStrings([...detailKeywords, ...extraKeywords])
    .map((t) => String(t ?? "").trim())
    .filter(Boolean);

  const titleId = `idea-modal-title-${idea.id}`;
  const descId = `idea-modal-desc-${idea.id}`;
  const isInitialDetailsLoading =
    detailsLoading &&
    !detailsError &&
    allTitles.length === 0 &&
    allHooks.length === 0 &&
    allTags.length === 0;

  return (
    <div className={s.sheetOverlay} onClick={onClose}>
      <div
        ref={panelRef}
        className={s.sheetPanel}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
      >
        {/* Drag handle */}
        <div className={s.sheetHandle} aria-hidden="true" />

        {/* Sticky header with Generate More CTA */}
        <div className={s.sheetHeader}>
          <button
            ref={closeBtnRef}
            className={s.sheetClose}
            onClick={onClose}
            aria-label="Close"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
          <div className={s.sheetKicker}>Idea</div>
          <h2 id={titleId} className={s.sheetTitle}>
            {idea.title}
          </h2>

          {/* Only show status when loading without any data, or when there's an error */}
          {(isInitialDetailsLoading || detailsError) && (
            <div className={s.sheetStatus} aria-live="polite">
              {isInitialDetailsLoading ? "Generating suggestions…" : detailsError}
            </div>
          )}
        </div>

        {/* Scrollable Content */}
        <div className={s.sheetContent}>
          {isInitialDetailsLoading && (
            <div
              className={s.detailsLoadingBanner}
              role="status"
              aria-live="polite"
            >
              <span className={s.spinnerNeutral} aria-hidden="true" />
              Generating title options, hooks, and tags…
            </div>
          )}

          {/* Description */}
          <section className={s.sheetSection}>
            <div className={s.sectionHeader}>
              <h3 className={s.sectionTitle}>Description</h3>
              <button
                className={s.copyAllBtn}
                onClick={() =>
                  onCopy(`${idea.title}\n\n${idea.angle}`.trim(), "premise")
                }
              >
                {copiedId === "premise" ? "Copied" : "Copy"}
              </button>
            </div>
            <p id={descId} className={s.descriptionText}>
              {idea.angle}
            </p>
          </section>

          {/* Title Options */}
          <TitleOptionsSection
            titles={allTitles}
            copiedId={copiedId}
            isLoading={detailsLoading}
            hasError={!!detailsError}
            showAll={showAllTitles}
            onShowAllToggle={() => setShowAllTitles((v) => !v)}
            onCopy={onCopy}
            onRetry={fetchDetails}
          />

          {/* Hooks */}
          <HooksSection
            hooks={allHooks}
            copiedId={copiedId}
            isLoading={detailsLoading}
            hasError={!!detailsError}
            showAll={showAllHooks}
            onShowAllToggle={() => setShowAllHooks((v) => !v)}
            onCopy={onCopy}
            onRetry={fetchDetails}
          />

          {/* Recommended tags */}
          <TagsSection
            tags={allTags}
            copiedId={copiedId}
            isLoading={detailsLoading}
            hasError={!!detailsError}
            showAll={showAllTags}
            onShowAllToggle={() => setShowAllTags((v) => !v)}
            onCopy={onCopy}
            onRetry={fetchDetails}
          />

          {/* Creative directions (from Generate More) */}
          <CreativeDirectionsSection
            directions={creativeDirections}
            remixes={aiRemixes}
          />

          {/* Script (optional, collapsed by default) */}
          <ScriptOutlineSection scriptOutline={idea.scriptOutline} />

          {/* Variations */}
          <VariationsSection remixVariants={idea.remixVariants} />

          {/* Safe area padding */}
          <div className={s.safeAreaBottom} />
        </div>
      </div>
    </div>
  );
}

