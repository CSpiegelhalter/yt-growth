"use client";

import { useState, useCallback, useMemo } from "react";
import s from "./DialPanel.module.css";
import type { StyleOption, StyleDial, IntensityLevel } from "@/lib/thumbnails/styleReferenceManifest";

type Props = {
  dial: StyleDial;
  selectedOptionId: string;
  intensity?: IntensityLevel;
  onSelect: (optionId: string) => void;
  onIntensityChange?: (intensity: IntensityLevel) => void;
  disabled?: boolean;
  /** If true, show expanded detail on hover */
  showDetailOnHover?: boolean;
};

/**
 * DialPanel - Visual dial selector with preview cards
 *
 * Each option shows a mini thumbnail preview so users can
 * understand what they're selecting without reading text.
 */
export default function DialPanel({
  dial,
  selectedOptionId,
  intensity = "medium",
  onSelect,
  onIntensityChange,
  disabled,
  showDetailOnHover = true,
}: Props) {
  const [hoveredOption, setHoveredOption] = useState<StyleOption | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareOptionId, setCompareOptionId] = useState<string | null>(null);

  const selectedOption = useMemo(
    () => dial.options.find((opt) => opt.id === selectedOptionId),
    [dial.options, selectedOptionId]
  );

  const compareOption = useMemo(
    () => dial.options.find((opt) => opt.id === compareOptionId),
    [dial.options, compareOptionId]
  );

  const handleOptionClick = useCallback(
    (option: StyleOption) => {
      if (disabled) return;

      if (compareMode) {
        // In compare mode, set as compare option
        if (compareOptionId === option.id) {
          setCompareOptionId(null);
        } else {
          setCompareOptionId(option.id);
        }
      } else {
        onSelect(option.id);
      }
    },
    [disabled, compareMode, compareOptionId, onSelect]
  );

  const handleIntensityClick = useCallback(
    (level: IntensityLevel) => {
      if (disabled) return;
      onIntensityChange?.(level);
    },
    [disabled, onIntensityChange]
  );

  return (
    <div className={s.dialPanel}>
      {/* Header */}
      <div className={s.header}>
        <div className={s.titleRow}>
          <h3 className={s.title}>{dial.title}</h3>
          <button
            type="button"
            className={s.infoBtn}
            title={dial.tooltip}
            aria-label="Info"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" />
            </svg>
          </button>
        </div>
        <p className={s.subtitle}>{dial.subtitle}</p>

        {/* Compare toggle */}
        <button
          type="button"
          className={`${s.compareBtn} ${compareMode ? s.active : ""}`}
          onClick={() => {
            setCompareMode(!compareMode);
            if (!compareMode) setCompareOptionId(null);
          }}
          disabled={disabled}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="12" y1="3" x2="12" y2="21" />
          </svg>
          Compare
        </button>
      </div>

      {/* Options Grid */}
      <div className={s.optionsGrid}>
        {dial.options.map((option) => (
          <button
            key={option.id}
            type="button"
            className={`${s.optionCard} ${
              selectedOptionId === option.id ? s.selected : ""
            } ${compareOptionId === option.id ? s.comparing : ""} ${
              option.isOff ? s.offOption : ""
            }`}
            onClick={() => handleOptionClick(option)}
            onMouseEnter={() => showDetailOnHover && setHoveredOption(option)}
            onMouseLeave={() => setHoveredOption(null)}
            disabled={disabled}
            aria-pressed={selectedOptionId === option.id}
          >
            {/* Preview Image */}
            <div
              className={s.previewWrap}
              style={{ "--accent-color": option.accentColor } as React.CSSProperties}
            >
              <StylePreviewSVG option={option} />
            </div>

            {/* Label */}
            <span className={s.optionLabel}>{option.label}</span>

            {/* Selected indicator */}
            {selectedOptionId === option.id && (
              <div className={s.selectedBadge}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            )}

            {/* Compare indicator */}
            {compareOptionId === option.id && (
              <div className={s.compareBadge}>B</div>
            )}
          </button>
        ))}
      </div>

      {/* Intensity Slider (if enabled) */}
      {dial.showIntensity && selectedOption && !selectedOption.isOff && (
        <div className={s.intensitySection}>
          <div className={s.intensityLabel}>Intensity</div>
          <div className={s.intensityButtons}>
            {(["light", "medium", "max"] as IntensityLevel[]).map((level) => (
              <button
                key={level}
                type="button"
                className={`${s.intensityBtn} ${intensity === level ? s.active : ""}`}
                onClick={() => handleIntensityClick(level)}
                disabled={disabled}
              >
                {level}
              </button>
            ))}
          </div>
          <div className={s.intensityBar}>
            <div
              className={s.intensityFill}
              style={{
                width:
                  intensity === "light"
                    ? "33%"
                    : intensity === "medium"
                    ? "66%"
                    : "100%",
              }}
            />
          </div>
        </div>
      )}

      {/* Compare View */}
      {compareMode && compareOption && selectedOption && (
        <div className={s.compareView}>
          <div className={s.compareCard}>
            <div className={s.compareHeader}>A (Selected)</div>
            <div
              className={s.compareLargePreview}
              style={{ "--accent-color": selectedOption.accentColor } as React.CSSProperties}
            >
              <StylePreviewSVG option={selectedOption} large />
            </div>
            <div className={s.compareLabel}>{selectedOption.label}</div>
            <p className={s.compareDesc}>{selectedOption.description}</p>
          </div>
          <div className={s.compareDivider}>
            <span>vs</span>
          </div>
          <div className={s.compareCard}>
            <div className={s.compareHeader}>B (Compare)</div>
            <div
              className={s.compareLargePreview}
              style={{ "--accent-color": compareOption.accentColor } as React.CSSProperties}
            >
              <StylePreviewSVG option={compareOption} large />
            </div>
            <div className={s.compareLabel}>{compareOption.label}</div>
            <p className={s.compareDesc}>{compareOption.description}</p>
          </div>
        </div>
      )}

      {/* Hover Detail Tooltip */}
      {hoveredOption && !compareMode && (
        <div className={s.hoverDetail}>
          <div
            className={s.hoverPreview}
            style={{ "--accent-color": hoveredOption.accentColor } as React.CSSProperties}
          >
            <StylePreviewSVG option={hoveredOption} large />
          </div>
          <div className={s.hoverInfo}>
            <div className={s.hoverLabel}>{hoveredOption.label}</div>
            <p className={s.hoverDesc}>
              {hoveredOption.description}
            </p>
            {hoveredOption.safeNote && (
              <p className={s.hoverNote}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                {hoveredOption.safeNote}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// PREVIEW SVG COMPONENT
// ============================================

type PreviewProps = {
  option: StyleOption;
  large?: boolean;
};

/**
 * Renders a visual preview SVG for the style option.
 * These are generated on-the-fly to avoid needing actual image assets.
 */
function StylePreviewSVG({ option, large }: PreviewProps) {
  const size = large ? 120 : 64;

  // Different preview styles based on category
  switch (option.category) {
    case "memeStyle":
      return <MemeStylePreview option={option} size={size} />;
    case "characterStyle":
      return <CharacterStylePreview option={option} size={size} />;
    case "expression":
      return <ExpressionPreview option={option} size={size} />;
    case "composition":
      return <CompositionPreview option={option} size={size} />;
    case "background":
      return <BackgroundPreview option={option} size={size} />;
    case "intensity":
      return <IntensityPreview option={option} size={size} />;
    default:
      return <DefaultPreview option={option} size={size} />;
  }
}

// Meme style previews - Enhanced visual representations
function MemeStylePreview({ option, size }: { option: StyleOption; size: number }) {
  if (option.isOff) {
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <rect width="64" height="64" rx="8" fill="#1F2937" />
        <circle cx="32" cy="28" r="12" stroke="#4B5563" strokeWidth="2" fill="none" />
        <rect x="20" y="44" width="24" height="8" rx="4" fill="#4B5563" />
        <line x1="10" y1="54" x2="54" y2="10" stroke="#4B5563" strokeWidth="2" />
      </svg>
    );
  }

  if (option.id.includes("rage")) {
    // Rage comic style: Classic MS Paint webcomic aesthetic
    // Bold black lines, white background, exaggerated crude expressions
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <rect width="64" height="64" rx="4" fill="#FFFFFF" />
        {/* Crude face outline - intentionally imperfect */}
        <path d="M16 28 Q16 12 32 12 Q48 12 48 28 Q48 44 32 48 Q16 44 16 28" 
              stroke="#000" strokeWidth="3" fill="#FFF" strokeLinejoin="round" />
        {/* Angry eyebrows - thick and angular */}
        <path d="M20 20 L28 24" stroke="#000" strokeWidth="3" strokeLinecap="round" />
        <path d="M44 20 L36 24" stroke="#000" strokeWidth="3" strokeLinecap="round" />
        {/* Simple dot eyes */}
        <circle cx="26" cy="26" r="3" fill="#000" />
        <circle cx="38" cy="26" r="3" fill="#000" />
        {/* Wide open mouth - rage expression */}
        <path d="M22 36 Q32 48 42 36 Q32 40 22 36" fill="#000" />
        {/* Teeth */}
        <rect x="26" y="36" width="3" height="4" fill="#FFF" />
        <rect x="31" y="36" width="3" height="4" fill="#FFF" />
        <rect x="36" y="36" width="3" height="4" fill="#FFF" />
        {/* Anger lines */}
        <path d="M10 8 L18 14" stroke="#000" strokeWidth="2" />
        <path d="M54 8 L46 14" stroke="#000" strokeWidth="2" />
        <path d="M8 18 L14 22" stroke="#000" strokeWidth="2" />
        <path d="M56 18 L50 22" stroke="#000" strokeWidth="2" />
        {/* Comic panel border */}
        <rect x="2" y="2" width="60" height="60" rx="2" stroke="#000" strokeWidth="2" fill="none" />
      </svg>
    );
  }

  if (option.id.includes("reaction")) {
    // Reaction face: Bold sticker cutout, high saturation, clean outline
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <rect width="64" height="64" rx="8" fill="#0F172A" />
        {/* Sticker drop shadow */}
        <ellipse cx="34" cy="34" rx="22" ry="24" fill="#000" opacity="0.3" />
        {/* Face with thick white stroke (sticker cutout effect) */}
        <ellipse cx="32" cy="32" rx="22" ry="24" fill="#FBBF24" stroke="#FFF" strokeWidth="4" />
        {/* Eyebrows raised */}
        <path d="M18 18 Q24 14 28 18" stroke="#000" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M36 18 Q40 14 46 18" stroke="#000" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        {/* Wide shocked eyes */}
        <ellipse cx="24" cy="26" rx="6" ry="7" fill="#FFF" stroke="#000" strokeWidth="2" />
        <ellipse cx="40" cy="26" rx="6" ry="7" fill="#FFF" stroke="#000" strokeWidth="2" />
        <circle cx="24" cy="27" r="3" fill="#000" />
        <circle cx="40" cy="27" r="3" fill="#000" />
        {/* Eye shine */}
        <circle cx="22" cy="25" r="1.5" fill="#FFF" />
        <circle cx="38" cy="25" r="1.5" fill="#FFF" />
        {/* Open mouth - shocked */}
        <ellipse cx="32" cy="44" rx="10" ry="8" fill="#000" stroke="#000" strokeWidth="2" />
        <ellipse cx="32" cy="42" rx="6" ry="3" fill="#DC2626" />
      </svg>
    );
  }

  if (option.id.includes("wojak")) {
    // Wojak/Feels style: Minimalist line art, melancholic, simple shapes
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <rect width="64" height="64" rx="8" fill="#F8FAFC" />
        {/* Simple bald head outline */}
        <path d="M14 36 Q14 8 32 8 Q50 8 50 36 Q50 56 32 58 Q14 56 14 36" 
              stroke="#64748B" strokeWidth="1.5" fill="#FEF3C7" />
        {/* Sad eyebrows */}
        <path d="M20 24 Q24 22 28 24" stroke="#64748B" strokeWidth="1.5" fill="none" />
        <path d="M36 24 Q40 22 44 24" stroke="#64748B" strokeWidth="1.5" fill="none" />
        {/* Simple dot eyes with slight bags */}
        <circle cx="24" cy="28" r="2" fill="#64748B" />
        <circle cx="40" cy="28" r="2" fill="#64748B" />
        <path d="M22 30 Q24 32 26 30" stroke="#94A3B8" strokeWidth="0.75" fill="none" />
        <path d="M38 30 Q40 32 42 30" stroke="#94A3B8" strokeWidth="0.75" fill="none" />
        {/* Simple nose */}
        <path d="M32 30 L32 36 Q30 38 32 38" stroke="#64748B" strokeWidth="1" fill="none" />
        {/* Slight frown */}
        <path d="M26 44 Q32 40 38 44" stroke="#64748B" strokeWidth="1.5" fill="none" />
        {/* Ear */}
        <ellipse cx="12" cy="34" rx="3" ry="5" stroke="#64748B" strokeWidth="1" fill="#FEF3C7" />
      </svg>
    );
  }

  if (option.id.includes("cursed")) {
    // Surreal cursed meme: Dreamlike, slightly unsettling, unexpected elements
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        {/* Dark surreal background */}
        <rect width="64" height="64" rx="8" fill="#0C0A1D" />
        {/* Gradient overlay */}
        <defs>
          <radialGradient id="cursedGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#0C0A1D" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="64" height="64" fill="url(#cursedGlow)" />
        {/* Distorted face */}
        <ellipse cx="32" cy="30" rx="16" ry="18" fill="#E879F9" />
        {/* Void eyes - completely black, unsettling */}
        <ellipse cx="24" cy="26" rx="5" ry="8" fill="#000" />
        <ellipse cx="40" cy="26" rx="5" ry="8" fill="#000" />
        {/* Subtle eye glow */}
        <ellipse cx="24" cy="26" rx="2" ry="3" fill="#4C1D95" opacity="0.5" />
        <ellipse cx="40" cy="26" rx="2" ry="3" fill="#4C1D95" opacity="0.5" />
        {/* Uncanny wide smile */}
        <path d="M18 38 Q32 52 46 38" stroke="#000" strokeWidth="2" fill="#000" />
        <path d="M20 38 Q32 46 44 38" stroke="#FFF" strokeWidth="1" fill="none" />
        {/* Random floating elements */}
        <circle cx="8" cy="12" r="4" fill="#F472B6" opacity="0.8" />
        <rect x="50" cy="8" width="8" height="8" fill="#22D3EE" opacity="0.7" transform="rotate(15 54 12)" />
        <polygon points="12,52 8,60 16,60" fill="#FBBF24" opacity="0.8" />
        {/* Floating eye */}
        <circle cx="54" cy="50" r="5" fill="#FFF" />
        <circle cx="54" cy="50" r="2" fill="#000" />
      </svg>
    );
  }

  if (option.id.includes("fried")) {
    // Deep fried: Over-saturated, heavy contrast, lens flares, emoji-like
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        {/* Hyper-saturated red/orange background */}
        <rect width="64" height="64" rx="4" fill="#7F1D1D" />
        <rect width="64" height="64" fill="#DC2626" opacity="0.6" />
        {/* Noise texture simulation */}
        <defs>
          <pattern id="friedNoise" patternUnits="userSpaceOnUse" width="4" height="4">
            <rect width="4" height="4" fill="#FDE047" opacity="0.1" />
            <rect x="0" y="0" width="2" height="2" fill="#000" opacity="0.1" />
            <rect x="2" y="2" width="2" height="2" fill="#000" opacity="0.1" />
          </pattern>
        </defs>
        <rect width="64" height="64" fill="url(#friedNoise)" />
        {/* Over-contrasted face */}
        <circle cx="32" cy="28" r="16" fill="#FDE047" stroke="#000" strokeWidth="5" />
        {/* Heavy black square eyes (jpeg artifact look) */}
        <rect x="20" y="20" width="10" height="10" fill="#000" />
        <rect x="34" y="20" width="10" height="10" fill="#000" />
        {/* Simple geometric mouth */}
        <rect x="22" y="34" width="20" height="8" fill="#000" />
        {/* Lens flares */}
        <circle cx="12" cy="10" r="6" fill="#FDE047" opacity="0.9" />
        <circle cx="12" cy="10" r="3" fill="#FFF" opacity="0.8" />
        <circle cx="52" cy="54" r="8" fill="#F97316" opacity="0.8" />
        <circle cx="52" cy="54" r="4" fill="#FFF" opacity="0.7" />
        <circle cx="56" cy="16" r="4" fill="#EF4444" opacity="0.7" />
        {/* "100" emoji style indicator */}
        <text x="4" y="58" fill="#FFF" fontSize="10" fontWeight="900" fontFamily="Arial">💯</text>
        {/* "B" emoji style */}
        <rect x="48" y="36" width="12" height="14" rx="2" fill="#DC2626" />
        <text x="50" y="47" fill="#FFF" fontSize="11" fontWeight="900" fontFamily="Arial">🅱️</text>
      </svg>
    );
  }

  return <DefaultPreview option={option} size={size} />;
}

