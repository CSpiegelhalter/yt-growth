"use client";

import React, { useRef, useEffect, useCallback, useState } from "react";
import { Stage, Layer, Rect, Line, Transformer, Image as KonvaImage } from "react-konva";
import type Konva from "konva";
import type { EditorObject, EditorDocument, ToolMode } from "./types";
import { TextLayer, ArrowLayer, ImageLayer, ShapeLayer, useHtmlImage } from "./layers";
import { CANVAS_WIDTH, CANVAS_HEIGHT, MIN_ZOOM, MAX_ZOOM } from "./constants";
import { sortByZIndex, snapToCenter } from "./utils";
import s from "./editor.module.css";

interface EditorCanvasProps {
  document: EditorDocument;
  selectedId: string | null;
  tool: ToolMode;
  zoom: number;
  panX: number;
  panY: number;
  showSafeArea: boolean;
  baseImageUrl: string;
  onSelect: (id: string | null) => void;
  onObjectChange: (id: string, patch: Partial<EditorObject>) => void;
  onZoomChange: (zoom: number) => void;
  onPanChange: (x: number, y: number) => void;
  isPanning: boolean;
  setIsPanning: (v: boolean) => void;
  containerRef: React.RefObject<HTMLDivElement>;
  stageRef: React.RefObject<Konva.Stage | null>;
}

