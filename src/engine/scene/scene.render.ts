import { Color, Scene } from "three";

import { getModule } from "../module/module.common";
import { RendererNodeResource } from "../node/node.render";
import {
  RendererReflectionProbeResource,
  updateSceneReflectionProbe,
} from "../reflection-probe/reflection-probe.render";
import { RendererModule } from "../renderer/renderer.render";
import { RenderThreadState } from "../renderer/renderer.render";
import { defineLocalResourceClass } from "../resource/LocalResourceClass";
import { getLocalResources } from "../resource/resource.render";
import { SceneResource } from "../resource/schema";
import { RendererTextureResource } from "../texture/texture.render";

export class RendererSceneResource extends defineLocalResourceClass<typeof SceneResource>(SceneResource) {
  sceneObject: Scene = new Scene();
  declare backgroundTexture: RendererTextureResource | undefined;
  currentBackgroundTextureResourceId = 0;
  declare reflectionProbe: RendererReflectionProbeResource | undefined;
  currentReflectionProbeResourceId = 0;
  reflectionProbeNeedsUpdate = false;
}

const blackBackground = new Color(0x000000);

export function updateLocalSceneResources(ctx: RenderThreadState, activeSceneResourceId: number) {
  const scenes = getLocalResources(ctx, RendererSceneResource);

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

function updateSceneVisibility(ctx: RenderThreadState, scene: RendererSceneResource) {
  let curChild = scene.firstNode as RendererNodeResource | undefined;

  while (curChild) {
    updateNodeVisibility(curChild, true);
    curChild = curChild.nextSibling as RendererNodeResource | undefined;
  }
}

export function updateNodeVisibility(node: RendererNodeResource, parentVisibility: boolean) {
  node.object3DVisible = node.visible && parentVisibility;

  let curChild = node.firstChild as RendererNodeResource | undefined;

  while (curChild) {
    updateNodeVisibility(curChild, node.object3DVisible);
    curChild = curChild.nextSibling as RendererNodeResource | undefined;
  }
}
