"use client";

import { Rect, Ellipse, RegularPolygon } from "react-konva";
import type Konva from "konva";
import type { ShapeObject } from "../types";

interface ShapeLayerProps {
  obj: ShapeObject;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (patch: Partial<ShapeObject>) => void;
}

export function ShapeLayer({ obj, isSelected: _isSelected, onSelect, onChange }: ShapeLayerProps) {
  const commonProps = {
    id: obj.id,
    x: obj.x,
    y: obj.y,
    rotation: obj.rotation,
    opacity: obj.opacity,
    fill: obj.fillEnabled ? obj.fill : undefined,
    stroke: obj.strokeEnabled ? obj.stroke : undefined,
    strokeWidth: obj.strokeEnabled ? obj.strokeWidth : 0,
    shadowColor: obj.shadowEnabled ? obj.shadowColor : undefined,
    shadowBlur: obj.shadowEnabled ? obj.shadowBlur : undefined,
    shadowOffsetX: obj.shadowEnabled ? obj.shadowOffsetX : undefined,
    shadowOffsetY: obj.shadowEnabled ? obj.shadowOffsetY : undefined,
    shadowEnabled: obj.shadowEnabled,
    draggable: true,
    onClick: onSelect,
    onTap: onSelect,
    onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => {
      onChange({
        x: e.target.x(),
        y: e.target.y(),
      });
    },
  };

  const handleTransformEnd = (e: Konva.KonvaEventObject<Event>) => {
    const node = e.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    node.scaleX(1);
    node.scaleY(1);

    if (obj.shapeType === "ellipse") {
      onChange({
        x: node.x(),
        y: node.y(),
        rotation: node.rotation(),
        width: Math.max(10, (obj.width / 2) * scaleX * 2),
        height: Math.max(10, (obj.height / 2) * scaleY * 2),
      });
    } else {
      onChange({
        x: node.x(),
        y: node.y(),
        rotation: node.rotation(),
        width: Math.max(10, node.width() * scaleX),
        height: Math.max(10, node.height() * scaleY),
      });
    }
  };

  switch (obj.shapeType) {
    case "ellipse":
      return (
        <Ellipse
          {...commonProps}
          radiusX={obj.width / 2}
          radiusY={obj.height / 2}
          onTransformEnd={handleTransformEnd}
        />
      );

    case "rectangle":
      return (
        <Rect
          {...commonProps}
          width={obj.width}
          height={obj.height}
          cornerRadius={obj.cornerRadius}
          // Offset so center is at x,y (like ellipse)
          offsetX={obj.width / 2}
          offsetY={obj.height / 2}
          onTransformEnd={handleTransformEnd}
        />
      );

    case "triangle":
      return (
        <RegularPolygon
          {...commonProps}
          sides={3}
          radius={Math.max(obj.width, obj.height) / 2}
          onTransformEnd={handleTransformEnd}
        />
      );

    default:
      return null;
  }
}
