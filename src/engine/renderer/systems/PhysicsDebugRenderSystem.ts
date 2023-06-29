import { BufferGeometry, DynamicDrawUsage, Float32BufferAttribute, LineBasicMaterial, LineSegments } from "three";

import { getReadObjectBufferView } from "../../allocator/ObjectBufferView";
import { getModule } from "../../module/module.common";
import { RendererModule, RenderContext } from "../renderer.render";

export function PhysicsDebugRenderSystem(ctx: RenderContext) {
  const renderModule = getModule(ctx, RendererModule);

  if (renderModule.debugRender && renderModule.debugRenderTripleBuffer) {
    const { vertices, colors, size } = getReadObjectBufferView(renderModule.debugRenderTripleBuffer);

    let geometry: BufferGeometry;
    let positionAttribute: Float32BufferAttribute;
    let colorAttribute: Float32BufferAttribute;

    if (!renderModule.debugLines) {
      geometry = new BufferGeometry();

      positionAttribute = new Float32BufferAttribute(vertices, 3);
      positionAttribute.usage = DynamicDrawUsage;
      geometry.setAttribute("position", positionAttribute);

      colorAttribute = new Float32BufferAttribute(colors, 4);
      colorAttribute.usage = DynamicDrawUsage;
      geometry.setAttribute("color", colorAttribute);

      renderModule.debugLines = new LineSegments(
        geometry,
        new LineBasicMaterial({ color: 0xffffff, vertexColors: true })
      );
      renderModule.debugLines.frustumCulled = false;

      renderModule.scene.add(renderModule.debugLines);
    } else {
      geometry = renderModule.debugLines.geometry;
      positionAttribute = renderModule.debugLines.geometry.getAttribute("position") as Float32BufferAttribute;
      colorAttribute = renderModule.debugLines.geometry.getAttribute("color") as Float32BufferAttribute;
    }

    geometry.setDrawRange(0, size[0]);
    positionAttribute.copyArray(vertices);
    positionAttribute.needsUpdate = true;
    colorAttribute.copyArray(colors);
    colorAttribute.needsUpdate = true;
  } else if (renderModule.debugLines) {
    renderModule.scene.remove(renderModule.debugLines);
    renderModule.debugLines.geometry.dispose();
    renderModule.debugLines = undefined;
  }
}