// Character style previews
function CharacterStylePreview({ option, size }: { option: StyleOption; size: number }) {
  const color = option.accentColor || "#3B82F6";

  if (option.isOff) {
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <rect width="64" height="64" rx="8" fill="#1F2937" />
        <text x="32" y="38" textAnchor="middle" fill="#6B7280" fontSize="12" fontWeight="600">
          AUTO
        </text>
      </svg>
    );
  }

  if (option.id.includes("photoreal")) {
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <rect width="64" height="64" rx="8" fill="#292524" />
        <defs>
          <linearGradient id="skin" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor="#92400E" />
          </linearGradient>
        </defs>
        <ellipse cx="32" cy="30" rx="12" ry="14" fill="url(#skin)" />
        <ellipse cx="27" cy="28" rx="2" ry="2.5" fill="#1C1917" />
        <ellipse cx="37" cy="28" rx="2" ry="2.5" fill="#1C1917" />
        <ellipse cx="32" cy="36" rx="4" ry="2" fill="#A16207" />
        <path d="M20 18 Q32 10 44 18" fill="#44403C" />
      </svg>
    );
  }

  if (option.id.includes("cinematic")) {
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <rect width="64" height="64" rx="8" fill={color} />
        <rect x="8" y="8" width="48" height="48" rx="4" fill="#0F172A" />
        <ellipse cx="32" cy="32" rx="10" ry="12" fill="#334155" />
        <ellipse cx="28" cy="30" rx="2" ry="2" fill="#94A3B8" />
        <ellipse cx="36" cy="30" rx="2" ry="2" fill="#94A3B8" />
        <circle cx="48" cy="20" r="8" fill="#F97316" opacity="0.6" />
      </svg>
    );
  }

  if (option.id.includes("cartoon") || option.id.includes("simple")) {
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <rect width="64" height="64" rx="8" fill={color} />
        <circle cx="32" cy="28" r="14" fill="#FEF3C7" stroke="#000" strokeWidth="2" />
        <circle cx="27" cy="25" r="3" fill="#000" />
        <circle cx="37" cy="25" r="3" fill="#000" />
        <ellipse cx="27" cy="24" rx="1" ry="1" fill="#FFF" />
        <ellipse cx="37" cy="24" rx="1" ry="1" fill="#FFF" />
        <path d="M26 32 Q32 38 38 32" stroke="#000" strokeWidth="2" fill="none" />
        <rect x="20" y="44" width="24" height="12" rx="4" fill="#3B82F6" />
      </svg>
    );
  }

  if (option.id.includes("vector") || option.id.includes("sticker")) {
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <rect width="64" height="64" rx="8" fill="#0F172A" />
        <circle cx="32" cy="28" r="16" fill={color} stroke="#FFF" strokeWidth="3" />
        <circle cx="26" cy="25" r="4" fill="#FFF" />
        <circle cx="38" cy="25" r="4" fill="#FFF" />
        <rect x="28" y="32" width="8" height="4" rx="2" fill="#FFF" />
        <path d="M20 48 L32 56 L44 48" fill="#10B981" />
      </svg>
    );
  }

  if (option.id.includes("comic") || option.id.includes("ink")) {
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <rect width="64" height="64" rx="8" fill="#FEF3C7" />
        <circle cx="32" cy="28" r="14" fill="#FFF" stroke="#000" strokeWidth="3" />
        <circle cx="27" cy="25" r="3" fill="#000" />
        <circle cx="37" cy="25" r="3" fill="#000" />
        <path d="M26 34 L38 34" stroke="#000" strokeWidth="2" />
        <circle cx="20" cy="20" r="4" fill="#000" opacity="0.1" />
        <circle cx="44" cy="44" r="6" fill="#000" opacity="0.1" />
        <circle cx="12" cy="40" r="3" fill="#000" opacity="0.1" />
      </svg>
    );
  }

  if (option.id.includes("3d") || option.id.includes("mascot")) {
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <rect width="64" height="64" rx="8" fill="#DBEAFE" />
        <defs>
          <linearGradient id="mascot3d" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor="#C2410C" />
          </linearGradient>
        </defs>
        <ellipse cx="32" cy="32" rx="18" ry="20" fill="url(#mascot3d)" />
        <ellipse cx="26" cy="28" rx="4" ry="5" fill="#FFF" />
        <ellipse cx="38" cy="28" rx="4" ry="5" fill="#FFF" />
        <circle cx="26" cy="29" r="2" fill="#000" />
        <circle cx="38" cy="29" r="2" fill="#000" />
        <ellipse cx="32" cy="40" rx="6" ry="3" fill="#FED7AA" />
      </svg>
    );
  }

  if (option.id.includes("anime")) {
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <rect width="64" height="64" rx="8" fill="#FDF2F8" />
        <ellipse cx="32" cy="32" rx="14" ry="16" fill="#FEE2E2" stroke={color} strokeWidth="1" />
        <ellipse cx="25" cy="28" rx="5" ry="6" fill="#FFF" stroke="#000" strokeWidth="1" />
        <ellipse cx="39" cy="28" rx="5" ry="6" fill="#FFF" stroke="#000" strokeWidth="1" />
        <circle cx="25" cy="29" r="3" fill={color} />
        <circle cx="39" cy="29" r="3" fill={color} />
        <ellipse cx="25" cy="28" rx="1" ry="1" fill="#FFF" />
        <ellipse cx="39" cy="28" rx="1" ry="1" fill="#FFF" />
        <path d="M29 38 Q32 41 35 38" stroke="#000" strokeWidth="1" fill="none" />
        <path d="M18 14 L26 22 M46 14 L38 22" stroke="#000" strokeWidth="2" />
      </svg>
    );
  }

  return <DefaultPreview option={option} size={size} />;
}

