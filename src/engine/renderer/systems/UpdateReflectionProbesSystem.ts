import { Texture, WebGLArrayRenderTarget, Event, Vector2 } from "three";

import { getModule } from "../../module/module.common";
import { RendererModule, RenderContext } from "../renderer.render";
import { LoadStatus } from "../../resource/resource.common";
import { getReflectionProbes } from "../ReflectionProbe";

const reflectionProbeMapRenderTargets = new WeakMap<Texture, WebGLArrayRenderTarget>();

export function UpdateReflectionProbesSystem(ctx: RenderContext) {
  const scene = ctx.worldResource.environment?.publicScene;

  if (!scene) {
    return;
  }

  const rendererModule = getModule(ctx, RendererModule);

  const reflectionProbes = getReflectionProbes(ctx);

  let needsUpdate = scene.reflectionProbeNeedsUpdate;

  if (!needsUpdate) {
    for (let i = 0; i < reflectionProbes.length; i++) {
      if (reflectionProbes[i].needsUpdate) {
        needsUpdate = true;
        break;
      }
    }
  }

  // Only update reflection probe texture array if the reflection probes changed
  if (needsUpdate) {
    let useRGBM = false;
    const reflectionProbeTextures: Texture[] = [];

    // Add the scene reflection probe to the texture array
    if (
      scene.reflectionProbe?.reflectionProbeTexture?.loadStatus === LoadStatus.Loaded &&
      scene.reflectionProbe.reflectionProbeTexture.texture
    ) {
      if (scene.reflectionProbe.reflectionProbeTexture.rgbm) {
        useRGBM = true;
      }

      scene.reflectionProbe.textureArrayIndex = reflectionProbeTextures.length;
      scene.reflectionProbeNeedsUpdate = false;
      reflectionProbeTextures.push(scene.reflectionProbe.reflectionProbeTexture.texture);
    }

    // Add each node reflection probe to the texture array array
    for (const reflectionProbe of reflectionProbes) {
      const reflectionProbeTexture = reflectionProbe.resource.reflectionProbeTexture;

      if (!reflectionProbeTexture) {
        throw new Error("Reflection probe texture not yet loaded");
      }

      if (reflectionProbeTexture.loadStatus === LoadStatus.Loaded && reflectionProbeTexture.texture) {
        reflectionProbe.resource.textureArrayIndex = reflectionProbeTextures.length;
        reflectionProbe.needsUpdate = false;
        reflectionProbeTextures.push(reflectionProbeTexture.texture);

        if (reflectionProbeTexture.rgbm) {
          useRGBM = true;
        }
      }
    }

    if (rendererModule.reflectionProbesMap) {
      // Dispose of the previous WebGLArrayRenderTarget
      rendererModule.reflectionProbesMap.dispose();
    }

    if (reflectionProbeTextures.length > 0) {
      const hdrDecodeParams = useRGBM ? new Vector2(34.49, 2.2) : null;

      const renderTarget = (rendererModule.pmremGenerator as any).fromEquirectangularArray(
        reflectionProbeTextures,
        hdrDecodeParams
      );
      reflectionProbeMapRenderTargets.set(renderTarget.texture, renderTarget);
      rendererModule.reflectionProbesMap = renderTarget.texture;

      const onReflectionProbeTextureDisposed = (event: Event) => {
        const texture = event.target as Texture;

        const renderTarget = reflectionProbeMapRenderTargets.get(texture);

        if (renderTarget) {
          reflectionProbeMapRenderTargets.delete(texture);
          // Ensure render target is disposed when the texture is disposed.
          renderTarget.dispose();
        }

        texture.removeEventListener("dispose", onReflectionProbeTextureDisposed);
      };

      renderTarget.texture.addEventListener("dispose", onReflectionProbeTextureDisposed);
      rendererModule.pmremGenerator.dispose(); // Dispose of the extra render target and materials
    } else {
      rendererModule.reflectionProbesMap = null;
    }
  }
}
