import type { BlendMode, DocumentBackground, LayerType, Selection } from "./types";

export type EditorLayer = {
  id: string;
  name: string;
  visible: boolean;
  opacity: number;
  blendMode: BlendMode;
  type: LayerType;
  canvas: HTMLCanvasElement;
};

export type LayerSnapshot = {
  id: string;
  name: string;
  visible: boolean;
  opacity: number;
  blendMode: BlendMode;
  type: LayerType;
  width: number;
  height: number;
  data: Uint8ClampedArray;
};

export type DocumentSnapshot = {
  width: number;
  height: number;
  activeLayerId: string | null;
  layers: LayerSnapshot[];
};

const MAX_HISTORY = 60;
const MAX_DOC_DIMENSION = 4096;
let layerIdCounter = 0;

function nextLayerId() {
  layerIdCounter += 1;
  return `layer-${layerIdCounter}-${Math.random().toString(36).slice(2, 7)}`;
}

function makeCanvas(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

export function canvasContext(canvas: HTMLCanvasElement) {
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    throw new Error("Canvas 2D context is not available.");
  }
  return context;
}

export function hexToRgba(hex: string, alpha = 255) {
  let value = hex.replace("#", "").trim();
  if (value.length === 3) {
    value = value
      .split("")
      .map((char) => char + char)
      .join("");
  }
  const number = Number.parseInt(value, 16);
  if (Number.isNaN(number)) {
    return { r: 0, g: 0, b: 0, a: alpha };
  }
  return {
    r: (number >> 16) & 255,
    g: (number >> 8) & 255,
    b: number & 255,
    a: alpha
  };
}

export function rgbaToHex(r: number, g: number, b: number) {
  const toHex = (channel: number) => channel.toString(16).padStart(2, "0");
  return `#${toHex(Math.max(0, Math.min(255, Math.round(r))))}${toHex(
    Math.max(0, Math.min(255, Math.round(g)))
  )}${toHex(Math.max(0, Math.min(255, Math.round(b))))}`;
}

export function fitDimensions(
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  const scale = Math.min(1, maxWidth / width, maxHeight / height);
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale))
  };
}

export class EditorEngine {
  width: number;
  height: number;
  layers: EditorLayer[] = [];
  activeLayerId: string | null = null;
  selection: Selection | null = null;

  private undoStack: DocumentSnapshot[] = [];
  private redoStack: DocumentSnapshot[] = [];
  private listeners = new Set<() => void>();
  private version = 0;

  constructor(width: number, height: number, background: DocumentBackground, layerName = "Layer 1") {
    this.width = width;
    this.height = height;
    this.addBlankLayer(layerName, background);
    this.activeLayerId = this.layers[0]?.id ?? null;
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getVersion() {
    return this.version;
  }

  emit() {
    this.version += 1;
    this.listeners.forEach((listener) => listener());
  }

  get activeLayer() {
    return this.layers.find((layer) => layer.id === this.activeLayerId) ?? null;
  }

  createDocument(width: number, height: number, background: DocumentBackground) {
    const normalized = fitDimensions(width, height, MAX_DOC_DIMENSION, MAX_DOC_DIMENSION);
    this.width = normalized.width;
    this.height = normalized.height;
    this.layers = [];
    this.selection = null;
    this.addBlankLayer("Layer 1", background);
    this.activeLayerId = this.layers[0]?.id ?? null;
    this.undoStack = [];
    this.redoStack = [];
    this.pushHistory();
    this.emit();
  }

  addBlankLayer(name: string, background: DocumentBackground) {
    const canvas = makeCanvas(this.width, this.height);
    const context = canvasContext(canvas);
    if (background === "white") {
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, this.width, this.height);
    }
    const layer: EditorLayer = {
      id: nextLayerId(),
      name,
      visible: true,
      opacity: 100,
      blendMode: "normal",
      type: "raster",
      canvas
    };
    this.layers.push(layer);
    return layer;
  }

  addLayer(name = "New Layer", fill?: string | null) {
    const layer = this.addBlankLayer(name, fill ? "white" : "transparent");
    if (fill) {
      const context = canvasContext(layer.canvas);
      context.fillStyle = fill;
      context.fillRect(0, 0, this.width, this.height);
    }
    this.activeLayerId = layer.id;
    this.pushHistory();
    this.emit();
    return layer;
  }

