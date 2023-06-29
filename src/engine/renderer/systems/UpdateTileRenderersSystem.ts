import { getModule } from "../../module/module.common";
import { updateTransformFromNode } from "../node";
import { RendererModule, RenderContext } from "../renderer.render";

export function UpdateTileRenderersSystem(ctx: RenderContext) {
  const { needsResize, renderer, tileRendererNodes } = getModule(ctx, RendererModule);

  const activeCameraNode = ctx.worldResource.activeCameraNode;

  if (!activeCameraNode?.cameraObject) {
    return;
  }

  for (let i = 0; i < tileRendererNodes.length; i++) {
    const node = tileRendererNodes[i];

    const tilesRenderer = node.tilesRendererObject;

    if (!tilesRenderer) {
      continue;
    }

    const camera = activeCameraNode.cameraObject;

    if (node.tilesRendererCamera !== camera) {
      tilesRenderer.setCamera(camera);
      tilesRenderer.setResolutionFromRenderer(camera, renderer);
      node.tilesRendererCamera = camera;
      updateTransformFromNode(ctx, node, tilesRenderer.group);
    }

    if (needsResize) {
      tilesRenderer.setResolutionFromRenderer(camera, renderer);
    }

    tilesRenderer.update();
  }
}
