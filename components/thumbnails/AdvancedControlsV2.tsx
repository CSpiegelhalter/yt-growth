"use client";

import { useState, useCallback, useMemo } from "react";
import s from "./AdvancedControlsV2.module.css";
import DialPanel from "./DialPanel";
import {
  type GenerationControls,
  type PresetKey,
  type BogyColor,
  GENERATION_PRESETS,
  getDefaultControls,
  applyPreset,
} from "@/lib/thumbnails/generationControls";
import {
  STYLE_DIALS,
  mapDialSelectionsToControls,
  getDialSelectionsSummary,
  getStyleOption,
  type IntensityLevel,
} from "@/lib/thumbnails/styleReferenceManifest";

type Props = {
  controls: GenerationControls;
  onChange: (controls: GenerationControls) => void;
  disabled?: boolean;
};

type DialSelections = {
  memeStyle: string;
  characterStyle: string;
  expression: string;
  composition: string;
  background: string;
};

/**
 * AdvancedControlsV2 - Visual dial-based controls
 *
 * Replaces abstract checkboxes/dropdowns with visual tile selectors.
 * Users can understand what each dial does without reading text.
 */
export default function AdvancedControlsV2({ controls, onChange, disabled }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<"dials" | "fine-tune">("dials");

  // Track dial selections (these map to GenerationControls)
  const [dialSelections, setDialSelections] = useState<DialSelections>(() =>
    getInitialDialSelections(controls)
  );
  const [intensity, setIntensity] = useState<IntensityLevel>(
    controls.memeIntensity === "off" ? "medium" : (controls.memeIntensity as IntensityLevel)
  );

  // Update controls when dial selection changes
  const handleDialSelect = useCallback(
    (dialId: string, optionId: string) => {
      const newSelections = { ...dialSelections, [dialId]: optionId };
      setDialSelections(newSelections);

      // Map to GenerationControls
      const mappedControls = mapDialSelectionsToControls(newSelections);
      const selectedOpt = getStyleOption(optionId);

      // Determine intensity for meme styles
      let newIntensity = intensity;
      if (dialId === "memeStyle") {
        if (selectedOpt?.isOff) {
          newIntensity = "medium";
          mappedControls.memeIntensity = "off";
        } else {
          mappedControls.memeIntensity = intensity;
          if (selectedOpt?.defaultIntensity) {
            newIntensity = selectedOpt.defaultIntensity;
            setIntensity(newIntensity);
            mappedControls.memeIntensity = newIntensity;
          }
        }
      }

      onChange({ ...controls, ...mappedControls });
    },
    [controls, dialSelections, intensity, onChange]
  );

  // Update intensity
  const handleIntensityChange = useCallback(
    (newIntensity: IntensityLevel) => {
      setIntensity(newIntensity);
      onChange({ ...controls, memeIntensity: newIntensity });
    },
    [controls, onChange]
  );

  // Apply a preset
  const handlePresetClick = useCallback(
    (presetKey: PresetKey) => {
      const presetControls = applyPreset(presetKey);
      const newControls = { ...getDefaultControls(), ...presetControls };
      onChange(newControls);

      // Update dial selections to match preset
      setDialSelections(getInitialDialSelections(newControls));
      if (newControls.memeIntensity && newControls.memeIntensity !== "off") {
        setIntensity(newControls.memeIntensity as IntensityLevel);
      }
    },
    [onChange]
  );

  // Reset to defaults
  const handleReset = useCallback(() => {
    const defaults = getDefaultControls();
    onChange(defaults);
    setDialSelections(getInitialDialSelections(defaults));
    setIntensity("medium");
  }, [onChange]);

  // Update a fine-tune field
  const updateField = useCallback(
    <K extends keyof GenerationControls>(field: K, value: GenerationControls[K]) => {
      onChange({ ...controls, [field]: value });
    },
    [controls, onChange]
  );

  // Summary for collapsed state
  const summary = useMemo(
    () => getDialSelectionsSummary(dialSelections, intensity),
    [dialSelections, intensity]
  );

  // Get dial configs
  const memeStyleDial = STYLE_DIALS.find((d) => d.id === "memeStyle")!;
  const characterStyleDial = STYLE_DIALS.find((d) => d.id === "characterStyle")!;
  const expressionDial = STYLE_DIALS.find((d) => d.id === "expression")!;
  const compositionDial = STYLE_DIALS.find((d) => d.id === "composition")!;
  const backgroundDial = STYLE_DIALS.find((d) => d.id === "background")!;

  return (
    <div className={s.container}>
      {/* Header with toggle */}
      <button
        type="button"
        className={s.header}
        onClick={() => setIsExpanded(!isExpanded)}
        disabled={disabled}
      >
        <div className={s.headerLeft}>
          <svg
            className={`${s.chevron} ${isExpanded ? s.expanded : ""}`}
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
          <span className={s.headerTitle}>Visual Style Controls</span>
          <span className={s.betaBadge}>Visual</span>
        </div>
        {!isExpanded && <span className={s.summary}>{summary}</span>}
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className={s.content}>
          {/* Quick Presets */}
          <div className={s.presetsSection}>
            <div className={s.sectionLabel}>Quick Presets</div>
            <div className={s.presetsGrid}>
              {(Object.keys(GENERATION_PRESETS) as PresetKey[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  className={`${s.presetBtn} ${
                    controls.presetUsed === key ? s.active : ""
                  }`}
                  onClick={() => handlePresetClick(key)}
                  disabled={disabled}
                  title={GENERATION_PRESETS[key].description}
                >
                  <PresetIcon presetKey={key} />
                  <span>{GENERATION_PRESETS[key].name}</span>
                </button>
              ))}
              <button
                type="button"
                className={s.resetBtn}
                onClick={handleReset}
                disabled={disabled}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                  <path d="M21 3v5h-5" />
                  <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                  <path d="M3 21v-5h5" />
                </svg>
                Reset
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className={s.tabs}>
            <button
              type="button"
              className={`${s.tab} ${activeTab === "dials" ? s.activeTab : ""}`}
              onClick={() => setActiveTab("dials")}
              disabled={disabled}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
              Visual Dials
            </button>
            <button
              type="button"
              className={`${s.tab} ${activeTab === "fine-tune" ? s.activeTab : ""}`}
              onClick={() => setActiveTab("fine-tune")}
              disabled={disabled}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="4" y1="21" x2="4" y2="14" />
                <line x1="4" y1="10" x2="4" y2="3" />
                <line x1="12" y1="21" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12" y2="3" />
                <line x1="20" y1="21" x2="20" y2="16" />
                <line x1="20" y1="12" x2="20" y2="3" />
                <line x1="1" y1="14" x2="7" y2="14" />
                <line x1="9" y1="8" x2="15" y2="8" />
                <line x1="17" y1="16" x2="23" y2="16" />
              </svg>
              Fine-Tune
            </button>
          </div>

          {/* Visual Dials Tab */}
          {activeTab === "dials" && (
            <div className={s.dialsTab}>
              {/* Meme Style Dial */}
              <DialPanel
                dial={memeStyleDial}
                selectedOptionId={dialSelections.memeStyle}
                intensity={intensity}
                onSelect={(optId) => handleDialSelect("memeStyle", optId)}
                onIntensityChange={handleIntensityChange}
                disabled={disabled}
              />

              {/* Character Style Dial */}
              {controls.includePerson && (
                <>
                  <DialPanel
                    dial={characterStyleDial}
                    selectedOptionId={dialSelections.characterStyle}
                    onSelect={(optId) => handleDialSelect("characterStyle", optId)}
                    disabled={disabled}
                  />

                  {/* Expression Dial */}
                  <DialPanel
                    dial={expressionDial}
                    selectedOptionId={dialSelections.expression}
                    onSelect={(optId) => handleDialSelect("expression", optId)}
                    disabled={disabled}
                  />
                </>
              )}

              {/* Composition Dial */}
              <DialPanel
                dial={compositionDial}
                selectedOptionId={dialSelections.composition}
                onSelect={(optId) => handleDialSelect("composition", optId)}
                disabled={disabled}
              />

              {/* Background Dial */}
              <DialPanel
                dial={backgroundDial}
                selectedOptionId={dialSelections.background}
                onSelect={(optId) => handleDialSelect("background", optId)}
                disabled={disabled}
              />

              {/* What Changed Summary */}
              {(dialSelections.memeStyle !== "meme-off" ||
                dialSelections.characterStyle !== "char-auto") && (
                <div className={s.whatChanged}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 16v-4M12 8h.01" />
                  </svg>
                  <span>
                    <strong>Active settings:</strong> {summary}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Fine-Tune Tab */}
          {activeTab === "fine-tune" && (
            <div className={s.fineTuneTab}>
              {/* Subject Controls */}
              <div className={s.fineTuneSection}>
                <h4 className={s.fineTuneTitle}>Subject</h4>
                <div className={s.toggleRow}>
                  <label className={s.toggleLabel}>
                    <input
                      type="checkbox"
                      checked={controls.includePerson}
                      onChange={(e) => updateField("includePerson", e.target.checked)}
                      disabled={disabled}
                    />
                    Include person/face
                  </label>
                  <label className={s.toggleLabel}>
                    <input
                      type="checkbox"
                      checked={controls.avoidHands}
                      onChange={(e) => updateField("avoidHands", e.target.checked)}
                      disabled={disabled || !controls.includePerson}
                    />
                    Avoid hands
                    <span className={s.hint}>(prevents weird fingers)</span>
                  </label>
                  <label className={s.toggleLabel}>
                    <input
                      type="checkbox"
                      checked={controls.avoidUncanny}
                      onChange={(e) => updateField("avoidUncanny", e.target.checked)}
                      disabled={disabled || !controls.includePerson}
                    />
                    Avoid uncanny valley
                  </label>
                </div>
              </div>

              {/* Gender & Age */}
              {controls.includePerson && controls.characterEnabled && (
                <div className={s.fineTuneSection}>
                  <h4 className={s.fineTuneTitle}>Character Identity</h4>
                  <div className={s.selectRow}>
                    <div className={s.selectGroup}>
                      <label>Gender</label>
                      <select
                        value={controls.characterGender}
                        onChange={(e) =>
                          updateField(
                            "characterGender",
                            e.target.value as typeof controls.characterGender
                          )
                        }
                        disabled={disabled}
                        className={s.select}
                      >
                        <option value="auto">Auto</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="neutral">Neutral</option>
                      </select>
                    </div>
                    <div className={s.selectGroup}>
                      <label>Age</label>
                      <select
                        value={controls.characterAge}
                        onChange={(e) =>
                          updateField(
                            "characterAge",
                            e.target.value as typeof controls.characterAge
                          )
                        }
                        disabled={disabled}
                        className={s.select}
                      >
                        <option value="auto">Auto</option>
                        <option value="young">Young (20s)</option>
                        <option value="adult">Adult (30s-40s)</option>
                        <option value="older">Older (50+)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Screen/UI Controls */}
              <div className={s.fineTuneSection}>
                <h4 className={s.fineTuneTitle}>Screen & UI</h4>
                <div className={s.toggleRow}>
                  <label className={s.toggleLabel}>
                    <input
                      type="checkbox"
                      checked={controls.avoidScreens}
                      onChange={(e) => updateField("avoidScreens", e.target.checked)}
                      disabled={disabled}
                    />
                    No screens/laptops
                    <span className={s.hint}>(prevents weird UIs)</span>
                  </label>
                </div>
                {!controls.avoidScreens && (
                  <div className={s.selectRow}>
                    <div className={s.selectGroup}>
                      <label>If showing screens</label>
                      <select
                        value={controls.uiMode}
                        onChange={(e) =>
                          updateField("uiMode", e.target.value as typeof controls.uiMode)
                        }
                        disabled={disabled}
                        className={s.select}
                      >
                        <option value="abstractBlocks">Abstract blocks only</option>
                        <option value="blurredMockUI">Blurred mock UI</option>
                        <option value="none">No screens</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Color Controls */}
              <div className={s.fineTuneSection}>
                <h4 className={s.fineTuneTitle}>Colors (BOGY)</h4>
                <div className={s.colorRow}>
                  <div className={s.colorGroup}>
                    <label>Primary</label>
                    <div className={s.colorGrid}>
                      {(["blue", "orange", "green", "yellow"] as BogyColor[]).map((color) => (
                        <button
                          key={color}
                          type="button"
                          className={`${s.colorBtn} ${s[color]} ${
                            controls.primaryColor === color ? s.active : ""
                          }`}
                          onClick={() => updateField("primaryColor", color)}
                          disabled={disabled}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>
                  <div className={s.colorGroup}>
                    <label>Accent</label>
                    <div className={s.colorGrid}>
                      {(["blue", "orange", "green", "yellow"] as BogyColor[]).map((color) => (
                        <button
                          key={color}
                          type="button"
                          className={`${s.colorBtn} ${s[color]} ${
                            controls.accentColor === color ? s.active : ""
                          }`}
                          onClick={() => updateField("accentColor", color)}
                          disabled={disabled}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div className={s.toggleRow}>
                  <label className={s.toggleLabel}>
                    <input
                      type="checkbox"
                      checked={controls.contrastBoost}
                      onChange={(e) => updateField("contrastBoost", e.target.checked)}
                      disabled={disabled}
                    />
                    Contrast boost
                  </label>
                  <label className={s.toggleLabel}>
                    <input
                      type="checkbox"
                      checked={controls.saturationBoost}
                      onChange={(e) => updateField("saturationBoost", e.target.checked)}
                      disabled={disabled}
                    />
                    Saturation boost
                  </label>
                </div>
              </div>

              {/* Emoji Icons */}
              <div className={s.fineTuneSection}>
                <h4 className={s.fineTuneTitle}>Emoji Icons</h4>
                <label className={s.toggleLabel}>
                  <input
                    type="checkbox"
                    checked={controls.includeEmojis}
                    onChange={(e) => updateField("includeEmojis", e.target.checked)}
                    disabled={disabled}
                  />
                  Include emoji-style icons
                </label>
                {controls.includeEmojis && (
                  <div className={s.emojiControls}>
                    <select
                      className={s.select}
                      value={controls.emojiIconStyle}
                      onChange={(e) =>
                        updateField("emojiIconStyle", e.target.value as typeof controls.emojiIconStyle)
                      }
                      disabled={disabled}
                    >
                      <option value="off">Off</option>
                      <option value="popular">Popular (fire, star, etc.)</option>
                      <option value="cursed">Cursed (weird, surreal)</option>
                    </select>
                    <div className={s.emojiCount}>
                      <label>Count:</label>
                      <input
                        type="number"
                        min={0}
                        max={3}
                        value={controls.emojiCount}
                        onChange={(e) =>
                          updateField("emojiCount", parseInt(e.target.value) || 0)
                        }
                        disabled={disabled}
                        className={s.numberInput}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Style Inspirations */}
              <div className={s.fineTuneSection}>
                <h4 className={s.fineTuneTitle}>Style Inspirations</h4>
                <input
                  type="text"
                  className={s.input}
                  value={controls.inspirationsText || ""}
                  onChange={(e) => updateField("inspirationsText", e.target.value)}
                  placeholder="e.g., retro RPG UI, horror movie poster..."
                  maxLength={200}
                  disabled={disabled}
                />
                <span className={s.charCount}>
                  {(controls.inspirationsText || "").length}/200
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// HELPERS
// ============================================

/**
 * Get initial dial selections from GenerationControls
 */
function getInitialDialSelections(controls: GenerationControls): DialSelections {
  // Map controls back to dial option IDs
  let memeStyle = "meme-off";
  if (controls.memeStyle === "rageComic") memeStyle = "meme-rage-comic";
  else if (controls.memeStyle === "reactionFace") memeStyle = "meme-reaction-face";
  else if (controls.memeStyle === "wojakLike") memeStyle = "meme-wojak";
  else if (controls.memeStyle === "surrealCursed") memeStyle = "meme-cursed";
  else if (controls.memeStyle === "deepFried") memeStyle = "meme-deep-fried";

  let characterStyle = "char-auto";
  if (controls.visualStyle === "photoreal") characterStyle = "char-photoreal";
  else if (controls.visualStyle === "cinematic") characterStyle = "char-cinematic";
  else if (controls.visualStyle === "cartoon") characterStyle = "char-cartoon-simple";
  else if (controls.visualStyle === "comic-ink") characterStyle = "char-comic-ink";
  else if (controls.visualStyle === "3d-mascot") characterStyle = "char-3d-mascot";
  else if (controls.visualStyle === "anime") characterStyle = "char-anime";
  else if (controls.visualStyle === "vector-flat") characterStyle = "char-vector-sticker";

  let expression = "expr-auto";
  if (controls.personaVibe === "serious") expression = "expr-serious";
  else if (controls.personaVibe === "confident") expression = "expr-confident";
  else if (controls.personaVibe === "curious") expression = "expr-curious";
  else if (controls.personaVibe === "shocked") expression = "expr-shocked";
  else if (controls.personaVibe === "silly") expression = "expr-silly";
  else if (controls.personaVibe === "chaotic") expression = "expr-chaotic";

  let composition = "comp-subject-left";
  if (controls.textPlacement === "left") composition = "comp-subject-right";
  else if (controls.textPlacement === "bottom") composition = "comp-center";

  let background = "bg-auto";
  if (controls.backgroundMode === "clean-gradient") background = "bg-clean-gradient";
  else if (controls.backgroundMode === "studio-desk") background = "bg-studio";
  else if (controls.backgroundMode === "abstract-texture") background = "bg-abstract";
  else if (controls.lightingStyle === "neon") background = "bg-neon";
  else if (controls.environmentTheme === "tech-workspace") background = "bg-tech-workspace";
  else if (controls.environmentTheme === "dark-moody") background = "bg-dark-moody";

  return { memeStyle, characterStyle, expression, composition, background };
}

/**
 * Preset icons
 */
function PresetIcon({ presetKey }: { presetKey: PresetKey }) {
  switch (presetKey) {
    case "high-ctr-face":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="8" r="5" />
          <path d="M20 21a8 8 0 0 0-16 0" />
        </svg>
      );
    case "clean-tech":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      );
    case "meme-reaction":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M8 14s1.5 2 4 2 4-2 4-2" />
          <line x1="9" y1="9" x2="9.01" y2="9" />
          <line x1="15" y1="9" x2="15.01" y2="9" />
        </svg>
      );
    case "rage-comic":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M16 16s-1.5-2-4-2-4 2-4 2" />
          <line x1="9" y1="9" x2="9.01" y2="9" />
          <line x1="15" y1="9" x2="15.01" y2="9" />
          <path d="M7 7l3 2M17 7l-3 2" />
        </svg>
      );
    case "cursed-meme":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 14c-3 2-3 4-3 4s6 0 6 0-0-2-3-4z" />
          <circle cx="9" cy="10" r="1.5" />
          <circle cx="15" cy="10" r="1.5" />
        </svg>
      );
    case "gaming-neon":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="6" y="6" width="12" height="12" rx="2" />
          <line x1="9" y1="9" x2="9" y2="9.01" />
          <line x1="15" y1="9" x2="15" y2="9.01" />
          <path d="M9 13h6" />
        </svg>
      );
    case "minimal-pro":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <line x1="3" y1="9" x2="21" y2="9" />
        </svg>
      );
    default:
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
        </svg>
      );
  }
}
