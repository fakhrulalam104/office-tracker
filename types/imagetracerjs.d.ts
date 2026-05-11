declare module "imagetracerjs" {
  type ImageTracerOptions = Record<string, unknown>;

  type TracedData = {
    width: number;
    height: number;
    palette: Array<{ r: number; g: number; b: number; a: number }>;
    layers: Array<Array<unknown>>;
  };

  const ImageTracer: {
    imagedataToTracedata(imageData: ImageData, options?: ImageTracerOptions): TracedData;
    getsvgstring(tracedData: TracedData, options?: ImageTracerOptions): string;
  };

  export default ImageTracer;
}
