import { canvasContext, hexToRgba, type EditorEngine, type EditorLayer } from "./engine";
import type { FilterId, TextStyle } from "./types";

export type StrokeTool = "brush" | "eraser";

export function beginStroke(engine: EditorEngine, layer: EditorLayer) {
  if (!layer) return false;
  engine.pushHistory();
  return true;
}

function applySelectionStroke(
  engine: EditorEngine,
  context: CanvasRenderingContext2D
): (() => void) | null {
  const path = engine.getSelectionPath2D();
  if (!path) return null;
  context.save();
  context.clip(path);
  return () => context.restore();
}

export function paintSegment(
  engine: EditorEngine,
  layer: EditorLayer,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: string,
  size: number,
  opacity: number,
  tool: StrokeTool
) {
  if (!layer) return;
  const context = canvasContext(layer.canvas);
  const restoreClip = applySelectionStroke(engine, context);

  context.save();
  context.lineCap = "round";
  context.lineJoin = "round";
  context.lineWidth = Math.max(1, size);
  context.globalAlpha = Math.max(0, Math.min(1, opacity / 100));
  if (tool === "eraser") {
    context.globalCompositeOperation = "destination-out";
  } else {
    context.globalCompositeOperation = "source-over";
    context.strokeStyle = color;
  }
  context.beginPath();
  context.moveTo(x0, y0);
  context.lineTo(x1, y1);
  context.stroke();
  context.restore();

  if (restoreClip) {
    restoreClip();
  }
}

export function floodFill(
  engine: EditorEngine,
  x: number,
  y: number,
  fillColor: string,
  tolerance: number
) {
  const layer = engine.activeLayer;
  if (!layer) return;

  const intX = Math.floor(x);
  const intY = Math.floor(y);
  if (intX < 0 || intY < 0 || intX >= engine.width || intY >= engine.height) {
    return;
  }

  const context = canvasContext(layer.canvas);
  const imageData = context.getImageData(0, 0, engine.width, engine.height);
  const data = imageData.data;
  const width = engine.width;
  const height = engine.height;

  const startIndex = (intY * width + intX) * 4;
  const targetR = data[startIndex];
  const targetG = data[startIndex + 1];
  const targetB = data[startIndex + 2];
  const targetA = data[startIndex + 3];

  const fill = hexToRgba(fillColor, 255);
  if (
    Math.abs(targetR - fill.r) <= tolerance &&
    Math.abs(targetG - fill.g) <= tolerance &&
    Math.abs(targetB - fill.b) <= tolerance &&
    Math.abs(targetA - fill.a) <= tolerance
  ) {
    return;
  }

  engine.pushHistory();

  const selectionMask = engine.renderSelectionMask();
  const visited = new Uint8Array(width * height);
  const stack: number[] = [intX, intY];

  while (stack.length > 0) {
    const py = stack.pop() as number;
    const px = stack.pop() as number;
    const index = py * width + px;

    if (visited[index]) continue;
    visited[index] = 1;

    if (selectionMask && selectionMask[index * 4 + 3] === 0) {
      continue;
    }

    const offset = index * 4;
    if (
      Math.abs(data[offset] - targetR) > tolerance ||
      Math.abs(data[offset + 1] - targetG) > tolerance ||
      Math.abs(data[offset + 2] - targetB) > tolerance ||
      Math.abs(data[offset + 3] - targetA) > tolerance
    ) {
      continue;
    }

    data[offset] = fill.r;
    data[offset + 1] = fill.g;
    data[offset + 2] = fill.b;
    data[offset + 3] = fill.a;

    if (px > 0) stack.push(px - 1, py);
    if (px < width - 1) stack.push(px + 1, py);
    if (py > 0) stack.push(px, py - 1);
    if (py < height - 1) stack.push(px, py + 1);
  }

  context.putImageData(imageData, 0, 0);
  engine.emit();
}

export function sampleColorAtDisplay(
  displayCanvas: HTMLCanvasElement,
  x: number,
  y: number
): { r: number; g: number; b: number; a: number } | null {
  const context = displayCanvas.getContext("2d", { willReadFrequently: true });
  if (!context) return null;
  const xClamped = Math.max(0, Math.min(displayCanvas.width - 1, Math.floor(x)));
  const yClamped = Math.max(0, Math.min(displayCanvas.height - 1, Math.floor(y)));
  const pixel = context.getImageData(xClamped, yClamped, 1, 1).data;
  return { r: pixel[0], g: pixel[1], b: pixel[2], a: pixel[3] };
}

export function applyFilterToLayer(
  engine: EditorEngine,
  layer: EditorLayer,
  filterId: FilterId,
  amount: number
) {
  if (!layer) return;
  const context = canvasContext(layer.canvas);
  const imageData = context.getImageData(0, 0, engine.width, engine.height);
  const data = imageData.data;

  switch (filterId) {
    case "grayscale":
      for (let i = 0; i < data.length; i += 4) {
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        data[i] = gray;
        data[i + 1] = gray;
        data[i + 2] = gray;
      }
      break;
    case "invert":
      for (let i = 0; i < data.length; i += 4) {
        data[i] = 255 - data[i];
        data[i + 1] = 255 - data[i + 1];
        data[i + 2] = 255 - data[i + 2];
      }
      break;
    case "brightness": {
      const delta = (amount / 100) * 255;
      for (let i = 0; i < data.length; i += 4) {
        data[i] = clampByte(data[i] + delta);
        data[i + 1] = clampByte(data[i + 1] + delta);
        data[i + 2] = clampByte(data[i + 2] + delta);
      }
      break;
    }
    case "contrast": {
      const factor = (259 * (amount + 255)) / (255 * (259 - amount));
      for (let i = 0; i < data.length; i += 4) {
        data[i] = clampByte(factor * (data[i] - 128) + 128);
        data[i + 1] = clampByte(factor * (data[i + 1] - 128) + 128);
        data[i + 2] = clampByte(factor * (data[i + 2] - 128) + 128);
      }
      break;
    }
    case "box-blur": {
      const radius = Math.max(0, Math.min(20, Math.round(amount)));
      if (radius > 0) {
        const blurred = twoPassBoxBlur(data, engine.width, engine.height, radius);
        for (let i = 0; i < data.length; i += 1) {
          data[i] = blurred[i];
        }
      }
      break;
    }
  }

  context.putImageData(imageData, 0, 0);
}

