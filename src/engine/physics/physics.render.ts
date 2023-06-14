import { BufferGeometry, DynamicDrawUsage, Float32BufferAttribute, LineBasicMaterial, LineSegments } from "three";

import { getReadObjectBufferView } from "../allocator/ObjectBufferView";
import { defineModule, getModule, registerMessageHandler } from "../module/module.common";
import { RendererModule, RenderContext } from "../renderer/renderer.render";
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

export function PhysicsDebugRenderSystem(ctx: RenderContext) {
  const physicsModule = getModule(ctx, PhysicsModule);
  const renderModule = getModule(ctx, RendererModule);

  if (physicsModule.debugRender && physicsModule.debugRenderTripleBuffer) {
    const { vertices, colors, size } = getReadObjectBufferView(physicsModule.debugRenderTripleBuffer);

    let geometry: BufferGeometry;
    let positionAttribute: Float32BufferAttribute;
    let colorAttribute: Float32BufferAttribute;

    if (!physicsModule.debugLines) {
      geometry = new BufferGeometry();

      positionAttribute = new Float32BufferAttribute(vertices, 3);
      positionAttribute.usage = DynamicDrawUsage;
      geometry.setAttribute("position", positionAttribute);

      colorAttribute = new Float32BufferAttribute(colors, 4);
      colorAttribute.usage = DynamicDrawUsage;
      geometry.setAttribute("color", colorAttribute);

      physicsModule.debugLines = new LineSegments(
        geometry,
        new LineBasicMaterial({ color: 0xffffff, vertexColors: true })
      );
      physicsModule.debugLines.frustumCulled = false;

      renderModule.scene.add(physicsModule.debugLines);
    } else {
      geometry = physicsModule.debugLines.geometry;
      positionAttribute = physicsModule.debugLines.geometry.getAttribute("position") as Float32BufferAttribute;
      colorAttribute = physicsModule.debugLines.geometry.getAttribute("color") as Float32BufferAttribute;
    }

    geometry.setDrawRange(0, size[0]);
    positionAttribute.copyArray(vertices);
    positionAttribute.needsUpdate = true;
    colorAttribute.copyArray(colors);
    colorAttribute.needsUpdate = true;
  } else if (physicsModule.debugLines) {
    renderModule.scene.remove(physicsModule.debugLines);
    physicsModule.debugLines.geometry.dispose();
    physicsModule.debugLines = undefined;
  }
}