// Expression previews
function ExpressionPreview({ option, size }: { option: StyleOption; size: number }) {
  const color = option.accentColor || "#3B82F6";

  if (option.isOff) {
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <rect width="64" height="64" rx="8" fill="#1F2937" />
        <text x="32" y="38" textAnchor="middle" fill="#6B7280" fontSize="12" fontWeight="600">
          AUTO
        </text>
      </svg>
    );
  }

  // Base face
  const Face = ({ children }: { children: React.ReactNode }) => (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <rect width="64" height="64" rx="8" fill={color} />
      <circle cx="32" cy="32" r="18" fill="#FEF3C7" stroke="#000" strokeWidth="2" />
      {children}
    </svg>
  );

  if (option.id.includes("serious")) {
    return (
      <Face>
        <line x1="24" y1="26" x2="28" y2="26" stroke="#000" strokeWidth="2" />
        <line x1="36" y1="26" x2="40" y2="26" stroke="#000" strokeWidth="2" />
        <circle cx="26" cy="28" r="2" fill="#000" />
        <circle cx="38" cy="28" r="2" fill="#000" />
        <line x1="28" y1="38" x2="36" y2="38" stroke="#000" strokeWidth="2" />
      </Face>
    );
  }

  if (option.id.includes("confident")) {
    return (
      <Face>
        <circle cx="26" cy="28" r="3" fill="#000" />
        <circle cx="38" cy="28" r="3" fill="#000" />
        <path d="M26 38 Q32 42 38 38" stroke="#000" strokeWidth="2" fill="none" />
        <path d="M22 24 L28 26" stroke="#000" strokeWidth="2" />
        <path d="M42 24 L36 26" stroke="#000" strokeWidth="2" />
      </Face>
    );
  }

  if (option.id.includes("curious")) {
    return (
      <Face>
        <circle cx="26" cy="28" r="3" fill="#000" />
        <circle cx="38" cy="28" r="3" fill="#000" />
        <path d="M22 22 L28 26" stroke="#000" strokeWidth="2" />
        <ellipse cx="32" cy="40" rx="4" ry="2" fill="#000" />
      </Face>
    );
  }

  if (option.id.includes("shocked")) {
    return (
      <Face>
        <ellipse cx="26" cy="26" rx="4" ry="5" fill="#FFF" stroke="#000" strokeWidth="2" />
        <ellipse cx="38" cy="26" rx="4" ry="5" fill="#FFF" stroke="#000" strokeWidth="2" />
        <circle cx="26" cy="27" r="2" fill="#000" />
        <circle cx="38" cy="27" r="2" fill="#000" />
        <ellipse cx="32" cy="42" rx="5" ry="4" fill="#000" />
      </Face>
    );
  }

  if (option.id.includes("silly")) {
    return (
      <Face>
        <circle cx="26" cy="28" r="3" fill="#000" />
        <circle cx="40" cy="26" r="3" fill="#000" />
        <path d="M26 38 Q32 44 38 38" stroke="#000" strokeWidth="2" fill="none" />
        <ellipse cx="40" cy="38" rx="3" ry="2" fill="#F87171" />
        <path d="M32 42 L32 48" stroke="#000" strokeWidth="2" />
      </Face>
    );
  }

  if (option.id.includes("chaotic")) {
    return (
      <Face>
        <ellipse cx="24" cy="24" rx="5" ry="6" fill="#FFF" stroke="#000" strokeWidth="2" />
        <ellipse cx="40" cy="26" rx="5" ry="6" fill="#FFF" stroke="#000" strokeWidth="2" />
        <circle cx="24" cy="25" r="3" fill="#000" />
        <circle cx="40" cy="27" r="3" fill="#000" />
        <path d="M24 38 Q32 50 40 38" fill="#000" />
        <path d="M18 18 L26 22" stroke="#000" strokeWidth="2" />
        <path d="M46 20 L38 24" stroke="#000" strokeWidth="2" />
      </Face>
    );
  }

  return <DefaultPreview option={option} size={size} />;
}

