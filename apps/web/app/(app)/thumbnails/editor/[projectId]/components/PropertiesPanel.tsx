"use client";

import { useState, useEffect, useRef } from "react";
import type {
  EditorObject,
  TextObject,
  ArrowObject,
  ImageObject,
  ShapeObject,
  DocumentSettings,
  ArrowStyle,
} from "./types";
import { FONT_OPTIONS, ARROW_PRESETS } from "./types";
import { COLOR_PRESETS } from "./constants";
import { fitImageContain, fitImageCover, centerInCanvas } from "./utils";
import s from "./editor.module.css";

interface PropertiesPanelProps {
  selectedObject: EditorObject | null;
  documentSettings: DocumentSettings;
  onObjectChange: (patch: Partial<EditorObject>) => void;
  onSettingsChange: (patch: Partial<DocumentSettings>) => void;
  onMoveLayer: (direction: "up" | "down") => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onSelect: (id: string | null) => void;
  objects: EditorObject[];
}

// ============================================================================
// SHARED UI COMPONENTS
// ============================================================================

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className={s.propSection}>
      <h4 className={s.propSectionTitle}>{title}</h4>
      {children}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className={s.propRow}>
      <span className={s.propLabel}>{label}</span>
      <div className={s.propControl}>{children}</div>
    </div>
  );
}

