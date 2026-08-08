export type BlendMode =
  | "normal"
  | "multiply"
  | "screen"
  | "overlay"
  | "darken"
  | "lighten"
  | "color-dodge"
  | "color-burn"
  | "hard-light"
  | "soft-light"
  | "difference"
  | "exclusion"
  | "hue"
  | "saturation"
  | "color"
  | "luminosity";

export type LayerType = "raster" | "text" | "adjustment" | "vector";

export const BLEND_MODES: BlendMode[] = [
  "normal",
  "multiply",
  "screen",
  "overlay",
  "darken",
  "lighten",
  "color-dodge",
  "color-burn",
  "hard-light",
  "soft-light",
  "difference",
  "exclusion",
  "hue",
  "saturation",
  "color",
  "luminosity"
];

export type ToolId = "move" | "brush" | "eraser" | "bucket" | "eyedropper" | "rectangle-select" | "lasso" | "text";

export type DocumentBackground = "white" | "transparent";

export type Selection = {
  kind: "rect" | "lasso";
  rect?: { x0: number; y0: number; x1: number; y1: number };
  points?: { x: number; y: number }[];
};

export type TextStyle = {
  family: string;
  size: number;
  bold: boolean;
  italic: boolean;
};

export type TextDraft = {
  x: number;
  y: number;
  text: string;
};

export type FilterId =
  | "grayscale"
  | "invert"
  | "brightness"
  | "contrast"
  | "box-blur";

export type FilterConfig = {
  filter: FilterId;
  amount: number;
};

export const FONT_OPTIONS = [
  { label: "Arial, Helvetica, sans-serif", value: "Arial, Helvetica, sans-serif" },
  { label: "Verdana, Geneva, sans-serif", value: "Verdana, Geneva, sans-serif" },
  { label: "Georgia, 'Times New Roman', serif", value: "Georgia, 'Times New Roman', serif" },
  { label: "'Times New Roman', Times, serif", value: "'Times New Roman', Times, serif" },
  { label: "'Courier New', Courier, monospace", value: "'Courier New', Courier, monospace" },
  { label: "'Trebuchet MS', Helvetica, sans-serif", value: "'Trebuchet MS', Helvetica, sans-serif" },
  { label: "Impact, Haettenschweiler, sans-serif", value: "Impact, Haettenschweiler, sans-serif" }
];