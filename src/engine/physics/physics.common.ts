import { ObjectTripleBuffer } from "../allocator/ObjectBufferView";

export enum PhysicsMessageType {
  TogglePhysicsDebug = "toggle-physics-debug",
  PhysicsEnableDebugRender = "physics-enable-debug-render",
  PhysicsDisableDebugRender = "physics-disable-debug-render",
}

export type PhysicsDebugRenderTripleBuffer = ObjectTripleBuffer<{
  size: [Uint32ArrayConstructor, number];
  vertices: [Float32ArrayConstructor, number];
  colors: [Float32ArrayConstructor, number];
}>;

export interface TogglePhysicsDebugMessage {
  type: PhysicsMessageType.TogglePhysicsDebug;
}

export interface PhysicsEnableDebugRenderMessage {
  type: PhysicsMessageType.PhysicsEnableDebugRender;
  tripleBuffer: PhysicsDebugRenderTripleBuffer;
}

export interface PhysicsDisableDebugRenderMessage {
  type: PhysicsMessageType.PhysicsDisableDebugRender;
}
