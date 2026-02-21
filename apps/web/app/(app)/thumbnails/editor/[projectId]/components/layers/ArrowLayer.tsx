"use client";

import { useCallback, useMemo, useRef } from "react";
import { Group, Line, Circle, Shape } from "react-konva";
import type Konva from "konva";
import type { ArrowObject } from "../types";
import { MIN_HIT_STROKE_WIDTH } from "../constants";

interface ArrowLayerProps {
  obj: ArrowObject;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (patch: Partial<ArrowObject>) => void;
}

/**
 * Draw a custom arrow shape with various styles
 * Supports: classic, thick, tapered (fat base), outlined, glow
 */
export function ArrowLayer({ obj, isSelected, onSelect, onChange }: ArrowLayerProps) {
  const points = obj.points;
  const hitStrokeWidth = Math.max(MIN_HIT_STROKE_WIDTH, obj.thickness * 3);
  
  // Track drag start - store initial pointer position and points
  const dragStartRef = useRef<{ startX: number; startY: number; points: number[] } | null>(null);

  // Calculate arrowhead geometry
  const arrowhead = useMemo(() => {
    if (points.length < 4) {return null;}
    
    const endX = points[points.length - 2];
    const endY = points[points.length - 1];
    const prevX = points[points.length - 4];
    const prevY = points[points.length - 3];
    
    const dx = endX - prevX;
    const dy = endY - prevY;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const dirX = dx / len;
    const dirY = dy / len;
    
    // Arrowhead size
    const headLength = obj.thickness * obj.arrowheadSize * 1.5;
    const headWidth = obj.thickness * obj.arrowheadSize;
    
    // Perpendicular direction
    const perpX = -dirY;
    const perpY = dirX;
    
    // Tip is at the end point
    const tipX = endX;
    const tipY = endY;
    
    // Base of arrowhead (where line should stop)
    const baseX = endX - dirX * headLength;
    const baseY = endY - dirY * headLength;
    
    // Left and right corners of arrowhead
    const leftX = baseX + perpX * headWidth;
    const leftY = baseY + perpY * headWidth;
    const rightX = baseX - perpX * headWidth;
    const rightY = baseY - perpY * headWidth;
    
    return {
      tipX, tipY,
      baseX, baseY,
      leftX, leftY,
      rightX, rightY,
      headLength,
    };
  }, [points, obj.thickness, obj.arrowheadSize]);

  // Create line points that stop at the arrowhead base
  const linePoints = useMemo(() => {
    if (!obj.arrowheadAtEnd || !arrowhead || points.length < 4) {
      return points;
    }
    
    // Replace the last point with the arrowhead base
    const adjusted = [...points];
    adjusted[adjusted.length - 2] = arrowhead.baseX;
    adjusted[adjusted.length - 1] = arrowhead.baseY;
    return adjusted;
  }, [points, arrowhead, obj.arrowheadAtEnd]);

  // Handle point dragging (for control points)
  const handlePointDrag = useCallback(
    (index: number, nx: number, ny: number) => {
      const newPoints = [...points];
      newPoints[index * 2] = nx;
      newPoints[index * 2 + 1] = ny;
      onChange({ points: newPoints });
    },
    [points, onChange]
  );

  // Store initial pointer position and points when drag starts
  const handleDragStart = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    const stage = e.target.getStage();
    if (!stage) {return;}
    
    // Get pointer position in canvas coordinates (accounting for stage transform)
    const transform = stage.getAbsoluteTransform().copy().invert();
    const pos = stage.getPointerPosition();
    if (!pos) {return;}
    
    const canvasPos = transform.point(pos);
    dragStartRef.current = { 
      startX: canvasPos.x, 
      startY: canvasPos.y, 
      points: [...points] 
    };
  }, [points]);

  // Update points on drag end using pointer delta
  const handleDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      const group = e.target;
      const stage = group.getStage();
      
      // Always reset group position
      group.x(0);
      group.y(0);
      
      if (!stage || !dragStartRef.current) {
        dragStartRef.current = null;
        return;
      }
      
      // Get current pointer position in canvas coordinates
      const transform = stage.getAbsoluteTransform().copy().invert();
      const pos = stage.getPointerPosition();
      if (!pos) {
        dragStartRef.current = null;
        return;
      }
      
      const canvasPos = transform.point(pos);
      const dx = canvasPos.x - dragStartRef.current.startX;
      const dy = canvasPos.y - dragStartRef.current.startY;
      
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) {
        dragStartRef.current = null;
        return;
      }
      
      // Apply delta to the stored initial points
      const newPoints = dragStartRef.current.points.map((v, i) => 
        i % 2 === 0 ? v + dx : v + dy
      );
      dragStartRef.current = null;
      
      onChange({ points: newPoints });
    },
    [onChange]
  );

  const dash = obj.dashed ? [obj.dashLength, obj.dashGap] : undefined;
  const isTapered = obj.style === "tapered";
  
  // Higher tension for smoother curves
  const curveTension = obj.isCurved ? 0.5 : 0;

  return (
    <Group
      id={obj.id}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={onSelect}
      onTap={onSelect}
    >
      {/* Outline layer (behind everything) */}
      {obj.outlineEnabled && (
        <>
          <Line
            points={linePoints}
            stroke={obj.outlineColor}
            strokeWidth={obj.thickness + obj.outlineWidth * 2}
            lineCap="round"
            lineJoin="round"
            tension={curveTension}
            listening={false}
          />
          {obj.arrowheadAtEnd && arrowhead && (
            <Line
              points={[
                arrowhead.leftX, arrowhead.leftY,
                arrowhead.tipX, arrowhead.tipY,
                arrowhead.rightX, arrowhead.rightY,
              ]}
              closed
              fill={obj.outlineColor}
              stroke={obj.outlineColor}
              strokeWidth={obj.outlineWidth}
              listening={false}
            />
          )}
        </>
      )}

      {/* Main arrow - use custom shape for tapered, simple line for others */}
      {isTapered ? (
        <Shape
          sceneFunc={(ctx, shape) => {
            if (points.length < 4) {return;}

            ctx.beginPath();

            const baseThickness = obj.thickness;
            const tipThickness = obj.thickness * 0.3;

            // Use linePoints (stops at arrowhead base)
            const pts = linePoints;

            for (let i = 0; i < pts.length - 2; i += 2) {
              const x1 = pts[i];
              const y1 = pts[i + 1];
              const x2 = pts[i + 2];
              const y2 = pts[i + 3];

              const segDx = x2 - x1;
              const segDy = y2 - y1;
              const segLen = Math.sqrt(segDx * segDx + segDy * segDy) || 1;
              const perpSegX = -segDy / segLen;
              const perpSegY = segDx / segLen;

              const t1 = i / (pts.length - 2);
              const t2 = (i + 2) / (pts.length - 2);
              const w1 = baseThickness * (1 - t1) + tipThickness * t1;
              const w2 = baseThickness * (1 - t2) + tipThickness * t2;

              if (i === 0) {
                ctx.moveTo(x1 + perpSegX * w1 / 2, y1 + perpSegY * w1 / 2);
              }
              ctx.lineTo(x2 + perpSegX * w2 / 2, y2 + perpSegY * w2 / 2);
            }

            for (let i = pts.length - 2; i >= 2; i -= 2) {
              const x1 = pts[i - 2];
              const y1 = pts[i - 1];
              const x2 = pts[i];
              const y2 = pts[i + 1];

              const segDx = x2 - x1;
              const segDy = y2 - y1;
              const segLen = Math.sqrt(segDx * segDx + segDy * segDy) || 1;
              const perpSegX = -segDy / segLen;
              const perpSegY = segDx / segLen;

              const t1 = (i - 2) / (pts.length - 2);
              const w1 = baseThickness * (1 - t1) + tipThickness * t1;

              ctx.lineTo(x1 - perpSegX * w1 / 2, y1 - perpSegY * w1 / 2);
            }

            ctx.closePath();
            ctx.fillStrokeShape(shape);
          }}
          fill={obj.color}
          opacity={obj.opacity}
          shadowColor={obj.shadowEnabled ? obj.shadowColor : undefined}
          shadowBlur={obj.shadowEnabled ? obj.shadowBlur : undefined}
          shadowEnabled={obj.shadowEnabled}
          hitStrokeWidth={hitStrokeWidth}
        />
      ) : (
        <Line
          points={linePoints}
          stroke={obj.color}
          strokeWidth={obj.thickness}
          lineCap="round"
          lineJoin="round"
          tension={curveTension}
          dash={dash}
          opacity={obj.opacity}
          shadowColor={obj.shadowEnabled ? obj.shadowColor : undefined}
          shadowBlur={obj.shadowEnabled ? obj.shadowBlur : undefined}
          shadowEnabled={obj.shadowEnabled}
          hitStrokeWidth={hitStrokeWidth}
        />
      )}

      {/* Arrowhead */}
      {obj.arrowheadAtEnd && arrowhead && (
        <Line
          points={[
            arrowhead.leftX, arrowhead.leftY,
            arrowhead.tipX, arrowhead.tipY,
            arrowhead.rightX, arrowhead.rightY,
          ]}
          closed
          fill={obj.color}
          opacity={obj.opacity}
          shadowColor={obj.shadowEnabled ? obj.shadowColor : undefined}
          shadowBlur={obj.shadowEnabled ? obj.shadowBlur : undefined}
          shadowEnabled={obj.shadowEnabled}
          listening={false}
        />
      )}

      {/* Control points when selected */}
      {isSelected &&
        points.map((_, i) =>
          i % 2 === 0 ? (
            <Circle
              key={`pt-${i}`}
              x={points[i]}
              y={points[i + 1]}
              radius={i === 0 || i === points.length - 2 ? 12 : 9}
              fill={i === 0 || i === points.length - 2 ? "#fff" : "#93c5fd"}
              stroke="#3b82f6"
              strokeWidth={2}
              draggable
              onDragMove={(e) => {
                e.cancelBubble = true; // Prevent group drag
                handlePointDrag(i / 2, e.target.x(), e.target.y());
              }}
              onDragEnd={(e) => {
                e.cancelBubble = true;
              }}
            />
          ) : null
        )}
    </Group>
  );
}
