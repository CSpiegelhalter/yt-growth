"use client";

import { useState, useCallback } from "react";
import s from "./AdvancedControls.module.css";
import {
  type GenerationControls,
  type PresetKey,
  type SubjectType,
  type PersonaVibe,
  type VisualStyle,
  type FaceStyle,
  type MemeIntensity,
  type MemeFormat,
  type BackgroundMode,
  type EnvironmentTheme,
  type DetailLevel,
  type LightingStyle,
  type BogyColor,
  type HeadlineStyle,
  type TextPlacement,
  GENERATION_PRESETS,
  getDefaultControls,
  applyPreset,
} from "@/lib/thumbnails/generationControls";
import { getControlsSummary } from "@/lib/thumbnails/controlledPromptBuilder";

type Props = {
  controls: GenerationControls;
  onChange: (controls: GenerationControls) => void;
  disabled?: boolean;
};

export default function AdvancedControls({ controls, onChange, disabled }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeSection, setActiveSection] = useState<
    "subject" | "person" | "meme" | "environment" | "color" | "text"
  >("subject");

  // Update a single field
  const updateField = useCallback(
    <K extends keyof GenerationControls>(field: K, value: GenerationControls[K]) => {
      onChange({ ...controls, [field]: value });
    },
    [controls, onChange]
  );

  // Toggle a meme format
  const toggleMemeFormat = useCallback(
    (format: MemeFormat) => {
      const current = controls.memeFormats || [];
      const updated = current.includes(format)
        ? current.filter((f) => f !== format)
        : [...current, format];
      updateField("memeFormats", updated);
    },
    [controls.memeFormats, updateField]
  );

  // Apply a preset
  const handlePresetClick = useCallback(
    (presetKey: PresetKey) => {
      const presetControls = applyPreset(presetKey);
      onChange({ ...getDefaultControls(), ...presetControls });
    },
    [onChange]
  );

  // Reset to defaults
  const handleReset = useCallback(() => {
    onChange(getDefaultControls());
  }, [onChange]);

  const summary = getControlsSummary(controls);

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
          <span className={s.headerTitle}>Advanced Controls</span>
        </div>
        {!isExpanded && <span className={s.summary}>{summary}</span>}
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className={s.content}>
          {/* Presets */}
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
                  {GENERATION_PRESETS[key].name}
                </button>
              ))}
              <button
                type="button"
                className={s.resetBtn}
                onClick={handleReset}
                disabled={disabled}
              >
                Reset
              </button>
            </div>
          </div>

          {/* Section tabs */}
          <div className={s.tabs}>
            {(
              [
                { id: "subject", label: "Subject" },
                { id: "person", label: "Person Style" },
                { id: "meme", label: "Meme & Style" },
                { id: "environment", label: "Environment" },
                { id: "color", label: "Color" },
                { id: "text", label: "Text" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`${s.tab} ${activeSection === tab.id ? s.activeTab : ""}`}
                onClick={() => setActiveSection(tab.id)}
                disabled={disabled}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className={s.tabContent}>
            {/* SUBJECT TAB */}
            {activeSection === "subject" && (
              <div className={s.tabPanel}>
                <div className={s.formGroup}>
                  <label className={s.label}>Main Subject</label>
                  <div className={s.buttonGroup}>
                    {(
                      [
                        { value: "auto", label: "Auto" },
                        { value: "person-face", label: "Person/Face" },
                        { value: "object-icon", label: "Object/Icon" },
                        { value: "mascot-character", label: "Mascot" },
                        { value: "environment-only", label: "Environment Only" },
                      ] as { value: SubjectType; label: string }[]
                    ).map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        className={`${s.optionBtn} ${
                          controls.subjectType === opt.value ? s.active : ""
                        }`}
                        onClick={() => updateField("subjectType", opt.value)}
                        disabled={disabled}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={s.formGroup}>
                  <label className={s.toggleLabel}>
                    <input
                      type="checkbox"
                      checked={controls.includePerson}
                      onChange={(e) => updateField("includePerson", e.target.checked)}
                      disabled={disabled}
                    />
                    Include person/face
                    <span className={s.hint}>(off = never generate a person)</span>
                  </label>
                </div>
              </div>
            )}

            {/* PERSON STYLE TAB */}
            {activeSection === "person" && (
              <div className={s.tabPanel}>
                {!controls.includePerson && (
                  <div className={s.disabledNote}>
                    Person controls disabled (no person selected)
                  </div>
                )}

                <div
                  className={`${s.personControls} ${
                    !controls.includePerson ? s.disabled : ""
                  }`}
                >
                  <div className={s.formGroup}>
                    <label className={s.label}>Persona Vibe</label>
                    <div className={s.buttonGroup}>
                      {(
                        [
                          "auto",
                          "serious",
                          "confident",
                          "curious",
                          "shocked",
                          "silly",
                          "chaotic",
                          "deadpan",
                        ] as PersonaVibe[]
                      ).map((vibe) => (
                        <button
                          key={vibe}
                          type="button"
                          className={`${s.optionBtn} ${
                            controls.personaVibe === vibe ? s.active : ""
                          }`}
                          onClick={() => updateField("personaVibe", vibe)}
                          disabled={disabled || !controls.includePerson}
                        >
                          {vibe}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className={s.formGroup}>
                    <label className={s.label}>Visual Style</label>
                    <div className={s.buttonGroup}>
                      {(
                        [
                          { value: "auto", label: "Auto" },
                          { value: "photoreal", label: "Photoreal" },
                          { value: "cinematic", label: "Cinematic" },
                          { value: "cartoon", label: "Cartoon" },
                          { value: "anime", label: "Anime" },
                          { value: "3d-mascot", label: "3D Mascot" },
                          { value: "vector-flat", label: "Vector/Flat" },
                          { value: "comic-ink", label: "Comic/Ink" },
                        ] as { value: VisualStyle; label: string }[]
                      ).map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          className={`${s.optionBtn} ${
                            controls.visualStyle === opt.value ? s.active : ""
                          }`}
                          onClick={() => updateField("visualStyle", opt.value)}
                          disabled={disabled || !controls.includePerson}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Face style - only for cartoon/comic */}
                  {(controls.visualStyle === "cartoon" ||
                    controls.visualStyle === "comic-ink") && (
                    <div className={s.formGroup}>
                      <label className={s.label}>Face Style</label>
                      <div className={s.buttonGroup}>
                        {(
                          [
                            { value: "auto", label: "Auto" },
                            { value: "emoji-like", label: "Emoji-like" },
                            { value: "expressive-cartoon", label: "Expressive" },
                            { value: "meme-face-vibe", label: "Meme Face" },
                            { value: "cute-mascot", label: "Cute Mascot" },
                          ] as { value: FaceStyle; label: string }[]
                        ).map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            className={`${s.optionBtn} ${
                              controls.faceStyle === opt.value ? s.active : ""
                            }`}
                            onClick={() => updateField("faceStyle", opt.value)}
                            disabled={disabled || !controls.includePerson}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className={s.toggleRow}>
                    <label className={s.toggleLabel}>
                      <input
                        type="checkbox"
                        checked={controls.avoidUncanny}
                        onChange={(e) => updateField("avoidUncanny", e.target.checked)}
                        disabled={disabled || !controls.includePerson}
                      />
                      Avoid uncanny valley
                      <span className={s.hint}>(cleaner style)</span>
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
                        checked={controls.diversityVariety}
                        onChange={(e) => updateField("diversityVariety", e.target.checked)}
                        disabled={disabled || !controls.includePerson}
                      />
                      Diversity/variety
                      <span className={s.hint}>(vary appearance)</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* MEME & STYLE TAB */}
            {activeSection === "meme" && (
              <div className={s.tabPanel}>
                <div className={s.formGroup}>
                  <label className={s.label}>Meme Intensity</label>
                  <div className={s.buttonGroup}>
                    {(["off", "light", "medium", "max"] as MemeIntensity[]).map((intensity) => (
                      <button
                        key={intensity}
                        type="button"
                        className={`${s.optionBtn} ${
                          controls.memeIntensity === intensity ? s.active : ""
                        }`}
                        onClick={() => updateField("memeIntensity", intensity)}
                        disabled={disabled}
                      >
                        {intensity}
                      </button>
                    ))}
                  </div>
                </div>

                {controls.memeIntensity !== "off" && (
                  <>
                    <div className={s.formGroup}>
                      <label className={s.label}>Meme Format Hints (original styles)</label>
                      <div className={s.checkboxGrid}>
                        {(
                          [
                            { value: "reaction-face", label: "Reaction face" },
                            { value: "exaggerated-expression", label: "Exaggerated expression" },
                            { value: "bold-outline", label: "Bold outline / sticker cutout" },
                            { value: "circle-highlight-arrow", label: "Circle highlight + arrow" },
                            { value: "glitch-retro-pixels", label: "Glitch / retro pixels" },
                          ] as { value: MemeFormat; label: string }[]
                        ).map((format) => (
                          <label key={format.value} className={s.checkboxLabel}>
                            <input
                              type="checkbox"
                              checked={controls.memeFormats?.includes(format.value)}
                              onChange={() => toggleMemeFormat(format.value)}
                              disabled={disabled}
                            />
                            {format.label}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className={s.formGroup}>
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
                            value={controls.emojiStyle}
                            onChange={(e) =>
                              updateField("emojiStyle", e.target.value as typeof controls.emojiStyle)
                            }
                            disabled={disabled}
                          >
                            <option value="popular-basic">Popular / Basic</option>
                            <option value="cursed-weird">Cursed / Weird</option>
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
                  </>
                )}

                <div className={s.formGroup}>
                  <label className={s.label}>
                    Style Inspirations
                    <span className={s.hint}>(interpreted as mood, not copied)</span>
                  </label>
                  <input
                    type="text"
                    className={s.input}
                    value={controls.inspirationsText || ""}
                    onChange={(e) => updateField("inspirationsText", e.target.value)}
                    placeholder="e.g., retro RPG UI, horror movie poster, Fortnite color pop..."
                    maxLength={200}
                    disabled={disabled}
                  />
                  <span className={s.charCount}>
                    {(controls.inspirationsText || "").length}/200
                  </span>
                </div>
              </div>
            )}

            {/* ENVIRONMENT TAB */}
            {activeSection === "environment" && (
              <div className={s.tabPanel}>
                <div className={s.formGroup}>
                  <label className={s.label}>Background Mode</label>
                  <div className={s.buttonGroup}>
                    {(
                      [
                        { value: "auto", label: "Auto" },
                        { value: "clean-gradient", label: "Clean Gradient" },
                        { value: "studio-desk", label: "Studio/Desk" },
                        { value: "scene-environment", label: "Scene" },
                        { value: "abstract-texture", label: "Abstract" },
                      ] as { value: BackgroundMode; label: string }[]
                    ).map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        className={`${s.optionBtn} ${
                          controls.backgroundMode === opt.value ? s.active : ""
                        }`}
                        onClick={() => updateField("backgroundMode", opt.value)}
                        disabled={disabled}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={s.formGroup}>
                  <label className={s.label}>Environment Theme</label>
                  <select
                    className={s.select}
                    value={controls.environmentTheme}
                    onChange={(e) =>
                      updateField("environmentTheme", e.target.value as EnvironmentTheme)
                    }
                    disabled={disabled}
                  >
                    <option value="auto">Auto</option>
                    <option value="tech-workspace">Tech Workspace</option>
                    <option value="gaming-setup">Gaming Setup</option>
                    <option value="finance-chart-room">Finance / Chart Room</option>
                    <option value="classroom-whiteboard">Classroom / Whiteboard</option>
                    <option value="outdoor-adventure">Outdoor / Adventure</option>
                    <option value="dark-moody">Dark / Moody</option>
                    <option value="bright-playful">Bright / Playful</option>
                  </select>
                </div>

                <div className={s.formGroup}>
                  <label className={s.label}>Detail Level</label>
                  <div className={s.buttonGroup}>
                    {(["minimal", "medium", "high"] as DetailLevel[]).map((level) => (
                      <button
                        key={level}
                        type="button"
                        className={`${s.optionBtn} ${
                          controls.detailLevel === level ? s.active : ""
                        }`}
                        onClick={() => updateField("detailLevel", level)}
                        disabled={disabled}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={s.formGroup}>
                  <label className={s.label}>Lighting</label>
                  <div className={s.buttonGroup}>
                    {(
                      [
                        { value: "auto", label: "Auto" },
                        { value: "flat", label: "Flat" },
                        { value: "dramatic", label: "Dramatic" },
                        { value: "neon", label: "Neon" },
                        { value: "soft-studio", label: "Soft Studio" },
                      ] as { value: LightingStyle; label: string }[]
                    ).map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        className={`${s.optionBtn} ${
                          controls.lightingStyle === opt.value ? s.active : ""
                        }`}
                        onClick={() => updateField("lightingStyle", opt.value)}
                        disabled={disabled}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* COLOR TAB */}
            {activeSection === "color" && (
              <div className={s.tabPanel}>
                <div className={s.formGroup}>
                  <label className={s.label}>Primary Color (BOGY)</label>
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
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={s.formGroup}>
                  <label className={s.label}>Accent Color (BOGY)</label>
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
            )}

            {/* TEXT TAB */}
            {activeSection === "text" && (
              <div className={s.tabPanel}>
                <div className={s.formGroup}>
                  <label className={s.label}>Headline Style</label>
                  <div className={s.buttonGroup}>
                    {(
                      [
                        { value: "bold-outline", label: "Bold Outline" },
                        { value: "shadow", label: "Shadow" },
                        { value: "banner", label: "Banner" },
                      ] as { value: HeadlineStyle; label: string }[]
                    ).map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        className={`${s.optionBtn} ${
                          controls.headlineStyle === opt.value ? s.active : ""
                        }`}
                        onClick={() => updateField("headlineStyle", opt.value)}
                        disabled={disabled}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={s.formGroup}>
                  <label className={s.label}>Text Placement</label>
                  <div className={s.buttonGroup}>
                    {(["auto", "left", "right", "top", "bottom"] as TextPlacement[]).map(
                      (placement) => (
                        <button
                          key={placement}
                          type="button"
                          className={`${s.optionBtn} ${
                            controls.textPlacement === placement ? s.active : ""
                          }`}
                          onClick={() => updateField("textPlacement", placement)}
                          disabled={disabled}
                        >
                          {placement}
                        </button>
                      )
                    )}
                  </div>
                </div>

                <div className={s.formGroup}>
                  <label className={s.toggleLabel}>
                    <input
                      type="checkbox"
                      checked={controls.shortHeadline}
                      onChange={(e) => updateField("shortHeadline", e.target.checked)}
                      disabled={disabled}
                    />
                    Short headline (≤4 words)
                    <span className={s.hint}>(punchier, more readable)</span>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
