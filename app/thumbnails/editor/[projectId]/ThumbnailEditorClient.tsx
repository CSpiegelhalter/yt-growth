"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Stage,
  Layer,
  Image as KonvaImage,
  Text,
  Line,
  Arrow,
  Ellipse,
  Circle,
  RegularPolygon,
  Transformer,
} from "react-konva";
import type Konva from "konva";
import s from "./ThumbnailEditorClient.module.css";
import { useToast } from "@/components/ui/Toast";
import {
  defaultEditorState,
  editorStateV1Schema,
  type EditorStateV1,
} from "@/lib/thumbnails-v2/editorState";

type Props = {
  projectId: string;
  baseImageUrl: string;
  initialEditorState: unknown;
  initialExports: unknown;
};

type ObjBase = {
  id: string;
  type: "text" | "arrow" | "ellipse" | "image";
  x: number;
  y: number;
  rotation: number;
  zIndex: number;
};

type TextObj = ObjBase & {
  type: "text";
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  fill: string;
  stroke: string;
  strokeWidth: number;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
};

type ArrowObj = ObjBase & {
  type: "arrow";
  mode: "straight" | "curved" | "path";
  points: number[]; // straight: [x1,y1,x2,y2], curved: [x1,y1,cx,cy,x2,y2], path: [x1,y1,x2,y2,...]
  color: string;
  thickness: number;
  dashed?: boolean;
};

type EllipseObj = ObjBase & {
  type: "ellipse";
  radiusX: number;
  radiusY: number;
  stroke: string;
  strokeWidth: number;
  fill?: string;
  dashed?: boolean;
};

type ImageObj = ObjBase & {
  type: "image";
  width: number;
  height: number;
  srcUrl: string;
  opacity?: number;
};

type AnyObj = TextObj | ArrowObj | EllipseObj | ImageObj;

function normalizeInitialState(raw: unknown): EditorStateV1 {
  const parsed = editorStateV1Schema.safeParse(raw);
  return parsed.success ? parsed.data : defaultEditorState();
}

function objLabel(o: AnyObj): string {
  if (o.type === "text") return `Text: ${(o.text || "").slice(0, 18) || "…"}`;
  if (o.type === "arrow") return `Arrow (${o.mode})`;
  if (o.type === "ellipse") return "Ellipse";
  return "Image";
}

function useHtmlImage(src: string) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    const i = new window.Image();
    i.crossOrigin = "anonymous";
    i.onload = () => setImg(i);
    i.src = src;
  }, [src]);
  return img;
}

function EditorImageNode(props: {
  obj: ImageObj;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (patch: Partial<ImageObj>) => void;
}) {
  const overlay = useHtmlImage(props.obj.srcUrl);
  return (
    <KonvaImage
      id={props.obj.id}
      image={overlay ?? undefined}
      x={props.obj.x}
      y={props.obj.y}
      width={props.obj.width}
      height={props.obj.height}
      rotation={props.obj.rotation}
      opacity={props.obj.opacity ?? 1}
      draggable
      onClick={props.onSelect}
      onTap={props.onSelect}
      onDragEnd={(e) => props.onChange({ x: e.target.x(), y: e.target.y() })}
      onTransformEnd={(e) => {
        const node = e.target as any;
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        node.scaleX(1);
        node.scaleY(1);
        props.onChange({
          x: node.x(),
          y: node.y(),
          rotation: node.rotation(),
          width: Math.max(8, node.width() * scaleX),
          height: Math.max(8, node.height() * scaleY),
        });
      }}
    />
  );
}

function snapTo(value: number, target: number, threshold = 8): number {
  return Math.abs(value - target) <= threshold ? target : value;
}

function arrowHeadRotationDeg(dx: number, dy: number): number {
  // Konva rotations are degrees
  return (Math.atan2(dy, dx) * 180) / Math.PI;
}

