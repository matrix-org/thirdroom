import { TripleBufferBackedObjectBufferView } from "../allocator/ObjectBufferView";
import { renderableSchema } from "../component/renderable.common";
import { worldMatrixObjectBufferSchema } from "../component/transform.common";
import { ResourceManager } from "../resources/ResourceManager";

export const rendererModuleName = "renderer";

export enum RendererMessageType {
  InitializeCanvas = "renderer-initialize-canvas",
  InitializeResourceManager = "initialize-resource-manager",
  InitializeRendererTripleBuffers = "initialize-renderer-triple-buffers",
}

export interface InitializeCanvasMessage {
  canvasTarget: HTMLCanvasElement | OffscreenCanvas;
  initialCanvasWidth: number;
  initialCanvasHeight: number;
}

export interface InitializeResourceManagerMessage {
  resourceManagerBuffer: ResourceManager;
}

export interface InitializeRendererTripleBuffersMessage {
  renderableObjectTripleBuffer: TripleBufferBackedObjectBufferView<typeof renderableSchema, ArrayBuffer>;
  worldMatrixObjectTripleBuffer: TripleBufferBackedObjectBufferView<typeof worldMatrixObjectBufferSchema, ArrayBuffer>;
}
