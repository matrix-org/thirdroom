import { TilesRenderer } from "3d-tiles-renderer";
import { Scene } from "three";

import { getModule } from "../module/module.common";
import { updateTransformFromNode } from "../node/node.render";
import { RendererModule, RenderThreadState } from "../renderer/renderer.render";
import { RenderNode } from "../resource/resource.render";

export function updateNodeTilesRenderer(
  ctx: RenderThreadState,
  scene: Scene,
  cameraNode: RenderNode | undefined,
  node: RenderNode
) {
  const currentTilesRendererResourceId = node.currentTilesRendererResourceId;
  const nextTilesRendererResourceId = node.tilesRenderer?.eid || 0;

  if (currentTilesRendererResourceId !== nextTilesRendererResourceId && node.tilesRendererObject) {
    scene.remove(node.tilesRendererObject.group);
    node.tilesRendererObject.dispose();
    node.tilesRendererObject = undefined;
  }

  if (!node.tilesRenderer) {
    return;
  }

  if (!node.tilesRendererObject) {
    node.tilesRendererObject = new TilesRenderer(node.tilesRenderer.uri);
    scene.add(node.tilesRendererObject.group);
  }

  const { needsResize, renderer } = getModule(ctx, RendererModule);

  const tilesRenderer = node.tilesRendererObject;

  if (!cameraNode?.cameraObject) {
    return;
  }

  const camera = cameraNode.cameraObject;

  if (node.tilesRendererCamera !== camera) {
    tilesRenderer.setCamera(camera);
    tilesRenderer.setResolutionFromRenderer(camera, renderer);
    node.tilesRendererCamera = camera;
  }

  if (needsResize) {
    tilesRenderer.setResolutionFromRenderer(camera, renderer);
  }

  tilesRenderer.update();

  updateTransformFromNode(ctx, node, tilesRenderer.group);
}
