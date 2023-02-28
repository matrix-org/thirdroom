import { Color } from "three";

import { getModule } from "../module/module.common";
import { updateSceneReflectionProbe } from "../reflection-probe/reflection-probe.render";
import { RendererModule } from "../renderer/renderer.render";
import { RenderThreadState } from "../renderer/renderer.render";
import { LoadStatus } from "../resource/resource.common";
import { getLocalResources, RenderNode, RenderScene } from "../resource/resource.render";

const blackBackground = new Color(0x000000);

export function updateActiveSceneResource(ctx: RenderThreadState, activeScene: RenderScene | undefined) {
  const rendererModule = getModule(ctx, RendererModule);

  if (activeScene) {
    rendererModule.scene.visible = true;

    const currentBackgroundTextureResourceId = activeScene.currentBackgroundTextureResourceId;
    const nextBackgroundTextureResourceId = activeScene.backgroundTexture?.eid || 0;

    if (
      nextBackgroundTextureResourceId !== currentBackgroundTextureResourceId &&
      activeScene.backgroundTexture?.loadStatus === LoadStatus.Loaded
    ) {
      activeScene.currentBackgroundTextureResourceId = nextBackgroundTextureResourceId;
    }

    rendererModule.renderPipeline.bloomPass.strength = activeScene.bloomStrength;
    rendererModule.renderPipeline.bloomPass.threshold = activeScene.bloomThreshold;
    rendererModule.renderPipeline.bloomPass.radius = activeScene.bloomRadius;

    updateSceneReflectionProbe(ctx, activeScene);

    if (rendererModule.enableMatrixMaterial) {
      rendererModule.scene.overrideMaterial = rendererModule.matrixMaterial;
      rendererModule.scene.background = blackBackground;
    } else {
      rendererModule.scene.overrideMaterial = null;

      const xrSession = rendererModule.renderer.xr.getSession();

      let showBackground = true;

      if (xrSession && activeScene.supportsAR) {
        showBackground = xrSession.environmentBlendMode === "opaque";
      }

      if (activeScene.backgroundTexture?.loadStatus === LoadStatus.Loaded && showBackground) {
        rendererModule.scene.background = activeScene.backgroundTexture?.texture || null;
      } else {
        rendererModule.scene.background = null;
      }
    }
  } else {
    rendererModule.scene.visible = false;
  }
}

export function updateWorldVisibility(ctx: RenderThreadState, ignoreStatic: boolean) {
  const nodes = getLocalResources(ctx, RenderNode);

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];

    if (!node.isStatic && !ignoreStatic) {
      node.object3DVisible = false;
    }
  }

  const worldResource = ctx.worldResource;

  if (worldResource.environment) {
    updateSceneVisibility(worldResource.environment.privateScene, ignoreStatic);
    updateSceneVisibility(worldResource.environment.publicScene, ignoreStatic);
  }

  let nextNode = worldResource.firstNode;

  while (nextNode) {
    updateNodeVisibility(nextNode, true, ignoreStatic);
    nextNode = nextNode.nextSibling;
  }

  updateSceneVisibility(worldResource.persistentScene, ignoreStatic);
}

function updateSceneVisibility(scene: RenderScene, ignoreStatic: boolean) {
  let curChild = scene.firstNode;

  while (curChild) {
    updateNodeVisibility(curChild, true, ignoreStatic);
    curChild = curChild.nextSibling;
  }
}

function updateNodeVisibility(node: RenderNode, parentVisibility: boolean, ignoreStatic: boolean) {
  if (node.isStatic && !ignoreStatic) {
    return;
  }

  node.object3DVisible = node.visible && parentVisibility;

  let curChild = node.firstChild;

  while (curChild) {
    updateNodeVisibility(curChild, node.object3DVisible, ignoreStatic);
    curChild = curChild.nextSibling;
  }
}
