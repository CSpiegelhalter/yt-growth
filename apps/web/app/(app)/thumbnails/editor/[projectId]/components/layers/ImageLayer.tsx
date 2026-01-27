"use client";

import { useEffect, useState } from "react";
import { Image as KonvaImage } from "react-konva";
import type { ImageObject } from "../types";

interface ImageLayerProps {
  obj: ImageObject;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (patch: Partial<ImageObject>) => void;
}

function useHtmlImage(src: string) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    if (!src) {
      setError("No image URL provided");
      return;
    }
    setImg(null);
    setError(null);
    setNaturalSize(null);

    const i = new window.Image();
    i.crossOrigin = "anonymous";
    i.onload = () => {
      setImg(i);
      setNaturalSize({ width: i.naturalWidth, height: i.naturalHeight });
      setError(null);
    };
    i.onerror = () => {
      // Retry without crossOrigin for external URLs that don't support CORS
      const retry = new window.Image();
      retry.onload = () => {
        setImg(retry);
        setNaturalSize({ width: retry.naturalWidth, height: retry.naturalHeight });
        setError(null);
      };
      retry.onerror = () => {
        setError(`Failed to load image`);
      };
      retry.src = src;
    };
    i.src = src;
  }, [src]);

  return { img, error, naturalSize };
}

export function ImageLayer({ obj, isSelected: _isSelected, onSelect, onChange }: ImageLayerProps) {
  const { img } = useHtmlImage(obj.srcUrl);

  return (
    <KonvaImage
      id={obj.id}
      image={img ?? undefined}
      x={obj.x}
      y={obj.y}
      width={obj.width}
      height={obj.height}
      rotation={obj.rotation}
      opacity={obj.opacity}
      // Crop settings if specified
      crop={
        obj.cropWidth > 0 && obj.cropHeight > 0
          ? {
              x: obj.cropX,
              y: obj.cropY,
              width: obj.cropWidth,
              height: obj.cropHeight,
            }
          : undefined
      }
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
        const node = e.target as any;
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        // Reset scale and bake into width/height
        node.scaleX(1);
        node.scaleY(1);
        
        // Use uniform scale to preserve aspect ratio (use the larger scale)
        const uniformScale = Math.max(scaleX, scaleY);
        const aspectRatio = obj.originalWidth / obj.originalHeight;
        const newWidth = Math.max(10, obj.width * uniformScale);
        const newHeight = newWidth / aspectRatio;
        
        onChange({
          x: node.x(),
          y: node.y(),
          rotation: node.rotation(),
          width: newWidth,
          height: newHeight,
        });
      }}
    />
  );
}

// Export the hook for use elsewhere (e.g., to get natural dimensions on upload)
export { useHtmlImage };