export default function ThumbnailEditorClient(props: Props) {
  const { toast } = useToast();
  const stageRef = useRef<Konva.Stage | null>(null);
  const trRef = useRef<Konva.Transformer | null>(null);

  const baseImg = useHtmlImage(props.baseImageUrl);

  const [state, setState] = useState<EditorStateV1>(() =>
    normalizeInitialState(props.initialEditorState)
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [exportsList, setExportsList] = useState<any[]>(
    Array.isArray(props.initialExports) ? props.initialExports : []
  );

  // Zoom/pan
  const [scale, setScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });

  // Undo/redo
  const historyRef = useRef<EditorStateV1[]>([]);
  const redoRef = useRef<EditorStateV1[]>([]);
  const lastCommittedRef = useRef<string>("");

  const sortedObjects = useMemo(() => {
    const objs = (state.objects as AnyObj[]).slice();
    objs.sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
    return objs;
  }, [state.objects]);

  const selectedObj = useMemo(
    () => sortedObjects.find((o) => o.id === selectedId) ?? null,
    [sortedObjects, selectedId]
  );

  const commit = useCallback(
    (next: EditorStateV1) => {
      const serialized = JSON.stringify(next);
      if (serialized === lastCommittedRef.current) return;
      historyRef.current.push(state);
      if (historyRef.current.length > 50) historyRef.current.shift();
      redoRef.current = [];
      lastCommittedRef.current = serialized;
      setState(next);
    },
    [state]
  );

  // Transformer attachment
  useEffect(() => {
    const tr = trRef.current;
    const stage = stageRef.current;
    if (!tr || !stage) return;
    if (!selectedId) {
      tr.nodes([]);
      tr.getLayer()?.batchDraw();
      return;
    }
    const node = stage.findOne(`#${selectedId}`);
    if (!node) return;
    tr.nodes([node as any]);
    tr.getLayer()?.batchDraw();
  }, [selectedId, sortedObjects]);

  // Autosave (debounced)
  const saveTimer = useRef<number | null>(null);
  useEffect(() => {
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(async () => {
      try {
        await fetch(`/api/thumbnails/projects/${props.projectId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ editorState: state }),
        });
      } catch {
        // ignore
      }
    }, 1200);
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [state, props.projectId]);

  const addText = useCallback(() => {
    const id = globalThis.crypto.randomUUID();
    const maxZ = Math.max(0, ...sortedObjects.map((o) => o.zIndex ?? 0));
    const next: EditorStateV1 = {
      ...state,
      objects: [
        ...(state.objects as any),
        {
          id,
          type: "text",
          x: 80,
          y: 80,
          rotation: 0,
          zIndex: maxZ + 1,
          text: "Add text",
          fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial",
          fontSize: 96,
          fontWeight: "800",
          fill: "#FFFFFF",
          stroke: "#000000",
          strokeWidth: 10,
          shadowColor: "rgba(0,0,0,0.6)",
          shadowBlur: 12,
          shadowOffsetX: 6,
          shadowOffsetY: 6,
        } satisfies TextObj,
      ],
    };
    commit(next);
    setSelectedId(id);
  }, [commit, sortedObjects, state]);

  const addArrow = useCallback(
    (mode: ArrowObj["mode"]) => {
      const id = globalThis.crypto.randomUUID();
      const maxZ = Math.max(0, ...sortedObjects.map((o) => o.zIndex ?? 0));
      const points =
        mode === "curved"
          ? [300, 360, 640, 220, 980, 360]
          : [300, 360, 980, 360];
      const next: EditorStateV1 = {
        ...state,
        objects: [
          ...(state.objects as any),
          {
            id,
            type: "arrow",
            x: 0,
            y: 0,
            rotation: 0,
            zIndex: maxZ + 1,
            mode,
            points,
            color: "#FFCC00",
            thickness: 18,
            dashed: false,
          } satisfies ArrowObj,
        ],
      };
      commit(next);
      setSelectedId(id);
    },
    [commit, sortedObjects, state]
  );

  const addEllipse = useCallback(() => {
    const id = globalThis.crypto.randomUUID();
    const maxZ = Math.max(0, ...sortedObjects.map((o) => o.zIndex ?? 0));
    const next: EditorStateV1 = {
      ...state,
      objects: [
        ...(state.objects as any),
        {
          id,
          type: "ellipse",
          x: 640,
          y: 360,
          rotation: 0,
          zIndex: maxZ + 1,
          radiusX: 220,
          radiusY: 140,
          stroke: "#FFCC00",
          strokeWidth: 14,
          fill: "rgba(0,0,0,0)",
          dashed: false,
        } satisfies EllipseObj,
      ],
    };
    commit(next);
    setSelectedId(id);
  }, [commit, sortedObjects, state]);

  const uploadOverlayImage = useCallback(
    async (file: File) => {
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
      return data.url as string;
    },
    [props.projectId]
  );

  const addImage = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const file = files[0];
      try {
        const url = await uploadOverlayImage(file);
        const id = globalThis.crypto.randomUUID();
        const maxZ = Math.max(0, ...sortedObjects.map((o) => o.zIndex ?? 0));
        const next: EditorStateV1 = {
          ...state,
          objects: [
            ...(state.objects as any),
            {
              id,
              type: "image",
              x: 200,
              y: 200,
              width: 300,
              height: 300,
              rotation: 0,
              zIndex: maxZ + 1,
              srcUrl: url,
              opacity: 1,
            } satisfies ImageObj,
          ],
        };
        commit(next);
        setSelectedId(id);
      } catch (err) {
        toast(err instanceof Error ? err.message : "Upload failed", "error");
      }
    },
    [commit, sortedObjects, state, toast, uploadOverlayImage]
  );

  const updateSelected = useCallback(
    (patch: Partial<AnyObj>) => {
      if (!selectedId) return;
      const objs = (state.objects as AnyObj[]).map((o) => {
        if (o.id !== selectedId) return o;
        const merged = { ...o, ...patch } as AnyObj;
        // Basic center snapping (fast + low-risk)
        merged.x = snapTo(merged.x, 640);
        merged.y = snapTo(merged.y, 360);
        merged.rotation = Number.isFinite(merged.rotation) ? merged.rotation : 0;
        return merged;
      });
      commit({ ...state, objects: objs });
    },
    [commit, selectedId, state]
  );

  const deleteSelected = useCallback(() => {
    if (!selectedId) return;
    const next = {
      ...state,
      objects: (state.objects as AnyObj[]).filter((o) => o.id !== selectedId),
    };
    commit(next);
    setSelectedId(null);
  }, [commit, selectedId, state]);

  const moveLayer = useCallback(
    (id: string, dir: -1 | 1) => {
      const objs = (state.objects as AnyObj[]).slice();
      objs.sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
      const idx = objs.findIndex((o) => o.id === id);
      const j = idx + dir;
      if (idx < 0 || j < 0 || j >= objs.length) return;
      const a = objs[idx];
      const b = objs[j];
      const tmp = a.zIndex;
      a.zIndex = b.zIndex;
      b.zIndex = tmp;
      commit({ ...state, objects: objs });
    },
    [commit, state]
  );

  const undo = useCallback(() => {
    const prev = historyRef.current.pop();
    if (!prev) return;
    redoRef.current.push(state);
    setState(prev);
  }, [state]);

  const redo = useCallback(() => {
    const next = redoRef.current.pop();
    if (!next) return;
    historyRef.current.push(state);
    setState(next);
  }, [state]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        deleteSelected();
      }
      if (mod && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if (mod && e.key.toLowerCase() === "z" && e.shiftKey) {
        e.preventDefault();
        redo();
      }
      if (!mod && selectedObj) {
        const step = e.shiftKey ? 10 : 2;
        if (e.key === "ArrowLeft") updateSelected({ x: selectedObj.x - step } as any);
        if (e.key === "ArrowRight") updateSelected({ x: selectedObj.x + step } as any);
        if (e.key === "ArrowUp") updateSelected({ y: selectedObj.y - step } as any);
        if (e.key === "ArrowDown") updateSelected({ y: selectedObj.y + step } as any);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [deleteSelected, redo, selectedObj, undo, updateSelected]);

  const onWheel = useCallback((e: any) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;
    const oldScale = scale;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    const mousePointTo = {
      x: (pointer.x - stagePos.x) / oldScale,
      y: (pointer.y - stagePos.y) / oldScale,
    };
    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const factor = 1.06;
    const newScale = Math.max(0.3, Math.min(2.5, direction > 0 ? oldScale * factor : oldScale / factor));
    setScale(newScale);
    setStagePos({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });
  }, [scale, stagePos.x, stagePos.y]);

  const exportImage = useCallback(
    async (format: "png" | "jpg") => {
      const stage = stageRef.current;
      if (!stage) return;
      const mimeType = format === "png" ? "image/png" : "image/jpeg";
      const dataUrl = stage.toDataURL({
        pixelRatio: 1,
        mimeType,
        quality: format === "jpg" ? 0.92 : undefined,
      });
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
        { url: data.url, format, width: 1280, height: 720, createdAt: new Date().toISOString() },
      ]);
      toast("Export saved", "success");
    },
    [props.projectId, toast]
  );

  const canvasWidth = 1280;
  const canvasHeight = 720;
  const displayWidth = 1000;
  const displayHeight = (displayWidth * 9) / 16;

  return (
    <div className={s.page}>
      <div className={s.header}>
        <h1 className={s.title}>Editor</h1>
        <div className={s.toolbar}>
          <button className={s.btn} onClick={() => void addText()}>
            Add text
          </button>
          <button className={s.btn} onClick={() => void addArrow("straight")}>
            Arrow
          </button>
          <button className={s.btn} onClick={() => void addArrow("curved")}>
            Curved arrow
          </button>
          <button className={s.btn} onClick={() => void addEllipse()}>
            Ellipse
          </button>
          <label className={s.btn}>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => void addImage(e.target.files)}
              style={{ display: "none" }}
            />
            Import image
          </label>
          <button className={s.btn} onClick={undo} disabled={historyRef.current.length === 0}>
            Undo
          </button>
          <button className={s.btn} onClick={redo} disabled={redoRef.current.length === 0}>
            Redo
          </button>
          <button className={`${s.btn} ${s.btnPrimary}`} onClick={() => void exportImage("png")}>
            Export PNG
          </button>
          <button className={s.btn} onClick={() => void exportImage("jpg")}>
            Export JPG
          </button>
        </div>
      </div>

      <div className={s.layout}>
        <div className={s.canvasCard}>
          <Stage
            ref={(n) => {
              stageRef.current = n;
            }}
            width={displayWidth}
            height={displayHeight}
            scaleX={(displayWidth / canvasWidth) * scale}
            scaleY={(displayHeight / canvasHeight) * scale}
            x={stagePos.x}
            y={stagePos.y}
            onWheel={onWheel}
            onMouseDown={(e) => {
              const clickedOnEmpty = e.target === e.target.getStage();
              if (clickedOnEmpty) setSelectedId(null);
            }}
          >
            <Layer>
              {baseImg && (
                <KonvaImage
                  image={baseImg}
                  x={0}
                  y={0}
                  width={canvasWidth}
                  height={canvasHeight}
                  listening={false}
                />
              )}

              {sortedObjects.map((o) => {
                if (o.type === "text") {
                  const t = o as TextObj;
                  return (
                    <Text
                      key={t.id}
                      id={t.id}
                      x={t.x}
                      y={t.y}
                      text={t.text}
                      fontFamily={t.fontFamily}
                      fontSize={t.fontSize}
                      fontStyle="bold"
                      fill={t.fill}
                      stroke={t.stroke}
                      strokeWidth={t.strokeWidth}
                      shadowColor={t.shadowColor}
                      shadowBlur={t.shadowBlur}
                      shadowOffsetX={t.shadowOffsetX}
                      shadowOffsetY={t.shadowOffsetY}
                      draggable
                      onClick={() => setSelectedId(t.id)}
                      onTap={() => setSelectedId(t.id)}
                      onDragEnd={(e) =>
                        updateSelected({ x: e.target.x(), y: e.target.y() } as any)
                      }
                      onTransformEnd={(e) => {
                        const node = e.target;
                        node.scaleX(1);
                        node.scaleY(1);
                        updateSelected({
                          x: node.x(),
                          y: node.y(),
                          rotation: node.rotation(),
                        } as any);
                      }}
                    />
                  );
                }

                if (o.type === "arrow") {
                  const a = o as ArrowObj;
                  const dash = a.dashed ? [14, 10] : undefined;
                  const color = a.color;
                  const points = a.points;
                  const isSelected = a.id === selectedId;

                  // Straight arrows use Konva's native Arrow (includes head)
                  if (a.mode === "straight" && points.length >= 4) {
                    return (
                      <>
                        <Arrow
                          key={a.id}
                          id={a.id}
                          points={points.slice(0, 4)}
                          stroke={color}
                          fill={color}
                          strokeWidth={a.thickness}
                          pointerLength={Math.max(14, a.thickness * 1.2)}
                          pointerWidth={Math.max(14, a.thickness * 1.2)}
                          lineCap="round"
                          lineJoin="round"
                          dash={dash}
                          draggable
                          onClick={() => setSelectedId(a.id)}
                          onTap={() => setSelectedId(a.id)}
                          onDragEnd={(e) => {
                            const dx = e.target.x();
                            const dy = e.target.y();
                            const newPts = points
                              .slice(0, 4)
                              .map((v, i) => (i % 2 === 0 ? v + dx : v + dy));
                            e.target.x(0);
                            e.target.y(0);
                            updateSelected({ points: newPts } as any);
                          }}
                        />
                        {isSelected && (
                          <>
                            <Circle
                              x={points[0]}
                              y={points[1]}
                              radius={10}
                              fill="#fff"
                              stroke="#3b82f6"
                              strokeWidth={2}
                              draggable
                              onDragMove={(e) => {
                                const nx = e.target.x();
                                const ny = e.target.y();
                                updateSelected({ points: [nx, ny, points[2], points[3]] } as any);
                              }}
                            />
                            <Circle
                              x={points[2]}
                              y={points[3]}
                              radius={10}
                              fill="#fff"
                              stroke="#3b82f6"
                              strokeWidth={2}
                              draggable
                              onDragMove={(e) => {
                                const nx = e.target.x();
                                const ny = e.target.y();
                                updateSelected({ points: [points[0], points[1], nx, ny] } as any);
                              }}
                            />
                          </>
                        )}
                      </>
                    );
                  }

                  // Curved/path arrows: draw a bezier/path line + explicit arrow head triangle
                  const pts = points;
                  const endX = pts[pts.length - 2] ?? 0;
                  const endY = pts[pts.length - 1] ?? 0;
                  const prevX = pts[pts.length - 4] ?? endX - 1;
                  const prevY = pts[pts.length - 3] ?? endY - 1;
                  const rot = arrowHeadRotationDeg(endX - prevX, endY - prevY);

                  const isCurved = a.mode === "curved";
                  return (
                    <>
                      <Line
                        key={a.id}
                        id={a.id}
                        x={0}
                        y={0}
                        stroke={color}
                        strokeWidth={a.thickness}
                        lineCap="round"
                        lineJoin="round"
                        dash={dash}
                        points={pts}
                        bezier={isCurved}
                        draggable
                        onClick={() => setSelectedId(a.id)}
                        onTap={() => setSelectedId(a.id)}
                        onDragEnd={(e) => {
                          const dx = e.target.x();
                          const dy = e.target.y();
                          const newPts = pts.map((v, i) =>
                            i % 2 === 0 ? v + dx : v + dy
                          );
                          e.target.x(0);
                          e.target.y(0);
                          updateSelected({ points: newPts } as any);
                        }}
                      />
                      <RegularPolygon
                        x={endX}
                        y={endY}
                        sides={3}
                        radius={Math.max(14, a.thickness * 1.1)}
                        fill={color}
                        rotation={rot + 90}
                        listening={false}
                      />
                      {isSelected && (
                        <>
                          {pts.map((_, i) =>
                            i % 2 === 0 ? null : (
                              <Circle
                                key={`${a.id}-pt-${i}`}
                                x={pts[i - 1]}
                                y={pts[i]}
                                radius={9}
                                fill="#fff"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                draggable
                                onDragMove={(e) => {
                                  const nx = e.target.x();
                                  const ny = e.target.y();
                                  const newPts = pts.slice();
                                  newPts[i - 1] = nx;
                                  newPts[i] = ny;
                                  updateSelected({ points: newPts } as any);
                                }}
                              />
                            )
                          )}
                        </>
                      )}
                    </>
                  );
                }

                if (o.type === "ellipse") {
                  const el = o as EllipseObj;
                  const dash = el.dashed ? [14, 10] : undefined;
                  return (
                    <Ellipse
                      key={el.id}
                      id={el.id}
                      x={el.x}
                      y={el.y}
                      radiusX={el.radiusX}
                      radiusY={el.radiusY}
                      stroke={el.stroke}
                      strokeWidth={el.strokeWidth}
                      fill={el.fill}
                      dash={dash}
                      draggable
                      onClick={() => setSelectedId(el.id)}
                      onTap={() => setSelectedId(el.id)}
                      onDragEnd={(e) =>
                        updateSelected({ x: e.target.x(), y: e.target.y() } as any)
                      }
                      onTransformEnd={(e) => {
                        const node = e.target as any;
                        const scaleX = node.scaleX();
                        const scaleY = node.scaleY();
                        node.scaleX(1);
                        node.scaleY(1);
                        updateSelected({
                          x: node.x(),
                          y: node.y(),
                          rotation: node.rotation(),
                          radiusX: Math.max(2, node.radiusX() * scaleX),
                          radiusY: Math.max(2, node.radiusY() * scaleY),
                        } as any);
                      }}
                    />
                  );
                }

                const im = o as ImageObj;
                return (
                  <EditorImageNode
                    key={im.id}
                    obj={im}
                    isSelected={im.id === selectedId}
                    onSelect={() => setSelectedId(im.id)}
                    onChange={(patch) => updateSelected(patch as any)}
                  />
                );
              })}

              <Transformer
                ref={(n) => {
                  trRef.current = n;
                }}
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
              />
            </Layer>
          </Stage>
          <div className={s.small}>
            Tip: mouse wheel zooms, Delete removes selection, Cmd/Ctrl+Z undo.
          </div>
        </div>

        <div className={s.sideCard}>
          <div className={s.panelSection}>
            <h3 className={s.panelTitle}>Layers</h3>
            <div className={s.layers}>
              {sortedObjects
                .slice()
                .sort((a, b) => (b.zIndex ?? 0) - (a.zIndex ?? 0))
                .map((o) => (
                  <div
                    key={o.id}
                    className={`${s.layerItem} ${o.id === selectedId ? s.layerItemActive : ""}`}
                    onClick={() => setSelectedId(o.id)}
                  >
                    <div className={s.layerLabel}>{objLabel(o)}</div>
                    <div className={s.layerButtons}>
                      <button
                        className={s.iconBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          moveLayer(o.id, 1);
                        }}
                        title="Move up"
                      >
                        ↑
                      </button>
                      <button
                        className={s.iconBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          moveLayer(o.id, -1);
                        }}
                        title="Move down"
                      >
                        ↓
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className={s.panelSection}>
            <h3 className={s.panelTitle}>Selected</h3>
            {!selectedObj && <div className={s.small}>Click an object to edit it.</div>}

            {selectedObj?.type === "text" && (
              <>
                <div className={s.row}>
                  <span className={s.small}>Text</span>
                </div>
                <input
                  className={s.input}
                  value={(selectedObj as TextObj).text}
                  onChange={(e) => updateSelected({ text: e.target.value } as any)}
                />
                <div className={s.row}>
                  <span className={s.small}>Font size</span>
                  <input
                    type="number"
                    className={s.input}
                    value={(selectedObj as TextObj).fontSize}
                    onChange={(e) => updateSelected({ fontSize: Number(e.target.value) } as any)}
                  />
                </div>
                <div className={s.row}>
                  <span className={s.small}>Fill</span>
                  <input
                    type="color"
                    value={(selectedObj as TextObj).fill}
                    onChange={(e) => updateSelected({ fill: e.target.value } as any)}
                  />
                </div>
                <div className={s.row}>
                  <span className={s.small}>Stroke</span>
                  <input
                    type="color"
                    value={(selectedObj as TextObj).stroke}
                    onChange={(e) => updateSelected({ stroke: e.target.value } as any)}
                  />
                </div>
                <div className={s.row}>
                  <span className={s.small}>Stroke width</span>
                  <input
                    type="number"
                    className={s.input}
                    value={(selectedObj as TextObj).strokeWidth}
                    onChange={(e) => updateSelected({ strokeWidth: Number(e.target.value) } as any)}
                  />
                </div>
              </>
            )}

            {selectedObj?.type === "arrow" && (
              <>
                <div className={s.row}>
                  <span className={s.small}>Color</span>
                  <input
                    type="color"
                    value={(selectedObj as ArrowObj).color}
                    onChange={(e) => updateSelected({ color: e.target.value } as any)}
                  />
                </div>
                <div className={s.row}>
                  <span className={s.small}>Thickness</span>
                  <input
                    type="number"
                    className={s.input}
                    value={(selectedObj as ArrowObj).thickness}
                    onChange={(e) =>
                      updateSelected({ thickness: Number(e.target.value) } as any)
                    }
                  />
                </div>
              </>
            )}

            {selectedObj?.type === "ellipse" && (
              <>
                <div className={s.row}>
                  <span className={s.small}>Stroke</span>
                  <input
                    type="color"
                    value={(selectedObj as EllipseObj).stroke}
                    onChange={(e) => updateSelected({ stroke: e.target.value } as any)}
                  />
                </div>
                <div className={s.row}>
                  <span className={s.small}>Stroke width</span>
                  <input
                    type="number"
                    className={s.input}
                    value={(selectedObj as EllipseObj).strokeWidth}
                    onChange={(e) =>
                      updateSelected({ strokeWidth: Number(e.target.value) } as any)
                    }
                  />
                </div>
              </>
            )}

            {selectedObj && (
              <button className={s.btn} onClick={deleteSelected}>
                Delete
              </button>
            )}
          </div>

          <div className={s.panelSection}>
            <h3 className={s.panelTitle}>Exports</h3>
            <div className={s.exports}>
              {exportsList.length === 0 && (
                <div className={s.small}>No exports yet. Use Export PNG/JPG.</div>
              )}
              {exportsList
                .slice()
                .reverse()
                .slice(0, 6)
                .map((x, i) => (
                  <a key={`${x.url}-${i}`} className={s.exportLink} href={x.url} target="_blank" rel="noreferrer">
                    {x.format?.toUpperCase?.() ?? "FILE"} — {x.url}
                  </a>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

