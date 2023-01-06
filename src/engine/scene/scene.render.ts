import { Color } from "three";

import { getModule } from "../module/module.common";
import { updateSceneReflectionProbe } from "../reflection-probe/reflection-probe.render";
import { RendererModule } from "../renderer/renderer.render";
import { RenderThreadState } from "../renderer/renderer.render";
import { RenderNode, RenderScene, RenderWorld } from "../resource/resource.render";

const blackBackground = new Color(0x000000);

export function updateActiveSceneResource(ctx: RenderThreadState, activeScene: RenderScene | undefined) {
  const rendererModule = getModule(ctx, RendererModule);

  if (activeScene) {
    rendererModule.scene.visible = true;

    const currentBackgroundTextureResourceId = activeScene.currentBackgroundTextureResourceId;
    const nextBackgroundTextureResourceId = activeScene.backgroundTexture?.resourceId || 0;

    if (nextBackgroundTextureResourceId !== currentBackgroundTextureResourceId) {
      if (activeScene.backgroundTexture) {
        rendererModule.scene.background = activeScene.backgroundTexture.texture;
      } else {
        rendererModule.scene.background = null;
      }
    }

    activeScene.currentBackgroundTextureResourceId = nextBackgroundTextureResourceId;

    rendererModule.renderPipeline.bloomPass.strength = activeScene.bloomStrength;

    updateSceneReflectionProbe(ctx, activeScene);

    if (rendererModule.enableMatrixMaterial) {
      rendererModule.scene.overrideMaterial = rendererModule.matrixMaterial;
      rendererModule.scene.background = blackBackground;
    } else {
      rendererModule.scene.overrideMaterial = null;
      rendererModule.scene.background = activeScene.backgroundTexture?.texture || null;
    }
  } else {
    rendererModule.scene.visible = false;
  }
}

export function updateWorldVisibility(worldResource: RenderWorld) {
  updateSceneVisibility(worldResource.persistentScene);

  if (worldResource.transientScene) {
    updateSceneVisibility(worldResource.transientScene);
  }

  if (worldResource.environment?.activeScene) {
    updateSceneVisibility(worldResource.environment.activeScene);
  }

  const avatars = worldResource.avatars;

  for (let i = 0; i < avatars.length; i++) {
    updateNodeVisibility(avatars[i].root, true);
  }
}

function updateSceneVisibility(scene: RenderScene) {
  let curChild = scene.firstNode;

  while (curChild) {
    updateNodeVisibility(curChild, true);
    curChild = curChild.nextSibling;
  }
}

function updateNodeVisibility(node: RenderNode, parentVisibility: boolean) {
  node.object3DVisible = node.visible && parentVisibility;

  let curChild = node.firstChild;

  while (curChild) {
    updateNodeVisibility(curChild, node.object3DVisible);
    curChild = curChild.nextSibling;
  }
}
