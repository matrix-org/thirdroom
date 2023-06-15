import { BufferGeometry, DynamicDrawUsage, Float32BufferAttribute, LineBasicMaterial, LineSegments } from "three";

import { getReadObjectBufferView } from "../../allocator/ObjectBufferView";
import { getModule } from "../../module/module.common";
import { RendererModule, RenderContext } from "../renderer.render";
import { PhysicsModule } from "../../physics/physics.render";

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
