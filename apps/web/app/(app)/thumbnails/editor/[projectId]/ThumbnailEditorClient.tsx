/**
 * YouTube Thumbnail Editor
 * 
 * A Photoshop-inspired canvas editor for creating YouTube thumbnails.
 * 
 * Architecture:
 * - Built with Konva.js (react-konva) for canvas rendering
 * - Fixed 16:9 aspect ratio (1280x720 export size)
 * - Modular component structure:
 *   - TopBar: undo/redo, zoom controls, export
 *   - Toolbar: tool selection (select, pan, text, arrow, shapes, image)
 *   - EditorCanvas: main canvas with pan/zoom
 *   - PropertiesPanel: context-sensitive property editing
 *   - layers/*: individual layer type renderers
 * 
 * Key features:
 * - Smooth pan (spacebar) and zoom (mouse wheel)
 * - Text with font, stroke, shadow, background pill options
 * - Arrows with style presets, outline, shadow/glow
 * - Images with cover/contain fit options
 * - Shapes (ellipse, rectangle, triangle)
 * - Undo/redo with command stack
 * - Export to PNG/JPG at exact 1280x720
 * 
 * State management:
 * - EditorDocument: persisted document state (settings + objects)
 * - EditorUIState: transient UI state (selection, zoom, pan, tool)
 * - History: undo/redo stack with max 50 entries
 */

"use client";

import type Konva from "konva";
import { useCallback, useEffect, useRef, useState } from "react";

import { useToast } from "@/components/ui/Toast";

import {
  ALLOWED_IMAGE_TYPES,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  centerInCanvas,
  convertToV1,
  DEFAULT_ARROW,
  DEFAULT_IMAGE,
  DEFAULT_SHAPE,
  DEFAULT_TEXT,
  EditorCanvas,
  exportCanvas,
  fitImageContain,
  generateId,
  getNextZIndex,
  GOOGLE_FONTS,
  MAX_IMAGE_SIZE_MB,
  MAX_ZOOM,
  migrateFromV1,
  MIN_ZOOM,
  PropertiesPanel,
  Toolbar,
  TopBar,
  useEditorHistory,
} from "./components";
import s from "./components/editor.module.css";
import type {
  ArrowObject,
  DocumentSettings,
  EditorDocument,
  EditorObject,
  ImageObject,
  ShapeObject,
  TextObject,
  ToolMode,
} from "./components/types";

function getNudgeDelta(key: string, shift: boolean): { dx: number; dy: number } | null {
  const step = shift ? 10 : 1;
  switch (key) {
    case "ArrowLeft": { return { dx: -step, dy: 0 }; }
    case "ArrowRight": { return { dx: step, dy: 0 }; }
    case "ArrowUp": { return { dx: 0, dy: -step }; }
    case "ArrowDown": { return { dx: 0, dy: step }; }
    default: { return null; }
  }
}

function isDeleteKey(key: string): boolean {
  return key === "Delete" || key === "Backspace";
}

function handleUndoRedoKey(e: KeyboardEvent, undo: () => void, redo: () => void): boolean {
  const mod = e.metaKey || e.ctrlKey;
  if (mod && e.key.toLowerCase() === "z") {
    e.preventDefault();
    (e.shiftKey ? redo : undo)();
    return true;
  }
  return false;
}

type ExportEntry = { url: string; [key: string]: unknown };

type Props = {
  projectId: string;
  baseImageUrl: string;
  initialEditorState: unknown;
  initialExports: unknown;
};