  addRasterizedLayer(name: string, canvas: HTMLCanvasElement) {
    const layer: EditorLayer = {
      id: nextLayerId(),
      name,
      visible: true,
      opacity: 100,
      blendMode: "normal",
      type: "raster",
      canvas
    };
    this.layers.push(layer);
    this.activeLayerId = layer.id;
    this.pushHistory();
    this.emit();
    return layer;
  }

  duplicateLayer(id: string) {
    const sourceIndex = this.layers.findIndex((layer) => layer.id === id);
    if (sourceIndex === -1) return;
    const source = this.layers[sourceIndex];
    const copy = makeCanvas(this.width, this.height);
    canvasContext(copy).drawImage(source.canvas, 0, 0);
    const layer: EditorLayer = {
      id: nextLayerId(),
      name: `${source.name} copy`,
      visible: source.visible,
      opacity: source.opacity,
      blendMode: source.blendMode,
      type: source.type,
      canvas: copy
    };
    this.layers.splice(sourceIndex + 1, 0, layer);
    this.activeLayerId = layer.id;
    this.pushHistory();
    this.emit();
  }

  deleteLayer(id: string) {
    if (this.layers.length <= 1) return;
    const index = this.layers.findIndex((layer) => layer.id === id);
    if (index === -1) return;
    this.layers.splice(index, 1);
    if (this.activeLayerId === id) {
      this.activeLayerId = this.layers[Math.max(0, index - 1)]?.id ?? this.layers[0]?.id ?? null;
    }
    this.selection = null;
    this.pushHistory();
    this.emit();
  }

  moveLayer(id: string, direction: -1 | 1) {
    const index = this.layers.findIndex((layer) => layer.id === id);
    const target = index + direction;
    if (index === -1 || target < 0 || target >= this.layers.length) return;
    const [layer] = this.layers.splice(index, 1);
    this.layers.splice(target, 0, layer);
    this.pushHistory();
    this.emit();
  }

  renameLayer(id: string, name: string) {
    const layer = this.layers.find((item) => item.id === id);
    if (!layer) return;
    layer.name = name.trim() || layer.name;
    this.emit();
  }

  setLayerVisibility(id: string, visible: boolean) {
    const layer = this.layers.find((item) => item.id === id);
    if (!layer) return;
    layer.visible = visible;
    this.pushHistory();
    this.emit();
  }

  setLayerOpacity(id: string, opacity: number) {
    const layer = this.layers.find((item) => item.id === id);
    if (!layer) return;
    layer.opacity = Math.max(0, Math.min(100, opacity));
    this.pushHistory();
    this.emit();
  }

  setLayerBlendMode(id: string, blendMode: BlendMode) {
    const layer = this.layers.find((item) => item.id === id);
    if (!layer) return;
    layer.blendMode = blendMode;
    this.pushHistory();
    this.emit();
  }

  setActiveLayer(id: string) {
    if (this.activeLayerId === id) return;
    this.activeLayerId = id;
    this.emit();
  }

  setSelection(selection: Selection | null) {
    this.selection = selection;
    this.emit();
  }