export function EditorCanvas({
  document,
  selectedId,
  tool,
  zoom,
  panX,
  panY,
  showSafeArea,
  baseImageUrl,
  onSelect,
  onObjectChange,
  onZoomChange,
  onPanChange,
  isPanning,
  setIsPanning,
  containerRef,
  stageRef,
}: EditorCanvasProps) {
  const trRef = useRef<Konva.Transformer | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 450 });
  const lastPanPos = useRef({ x: 0, y: 0 });

  // Load base image
  const { img: baseImg, error: baseImgError } = useHtmlImage(baseImageUrl);

  // Calculate responsive display size
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        // Account for padding
        const availableWidth = rect.width - 32;
        const availableHeight = rect.height - 32;
        
        // Calculate size that fits while maintaining 16:9
        const aspectRatio = CANVAS_WIDTH / CANVAS_HEIGHT;
        let width = availableWidth;
        let height = width / aspectRatio;
        
        if (height > availableHeight) {
          height = availableHeight;
          width = height * aspectRatio;
        }
        
        setContainerSize({ width: Math.floor(width), height: Math.floor(height) });
      }
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, [containerRef]);

  // Attach transformer to selected object (except arrows - they use control points)
  useEffect(() => {
    const tr = trRef.current;
    const stage = stageRef.current;
    if (!tr || !stage) return;

    if (!selectedId) {
      tr.nodes([]);
      tr.getLayer()?.batchDraw();
      return;
    }

    // Don't attach transformer to arrows - they use control point handles instead
    const selectedObj = document.objects.find((o) => o.id === selectedId);
    if (!selectedObj || selectedObj.type === "arrow") {
      tr.nodes([]);
      tr.getLayer()?.batchDraw();
      return;
    }

    const node = stage.findOne(`#${selectedId}`);
    if (!node) {
      tr.nodes([]);
      tr.getLayer()?.batchDraw();
      return;
    }

    tr.nodes([node as any]);
    tr.getLayer()?.batchDraw();
  }, [selectedId, document.objects, stageRef]);

  // Calculate scale factor (how canvas coordinates map to screen pixels)
  const scaleFactor = containerSize.width / CANVAS_WIDTH;

  // Wheel zoom handler
  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();
      const stage = stageRef.current;
      if (!stage) return;

      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      // Calculate zoom
      const oldZoom = zoom;
      const direction = e.evt.deltaY > 0 ? -1 : 1;
      const factor = 1.08;
      const newZoom = Math.max(
        MIN_ZOOM,
        Math.min(MAX_ZOOM, direction > 0 ? oldZoom * factor : oldZoom / factor)
      );

      // Zoom around pointer
      const mousePointTo = {
        x: (pointer.x - panX) / oldZoom,
        y: (pointer.y - panY) / oldZoom,
      };

      const newPanX = pointer.x - mousePointTo.x * newZoom;
      const newPanY = pointer.y - mousePointTo.y * newZoom;

      onZoomChange(newZoom);
      onPanChange(newPanX, newPanY);
    },
    [zoom, panX, panY, onZoomChange, onPanChange, stageRef]
  );

  // Pan handlers
  const handleMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (tool === "pan" || isPanning) {
        const stage = stageRef.current;
        if (!stage) return;
        const pos = stage.getPointerPosition();
        if (pos) {
          lastPanPos.current = { x: pos.x - panX, y: pos.y - panY };
        }
        setIsPanning(true);
        return;
      }

      // Check if clicked on empty space
      const clickedOnEmpty = e.target === e.target.getStage();
      if (clickedOnEmpty) {
        onSelect(null);
      }
    },
    [tool, isPanning, panX, panY, onSelect, setIsPanning, stageRef]
  );

  const handleMouseMove = useCallback(
    (_e: Konva.KonvaEventObject<MouseEvent>) => {
      if (!isPanning) return;
      const stage = stageRef.current;
      if (!stage) return;
      const pos = stage.getPointerPosition();
      if (!pos) return;

      onPanChange(pos.x - lastPanPos.current.x, pos.y - lastPanPos.current.y);
    },
    [isPanning, onPanChange, stageRef]
  );

  const handleMouseUp = useCallback(() => {
    // Always release panning on mouse up (user must hold to pan)
    if (isPanning) {
      setIsPanning(false);
    }
  }, [isPanning, setIsPanning]);

  // Handle object change with snapping
  const handleObjectChange = useCallback(
    (id: string, patch: Partial<EditorObject>) => {
      // Apply center snapping for position changes (not for arrows which use points)
      if ("x" in patch || "y" in patch) {
        const obj = document.objects.find((o) => o.id === id);
        // Don't snap arrows - they use points for position
        if (obj && obj.type !== "arrow") {
          const newX = patch.x ?? obj.x;
          const newY = patch.y ?? obj.y;
          const snapped = snapToCenter(newX, newY);
          patch = { ...patch, x: snapped.x, y: snapped.y };
        }
      }
      onObjectChange(id, patch);
    },
    [document.objects, onObjectChange]
  );

  // Sort objects by zIndex
  const sortedObjects = sortByZIndex(document.objects);

  // Safe area dimensions
  const safeMargin = document.settings.safeAreaMargin / 100;
  const safeAreaX = CANVAS_WIDTH * safeMargin;
  const safeAreaY = CANVAS_HEIGHT * safeMargin;
  const safeAreaWidth = CANVAS_WIDTH * (1 - 2 * safeMargin);
  const safeAreaHeight = CANVAS_HEIGHT * (1 - 2 * safeMargin);

  return (
    <div className={s.canvasContainer} ref={containerRef}>
      {/* Loading state */}
      {!baseImg && !baseImgError && (
        <div className={s.canvasLoading}>
          <div className={s.canvasSpinner} />
          <span>Loading image...</span>
        </div>
      )}
      
      {/* Error state */}
      {baseImgError && (
        <div className={s.canvasError}>
          <span>Failed to load thumbnail</span>
          <small>{baseImageUrl.slice(0, 60)}...</small>
        </div>
      )}

      <div
        className={s.canvasWrapper}
        style={{
          width: containerSize.width,
          height: containerSize.height,
          cursor: isPanning || tool === "pan" ? "grab" : "default",
        }}
      >
        <Stage
          ref={stageRef as any}
          width={containerSize.width}
          height={containerSize.height}
          scaleX={scaleFactor * zoom}
          scaleY={scaleFactor * zoom}
          x={panX}
          y={panY}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleMouseDown as any}
          onTouchMove={handleMouseMove as any}
          onTouchEnd={handleMouseUp}
        >
          <Layer>
            {/* Background */}
            {!document.settings.backgroundTransparent && (
              <Rect
                x={0}
                y={0}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                fill={document.settings.backgroundColor}
                listening={false}
              />
            )}

            {/* Base image (generated thumbnail) - fit to cover without distortion */}
            {baseImg && (() => {
              // Calculate cover fit dimensions (fill canvas, may crop)
              const imgRatio = baseImg.width / baseImg.height;
              const canvasRatio = CANVAS_WIDTH / CANVAS_HEIGHT;
              let drawWidth, drawHeight, offsetX, offsetY;
              
              if (imgRatio > canvasRatio) {
                // Image is wider - fit height, crop sides
                drawHeight = CANVAS_HEIGHT;
                drawWidth = CANVAS_HEIGHT * imgRatio;
                offsetX = (CANVAS_WIDTH - drawWidth) / 2;
                offsetY = 0;
              } else {
                // Image is taller - fit width, crop top/bottom
                drawWidth = CANVAS_WIDTH;
                drawHeight = CANVAS_WIDTH / imgRatio;
                offsetX = 0;
                offsetY = (CANVAS_HEIGHT - drawHeight) / 2;
              }
              
              return (
                <KonvaImage
                  image={baseImg}
                  x={offsetX}
                  y={offsetY}
                  width={drawWidth}
                  height={drawHeight}
                  listening={false}
                />
              );
            })()}

            {/* Render all objects */}
            {sortedObjects.map((obj) => {
              const isSelected = obj.id === selectedId;

              switch (obj.type) {
                case "text":
                  return (
                    <TextLayer
                      key={obj.id}
                      obj={obj}
                      isSelected={isSelected}
                      onSelect={() => onSelect(obj.id)}
                      onChange={(patch) => handleObjectChange(obj.id, patch)}
                    />
                  );
                case "arrow":
                  return (
                    <ArrowLayer
                      key={obj.id}
                      obj={obj}
                      isSelected={isSelected}
                      onSelect={() => onSelect(obj.id)}
                      onChange={(patch) => handleObjectChange(obj.id, patch)}
                    />
                  );
                case "image":
                  return (
                    <ImageLayer
                      key={obj.id}
                      obj={obj}
                      isSelected={isSelected}
                      onSelect={() => onSelect(obj.id)}
                      onChange={(patch) => handleObjectChange(obj.id, patch)}
                    />
                  );
                case "shape":
                  return (
                    <ShapeLayer
                      key={obj.id}
                      obj={obj}
                      isSelected={isSelected}
                      onSelect={() => onSelect(obj.id)}
                      onChange={(patch) => handleObjectChange(obj.id, patch)}
                    />
                  );
                default:
                  return null;
              }
            })}

            {/* Safe area guides */}
            {(showSafeArea || document.settings.safeAreaEnabled) && (
              <Rect
                x={safeAreaX}
                y={safeAreaY}
                width={safeAreaWidth}
                height={safeAreaHeight}
                stroke="#00ff00"
                strokeWidth={2 / (scaleFactor * zoom)}
                dash={[10 / (scaleFactor * zoom), 5 / (scaleFactor * zoom)]}
                listening={false}
              />
            )}

            {/* Center guides */}
            {selectedId && (
              <>
                <Line
                  points={[CANVAS_WIDTH / 2, 0, CANVAS_WIDTH / 2, CANVAS_HEIGHT]}
                  stroke="rgba(59, 130, 246, 0.3)"
                  strokeWidth={1 / (scaleFactor * zoom)}
                  dash={[5 / (scaleFactor * zoom), 5 / (scaleFactor * zoom)]}
                  listening={false}
                />
                <Line
                  points={[0, CANVAS_HEIGHT / 2, CANVAS_WIDTH, CANVAS_HEIGHT / 2]}
                  stroke="rgba(59, 130, 246, 0.3)"
                  strokeWidth={1 / (scaleFactor * zoom)}
                  dash={[5 / (scaleFactor * zoom), 5 / (scaleFactor * zoom)]}
                  listening={false}
                />
              </>
            )}

            {/* Transformer for selected object */}
            <Transformer
              ref={trRef as any}
              rotateEnabled
              keepRatio={false}
              enabledAnchors={[
                "top-left",
                "top-right",
                "bottom-left",
                "bottom-right",
                "middle-left",
                "middle-right",
                "top-center",
                "bottom-center",
              ]}
              boundBoxFunc={(oldBox, newBox) => {
                // Limit minimum size
                if (newBox.width < 10 || newBox.height < 10) {
                  return oldBox;
                }
                return newBox;
              }}
            />
          </Layer>
        </Stage>
      </div>

      {/* Canvas info */}
      <div className={s.canvasInfo}>
        <span>{CANVAS_WIDTH} × {CANVAS_HEIGHT}</span>
        <span>·</span>
        <span>{Math.round(zoom * 100)}%</span>
      </div>
    </div>
  );
}

