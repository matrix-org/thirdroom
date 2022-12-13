import { TilesRenderer } from "3d-tiles-renderer";
import { Camera, Scene } from "three";

import { ReadObjectTripleBufferView } from "../allocator/ObjectBufferView";
import { getModule } from "../module/module.common";
import { RendererNodeTripleBuffer } from "../node/node.common";
import { LocalNode, updateTransformFromNode } from "../node/node.render";
import { RendererModule, RenderThreadState } from "../renderer/renderer.render";
import { defineLocalResourceClass } from "../resource/LocalResourceClass";
import { getLocalResource } from "../resource/resource.render";
import { TilesRendererResource } from "../resource/schema";

export class RendererTilesRendererResource extends defineLocalResourceClass<
  typeof TilesRendererResource,
  RenderThreadState
>(TilesRendererResource) {
  camera?: Camera;
  tilesRenderer: TilesRenderer = new TilesRenderer("");

  async load() {
    this.tilesRenderer = new TilesRenderer(this.uri);
  }
}

export function updateNodeTilesRenderer(
  ctx: RenderThreadState,
  scene: Scene,
  cameraNode: LocalNode | undefined,
  node: LocalNode,
  nodeReadView: ReadObjectTripleBufferView<RendererNodeTripleBuffer>
) {
  const currentTilesRendererResourceId = node.tilesRenderer?.resourceId || 0;
  const nextTilesRendererResourceId = nodeReadView.tilesRenderer[0];

  if (currentTilesRendererResourceId !== nextTilesRendererResourceId) {
    if (node.tilesRenderer) {
      scene.remove(node.tilesRenderer.tilesRenderer.group);
      node.tilesRenderer.tilesRenderer.dispose();
    }

    if (nextTilesRendererResourceId) {
      node.tilesRenderer = getLocalResource<RendererTilesRendererResource>(ctx, nextTilesRendererResourceId)?.resource;

      if (node.tilesRenderer) {
        scene.add(node.tilesRenderer.tilesRenderer.group);
      }
    } else {
      node.tilesRenderer = undefined;
    }
  }

  if (!node.tilesRenderer) {
    return;
  }

  const { needsResize, renderer } = getModule(ctx, RendererModule);

  const tilesRendererResource = node.tilesRenderer;
  const tilesRenderer = tilesRendererResource.tilesRenderer;

  if (!cameraNode?.cameraObject) {
    return;
  }

  const camera = cameraNode.cameraObject;

  if (tilesRendererResource.camera !== camera) {
    tilesRenderer.setCamera(camera);
    tilesRenderer.setResolutionFromRenderer(camera, renderer);
    tilesRendererResource.camera = camera;
  }

  if (needsResize) {
    tilesRenderer.setResolutionFromRenderer(camera, renderer);
  }

  tilesRenderer.update();

  updateTransformFromNode(ctx, nodeReadView, tilesRenderer.group);
}