  getSelectionPath2D(): Path2D | null {
    if (!this.selection) return null;
    const path = new Path2D();
    if (this.selection.kind === "rect" && this.selection.rect) {
      const { x0, y0, x1, y1 } = this.selection.rect;
      path.rect(Math.min(x0, x1), Math.min(y0, y1), Math.abs(x1 - x0), Math.abs(y1 - y0));
    } else if (this.selection.kind === "lasso" && this.selection.points && this.selection.points.length > 0) {
      const points = this.selection.points;
      path.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i += 1) {
        path.lineTo(points[i].x, points[i].y);
      }
      path.closePath();
    }
    return path;
  }

  clearSelectionPixels() {
    const layer = this.activeLayer;
    const path = this.getSelectionPath2D();
    if (!layer || !path) return;
    this.pushHistory();
    const context = canvasContext(layer.canvas);
    context.save();
    context.clip(path);
    context.clearRect(0, 0, this.width, this.height);
    context.restore();
    this.emit();
  }

  clearSelection() {
    this.selection = null;
    this.emit();
  }

  composite(context: CanvasRenderingContext2D) {
    context.clearRect(0, 0, this.width, this.height);
    for (const layer of this.layers) {
      if (!layer.visible) continue;
      context.globalAlpha = layer.opacity / 100;
      context.globalCompositeOperation = layer.blendMode === "normal" ? "source-over" : layer.blendMode;
      context.drawImage(layer.canvas, 0, 0);
    }
    context.globalAlpha = 1;
    context.globalCompositeOperation = "source-over";
  }

  renderSelectionMask(): Uint8ClampedArray | null {
    const path = this.getSelectionPath2D();
    if (!path) return null;
    const mask = makeCanvas(this.width, this.height);
    const context = canvasContext(mask);
    context.fillStyle = "#ffffff";
    context.fill(path);
    return context.getImageData(0, 0, this.width, this.height).data;
  }

  pushHistory() {
    const snapshot: DocumentSnapshot = {
      width: this.width,
      height: this.height,
      activeLayerId: this.activeLayerId,
      layers: this.layers.map((layer) => {
        const context = canvasContext(layer.canvas);
        const imageData = context.getImageData(0, 0, this.width, this.height);
        return {
          id: layer.id,
          name: layer.name,
          visible: layer.visible,
          opacity: layer.opacity,
          blendMode: layer.blendMode,
          type: layer.type,
          width: imageData.width,
          height: imageData.height,
          data: imageData.data.slice()
        };
      })
    };
    this.undoStack.push(snapshot);
    if (this.undoStack.length > MAX_HISTORY) {
      this.undoStack.shift();
    }
    this.redoStack = [];
  }

  canUndo() {
    return this.undoStack.length > 0;
  }

  canRedo() {
    return this.redoStack.length > 0;
  }

  private restoreSnapshot(snapshot: DocumentSnapshot) {
    this.width = snapshot.width;
    this.height = snapshot.height;
    this.layers = snapshot.layers.map((item) => {
      const canvas = makeCanvas(item.width, item.height);
      const context = canvasContext(canvas);
      const shallow = context.createImageData(item.width, item.height);
      shallow.data.set(item.data);
      context.putImageData(shallow, 0, 0);
      return {
        id: item.id,
        name: item.name,
        visible: item.visible,
        opacity: item.opacity,
        blendMode: item.blendMode,
        type: item.type,
        canvas
      };
    });
    this.activeLayerId = snapshot.activeLayerId;
  }

  undo() {
    const snapshot = this.undoStack.pop();
    if (!snapshot) return;
    const current: DocumentSnapshot = {
      width: this.width,
      height: this.height,
      activeLayerId: this.activeLayerId,
      layers: this.layers.map((layer) => {
        const context = canvasContext(layer.canvas);
        const imageData = context.getImageData(0, 0, this.width, this.height);
        return {
          id: layer.id,
          name: layer.name,
          visible: layer.visible,
          opacity: layer.opacity,
          blendMode: layer.blendMode,
          type: layer.type,
          width: imageData.width,
          height: imageData.height,
          data: imageData.data.slice()
        };
      })
    };
    this.redoStack.push(current);
    this.restoreSnapshot(snapshot);
    this.selection = null;
    this.emit();
  }

  redo() {
    const snapshot = this.redoStack.pop();
    if (!snapshot) return;
    const current: DocumentSnapshot = {
      width: this.width,
      height: this.height,
      activeLayerId: this.activeLayerId,
      layers: this.layers.map((layer) => {
        const context = canvasContext(layer.canvas);
        const imageData = context.getImageData(0, 0, this.width, this.height);
        return {
          id: layer.id,
          name: layer.name,
          visible: layer.visible,
          opacity: layer.opacity,
          blendMode: layer.blendMode,
          type: layer.type,
          width: imageData.width,
          height: imageData.height,
          data: imageData.data.slice()
        };
      })
    };
    this.undoStack.push(current);
    this.restoreSnapshot(snapshot);
    this.selection = null;
    this.emit();
  }

  translateLayerPixels(id: string, dx: number, dy: number) {
    const layer = this.layers.find((item) => item.id === id);
    if (!layer) return;
    const source = makeCanvas(this.width, this.height);
    const sourceContext = canvasContext(source);
    sourceContext.drawImage(layer.canvas, 0, 0);

    const context = canvasContext(layer.canvas);
    context.clearRect(0, 0, this.width, this.height);
    context.drawImage(source, dx, dy);
    this.emit();
  }

  exportCanvas(background: "transparent" | "white") {
    const canvas = makeCanvas(this.width, this.height);
    const context = canvasContext(canvas);
    if (background === "white") {
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, this.width, this.height);
    }
    this.composite(context);
    return canvas;
  }

  dispose() {
    this.layers = [];
    this.undoStack = [];
    this.redoStack = [];
    this.listeners.clear();
  }
}