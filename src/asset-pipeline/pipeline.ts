import { Document, PlatformIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { textureResize } from "@gltf-transform/functions";

import { KHRAudioExtension } from "./extensions/KHRAudioExtension";
import { MXBackgroundExtension } from "./extensions/MXBackgroundExtension";
import { MXLightmapExtension } from "./extensions/MXLightmapExtension";
import { MXLightsShadowsExtension } from "./extensions/MXLightsShadows";
import { MXPortalExtension } from "./extensions/MXPortalExtension";
import { MXPostprocessingExtension } from "./extensions/MXPostprocessing";
import { MXReflectionProbesExtension } from "./extensions/MXReflectionProbesExtension";
import { MXSceneARExtension } from "./extensions/MXSceneAR";
import { MXSpawnPointExtension } from "./extensions/MXSpawnPointExtension";
import { MXStaticExtension } from "./extensions/MXStatic";
import { MXTextureRGBMExtension } from "./extensions/MXTextureRGBM";
import { OMIColliderExtension } from "./extensions/OMIColliderExtension";
import { OMILinkExtension } from "./extensions/OMILinkExtension";
import { compressTextures } from "./functions/compressTextures";
import { dedupeProperties } from "./functions/dedupeProperties";
import { extensionAwareInstance } from "./functions/extensionAwareInstance";
import { GLTFTransformProgressCallback } from "./web";

export function registerExtensions(io: PlatformIO) {
  io.registerExtensions([
    ...ALL_EXTENSIONS,
    KHRAudioExtension,
    MXLightmapExtension,
    MXLightsShadowsExtension,
    MXReflectionProbesExtension,
    MXBackgroundExtension,
    MXSceneARExtension,
    MXSpawnPointExtension,
    MXStaticExtension,
    MXPostprocessingExtension,
    MXPortalExtension,
    MXTextureRGBMExtension,
    OMILinkExtension,
    OMIColliderExtension,
  ]);
}

export interface AssetPipelineOptions {
  dedupeProperties?: boolean;
  resizeTextures?: boolean;
  instancing?: boolean;
  compressTextures?: boolean;
}

export const DefaultAssetPipelineOptions: AssetPipelineOptions = {
  dedupeProperties: true,
  resizeTextures: true,
  instancing: true,
  compressTextures: true,
};

export async function transformGLTF(
  doc: Document,
  options: AssetPipelineOptions = DefaultAssetPipelineOptions,
  onProgress?: GLTFTransformProgressCallback
) {
  if (options.dedupeProperties) {
    if (onProgress) {
      onProgress({
        step: "Deduplicating Properties...",
      });
    }

    await doc.transform(dedupeProperties());
  }

  if (options.instancing) {
    if (onProgress) {
      onProgress({
        step: "Instancing meshes...",
      });
    }

    await doc.transform(extensionAwareInstance());
  }

  if (options.resizeTextures) {
    if (onProgress) {
      onProgress({
        step: "Resizing base color textures and emissive textures to 2048x2048...",
      });
    }

    await doc.transform(
      textureResize({
        pattern: /^(?!ignore-).*/,
        slots: /(baseColorTexture)|(emissiveTexture)/,
        size: [2048, 2048],
      })
    );

    if (onProgress) {
      onProgress({
        step: "Resizing metallic roughness, occlusion, and normal textures to 1024x1024...",
      });
    }

    await doc.transform(
      textureResize({
        pattern: /^(?!ignore-).*/,
        slots: /(metallicRoughnessTexture)|(occlusionTexture)|(normalTexture)/,
        size: [1024, 1024],
      })
    );

    await doc.transform(
      textureResize({
        pattern: /^ignore-.*/,
        size: [4096, 4096],
      })
    );
  }

  if (options.compressTextures) {
    await doc.transform(compressTextures(onProgress));
  }
}
