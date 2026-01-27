"use client";

import React, { useRef } from "react";
import type { ToolMode } from "./types";
import s from "./editor.module.css";

interface ToolbarProps {
  activeTool: ToolMode;
  onToolChange: (tool: ToolMode) => void;
  onAddText: () => void;
  onAddArrow: (curved: boolean) => void;
  onAddLine: () => void;
  onAddShape: (type: "ellipse" | "rectangle") => void;
  onImageUpload: (files: FileList | null) => void;
  onDelete: () => void;
  hasSelection: boolean;
  isPanning: boolean;
}

interface ToolButtonProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  shortcut?: string;
}

function ToolButton({ icon, label, active, disabled, onClick, shortcut }: ToolButtonProps) {
  return (
    <button
      className={`${s.toolButton} ${active ? s.toolButtonActive : ""}`}
      onClick={onClick}
      disabled={disabled}
      title={shortcut ? `${label} (${shortcut})` : label}
      aria-label={label}
    >
      {icon}
      <span className={s.toolLabel}>{label}</span>
    </button>
  );
}

export function Toolbar({
  activeTool,
  onToolChange,
  onAddText,
  onAddArrow,
  onAddLine,
  onAddShape,
  onImageUpload,
  onDelete,
  hasSelection,
  isPanning,
}: ToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={s.toolbar}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={(e) => {
          onImageUpload(e.target.files);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }}
        style={{ display: "none" }}
      />

      {/* Selection Tool */}
      <ToolButton
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
            <path d="M13 13l6 6" />
          </svg>
        }
        label="Select"
        active={activeTool === "select" && !isPanning}
        onClick={() => onToolChange("select")}
        shortcut="V"
      />

      {/* Pan Tool */}
      <ToolButton
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
            <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2" />
            <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" />
            <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
          </svg>
        }
        label="Pan"
        active={activeTool === "pan" || isPanning}
        onClick={() => onToolChange("pan")}
        shortcut="H / Space"
      />

      <div className={s.toolDivider} />

      {/* Text Tool */}
      <ToolButton
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="4 7 4 4 20 4 20 7" />
            <line x1="9" y1="20" x2="15" y2="20" />
            <line x1="12" y1="4" x2="12" y2="20" />
          </svg>
        }
        label="Text"
        onClick={onAddText}
        shortcut="T"
      />

      {/* Arrow Tool */}
      <ToolButton
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        }
        label="Arrow"
        onClick={() => onAddArrow(false)}
        shortcut="A"
      />

      {/* Curved Arrow */}
      <ToolButton
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 16c0-6 6-10 14-10" />
            <polyline points="14 2 19 6 14 10" />
          </svg>
        }
        label="Curved"
        onClick={() => onAddArrow(true)}
      />

      {/* Line (no arrowhead) */}
      <ToolButton
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="5" y1="19" x2="19" y2="5" />
          </svg>
        }
        label="Line"
        onClick={onAddLine}
        shortcut="L"
      />

      <div className={s.toolDivider} />

      {/* Shape - Ellipse */}
      <ToolButton
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <ellipse cx="12" cy="12" rx="10" ry="6" />
          </svg>
        }
        label="Ellipse"
        onClick={() => onAddShape("ellipse")}
        shortcut="O"
      />

      {/* Shape - Rectangle */}
      <ToolButton
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
          </svg>
        }
        label="Rectangle"
        onClick={() => onAddShape("rectangle")}
        shortcut="R"
      />

      <div className={s.toolDivider} />

      {/* Image Upload */}
      <ToolButton
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        }
        label="Image"
        onClick={handleImageClick}
        shortcut="I"
      />

      <div className={s.toolDivider} />

      {/* Delete */}
      <ToolButton
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            <line x1="10" y1="11" x2="10" y2="17" />
            <line x1="14" y1="11" x2="14" y2="17" />
          </svg>
        }
        label="Delete"
        onClick={onDelete}
        disabled={!hasSelection}
        shortcut="Del"
      />
    </div>
  );
}
