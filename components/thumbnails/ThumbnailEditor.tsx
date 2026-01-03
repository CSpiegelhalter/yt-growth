"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import s from "./ThumbnailEditor.module.css";
import { useToast } from "@/components/ui/Toast";
import type { ThumbnailVariantResponse, ThumbnailPalette } from "@/lib/thumbnails/types";

type Props = {
  variant: ThumbnailVariantResponse;
  onClose: () => void;
  onUpdate: (updated: ThumbnailVariantResponse) => void;
};

export default function ThumbnailEditor({ variant, onClose, onUpdate }: Props) {
  const { toast } = useToast();

  // Hook text (concept-based)
  const [hookText, setHookText] = useState(
    variant.spec.hookText ?? variant.spec.plan?.hookText ?? ""
  );
  const [subHook, setSubHook] = useState(
    variant.spec.subHook ?? variant.spec.plan?.subHook ?? ""
  );
  const [badgeText, setBadgeText] = useState(
    variant.spec.badgeText ?? variant.spec.plan?.overlayDirectives?.badges?.[0]?.text ?? ""
  );
  const [align, setAlign] = useState<"left" | "center" | "right">(
    variant.spec.align ?? "left"
  );
  const [outline, setOutline] = useState(variant.spec.outline ?? true);
  const [shadow, setShadow] = useState(variant.spec.shadow ?? true);

  // Overlay toggles (new)
  const [showBadges, setShowBadges] = useState(variant.spec.showBadges ?? true);
  const [showSymbol, setShowSymbol] = useState(variant.spec.showSymbol ?? true);
  const [showHighlights, setShowHighlights] = useState(variant.spec.showHighlights ?? true);

  // Palette
  const [accentColor, setAccentColor] = useState(
    variant.spec.palette?.accent ?? variant.spec.plan?.palette?.accent ?? "#FFFF00"
  );
  const [textColor, setTextColor] = useState(
    variant.spec.palette?.text ?? variant.spec.plan?.palette?.text ?? "#FFFFFF"
  );

  // Loading states
  const [rerenderLoading, setRerenderLoading] = useState(false);
  const [regenerateLoading, setRegenerateLoading] = useState(false);

  // Safe zone toggle
  const [showSafeZone, setShowSafeZone] = useState(false);

  // Get concept info
  const conceptId = variant.spec.plan?.conceptId;
  const conceptName = variant.conceptName ?? conceptId?.replace(/-/g, " ") ?? "Unknown";
  const bigSymbol = variant.spec.plan?.overlayDirectives?.bigSymbol ?? "NONE";

  // Re-render overlay (no AI)
  const handleRerender = useCallback(async () => {
    setRerenderLoading(true);
    try {
      const res = await fetch(`/api/thumbnails/variants/${variant.variantId}/rerender`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patch: {
            hookText: hookText || undefined,
            subHook: subHook || undefined,
            badgeText: badgeText || undefined,
            align,
            outline,
            shadow,
            showBadges,
            showSymbol,
            showHighlights,
            palette: {
              accent: accentColor,
              text: textColor,
            },
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || data.message || "Re-render failed");
      }

      const updated: ThumbnailVariantResponse = await res.json();
      onUpdate(updated);
      toast("Thumbnail updated!", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Re-render failed", "error");
    } finally {
      setRerenderLoading(false);
    }
  }, [
    variant.variantId,
    hookText,
    subHook,
    badgeText,
    align,
    outline,
    shadow,
    showBadges,
    showSymbol,
    showHighlights,
    accentColor,
    textColor,
    onUpdate,
    toast,
  ]);

  // Regenerate base scene image (AI)
  const handleRegenerateBase = useCallback(async () => {
    setRegenerateLoading(true);
    try {
      const res = await fetch(
        `/api/thumbnails/variants/${variant.variantId}/regenerate-base`,
        { method: "POST" }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || data.message || "Regeneration failed");
      }

      const updated: ThumbnailVariantResponse = await res.json();
      onUpdate(updated);
      toast("Base scene regenerated!", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Regeneration failed", "error");
    } finally {
      setRegenerateLoading(false);
    }
  }, [variant.variantId, onUpdate, toast]);

  // Download thumbnail
  const handleDownload = useCallback(async () => {
    if (!variant.previewUrl) return;

    try {
      const res = await fetch(variant.previewUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `thumbnail-${variant.variantId}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      toast("Download failed", "error");
    }
  }, [variant.previewUrl, variant.variantId, toast]);

  return (
    <div className={s.overlay} onClick={onClose}>
      <div className={s.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={s.header}>
          <div className={s.headerLeft}>
            <h2 className={s.title}>Edit Thumbnail</h2>
            <span className={s.conceptTag}>{conceptName}</span>
          </div>
          <button className={s.closeBtn} onClick={onClose} aria-label="Close">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className={s.content}>
          {/* Preview */}
          <div className={s.previewSection}>
            <div className={s.previewContainer}>
              {variant.previewUrl ? (
                <Image
                  src={variant.previewUrl}
                  alt="Thumbnail preview"
                  fill
                  style={{ objectFit: "contain" }}
                  priority
                />
              ) : (
                <div className={s.previewPlaceholder}>No preview</div>
              )}
              {showSafeZone && (
                <div className={s.safeZoneOverlay}>
                  <div className={s.safeZoneTimestamp}>YouTube Timestamp</div>
                </div>
              )}
            </div>
            <div className={s.safeZoneToggle}>
              <label>
                <input
                  type="checkbox"
                  checked={showSafeZone}
                  onChange={(e) => setShowSafeZone(e.target.checked)}
                />
                Show safe zones
              </label>
            </div>
          </div>

          {/* Editor Form */}
          <div className={s.editorSection}>
            {/* Hook Text */}
            <div className={s.formGroup}>
              <label className={s.label}>Hook Text (2-5 words, max 28 chars)</label>
              <input
                type="text"
                className={s.input}
                value={hookText}
                onChange={(e) => setHookText(e.target.value)}
                maxLength={28}
                placeholder="Short, punchy hook"
              />
              <span className={s.charCount}>{hookText.length}/28</span>
            </div>

            {/* Sub-hook */}
            <div className={s.formGroup}>
              <label className={s.label}>Sub-hook (max 18 chars)</label>
              <input
                type="text"
                className={s.input}
                value={subHook}
                onChange={(e) => setSubHook(e.target.value)}
                maxLength={18}
                placeholder="Optional supporting text"
              />
              <span className={s.charCount}>{subHook.length}/18</span>
            </div>

            {/* Badge Text */}
            <div className={s.formGroup}>
              <label className={s.label}>Badge Text (max 20 chars)</label>
              <input
                type="text"
                className={s.input}
                value={badgeText}
                onChange={(e) => setBadgeText(e.target.value)}
                maxLength={20}
                placeholder="e.g., SECRET, #1, NEW"
              />
            </div>

            {/* Alignment */}
            <div className={s.formGroup}>
              <label className={s.label}>Text Alignment</label>
              <div className={s.buttonGroup}>
                <button
                  className={`${s.optionBtn} ${align === "left" ? s.active : ""}`}
                  onClick={() => setAlign("left")}
                >
                  Left
                </button>
                <button
                  className={`${s.optionBtn} ${align === "center" ? s.active : ""}`}
                  onClick={() => setAlign("center")}
                >
                  Center
                </button>
                <button
                  className={`${s.optionBtn} ${align === "right" ? s.active : ""}`}
                  onClick={() => setAlign("right")}
                >
                  Right
                </button>
              </div>
            </div>

            {/* Colors */}
            <div className={s.colorRow}>
              <div className={s.colorGroup}>
                <label className={s.label}>Accent</label>
                <input
                  type="color"
                  className={s.colorInput}
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                />
              </div>
              <div className={s.colorGroup}>
                <label className={s.label}>Text</label>
                <input
                  type="color"
                  className={s.colorInput}
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                />
              </div>
            </div>

            {/* Text Style Toggles */}
            <div className={s.toggleSection}>
              <span className={s.toggleSectionLabel}>Text Style</span>
              <div className={s.toggleRow}>
                <label className={s.toggleLabel}>
                  <input
                    type="checkbox"
                    checked={outline}
                    onChange={(e) => setOutline(e.target.checked)}
                  />
                  Outline
                </label>
                <label className={s.toggleLabel}>
                  <input
                    type="checkbox"
                    checked={shadow}
                    onChange={(e) => setShadow(e.target.checked)}
                  />
                  Shadow
                </label>
              </div>
            </div>

            {/* Overlay Element Toggles */}
            <div className={s.toggleSection}>
              <span className={s.toggleSectionLabel}>Overlay Elements</span>
              <div className={s.toggleRow}>
                <label className={s.toggleLabel}>
                  <input
                    type="checkbox"
                    checked={showBadges}
                    onChange={(e) => setShowBadges(e.target.checked)}
                  />
                  Badges
                </label>
                {bigSymbol !== "NONE" && (
                  <label className={s.toggleLabel}>
                    <input
                      type="checkbox"
                      checked={showSymbol}
                      onChange={(e) => setShowSymbol(e.target.checked)}
                    />
                    {bigSymbol} Symbol
                  </label>
                )}
                <label className={s.toggleLabel}>
                  <input
                    type="checkbox"
                    checked={showHighlights}
                    onChange={(e) => setShowHighlights(e.target.checked)}
                  />
                  Highlights
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className={s.actions}>
              <button
                className={s.primaryBtn}
                onClick={handleRerender}
                disabled={rerenderLoading}
              >
                {rerenderLoading ? "Updating..." : "Update Overlay (Fast)"}
              </button>
              <button
                className={s.secondaryBtn}
                onClick={handleRegenerateBase}
                disabled={regenerateLoading}
              >
                {regenerateLoading ? "Regenerating..." : "Regenerate Scene (AI)"}
              </button>
              <button
                className={s.outlineBtn}
                onClick={handleDownload}
                disabled={!variant.previewUrl}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Download PNG
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