// ============================================================================
// EXPORT FUNCTION
// ============================================================================

export async function exportCanvas(
  stageRef: React.RefObject<Konva.Stage | null>,
  format: "png" | "jpg"
): Promise<string> {
  const stage = stageRef.current;
  if (!stage) throw new Error("Stage not available");

  // Store current state
  const oldScaleX = stage.scaleX();
  const oldScaleY = stage.scaleY();
  const oldX = stage.x();
  const oldY = stage.y();
  const oldWidth = stage.width();
  const oldHeight = stage.height();

  // Set stage to exactly 1280x720 with 1:1 scale for export
  stage.width(CANVAS_WIDTH);
  stage.height(CANVAS_HEIGHT);
  stage.scaleX(1);
  stage.scaleY(1);
  stage.x(0);
  stage.y(0);

  // Force redraw
  stage.batchDraw();

  // Export at pixelRatio 1 - stage is now exactly 1280x720
  const mimeType = format === "png" ? "image/png" : "image/jpeg";
  const dataUrl = stage.toDataURL({
    pixelRatio: 1,
    mimeType,
    quality: format === "jpg" ? 0.92 : undefined,
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
  });

  // Restore original state
  stage.width(oldWidth);
  stage.height(oldHeight);
  stage.scaleX(oldScaleX);
  stage.scaleY(oldScaleY);
  stage.x(oldX);
  stage.y(oldY);
  stage.batchDraw();

  return dataUrl;
}
