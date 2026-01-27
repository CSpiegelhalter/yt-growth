"use client";

import Link from "next/link";
import { MIN_ZOOM, MAX_ZOOM } from "./constants";
import s from "./editor.module.css";

interface TopBarProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onFitToScreen: () => void;
  onExport: (format: "png" | "jpg") => void;
  showSafeArea: boolean;
  onToggleSafeArea: () => void;
  isExporting?: boolean;
}

export function TopBar({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  zoom,
  onZoomChange,
  onFitToScreen,
  onExport,
  showSafeArea,
  onToggleSafeArea,
  isExporting,
}: TopBarProps) {
  const zoomPercent = Math.round(zoom * 100);

  return (
    <div className={s.topBar}>
      <div className={s.topBarLeft}>
        <Link href="/thumbnails" className={s.backButton}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back
        </Link>
        <div className={s.topBarDivider} />
        <h1 className={s.title}>Thumbnail Editor</h1>
      </div>

      <div className={s.topBarCenter}>
        {/* Undo/Redo */}
        <div className={s.buttonGroup}>
          <button
            className={s.iconButton}
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Cmd+Z)"
            aria-label="Undo"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 10h10a5 5 0 0 1 5 5v2" />
              <polyline points="3 10 8 5" />
              <polyline points="3 10 8 15" />
            </svg>
          </button>
          <button
            className={s.iconButton}
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Cmd+Shift+Z)"
            aria-label="Redo"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10H11a5 5 0 0 0-5 5v2" />
              <polyline points="21 10 16 5" />
              <polyline points="21 10 16 15" />
            </svg>
          </button>
        </div>

        {/* Zoom Controls */}
        <div className={s.buttonGroup}>
          <button
            className={s.textButton}
            onClick={onFitToScreen}
            title="Fit to screen"
          >
            Fit
          </button>
          <button
            className={s.textButton}
            onClick={() => onZoomChange(1)}
            title="Reset to 100%"
          >
            100%
          </button>
          <div className={s.zoomSliderWrapper}>
            <input
              type="range"
              min={MIN_ZOOM * 100}
              max={MAX_ZOOM * 100}
              value={zoomPercent}
              onChange={(e) => onZoomChange(Number(e.target.value) / 100)}
              className={s.zoomSlider}
              title={`Zoom: ${zoomPercent}%`}
            />
            <span className={s.zoomLabel}>{zoomPercent}%</span>
          </div>
        </div>

        {/* Safe Area Toggle */}
        <button
          className={`${s.textButton} ${showSafeArea ? s.active : ""}`}
          onClick={onToggleSafeArea}
          title="Toggle safe area guides"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16, marginRight: 4 }}>
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <rect x="6" y="6" width="12" height="12" rx="1" strokeDasharray="2 2" />
          </svg>
          Safe Area
        </button>
      </div>

      <div className={s.topBarRight}>
        {/* Export Buttons */}
        <button
          className={s.exportButton}
          onClick={() => onExport("png")}
          disabled={isExporting}
        >
          {isExporting ? (
            <span className={s.spinner} />
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          )}
          Export PNG
        </button>
        <button
          className={s.exportButtonSecondary}
          onClick={() => onExport("jpg")}
          disabled={isExporting}
          title="Export as JPEG"
        >
          JPG
        </button>
      </div>
    </div>
  );
}