function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [showPicker, setShowPicker] = useState(false);
  const [hexInput, setHexInput] = useState(value.startsWith("rgba") ? rgbaToHex(value) : value);
  const wrapperRef = useRef<HTMLDivElement>(null);
  
  // Close picker on click outside
  useEffect(() => {
    if (!showPicker) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showPicker]);
  
  const handleHexChange = (hex: string) => {
    setHexInput(hex);
    if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
      onChange(hex);
    }
  };
  
  return (
    <div className={s.colorInputWrapper} ref={wrapperRef}>
      <div className={s.colorPickerTrigger} onClick={() => setShowPicker(!showPicker)}>
        <div 
          className={s.colorSwatch} 
          style={{ backgroundColor: value.startsWith("rgba") ? rgbaToHex(value) : value }}
        />
        <input
          type="text"
          value={hexInput}
          onChange={(e) => handleHexChange(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          className={s.hexInput}
          placeholder="#000000"
        />
      </div>
      {showPicker && (
        <div className={s.colorPickerDropdown}>
          <input
            type="color"
            value={value.startsWith("rgba") ? rgbaToHex(value) : value}
            onChange={(e) => {
              onChange(e.target.value);
              setHexInput(e.target.value);
            }}
            className={s.colorInputLarge}
          />
          <div className={s.colorPresetsGrid}>
            {COLOR_PRESETS.map((c) => (
              <button
                key={c}
                className={s.colorPresetLarge}
                style={{ backgroundColor: c }}
                onClick={() => {
                  onChange(c);
                  setHexInput(c);
                  setShowPicker(false);
                }}
                title={c}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SliderInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix = "",
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
}) {
  return (
    <div className={s.sliderWrapper}>
      <input
        type="range"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        min={min}
        max={max}
        step={step}
        className={s.sliderInput}
      />
      <span className={s.sliderValue}>{Math.round(value)}{suffix}</span>
    </div>
  );
}

function NumberInput({
  value,
  onChange,
  min,
  max,
  step = 1,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <input
      type="number"
      value={Math.round(value * 100) / 100}
      onChange={(e) => onChange(Number(e.target.value))}
      min={min}
      max={max}
      step={step}
      className={s.numberInput}
    />
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <label className={s.toggle}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className={s.toggleTrack} />
      {label && <span className={s.toggleLabel}>{label}</span>}
    </label>
  );
}

type ShadowSectionProps = {
  title?: string;
  enabled: boolean;
  color: string;
  blur: number;
  offsetX?: number;
  offsetY?: number;
  onEnabledChange: (v: boolean) => void;
  onColorChange: (v: string) => void;
  onBlurChange: (v: number) => void;
  onOffsetXChange?: (v: number) => void;
  onOffsetYChange?: (v: number) => void;
  blurInput?: "slider" | "number";
};

function ShadowControls({
  title = "Shadow",
  enabled,
  color,
  blur,
  offsetX,
  offsetY,
  onEnabledChange,
  onColorChange,
  onBlurChange,
  onOffsetXChange,
  onOffsetYChange,
  blurInput = "slider",
}: ShadowSectionProps) {
  return (
    <Section title={title}>
      <Row label="Enabled">
        <Toggle checked={enabled} onChange={onEnabledChange} />
      </Row>
      {enabled && (
        <>
          <Row label="Color">
            <ColorInput value={color} onChange={onColorChange} />
          </Row>
          <Row label="Blur">
            {blurInput === "slider" ? (
              <SliderInput value={blur} onChange={onBlurChange} min={0} max={50} />
            ) : (
              <NumberInput value={blur} onChange={onBlurChange} min={0} max={50} />
            )}
          </Row>
          {onOffsetXChange && offsetX !== undefined && (
            <Row label="Offset X">
              <SliderInput value={offsetX} onChange={onOffsetXChange} min={-30} max={30} />
            </Row>
          )}
          {onOffsetYChange && offsetY !== undefined && (
            <Row label="Offset Y">
              <SliderInput value={offsetY} onChange={onOffsetYChange} min={-30} max={30} />
            </Row>
          )}
        </>
      )}
    </Section>
  );
}

function StrokeControls({
  enabled,
  color,
  width,
  onEnabledChange,
  onColorChange,
  onWidthChange,
}: {
  enabled: boolean;
  color: string;
  width: number;
  onEnabledChange: (v: boolean) => void;
  onColorChange: (v: string) => void;
  onWidthChange: (v: number) => void;
}) {
  return (
    <Section title="Stroke">
      <Row label="Enabled">
        <Toggle checked={enabled} onChange={onEnabledChange} />
      </Row>
      {enabled && (
        <>
          <Row label="Color">
            <ColorInput value={color} onChange={onColorChange} />
          </Row>
          <Row label="Width">
            <SliderInput value={width} onChange={onWidthChange} min={0} max={30} suffix="px" />
          </Row>
        </>
      )}
    </Section>
  );
}

function Select({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { label: string; value: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={s.select}>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

// Helper to convert rgba to hex (rough)
function rgbaToHex(rgba: string): string {
  const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return "#000000";
  const [, r, g, b] = match;
  return `#${[r, g, b].map((x) => parseInt(x).toString(16).padStart(2, "0")).join("")}`;
}

// ============================================================================
// DOCUMENT SETTINGS PANEL
// ============================================================================

function DocumentSettingsPanel({
  settings,
  onChange,
}: {
  settings: DocumentSettings;
  onChange: (patch: Partial<DocumentSettings>) => void;
}) {
  return (
    <>
      <Section title="Document">
        <Row label="Size">
          <span className={s.readOnly}>{settings.width} × {settings.height}</span>
        </Row>
        <Row label="Background">
          <ColorInput
            value={settings.backgroundColor}
            onChange={(v) => onChange({ backgroundColor: v })}
          />
        </Row>
        <Row label="Transparent">
          <Toggle
            checked={settings.backgroundTransparent}
            onChange={(v) => onChange({ backgroundTransparent: v })}
          />
        </Row>
      </Section>

      <Section title="Guides">
        <Row label="Safe Area">
          <Toggle
            checked={settings.safeAreaEnabled}
            onChange={(v) => onChange({ safeAreaEnabled: v })}
          />
        </Row>
        {settings.safeAreaEnabled && (
          <Row label="Margin %">
            <NumberInput
              value={settings.safeAreaMargin}
              onChange={(v) => onChange({ safeAreaMargin: v })}
              min={1}
              max={20}
            />
          </Row>
        )}
      </Section>
    </>
  );
}

// ============================================================================
// TEXT PROPERTIES PANEL
// ============================================================================

function TextPropertiesPanel({
  obj,
  onChange,
}: {
  obj: TextObject;
  onChange: (patch: Partial<TextObject>) => void;
}) {
  return (
    <>
      <Section title="Text">
        <textarea
          value={obj.text}
          onChange={(e) => onChange({ text: e.target.value })}
          className={s.textArea}
          rows={3}
        />
      </Section>

      <Section title="Typography">
        <Row label="Font">
          <Select
            value={obj.fontFamily}
            options={FONT_OPTIONS.map((f) => ({ label: f.label, value: f.value }))}
            onChange={(v) => onChange({ fontFamily: v })}
          />
        </Row>
        <Row label="Size">
          <SliderInput
            value={obj.fontSize}
            onChange={(v) => onChange({ fontSize: v })}
            min={12}
            max={300}
            suffix="px"
          />
        </Row>
        <Row label="Weight">
          <Select
            value={obj.fontWeight}
            options={[
              { label: "Normal", value: "400" },
              { label: "Medium", value: "500" },
              { label: "Semi Bold", value: "600" },
              { label: "Bold", value: "700" },
              { label: "Extra Bold", value: "800" },
              { label: "Black", value: "900" },
            ]}
            onChange={(v) => onChange({ fontWeight: v })}
          />
        </Row>
        <Row label="Align">
          <div className={s.alignButtons}>
            <button
              className={`${s.alignBtn} ${obj.textAlign === "left" ? s.active : ""}`}
              onClick={() => onChange({ textAlign: "left" })}
              title="Align Left"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="15" y2="12" />
                <line x1="3" y1="18" x2="18" y2="18" />
              </svg>
            </button>
            <button
              className={`${s.alignBtn} ${obj.textAlign === "center" ? s.active : ""}`}
              onClick={() => onChange({ textAlign: "center" })}
              title="Align Center"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="6" y1="12" x2="18" y2="12" />
                <line x1="4" y1="18" x2="20" y2="18" />
              </svg>
            </button>
            <button
              className={`${s.alignBtn} ${obj.textAlign === "right" ? s.active : ""}`}
              onClick={() => onChange({ textAlign: "right" })}
              title="Align Right"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="9" y1="12" x2="21" y2="12" />
                <line x1="6" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          </div>
        </Row>
        <Row label="Spacing">
          <SliderInput
            value={obj.letterSpacing}
            onChange={(v) => onChange({ letterSpacing: v })}
            min={-10}
            max={30}
          />
        </Row>
      </Section>

      <Section title="Transform">
        <Row label="Rotation">
          <SliderInput
            value={obj.rotation}
            onChange={(v) => onChange({ rotation: v })}
            min={-180}
            max={180}
            suffix="°"
          />
        </Row>
      </Section>

      <Section title="Colors">
        <Row label="Fill">
          <ColorInput value={obj.fill} onChange={(v) => onChange({ fill: v })} />
        </Row>
        <Row label="Stroke">
          <ColorInput value={obj.stroke} onChange={(v) => onChange({ stroke: v })} />
        </Row>
        <Row label="Stroke Width">
          <SliderInput
            value={obj.strokeWidth}
            onChange={(v) => onChange({ strokeWidth: v })}
            min={0}
            max={30}
            suffix="px"
          />
        </Row>
      </Section>

      <ShadowControls
        enabled={obj.shadowEnabled}
        color={obj.shadowColor}
        blur={obj.shadowBlur}
        offsetX={obj.shadowOffsetX}
        offsetY={obj.shadowOffsetY}
        onEnabledChange={(v) => onChange({ shadowEnabled: v })}
        onColorChange={(v) => onChange({ shadowColor: v })}
        onBlurChange={(v) => onChange({ shadowBlur: v })}
        onOffsetXChange={(v) => onChange({ shadowOffsetX: v })}
        onOffsetYChange={(v) => onChange({ shadowOffsetY: v })}
      />

      <Section title="Background Pill">
        <Row label="Enabled">
          <Toggle
            checked={obj.backgroundEnabled}
            onChange={(v) => onChange({ backgroundEnabled: v })}
          />
        </Row>
        {obj.backgroundEnabled && (
          <>
            <Row label="Color">
              <ColorInput
                value={obj.backgroundColor}
                onChange={(v) => onChange({ backgroundColor: v })}
              />
            </Row>
            <Row label="Padding">
              <NumberInput
                value={obj.backgroundPadding}
                onChange={(v) => onChange({ backgroundPadding: v })}
                min={0}
                max={100}
              />
            </Row>
            <Row label="Radius">
              <NumberInput
                value={obj.backgroundRadius}
                onChange={(v) => onChange({ backgroundRadius: v })}
                min={0}
                max={100}
              />
            </Row>
          </>
        )}
      </Section>
    </>
  );
}

// ============================================================================
// ARROW PROPERTIES PANEL
// ============================================================================

function ArrowPropertiesPanel({
  obj,
  onChange,
}: {
  obj: ArrowObject;
  onChange: (patch: Partial<ArrowObject>) => void;
}) {
  const applyPreset = (style: ArrowStyle) => {
    const preset = ARROW_PRESETS[style];
    onChange({ style, ...preset });
  };

  return (
    <>
      <Section title="Style">
        <div className={s.stylePresets}>
          {(["classic", "tapered", "thick", "outlined", "glow"] as ArrowStyle[]).map((style) => (
            <button
              key={style}
              className={`${s.stylePresetBtn} ${obj.style === style ? s.active : ""}`}
              onClick={() => applyPreset(style)}
              title={
                style === "tapered" ? "Fat base, thin tip" :
                style === "classic" ? "Uniform thickness" :
                style === "thick" ? "Bold uniform" :
                style === "outlined" ? "With outline" :
                "With glow effect"
              }
            >
              {style === "tapered" ? "Tapered" : style.charAt(0).toUpperCase() + style.slice(1)}
            </button>
          ))}
        </div>
        <Row label="Smooth">
          <Toggle
            checked={obj.isCurved}
            onChange={(v) => onChange({ isCurved: v })}
          />
        </Row>
        <Row label="Add Point">
          <button
            className={s.textButton}
            onClick={() => {
              // Add a midpoint to the arrow
              if (obj.points.length >= 4) {
                const newPoints = [...obj.points];
                const lastIdx = newPoints.length - 2;
                const prevX = newPoints[lastIdx - 2];
                const prevY = newPoints[lastIdx - 1];
                const endX = newPoints[lastIdx];
                const endY = newPoints[lastIdx + 1];
                // Insert midpoint before end
                const midX = (prevX + endX) / 2;
                const midY = (prevY + endY) / 2 - 50;
                newPoints.splice(lastIdx, 0, midX, midY);
                onChange({ points: newPoints });
              }
            }}
          >
            + Add Curve Point
          </button>
        </Row>
      </Section>

      <Section title="Appearance">
        <Row label="Color">
          <ColorInput value={obj.color} onChange={(v) => onChange({ color: v })} />
        </Row>
        <Row label="Thickness">
          <SliderInput
            value={obj.thickness}
            onChange={(v) => onChange({ thickness: v })}
            min={4}
            max={60}
            suffix="px"
          />
        </Row>
        <Row label="Head Size">
          <SliderInput
            value={obj.arrowheadSize}
            onChange={(v) => onChange({ arrowheadSize: v })}
            min={0.5}
            max={3}
            step={0.1}
          />
        </Row>
        <Row label="Dashed">
          <Toggle checked={obj.dashed} onChange={(v) => onChange({ dashed: v })} />
        </Row>
      </Section>

      <Section title="Outline">
        <Row label="Enabled">
          <Toggle
            checked={obj.outlineEnabled}
            onChange={(v) => onChange({ outlineEnabled: v })}
          />
        </Row>
        {obj.outlineEnabled && (
          <>
            <Row label="Color">
              <ColorInput
                value={obj.outlineColor}
                onChange={(v) => onChange({ outlineColor: v })}
              />
            </Row>
            <Row label="Width">
              <SliderInput
                value={obj.outlineWidth}
                onChange={(v) => onChange({ outlineWidth: v })}
                min={1}
                max={15}
                suffix="px"
              />
            </Row>
          </>
        )}
      </Section>

      <ShadowControls
        title="Shadow / Glow"
        enabled={obj.shadowEnabled}
        color={obj.shadowColor}
        blur={obj.shadowBlur}
        onEnabledChange={(v) => onChange({ shadowEnabled: v })}
        onColorChange={(v) => onChange({ shadowColor: v })}
        onBlurChange={(v) => onChange({ shadowBlur: v })}
        blurInput="number"
      />
    </>
  );
}

// ============================================================================
// IMAGE PROPERTIES PANEL
// ============================================================================

function ImagePropertiesPanel({
  obj,
  onChange,
}: {
  obj: ImageObject;
  onChange: (patch: Partial<ImageObject>) => void;
}) {
  const handleCover = () => {
    const dims = fitImageCover(obj.originalWidth, obj.originalHeight);
    const pos = centerInCanvas(dims.width, dims.height);
    onChange({ ...dims, ...pos });
  };

  const handleContain = () => {
    const dims = fitImageContain(obj.originalWidth, obj.originalHeight);
    const pos = centerInCanvas(dims.width, dims.height);
    onChange({ ...dims, ...pos });
  };

  return (
    <>
      <Section title="Fit">
        <div className={s.fitButtons}>
          <button className={s.fitBtn} onClick={handleCover}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M9 3v18M15 3v18" strokeDasharray="2 2" opacity="0.5" />
            </svg>
            Cover
          </button>
          <button className={s.fitBtn} onClick={handleContain}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <rect x="6" y="8" width="12" height="8" />
            </svg>
            Contain
          </button>
        </div>
      </Section>

      <Section title="Transform">
        <Row label="Width">
          <NumberInput
            value={Math.round(obj.width)}
            onChange={(v) => onChange({ width: v })}
            min={10}
          />
        </Row>
        <Row label="Height">
          <NumberInput
            value={Math.round(obj.height)}
            onChange={(v) => onChange({ height: v })}
            min={10}
          />
        </Row>
        <Row label="Rotation">
          <SliderInput
            value={obj.rotation}
            onChange={(v) => onChange({ rotation: v })}
            min={-180}
            max={180}
            suffix="°"
          />
        </Row>
        <Row label="Opacity">
          <SliderInput
            value={obj.opacity * 100}
            onChange={(v) => onChange({ opacity: v / 100 })}
            min={0}
            max={100}
            suffix="%"
          />
        </Row>
      </Section>

      <Section title="Original">
        <Row label="Size">
          <span className={s.readOnly}>
            {obj.originalWidth} × {obj.originalHeight}
          </span>
        </Row>
      </Section>
    </>
  );
}

// ============================================================================
// SHAPE PROPERTIES PANEL
// ============================================================================

function ShapePropertiesPanel({
  obj,
  onChange,
}: {
  obj: ShapeObject;
  onChange: (patch: Partial<ShapeObject>) => void;
}) {
  return (
    <>
      <Section title="Shape">
        <Row label="Type">
          <Select
            value={obj.shapeType}
            options={[
              { label: "Ellipse", value: "ellipse" },
              { label: "Rectangle", value: "rectangle" },
              { label: "Triangle", value: "triangle" },
            ]}
            onChange={(v) => onChange({ shapeType: v as ShapeObject["shapeType"] })}
          />
        </Row>
        <Row label="Width">
          <SliderInput
            value={obj.width}
            onChange={(v) => onChange({ width: v })}
            min={20}
            max={1200}
            suffix="px"
          />
        </Row>
        <Row label="Height">
          <SliderInput
            value={obj.height}
            onChange={(v) => onChange({ height: v })}
            min={20}
            max={700}
            suffix="px"
          />
        </Row>
        {obj.shapeType === "rectangle" && (
          <Row label="Corner Radius">
            <SliderInput
              value={obj.cornerRadius}
              onChange={(v) => onChange({ cornerRadius: v })}
              min={0}
              max={100}
              suffix="px"
            />
          </Row>
        )}
        <Row label="Rotation">
          <SliderInput
            value={obj.rotation}
            onChange={(v) => onChange({ rotation: v })}
            min={-180}
            max={180}
            suffix="°"
          />
        </Row>
      </Section>

      <Section title="Fill">
        <Row label="Enabled">
          <Toggle
            checked={obj.fillEnabled}
            onChange={(v) => onChange({ fillEnabled: v })}
          />
        </Row>
        {obj.fillEnabled && (
          <Row label="Color">
            <ColorInput value={obj.fill} onChange={(v) => onChange({ fill: v })} />
          </Row>
        )}
      </Section>

      <StrokeControls
        enabled={obj.strokeEnabled}
        color={obj.stroke}
        width={obj.strokeWidth}
        onEnabledChange={(v) => onChange({ strokeEnabled: v })}
        onColorChange={(v) => onChange({ stroke: v })}
        onWidthChange={(v) => onChange({ strokeWidth: v })}
      />

      <ShadowControls
        enabled={obj.shadowEnabled}
        color={obj.shadowColor}
        blur={obj.shadowBlur}
        onEnabledChange={(v) => onChange({ shadowEnabled: v })}
        onColorChange={(v) => onChange({ shadowColor: v })}
        onBlurChange={(v) => onChange({ shadowBlur: v })}
      />
    </>
  );
}

// ============================================================================
// MAIN PROPERTIES PANEL
// ============================================================================

export function PropertiesPanel({
  selectedObject,
  documentSettings,
  onObjectChange,
  onSettingsChange,
  onMoveLayer,
  onDuplicate,
  onDelete,
  onSelect,
  objects,
}: PropertiesPanelProps) {
  // Sort objects by zIndex descending for layer list
  const sortedObjects = [...objects].sort((a, b) => b.zIndex - a.zIndex);

  return (
    <div className={s.propertiesPanel}>
      {/* Layer list */}
      <Section title="Layers">
        <div className={s.layerList}>
          {sortedObjects.map((obj) => (
            <div
              key={obj.id}
              className={`${s.layerItem} ${
                selectedObject?.id === obj.id ? s.layerItemActive : ""
              }`}
              onClick={() => onSelect(obj.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && onSelect(obj.id)}
            >
              <span className={s.layerIcon}>
                {obj.type === "text" && "T"}
                {obj.type === "arrow" && "→"}
                {obj.type === "image" && "🖼"}
                {obj.type === "shape" && "○"}
              </span>
              <span className={s.layerName}>
                {obj.type === "text"
                  ? (obj as TextObject).text.slice(0, 12) || "Text"
                  : obj.type.charAt(0).toUpperCase() + obj.type.slice(1)}
              </span>
            </div>
          ))}
          {objects.length === 0 && (
            <div className={s.layerEmpty}>No objects yet</div>
          )}
        </div>
      </Section>

      {/* Context-sensitive properties */}
      {selectedObject ? (
        <>
          {/* Layer actions */}
          <div className={s.layerActions}>
            <button
              className={s.layerActionBtn}
              onClick={() => onMoveLayer("up")}
              title="Bring Forward"
            >
              ↑
            </button>
            <button
              className={s.layerActionBtn}
              onClick={() => onMoveLayer("down")}
              title="Send Back"
            >
              ↓
            </button>
            <button
              className={s.layerActionBtn}
              onClick={onDuplicate}
              title="Duplicate"
            >
              ⧉
            </button>
            <button
              className={`${s.layerActionBtn} ${s.danger}`}
              onClick={onDelete}
              title="Delete"
            >
              🗑
            </button>
          </div>

          {/* Type-specific properties */}
          {selectedObject.type === "text" && (
            <TextPropertiesPanel
              obj={selectedObject as TextObject}
              onChange={onObjectChange}
            />
          )}
          {selectedObject.type === "arrow" && (
            <ArrowPropertiesPanel
              obj={selectedObject as ArrowObject}
              onChange={onObjectChange}
            />
          )}
          {selectedObject.type === "image" && (
            <ImagePropertiesPanel
              obj={selectedObject as ImageObject}
              onChange={onObjectChange}
            />
          )}
          {selectedObject.type === "shape" && (
            <ShapePropertiesPanel
              obj={selectedObject as ShapeObject}
              onChange={onObjectChange}
            />
          )}
        </>
      ) : (
        <DocumentSettingsPanel
          settings={documentSettings}
          onChange={onSettingsChange}
        />
      )}
    </div>
  );
}