// Composition previews
function CompositionPreview({ option, size }: { option: StyleOption; size: number }) {
  const color = option.accentColor || "#3B82F6";

  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <rect width="64" height="64" rx="8" fill="#1E293B" />

      {option.id.includes("left") && (
        <>
          <rect x="6" y="14" width="24" height="36" rx="4" fill={color} />
          <rect x="34" y="20" width="24" height="6" rx="2" fill="#475569" />
          <rect x="34" y="30" width="20" height="4" rx="1" fill="#475569" />
          <rect x="34" y="38" width="16" height="4" rx="1" fill="#475569" />
        </>
      )}

      {option.id.includes("right") && (
        <>
          <rect x="34" y="14" width="24" height="36" rx="4" fill={color} />
          <rect x="6" y="20" width="24" height="6" rx="2" fill="#475569" />
          <rect x="6" y="30" width="20" height="4" rx="1" fill="#475569" />
          <rect x="6" y="38" width="16" height="4" rx="1" fill="#475569" />
        </>
      )}

      {option.id.includes("center") && (
        <>
          <rect x="20" y="20" width="24" height="32" rx="4" fill={color} />
          <rect x="12" y="8" width="40" height="8" rx="2" fill="#475569" />
        </>
      )}

      {option.id.includes("close") && (
        <>
          <rect x="8" y="8" width="48" height="48" rx="4" fill={color} />
          <circle cx="32" cy="32" r="16" fill="#1E40AF" />
          <rect x="22" y="50" width="20" height="6" rx="2" fill="#475569" />
        </>
      )}

      {option.id.includes("wide") && (
        <>
          <rect x="4" y="16" width="56" height="32" rx="4" fill="#0F172A" />
          <rect x="24" y="24" width="16" height="20" rx="2" fill={color} />
          <rect x="8" y="20" width="12" height="16" rx="2" fill="#334155" />
          <rect x="44" y="22" width="12" height="14" rx="2" fill="#334155" />
          <rect x="20" y="52" width="24" height="6" rx="2" fill="#475569" />
        </>
      )}
    </svg>
  );
}

