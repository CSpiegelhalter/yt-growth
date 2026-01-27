"use client";

import { Text, Rect, Group } from "react-konva";
import type { TextObject } from "../types";

interface TextLayerProps {
  obj: TextObject;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (patch: Partial<TextObject>) => void;
}

export function TextLayer({ obj, isSelected: _isSelected, onSelect, onChange }: TextLayerProps) {
  return (
    <Group
      id={obj.id}
      x={obj.x}
      y={obj.y}
      rotation={obj.rotation}
      opacity={obj.opacity}
      draggable
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={(e) => {
        onChange({
          x: e.target.x(),
          y: e.target.y(),
        });
      }}
      onTransformEnd={(e) => {
        const node = e.target;
        // Reset scale and apply to position
        node.scaleX(1);
        node.scaleY(1);
        onChange({
          x: node.x(),
          y: node.y(),
          rotation: node.rotation(),
        });
      }}
    >
      {/* Background pill (rendered behind text) */}
      {obj.backgroundEnabled && (
        <Rect
          x={-obj.backgroundPadding}
          y={-obj.backgroundPadding}
          // Width/height will be set dynamically based on text bounds
          // For now use approximate sizing
          width={obj.text.length * obj.fontSize * 0.6 + obj.backgroundPadding * 2}
          height={obj.fontSize * obj.lineHeight + obj.backgroundPadding * 2}
          fill={obj.backgroundColor}
          cornerRadius={obj.backgroundRadius}
          listening={false}
        />
      )}
      
      {/* Main text */}
      <Text
        text={obj.text}
        fontFamily={obj.fontFamily}
        fontSize={obj.fontSize}
        fontStyle={obj.fontWeight === "bold" || Number(obj.fontWeight) >= 700 ? "bold" : "normal"}
        fill={obj.fill}
        stroke={obj.strokeWidth > 0 ? obj.stroke : undefined}
        strokeWidth={obj.strokeWidth}
        letterSpacing={obj.letterSpacing}
        lineHeight={obj.lineHeight}
        align={obj.textAlign}
        shadowColor={obj.shadowEnabled ? obj.shadowColor : undefined}
        shadowBlur={obj.shadowEnabled ? obj.shadowBlur : undefined}
        shadowOffsetX={obj.shadowEnabled ? obj.shadowOffsetX : undefined}
        shadowOffsetY={obj.shadowEnabled ? obj.shadowOffsetY : undefined}
        // Improve text rendering
        fillAfterStrokeEnabled
      />
    </Group>
  );
}