export default function ThumbnailEditorClient(props: Props) {
  const { toast } = useToast();
  
  // Refs
  const stageRef = useRef<Konva.Stage | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Document state with history
  const initialDoc = migrateFromV1(props.initialEditorState);
  const { document, setDocument, undo, redo, canUndo, canRedo } = useEditorHistory(initialDoc);

  // UI state
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tool, setTool] = useState<ToolMode>("select");
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isPanning, setIsPanning] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [showSafeArea, setShowSafeArea] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [_exportsList, setExportsList] = useState<ExportEntry[]>(
    Array.isArray(props.initialExports) ? props.initialExports : []
  );

  // Get selected object
  const selectedObject = document.objects.find((o) => o.id === selectedId) ?? null;

  // ============================================================================
  // LOAD GOOGLE FONTS
  // ============================================================================
  
  useEffect(() => {
    // Build Google Fonts URL with all fonts
    const fontFamilies = GOOGLE_FONTS.map((f) => `${f.replaceAll(' ', "+")  }:wght@400;500;600;700;800;900`).join("&family=");
    const link = window.document.createElement("link");
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${fontFamilies}&display=swap`;
    window.document.head.append(link);
    
    return () => {
      link.remove();
    };
  }, []);

  // ============================================================================
  // AUTO-SAVE
  // ============================================================================
  
  const saveTimer = useRef<number | null>(null);
  useEffect(() => {
    if (saveTimer.current) {window.clearTimeout(saveTimer.current);}
    saveTimer.current = window.setTimeout(() => {
      void fetch(`/api/thumbnails/projects/${props.projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ editorState: convertToV1(document) }),
      }).catch(() => {/* silently fail - user can manually save */});
    }, 1500);
    return () => {
      if (saveTimer.current) {window.clearTimeout(saveTimer.current);}
    };
  }, [document, props.projectId]);

  // ============================================================================
  // DOCUMENT OPERATIONS
  // ============================================================================

  const updateDocument = useCallback(
    (updater: (doc: EditorDocument) => EditorDocument, description?: string) => {
      setDocument(updater(document), description);
    },
    [document, setDocument]
  );

  const updateObject = useCallback(
    (id: string, patch: Partial<EditorObject>) => {
      updateDocument(
        (doc) => ({
          ...doc,
          objects: doc.objects.map((o) =>
            o.id === id ? ({ ...o, ...patch } as EditorObject) : o
          ),
        }),
        `Update ${patch}`
      );
    },
    [updateDocument]
  );

  const updateSettings = useCallback(
    (patch: Partial<DocumentSettings>) => {
      updateDocument((doc) => ({
        ...doc,
        settings: { ...doc.settings, ...patch },
      }));
    },
    [updateDocument]
  );

  const addObject = useCallback(
    (obj: EditorObject) => {
      updateDocument((doc) => ({
        ...doc,
        objects: [...doc.objects, obj],
      }));
      setSelectedId(obj.id);
      setTool("select");
    },
    [updateDocument]
  );

  const deleteSelected = useCallback(() => {
    if (!selectedId) {return;}
    updateDocument((doc) => ({
      ...doc,
      objects: doc.objects.filter((o) => o.id !== selectedId),
    }));
    setSelectedId(null);
  }, [selectedId, updateDocument]);

  const duplicateSelected = useCallback(() => {
    if (!selectedObject) {return;}
    const newId = generateId();
    const newObj = {
      ...selectedObject,
      id: newId,
      x: selectedObject.x + 20,
      y: selectedObject.y + 20,
      zIndex: getNextZIndex(document.objects),
    } as EditorObject;
    addObject(newObj);
  }, [selectedObject, document.objects, addObject]);

  const moveLayer = useCallback(
    (direction: "up" | "down") => {
      if (!selectedId) {return;}
      
      const sorted = [...document.objects].sort((a, b) => a.zIndex - b.zIndex);
      const idx = sorted.findIndex((o) => o.id === selectedId);
      const swapIdx = direction === "up" ? idx + 1 : idx - 1;
      
      if (swapIdx < 0 || swapIdx >= sorted.length) {return;}
      
      const current = sorted[idx];
      const swap = sorted[swapIdx];
      
      updateDocument((doc) => ({
        ...doc,
        objects: doc.objects.map((o) => {
          if (o.id === current.id) {return { ...o, zIndex: swap.zIndex } as EditorObject;}
          if (o.id === swap.id) {return { ...o, zIndex: current.zIndex } as EditorObject;}
          return o;
        }),
      }));
    },
    [selectedId, document.objects, updateDocument]
  );

  // ============================================================================
  // ADD OBJECTS
  // ============================================================================

  const addText = useCallback(() => {
    const obj: TextObject = {
      ...DEFAULT_TEXT,
      id: generateId(),
      x: CANVAS_WIDTH / 2 - 150,
      y: CANVAS_HEIGHT / 2 - 50,
      zIndex: getNextZIndex(document.objects),
    };
    addObject(obj);
  }, [document.objects, addObject]);

  const addArrow = useCallback(
    (curved: boolean) => {
      const basePoints = curved
        ? [200, 400, 640, 200, 1080, 400] // Control point in middle
        : [200, 360, 1080, 360];
      
      const obj: ArrowObject = {
        ...DEFAULT_ARROW,
        id: generateId(),
        x: 0,
        y: 0,
        zIndex: getNextZIndex(document.objects),
        points: basePoints,
        isCurved: curved,
      };
      addObject(obj);
    },
    [document.objects, addObject]
  );

  const addLine = useCallback(() => {
    const obj: ArrowObject = {
      ...DEFAULT_ARROW,
      id: generateId(),
      x: 0,
      y: 0,
      zIndex: getNextZIndex(document.objects),
      points: [200, 360, 1080, 360],
      isCurved: false,
      arrowheadAtEnd: false, // No arrowhead = just a line
      arrowheadAtStart: false,
    };
    addObject(obj);
  }, [document.objects, addObject]);

  const addShape = useCallback(
    (type: "ellipse" | "rectangle") => {
      const obj: ShapeObject = {
        ...DEFAULT_SHAPE,
        id: generateId(),
        x: CANVAS_WIDTH / 2,
        y: CANVAS_HEIGHT / 2,
        zIndex: getNextZIndex(document.objects),
        shapeType: type,
        width: type === "ellipse" ? 300 : 200,
        height: type === "ellipse" ? 200 : 150,
      };
      addObject(obj);
    },
    [document.objects, addObject]
  );

  // ============================================================================
  // KEYBOARD SHORTCUTS
  // ============================================================================

  useEffect(() => {
    const toolShortcuts: Record<string, () => void> = {
      v: () => setTool("select"),
      h: () => setTool("pan"),
      t: addText,
      a: () => addArrow(false),
      o: () => addShape("ellipse"),
      r: () => addShape("rectangle"),
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA";

      if (e.code === "Space" && !isInput) {
        e.preventDefault();
        setIsSpacePressed(true);
        setIsPanning(true);
        return;
      }

      if (e.key === "Escape") {
        setSelectedId(null);
        return;
      }

      if (isInput) {return;}

      if (isDeleteKey(e.key) && selectedId) {
        e.preventDefault();
        deleteSelected();
        return;
      }

      if (handleUndoRedoKey(e, undo, redo)) {return;}

      if (selectedObject) {
        const nudge = getNudgeDelta(e.key, e.shiftKey);
        if (nudge) {
          e.preventDefault();
          updateObject(selectedId!, { x: selectedObject.x + nudge.dx, y: selectedObject.y + nudge.dy });
          return;
        }
      }

      const action = toolShortcuts[e.key.toLowerCase()];
      if (action) {action();}
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        setIsSpacePressed(false);
        if (tool !== "pan") {setIsPanning(false);}
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [selectedId, selectedObject, tool, undo, redo, deleteSelected, addText, addArrow, addShape, updateObject]);

  // ============================================================================
  // IMAGE UPLOAD
  // ============================================================================

  const handleImageUpload = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) {return;}
      const file = files[0];

      // Validate type
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        toast("Please upload a PNG, JPEG, or WebP image", "error");
        return;
      }

      // Validate size
      if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
        toast(`Image must be under ${MAX_IMAGE_SIZE_MB}MB`, "error");
        return;
      }

      try {
        // Upload to server
        const form = new FormData();
        form.append("file", file);
        const res = await fetch(
          `/api/thumbnails/projects/${props.projectId}/upload-overlay`,
          { method: "POST", body: form }
        );
        const data = await res.json().catch(() => ({}));
        
        if (!res.ok) {
          throw new Error(data.message || "Upload failed");
        }

        // Load image to get dimensions
        const img = new window.Image();
        img.crossOrigin = "anonymous";
        
        await new Promise<void>((resolve, reject) => {
          img.addEventListener('load', () => resolve());
          img.onerror = () => reject(new Error("Failed to load image"));
          img.src = data.url;
        });

        // Calculate dimensions to fit in canvas
        const dims = fitImageContain(img.naturalWidth, img.naturalHeight);
        const pos = centerInCanvas(dims.width, dims.height);

        const obj: ImageObject = {
          ...DEFAULT_IMAGE,
          id: generateId(),
          x: pos.x,
          y: pos.y,
          zIndex: getNextZIndex(document.objects),
          srcUrl: data.url,
          originalWidth: img.naturalWidth,
          originalHeight: img.naturalHeight,
          width: dims.width,
          height: dims.height,
        };
        
        addObject(obj);
        toast("Image added", "success");
      } catch (error) {
        toast(error instanceof Error ? error.message : "Upload failed", "error");
      }
    },
    [props.projectId, document.objects, addObject, toast]
  );

  // ============================================================================
  // ZOOM/PAN CONTROLS
  // ============================================================================

  const handleZoomChange = useCallback((newZoom: number) => {
    setZoom(Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom)));
  }, []);

  const handlePanChange = useCallback((x: number, y: number) => {
    setPanX(x);
    setPanY(y);
  }, []);

  const fitToScreen = useCallback(() => {
    setZoom(1);
    setPanX(0);
    setPanY(0);
  }, []);

  // ============================================================================
  // EXPORT
  // ============================================================================

  const handleExport = useCallback(
    async (format: "png" | "jpg") => {
      setIsExporting(true);

      try {
        const dataUrl = await exportCanvas(stageRef, format);

        // Upload to server for storage
        const res = await fetch(
          `/api/thumbnails/projects/${props.projectId}/export`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ dataUrl, format }),
          }
        );
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(data.message || "Export failed");
        }

        setExportsList((prev) => [
          ...prev,
          {
            url: data.url,
            format,
            width: 1280,
            height: 720,
            createdAt: new Date().toISOString(),
          },
        ]);

        // Trigger browser download
        const link = window.document.createElement("a");
        link.href = dataUrl;
        link.download = `thumbnail-${Date.now()}.${format === "jpg" ? "jpg" : "png"}`;
        window.document.body.append(link);
        link.click();
        link.remove();
        
        toast(`Exported ${format.toUpperCase()} successfully`, "success");
      } catch (error) {
        toast(error instanceof Error ? error.message : "Export failed", "error");
      } finally {
        setIsExporting(false);
      }
    },
    [props.projectId, toast]
  );

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className={s.editorLayout}>
      <TopBar
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        zoom={zoom}
        onZoomChange={handleZoomChange}
        onFitToScreen={fitToScreen}
        onExport={handleExport}
        showSafeArea={showSafeArea}
        onToggleSafeArea={() => setShowSafeArea(!showSafeArea)}
        isExporting={isExporting}
      />

      <Toolbar
        activeTool={tool}
        onToolChange={setTool}
        onAddText={addText}
        onAddArrow={addArrow}
        onAddLine={addLine}
        onAddShape={addShape}
        onImageUpload={handleImageUpload}
        onDelete={deleteSelected}
        hasSelection={!!selectedId}
        isPanning={isPanning || isSpacePressed}
      />

      <div className={s.canvasArea}>
        <EditorCanvas
          document={document}
          selectedId={selectedId}
          tool={tool}
          zoom={zoom}
          panX={panX}
          panY={panY}
          showSafeArea={showSafeArea}
          baseImageUrl={props.baseImageUrl}
          onSelect={setSelectedId}
          onObjectChange={updateObject}
          onZoomChange={handleZoomChange}
          onPanChange={handlePanChange}
          isPanning={isPanning || isSpacePressed}
          setIsPanning={setIsPanning}
          containerRef={containerRef as React.RefObject<HTMLDivElement>}
          stageRef={stageRef as React.RefObject<Konva.Stage | null>}
        />
      </div>

      <PropertiesPanel
        selectedObject={selectedObject}
        documentSettings={document.settings}
        onObjectChange={(patch) => selectedId && updateObject(selectedId, patch)}
        onSettingsChange={updateSettings}
        onMoveLayer={moveLayer}
        onDuplicate={duplicateSelected}
        onDelete={deleteSelected}
        onSelect={setSelectedId}
        objects={document.objects}
      />
    </div>
  );
}
