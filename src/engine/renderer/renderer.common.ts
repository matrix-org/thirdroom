import { defineObjectBufferSchema, TripleBufferBackedObjectBufferView } from "../allocator/ObjectBufferView";

export const rendererModuleName = "renderer";

export enum RendererMessageType {
  InitializeCanvas = "renderer-initialize-canvas",
  InitializeResourceManager = "initialize-resource-manager",
  InitializeRendererTripleBuffers = "initialize-renderer-triple-buffers",
}

export interface InitializeCanvasMessage {
  canvasTarget?: OffscreenCanvas;
  initialCanvasWidth: number;
  initialCanvasHeight: number;
}

export const rendererSchema = defineObjectBufferSchema({
  activeSceneResourceId: [Uint32Array, 1],
  activeCameraResourceId: [Uint32Array, 1],
});

export interface InitializeRendererTripleBuffersMessage {
  sharedRendererState: TripleBufferBackedObjectBufferView<typeof rendererSchema, ArrayBuffer>;
}