// Background previews
function BackgroundPreview({ option, size }: { option: StyleOption; size: number }) {
  const color = option.accentColor || "#3B82F6";

  if (option.isOff) {
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <rect width="64" height="64" rx="8" fill="#1F2937" />
        <text x="32" y="38" textAnchor="middle" fill="#6B7280" fontSize="12" fontWeight="600">
          AUTO
        </text>
      </svg>
    );
  }

  if (option.id.includes("gradient")) {
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <defs>
          <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor="#1E3A8A" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx="8" fill="url(#bgGrad)" />
        <circle cx="24" cy="32" r="12" fill="rgba(255,255,255,0.2)" />
      </svg>
    );
  }

  if (option.id.includes("studio")) {
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <rect width="64" height="64" rx="8" fill="#E5E5E5" />
        <ellipse cx="32" cy="56" rx="28" ry="8" fill="#D4D4D4" />
        <circle cx="32" cy="32" r="14" fill="#A3A3A3" />
        <circle cx="12" cy="12" r="6" fill="#FDE68A" opacity="0.8" />
      </svg>
    );
  }

  if (option.id.includes("tech")) {
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <rect width="64" height="64" rx="8" fill="#0F172A" />
        <rect x="8" y="8" width="20" height="14" rx="2" fill="#1E40AF" />
        <rect x="32" y="8" width="24" height="14" rx="2" fill="#1E40AF" />
        <rect x="12" y="48" width="40" height="8" rx="2" fill="#334155" />
        <rect x="8" y="28" width="48" height="16" rx="2" fill="#1E293B" />
      </svg>
    );
  }

  if (option.id.includes("neon")) {
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <rect width="64" height="64" rx="8" fill="#0F0F1A" />
        <circle cx="16" cy="16" r="8" fill={color} opacity="0.6" />
        <circle cx="48" cy="48" r="10" fill="#06B6D4" opacity="0.5" />
        <rect x="20" y="28" width="24" height="2" fill="#F472B6" />
        <rect x="16" y="34" width="32" height="2" fill="#A78BFA" />
      </svg>
    );
  }

  if (option.id.includes("abstract")) {
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <rect width="64" height="64" rx="8" fill="#1E1B4B" />
        <circle cx="20" cy="20" r="12" fill={color} opacity="0.4" />
        <circle cx="44" cy="44" r="16" fill="#F472B6" opacity="0.3" />
        <rect x="8" y="40" width="16" height="16" rx="4" fill="#A78BFA" opacity="0.5" transform="rotate(-15 8 40)" />
      </svg>
    );
  }

  if (option.id.includes("dark")) {
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <rect width="64" height="64" rx="8" fill="#0A0A0A" />
        <rect x="0" y="32" width="64" height="32" rx="0" fill="#1F2937" opacity="0.5" />
        <circle cx="48" cy="16" r="4" fill="#F97316" opacity="0.8" />
      </svg>
    );
  }

  return <DefaultPreview option={option} size={size} />;
}

// Intensity previews
function IntensityPreview({ option, size }: { option: StyleOption; size: number }) {
  const color = option.accentColor || "#6B7280";

  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <rect width="64" height="64" rx="8" fill="#1F2937" />
      <rect
        x="8"
        y="28"
        width={option.id.includes("off") ? 8 : option.id.includes("light") ? 16 : option.id.includes("medium") ? 32 : 48}
        height="8"
        rx="4"
        fill={color}
      />
    </svg>
  );
}

// Default fallback preview
function DefaultPreview({ option, size }: { option: StyleOption; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <rect width="64" height="64" rx="8" fill={option.accentColor || "#3B82F6"} />
      <text x="32" y="38" textAnchor="middle" fill="#FFF" fontSize="10" fontWeight="600">
        {option.label.slice(0, 6)}
      </text>
    </svg>
  );
}
