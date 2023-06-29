import { Color } from "three";

import { getModule } from "../../module/module.common";
import { RendererModule, RenderContext } from "../renderer.render";
import { LoadStatus } from "../../resource/resource.common";
import { RenderScene } from "../RenderResources";

const blackBackground = new Color(0x000000);

export function UpdateActiveSceneResourceSystem(ctx: RenderContext) {
  const rendererModule = getModule(ctx, RendererModule);

  const activeScene = ctx.worldResource.environment?.publicScene;

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

function updateSceneReflectionProbe(ctx: RenderContext, scene: RenderScene) {
  const currentReflectionProbeResourceId = scene.currentReflectionProbeResourceId;
  const nextReflectionProbeResourceId = scene.reflectionProbe?.eid || 0;

  if (nextReflectionProbeResourceId !== currentReflectionProbeResourceId) {
    scene.reflectionProbeNeedsUpdate = true;
  }

  scene.currentReflectionProbeResourceId = nextReflectionProbeResourceId;
}
