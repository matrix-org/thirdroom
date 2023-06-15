import { LineSegments } from "three";

import { defineModule, getModule, registerMessageHandler } from "../module/module.common";
import { RenderContext } from "../renderer/renderer.render";
import { createDisposables } from "../utils/createDisposables";
import { PhysicsDebugRenderTripleBuffer, PhysicsEnableDebugRenderMessage, PhysicsMessageType } from "./physics.common";

export interface RenderPhysicsModuleState {
  debugRender: boolean;
  debugRenderTripleBuffer?: PhysicsDebugRenderTripleBuffer;
  debugLines?: LineSegments;
}

export const PhysicsModule = defineModule<RenderContext, RenderPhysicsModuleState>({
  name: "physics",
  async create() {
    return {
      debugRender: true,
      debugRenderTripleBuffer: undefined,
    };
  },
  init(ctx) {
    return createDisposables([
      registerMessageHandler(ctx, PhysicsMessageType.PhysicsEnableDebugRender, onEnableDebugRender),
      registerMessageHandler(ctx, PhysicsMessageType.PhysicsDisableDebugRender, onDisableDebugRender),
    ]);
  },
});

function onEnableDebugRender(ctx: RenderContext, { tripleBuffer }: PhysicsEnableDebugRenderMessage) {
  const physicsModule = getModule(ctx, PhysicsModule);
  physicsModule.debugRender = true;
  physicsModule.debugRenderTripleBuffer = tripleBuffer;
}

function onDisableDebugRender(ctx: RenderContext) {
  const physicsModule = getModule(ctx, PhysicsModule);
  physicsModule.debugRender = false;
  physicsModule.debugRenderTripleBuffer = undefined;
}
