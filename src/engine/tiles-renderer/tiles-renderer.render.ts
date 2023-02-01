import { TilesRenderer } from "3d-tiles-renderer";
import { Scene } from "three";

import { getModule } from "../module/module.common";
import { updateTransformFromNode } from "../node/node.render";
import { RendererModule, RenderThreadState } from "../renderer/renderer.render";
import { RenderNode } from "../resource/resource.render";

export function updateNodeTilesRenderer(ctx: RenderThreadState, scene: Scene, node: RenderNode) {
  const { tileRendererNodes } = getModule(ctx, RendererModule);

  const currentTilesRendererResourceId = node.currentTilesRendererResourceId;
  const nextTilesRendererResourceId = node.tilesRenderer?.eid || 0;

  if (currentTilesRendererResourceId !== nextTilesRendererResourceId && node.tilesRendererObject) {
    scene.remove(node.tilesRendererObject.group);
    node.tilesRendererObject.dispose();
    node.tilesRendererObject = undefined;
    node.currentTilesRendererResourceId = nextTilesRendererResourceId;

    const index = tileRendererNodes.indexOf(node);

    if (index !== -1) {
      tileRendererNodes.splice(index, 1);
    }
  }

  if (!node.tilesRenderer) {
    return;
  }

  if (!node.tilesRendererObject) {
    node.tilesRendererObject = new TilesRenderer(node.tilesRenderer.uri);
    scene.add(node.tilesRendererObject.group);
    tileRendererNodes.push(node);
  }

  updateTransformFromNode(ctx, node, node.tilesRendererObject.group);
}

export function updateTileRenderers(ctx: RenderThreadState, nodes: RenderNode[], cameraNode: RenderNode | undefined) {
  const { needsResize, renderer } = getModule(ctx, RendererModule);

  if (!cameraNode?.cameraObject) {
    return;
  }

  for (const node of nodes) {
    const tilesRenderer = node.tilesRendererObject;

    if (!tilesRenderer) {
      continue;
    }

    const camera = cameraNode.cameraObject;

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
