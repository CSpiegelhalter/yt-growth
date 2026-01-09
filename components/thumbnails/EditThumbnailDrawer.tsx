"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import s from "./EditThumbnailDrawer.module.css";
import { useToast } from "@/components/ui/Toast";
import type { ThumbnailVariantResponse } from "@/lib/thumbnails/types";
import {
  type EditRequest,
  type LayoutOption,
  type CropOption,
  type ClutterOption,
  type SubjectTypeOption,
  type ExpressionOption,
  type SubjectSizeOption,
  type BackgroundStyleOption,
  type DepthOption,
  type CleanlinessOption,
  type BogyColorOption,
  type TextPlacementOption,
  type TextTreatmentOption,
  type CalloutTypeOption,
  type CalloutIntensityOption,
  type LockableAspect,
  getDefaultEditRequest,
} from "@/lib/thumbnails/editTypes";

type Props = {
  variant: ThumbnailVariantResponse;
  jobId: string;
  title: string;
  description: string;
  onClose: () => void;
  onRegenerated: (variants: ThumbnailVariantResponse[]) => void;
};

export default function EditThumbnailDrawer({
  variant,
  jobId,
  title,
  description,
  onClose,
  onRegenerated,
}: Props) {
  const { toast } = useToast();

  // Initialize edit request with defaults
  const [editRequest, setEditRequest] = useState<EditRequest>(() =>
    getDefaultEditRequest(jobId, variant.variantId, title, description)
  );

  // UI state
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "feedback" | "composition" | "subject" | "background" | "color" | "text" | "graphics" | "locks"
  >("feedback");

  // Generated variants from regeneration
  const [generatedVariants, setGeneratedVariants] = useState<ThumbnailVariantResponse[]>([]);

  // Update a nested property helper
  const updateField = useCallback(
    <K extends keyof EditRequest>(
      section: K,
      field: keyof EditRequest[K],
      value: EditRequest[K][keyof EditRequest[K]]
    ) => {
      setEditRequest((prev) => ({
        ...prev,
        [section]: {
          ...(prev[section] as object),
          [field]: value,
        },
      }));
    },
    []
  );

  // Toggle a lock
  const toggleLock = useCallback((aspect: LockableAspect) => {
    setEditRequest((prev) => ({
      ...prev,
      locks: prev.locks.includes(aspect)
        ? prev.locks.filter((l) => l !== aspect)
        : [...prev.locks, aspect],
    }));
  }, []);

  // Handle regeneration
  const handleRegenerate = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/thumbnails/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editRequest),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || data.message || "Regeneration failed");
      }

      const data = await res.json();
      setGeneratedVariants(data.variants || []);
      toast("Regeneration started!", "success");

      // Poll for completion
      if (data.jobId) {
        pollForCompletion(data.jobId);
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : "Regeneration failed", "error");
    } finally {
      setLoading(false);
    }
  }, [editRequest, toast]);

  // Poll for job completion
  const pollForCompletion = useCallback(
    async (newJobId: string) => {
      const maxAttempts = 60; // 3 minutes max
      let attempts = 0;

      const poll = async () => {
        attempts++;
        try {
          const res = await fetch(`/api/thumbnails/jobs/${newJobId}`);
          if (!res.ok) return;

          const data = await res.json();

          if (data.status === "completed") {
            setGeneratedVariants(data.variants || []);
            toast("Regeneration complete!", "success");
            return;
          }

          if (data.status === "failed") {
            toast(data.error || "Regeneration failed", "error");
            return;
          }

          // Continue polling
          if (attempts < maxAttempts) {
            setTimeout(poll, 3000);
          }
        } catch {
          // Ignore polling errors
        }
      };

      poll();
    },
    [toast]
  );

  // Select a generated variant
  const handleSelectVariant = useCallback(
    (selectedVariant: ThumbnailVariantResponse) => {
      onRegenerated([selectedVariant]);
      toast("Thumbnail selected!", "success");
    },
    [onRegenerated, toast]
  );

  return (
    <div className={s.overlay} onClick={onClose}>
      <div className={s.drawer} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={s.header}>
          <h2 className={s.title}>Edit Thumbnail</h2>
          <button className={s.closeBtn} onClick={onClose} aria-label="Close">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Content - Two columns */}
        <div className={s.content}>
          {/* Left Column - Preview */}
          <div className={s.previewSection}>
            <div className={s.previewLabel}>Current Thumbnail</div>
            <div className={s.previewContainer}>
              {variant.previewUrl ? (
                <Image
                  src={variant.previewUrl}
                  alt="Reference thumbnail"
                  fill
                  style={{ objectFit: "contain" }}
                  priority
                />
              ) : (
                <div className={s.previewPlaceholder}>No preview</div>
              )}
            </div>
            <div className={s.mobilePreview}>
              <span className={s.mobileLabel}>Mobile size</span>
              <div className={s.mobileThumb}>
                {variant.previewUrl && (
                  <Image
                    src={variant.previewUrl}
                    alt="Mobile preview"
                    width={120}
                    height={68}
                    style={{ objectFit: "cover" }}
                  />
                )}
              </div>
            </div>
            <div className={s.currentHeadline}>
              Current headline:{" "}
              <strong>{variant.spec.hookText || variant.spec.plan?.hookText || "None"}</strong>
            </div>
            
            {/* Generated Variants (After Regeneration) - Show in left column */}
            {generatedVariants.length > 0 && (
              <div className={s.generatedSection}>
                <h3 className={s.generatedTitle}>Generated Variants</h3>
                <div className={s.generatedGrid}>
                  {generatedVariants.map((v) => (
                    <div
                      key={v.variantId}
                      className={s.generatedCard}
                      onClick={() => handleSelectVariant(v)}
                    >
                      {v.previewUrl ? (
                        <Image
                          src={v.previewUrl}
                          alt="Generated variant"
                          fill
                          style={{ objectFit: "cover" }}
                        />
                      ) : (
                        <div className={s.generatedPlaceholder}>Loading...</div>
                      )}
                    </div>
                  ))}
                </div>
                <p className={s.selectHint}>Click a variant to use it</p>
              </div>
            )}
          </div>

          {/* Right Column - Edit Panel */}
          <div className={s.editPanel}>
            {/* Tab Navigation */}
            <div className={s.tabs}>
            {[
              { id: "feedback", label: "Feedback" },
              { id: "composition", label: "Composition" },
              { id: "subject", label: "Subject" },
              { id: "background", label: "Background" },
              { id: "color", label: "Color" },
              { id: "text", label: "Text" },
              { id: "graphics", label: "Graphics" },
              { id: "locks", label: "Locks" },
            ].map((tab) => (
              <button
                key={tab.id}
                className={`${s.tab} ${activeTab === tab.id ? s.activeTab : ""}`}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className={s.tabContent}>
            {/* FEEDBACK TAB */}
            {activeTab === "feedback" && (
              <div className={s.tabPanel}>
                <div className={s.formGroup}>
                  <label className={s.label}>What do you like? (keep these)</label>
                  <textarea
                    className={s.textarea}
                    value={editRequest.userLikes || ""}
                    onChange={(e) =>
                      setEditRequest((prev) => ({ ...prev, userLikes: e.target.value }))
                    }
                    placeholder="e.g., I like the color scheme, the dramatic lighting, the subject position..."
                    rows={3}
                  />
                </div>
                <div className={s.formGroup}>
                  <label className={s.label}>What do you dislike? (change these)</label>
                  <textarea
                    className={s.textarea}
                    value={editRequest.userDislikes || ""}
                    onChange={(e) =>
                      setEditRequest((prev) => ({ ...prev, userDislikes: e.target.value }))
                    }
                    placeholder="e.g., Background is too busy, subject is too small, wrong colors..."
                    rows={3}
                  />
                </div>
                <div className={s.formGroup}>
                  <label className={s.label}>What should the new version emphasize?</label>
                  <textarea
                    className={s.textarea}
                    value={editRequest.emphasize || ""}
                    onChange={(e) =>
                      setEditRequest((prev) => ({ ...prev, emphasize: e.target.value }))
                    }
                    placeholder="e.g., More energy, cleaner look, bigger text..."
                    rows={2}
                  />
                </div>
                <div className={s.formGroup}>
                  <label className={s.label}>Anything that must NOT appear?</label>
                  <textarea
                    className={s.textarea}
                    value={editRequest.mustAvoid || ""}
                    onChange={(e) =>
                      setEditRequest((prev) => ({ ...prev, mustAvoid: e.target.value }))
                    }
                    placeholder="e.g., No hands, no complex screens, no red color..."
                    rows={2}
                  />
                </div>
              </div>
            )}

            {/* COMPOSITION TAB */}
            {activeTab === "composition" && (
              <div className={s.tabPanel}>
                <div className={s.formGroup}>
                  <label className={s.label}>Layout</label>
                  <div className={s.buttonGroup}>
                    {(["keep", "flip-horizontal", "center-subject", "more-negative-space"] as LayoutOption[]).map(
                      (opt) => (
                        <button
                          key={opt}
                          className={`${s.optionBtn} ${
                            editRequest.composition.layout === opt ? s.active : ""
                          }`}
                          onClick={() => updateField("composition", "layout", opt)}
                        >
                          {opt.replace(/-/g, " ")}
                        </button>
                      )
                    )}
                  </div>
                </div>
                <div className={s.formGroup}>
                  <label className={s.label}>Crop</label>
                  <div className={s.buttonGroup}>
                    {(["keep", "zoom-in", "zoom-out", "rule-of-thirds"] as CropOption[]).map((opt) => (
                      <button
                        key={opt}
                        className={`${s.optionBtn} ${
                          editRequest.composition.crop === opt ? s.active : ""
                        }`}
                        onClick={() => updateField("composition", "crop", opt)}
                      >
                        {opt.replace(/-/g, " ")}
                      </button>
                    ))}
                  </div>
                </div>
                <div className={s.formGroup}>
                  <label className={s.label}>Clutter</label>
                  <div className={s.buttonGroup}>
                    {(["keep", "simplify", "add-context"] as ClutterOption[]).map((opt) => (
                      <button
                        key={opt}
                        className={`${s.optionBtn} ${
                          editRequest.composition.clutter === opt ? s.active : ""
                        }`}
                        onClick={() => updateField("composition", "clutter", opt)}
                      >
                        {opt.replace(/-/g, " ")}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* SUBJECT TAB */}
            {activeTab === "subject" && (
              <div className={s.tabPanel}>
                <div className={s.formGroup}>
                  <label className={s.toggleLabel}>
                    <input
                      type="checkbox"
                      checked={editRequest.subject.keepSubject}
                      onChange={(e) => updateField("subject", "keepSubject", e.target.checked)}
                    />
                    Keep same subject
                  </label>
                </div>
                <div className={s.formGroup}>
                  <label className={s.label}>Subject Type</label>
                  <div className={s.buttonGroup}>
                    {(["keep", "face", "object", "mascot", "icon-only"] as SubjectTypeOption[]).map(
                      (opt) => (
                        <button
                          key={opt}
                          className={`${s.optionBtn} ${
                            editRequest.subject.subjectType === opt ? s.active : ""
                          }`}
                          onClick={() => updateField("subject", "subjectType", opt)}
                        >
                          {opt.replace(/-/g, " ")}
                        </button>
                      )
                    )}
                  </div>
                </div>
                <div className={s.formGroup}>
                  <label className={s.label}>Expression (if face)</label>
                  <div className={s.buttonGroup}>
                    {(
                      ["curious", "shocked", "confident", "focused", "excited", "neutral"] as ExpressionOption[]
                    ).map((opt) => (
                      <button
                        key={opt}
                        className={`${s.optionBtn} ${
                          editRequest.subject.expression === opt ? s.active : ""
                        }`}
                        onClick={() => updateField("subject", "expression", opt)}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
                <div className={s.formGroup}>
                  <label className={s.label}>Subject Size</label>
                  <div className={s.buttonGroup}>
                    {(["small", "medium", "large"] as SubjectSizeOption[]).map((opt) => (
                      <button
                        key={opt}
                        className={`${s.optionBtn} ${
                          editRequest.subject.subjectSize === opt ? s.active : ""
                        }`}
                        onClick={() => updateField("subject", "subjectSize", opt)}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
                <div className={s.formGroup}>
                  <label className={s.label}>Change subject to (optional)</label>
                  <input
                    type="text"
                    className={s.input}
                    value={editRequest.subject.changeSubjectTo || ""}
                    onChange={(e) => updateField("subject", "changeSubjectTo", e.target.value)}
                    placeholder="e.g., a person holding a laptop"
                    maxLength={100}
                  />
                </div>
                <div className={s.safetyToggles}>
                  <span className={s.safetyLabel}>Anti-artifact safety:</span>
                  <label className={s.toggleLabel}>
                    <input
                      type="checkbox"
                      checked={editRequest.subject.avoidHands}
                      onChange={(e) => updateField("subject", "avoidHands", e.target.checked)}
                    />
                    Avoid hands
                    <span className={s.hint}>(reduces weird finger artifacts)</span>
                  </label>
                  <label className={s.toggleLabel}>
                    <input
                      type="checkbox"
                      checked={editRequest.subject.avoidScreens}
                      onChange={(e) => updateField("subject", "avoidScreens", e.target.checked)}
                    />
                    Avoid detailed screens
                    <span className={s.hint}>(prevents gibberish UI)</span>
                  </label>
                  <label className={s.toggleLabel}>
                    <input
                      type="checkbox"
                      checked={editRequest.subject.avoidTextInImage}
                      onChange={(e) => updateField("subject", "avoidTextInImage", e.target.checked)}
                    />
                    Avoid text in image
                    <span className={s.hint}>(compositor adds text)</span>
                  </label>
                </div>
              </div>
            )}

            {/* BACKGROUND TAB */}
            {activeTab === "background" && (
              <div className={s.tabPanel}>
                <div className={s.formGroup}>
                  <label className={s.label}>Background Style</label>
                  <div className={s.buttonGroup}>
                    {(
                      ["gradient", "photo-like", "illustration", "abstract-texture"] as BackgroundStyleOption[]
                    ).map((opt) => (
                      <button
                        key={opt}
                        className={`${s.optionBtn} ${
                          editRequest.background.style === opt ? s.active : ""
                        }`}
                        onClick={() => updateField("background", "style", opt)}
                      >
                        {opt.replace(/-/g, " ")}
                      </button>
                    ))}
                  </div>
                </div>
                <div className={s.formGroup}>
                  <label className={s.label}>Depth</label>
                  <div className={s.buttonGroup}>
                    {(["flat", "medium", "high"] as DepthOption[]).map((opt) => (
                      <button
                        key={opt}
                        className={`${s.optionBtn} ${
                          editRequest.background.depth === opt ? s.active : ""
                        }`}
                        onClick={() => updateField("background", "depth", opt)}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
                <div className={s.formGroup}>
                  <label className={s.label}>Cleanliness</label>
                  <div className={s.buttonGroup}>
                    {(["minimal", "medium", "busy"] as CleanlinessOption[]).map((opt) => (
                      <button
                        key={opt}
                        className={`${s.optionBtn} ${
                          editRequest.background.cleanliness === opt ? s.active : ""
                        }`}
                        onClick={() => updateField("background", "cleanliness", opt)}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* COLOR TAB */}
            {activeTab === "color" && (
              <div className={s.tabPanel}>
                <div className={s.formGroup}>
                  <label className={s.label}>Primary Color (BOGY)</label>
                  <div className={s.colorGrid}>
                    {(["blue", "orange", "green", "yellow"] as BogyColorOption[]).map((color) => (
                      <button
                        key={color}
                        className={`${s.colorBtn} ${s[color]} ${
                          editRequest.color.primaryColor === color ? s.active : ""
                        }`}
                        onClick={() => updateField("color", "primaryColor", color)}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
                <div className={s.formGroup}>
                  <label className={s.label}>Accent Color (BOGY)</label>
                  <div className={s.colorGrid}>
                    {(["blue", "orange", "green", "yellow"] as BogyColorOption[]).map((color) => (
                      <button
                        key={color}
                        className={`${s.colorBtn} ${s[color]} ${
                          editRequest.color.accentColor === color ? s.active : ""
                        }`}
                        onClick={() => updateField("color", "accentColor", color)}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
                <div className={s.toggleRow}>
                  <label className={s.toggleLabel}>
                    <input
                      type="checkbox"
                      checked={editRequest.color.boostContrast}
                      onChange={(e) => updateField("color", "boostContrast", e.target.checked)}
                    />
                    Boost contrast
                  </label>
                  <label className={s.toggleLabel}>
                    <input
                      type="checkbox"
                      checked={editRequest.color.boostSaturation}
                      onChange={(e) => updateField("color", "boostSaturation", e.target.checked)}
                    />
                    Boost saturation
                  </label>
                  <label className={s.toggleLabel}>
                    <input
                      type="checkbox"
                      checked={editRequest.color.limitRedWhiteBlack}
                      onChange={(e) => updateField("color", "limitRedWhiteBlack", e.target.checked)}
                    />
                    Limit red/white/black (accents only)
                  </label>
                </div>
              </div>
            )}

            {/* TEXT TAB */}
            {activeTab === "text" && (
              <div className={s.tabPanel}>
                <div className={s.formGroup}>
                  <label className={s.label}>Headline Text (2-5 words)</label>
                  <input
                    type="text"
                    className={s.input}
                    value={editRequest.text.headlineText || ""}
                    onChange={(e) => updateField("text", "headlineText", e.target.value)}
                    placeholder="Short punchy headline"
                    maxLength={28}
                  />
                  <span className={s.charCount}>
                    {(editRequest.text.headlineText || "").length}/28
                  </span>
                </div>
                <div className={s.formGroup}>
                  <label className={s.label}>Text Placement</label>
                  <div className={s.buttonGroup}>
                    {(["left", "right", "top", "bottom"] as TextPlacementOption[]).map((opt) => (
                      <button
                        key={opt}
                        className={`${s.optionBtn} ${
                          editRequest.text.textPlacement === opt ? s.active : ""
                        }`}
                        onClick={() => updateField("text", "textPlacement", opt)}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
                <div className={s.formGroup}>
                  <label className={s.label}>Text Treatment</label>
                  <div className={s.buttonGroup}>
                    {(["outline-heavy", "drop-shadow", "banner-behind"] as TextTreatmentOption[]).map(
                      (opt) => (
                        <button
                          key={opt}
                          className={`${s.optionBtn} ${
                            editRequest.text.textTreatment === opt ? s.active : ""
                          }`}
                          onClick={() => updateField("text", "textTreatment", opt)}
                        >
                          {opt.replace(/-/g, " ")}
                        </button>
                      )
                    )}
                  </div>
                </div>
                <div className={s.formGroup}>
                  <label className={s.label}>
                    Text Size: {editRequest.text.textSizeMultiplier.toFixed(1)}x
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={editRequest.text.textSizeMultiplier}
                    onChange={(e) =>
                      updateField("text", "textSizeMultiplier", parseFloat(e.target.value))
                    }
                    className={s.slider}
                  />
                </div>
              </div>
            )}

            {/* GRAPHICS TAB */}
            {activeTab === "graphics" && (
              <div className={s.tabPanel}>
                <div className={s.formGroup}>
                  <label className={s.label}>Callout Type</label>
                  <div className={s.buttonGroup}>
                    {(["none", "arrow", "circle-highlight", "glow-outline"] as CalloutTypeOption[]).map(
                      (opt) => (
                        <button
                          key={opt}
                          className={`${s.optionBtn} ${
                            editRequest.graphics.calloutType === opt ? s.active : ""
                          }`}
                          onClick={() => updateField("graphics", "calloutType", opt)}
                        >
                          {opt.replace(/-/g, " ")}
                        </button>
                      )
                    )}
                  </div>
                </div>
                {editRequest.graphics.calloutType !== "none" && (
                  <>
                    <div className={s.formGroup}>
                      <label className={s.label}>Callout Target</label>
                      <div className={s.buttonGroup}>
                        {(["subject", "logo-icon", "important-prop"] as const).map((opt) => (
                          <button
                            key={opt}
                            className={`${s.optionBtn} ${
                              editRequest.graphics.calloutTarget === opt ? s.active : ""
                            }`}
                            onClick={() => updateField("graphics", "calloutTarget", opt)}
                          >
                            {opt.replace(/-/g, " ")}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className={s.formGroup}>
                      <label className={s.label}>Intensity</label>
                      <div className={s.buttonGroup}>
                        {(["subtle", "medium", "bold"] as CalloutIntensityOption[]).map((opt) => (
                          <button
                            key={opt}
                            className={`${s.optionBtn} ${
                              editRequest.graphics.calloutIntensity === opt ? s.active : ""
                            }`}
                            onClick={() => updateField("graphics", "calloutIntensity", opt)}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* LOCKS TAB */}
            {activeTab === "locks" && (
              <div className={s.tabPanel}>
                <p className={s.lockDescription}>
                  Lock aspects you want to keep exactly the same. Locked aspects won&apos;t vary
                  across regenerated thumbnails.
                </p>
                <div className={s.lockGrid}>
                  {(
                    [
                      { id: "palette", label: "Color Palette", desc: "Keep exact colors" },
                      { id: "layout", label: "Layout", desc: "Keep composition" },
                      { id: "subject-identity", label: "Subject", desc: "Keep main subject" },
                      { id: "background-style", label: "Background", desc: "Keep BG style" },
                      { id: "headline-style", label: "Typography", desc: "Keep text style" },
                      { id: "callout-style", label: "Callouts", desc: "Keep graphics" },
                    ] as { id: LockableAspect; label: string; desc: string }[]
                  ).map((lock) => (
                    <button
                      key={lock.id}
                      className={`${s.lockBtn} ${
                        editRequest.locks.includes(lock.id) ? s.locked : ""
                      }`}
                      onClick={() => toggleLock(lock.id)}
                    >
                      <span className={s.lockIcon}>
                        {editRequest.locks.includes(lock.id) ? "🔒" : "🔓"}
                      </span>
                      <span className={s.lockLabel}>{lock.label}</span>
                      <span className={s.lockDesc}>{lock.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          </div>{/* End editPanel */}
        </div>

        {/* Footer Actions */}
        <div className={s.footer}>
          <div className={s.variantCount}>
            <label className={s.label}>Variants:</label>
            <select
              className={s.select}
              value={editRequest.variantCount}
              onChange={(e) =>
                setEditRequest((prev) => ({
                  ...prev,
                  variantCount: parseInt(e.target.value),
                }))
              }
            >
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={4}>4</option>
            </select>
          </div>
          <button className={s.secondaryBtn} onClick={onClose}>
            Cancel
          </button>
          <button className={s.primaryBtn} onClick={handleRegenerate} disabled={loading}>
            {loading ? (
              <>
                <span className={s.spinner} />
                Regenerating...
              </>
            ) : (
              `Regenerate ${editRequest.variantCount} Variant${editRequest.variantCount > 1 ? "s" : ""}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