export function clampByte(value: number) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function clampIndex(value: number, max: number) {
  return Math.max(0, Math.min(max - 1, value));
}

function twoPassBoxBlur(
  source: Uint8ClampedArray,
  width: number,
  height: number,
  radius: number
) {
  const channels = 4;
  const horizontal = new Uint8ClampedArray(source.length);
  const output = new Uint8ClampedArray(source.length);
  const kernel = 2 * radius + 1;

  for (let channel = 0; channel < channels; channel += 1) {
    for (let y = 0; y < height; y += 1) {
      const rowOffset = y * width;
      let sum = 0;
      for (let k = -radius; k <= radius; k += 1) {
        const x = clampIndex(k, width);
        sum += source[(rowOffset + x) * channels + channel];
      }
      for (let x = 0; x < width; x += 1) {
        const idx = (rowOffset + x) * channels + channel;
        horizontal[idx] = sum / kernel;
        const removeX = clampIndex(x - radius, width);
        const addX = clampIndex(x + radius + 1, width);
        sum +=
          source[(rowOffset + addX) * channels + channel] -
          source[(rowOffset + removeX) * channels + channel];
      }
    }
  }

  for (let channel = 0; channel < channels; channel += 1) {
    for (let x = 0; x < width; x += 1) {
      let sum = 0;
      for (let k = -radius; k <= radius; k += 1) {
        const y = clampIndex(k, height);
        sum += horizontal[(y * width + x) * channels + channel];
      }
      for (let y = 0; y < height; y += 1) {
        const offset = (y * width + x) * channels + channel;
        output[offset] = sum / kernel;
        const removeY = clampIndex(y - radius, height);
        const addY = clampIndex(y + radius + 1, height);
        sum +=
          horizontal[(addY * width + x) * channels + channel] -
          horizontal[(removeY * width + x) * channels + channel];
      }
    }
  }

  return output;
}

export function rasterizeText(
  width: number,
  height: number,
  text: string,
  x: number,
  y: number,
  textStyle: TextStyle,
  color: string,
  lineHeight = 1.35
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return canvas;

  const weight = textStyle.bold ? "bold" : "normal";
  const style = textStyle.italic ? "italic" : "normal";
  context.font = `${style} ${weight} ${textStyle.size}px ${textStyle.family}`;
  context.fillStyle = color;
  context.textBaseline = "top";

  const lines = text.split("\n");
  const fontSize = textStyle.size;
  const leading = fontSize * lineHeight;
  lines.forEach((line, index) => {
    context.fillText(line, x, y + index * leading);
  });

  return canvas;
}

export function trimTextCanvas(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return canvas;
  const { width, height } = canvas;
  const imageData = context.getImageData(0, 0, width, height);
  const data = imageData.data;

  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 4;
      if (data[offset + 3] !== 0) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX < 0) {
    return canvas;
  }

  const trimmedWidth = maxX - minX + 1;
  const trimmedHeight = maxY - minY + 1;
  const trimmed = document.createElement("canvas");
  trimmed.width = trimmedWidth;
  trimmed.height = trimmedHeight;
  const trimmedContext = trimmed.getContext("2d");
  if (!trimmedContext) return canvas;
  trimmedContext.putImageData(imageData, -minX, -minY);
  return trimmed;
}

export async function loadImageFromFile(
  file: File
): Promise<{ image: HTMLImageElement; width: number; height: number }> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file.");
  }
  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Could not load that image file."));
      img.src = url;
    });
    return { image, width: image.naturalWidth, height: image.naturalHeight };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function importImageAsLayerCanvas(
  image: HTMLImageElement,
  imageWidth: number,
  imageHeight: number,
  documentWidth: number,
  documentHeight: number
): HTMLCanvasElement {
  const options = fitToDoc(imageWidth, imageHeight, documentWidth, documentHeight);
  const canvas = document.createElement("canvas");
  canvas.width = documentWidth;
  canvas.height = documentHeight;
  const context = canvas.getContext("2d");
  if (!context) return canvas;
  const x = Math.round((documentWidth - options.width) / 2);
  const y = Math.round((documentHeight - options.height) / 2);
  context.drawImage(image, x, y, options.width, options.height);
  return canvas;
}

export function drawImageScaledToDoc(
  layerCanvas: HTMLCanvasElement,
  image: HTMLImageElement,
  imageWidth: number,
  imageHeight: number
) {
  const options = fitToDoc(imageWidth, imageHeight, layerCanvas.width, layerCanvas.height);
  const x = Math.round((layerCanvas.width - options.width) / 2);
  const y = Math.round((layerCanvas.height - options.height) / 2);
  const context = canvasContext(layerCanvas);
  context.clearRect(0, 0, layerCanvas.width, layerCanvas.height);
  context.drawImage(image, x, y, options.width, options.height);
}

export function fitToDoc(width: number, height: number, maxWidth: number, maxHeight: number) {
  const scale = Math.min(maxWidth / width, maxHeight / height, 1);
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale))
  };
}