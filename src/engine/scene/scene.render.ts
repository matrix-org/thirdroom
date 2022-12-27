import { Color } from "three";

import { getModule } from "../module/module.common";
import { updateSceneReflectionProbe } from "../reflection-probe/reflection-probe.render";
import { RendererModule } from "../renderer/renderer.render";
import { RenderThreadState } from "../renderer/renderer.render";
import { getLocalResources, RenderNode, RenderScene } from "../resource/resource.render";

const blackBackground = new Color(0x000000);

export function updateLocalSceneResources(ctx: RenderThreadState, activeSceneResourceId: number) {
  const scenes = getLocalResources(ctx, RenderScene);

  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];

    const currentBackgroundTextureResourceId = scene.currentBackgroundTextureResourceId;
    const nextBackgroundTextureResourceId = scene.backgroundTexture?.resourceId || 0;

    if (nextBackgroundTextureResourceId !== currentBackgroundTextureResourceId) {
      if (scene.backgroundTexture) {
        scene.sceneObject.background = scene.backgroundTexture.texture;
      } else {
        scene.sceneObject.background = null;
      }
    }

    scene.currentBackgroundTextureResourceId = nextBackgroundTextureResourceId;

    const rendererModule = getModule(ctx, RendererModule);

    if (scene.resourceId === activeSceneResourceId) {
      rendererModule.renderPipeline.bloomPass.strength = scene.bloomStrength;
      updateSceneVisibility(ctx, scene);
    }

    updateSceneReflectionProbe(ctx, scene);

    if (rendererModule.enableMatrixMaterial) {
      scene.sceneObject.overrideMaterial = rendererModule.matrixMaterial;
      scene.sceneObject.background = blackBackground;
    } else {
      scene.sceneObject.overrideMaterial = null;
      scene.sceneObject.background = scene.backgroundTexture?.texture || null;
    }
  }
}

function updateSceneVisibility(ctx: RenderThreadState, scene: RenderScene) {
  let curChild = scene.firstNode;

  while (curChild) {
    updateNodeVisibility(curChild, true);
    curChild = curChild.nextSibling;
  }
}

export function updateNodeVisibility(node: RenderNode, parentVisibility: boolean) {
  node.object3DVisible = node.visible && parentVisibility;

  let curChild = node.firstChild;

  while (curChild) {
    updateNodeVisibility(curChild, node.object3DVisible);
    curChild = curChild.nextSibling;
  }
}
