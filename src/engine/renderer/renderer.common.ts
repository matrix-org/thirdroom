import { defineObjectBufferSchema, ObjectTripleBuffer } from "../allocator/ObjectBufferView";

export const rendererModuleName = "renderer";

export enum RendererMessageType {
  InitializeCanvas = "renderer-initialize-canvas",
  InitializeResourceManager = "initialize-resource-manager",
  InitializeRendererTripleBuffers = "initialize-renderer-triple-buffers",
  NotifySceneRendered = "renderer-notify-scene-renderer",
  SceneRenderedNotification = "renderer-scene-rendered-notification",
}

export interface InitializeCanvasMessage {
  canvasTarget?: OffscreenCanvas;
  initialCanvasWidth: number;
  initialCanvasHeight: number;
}

export interface NotifySceneRendererMessage {
  type: RendererMessageType.NotifySceneRendered;
  sceneResourceId: number;
  id: number;
}

export interface SceneRenderedNotificationMessage {
  type: RendererMessageType.SceneRenderedNotification;
  id: number;
}

export const rendererStateSchema = defineObjectBufferSchema({
  activeSceneResourceId: [Uint32Array, 1],
  activeCameraResourceId: [Uint32Array, 1],
  deltaTime: [Float32Array, 1],
});

export type RendererStateTripleBuffer = ObjectTripleBuffer<typeof rendererStateSchema>;

export interface InitializeRendererTripleBuffersMessage {
  rendererStateTripleBuffer: RendererStateTripleBuffer;
}
