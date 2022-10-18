import { Document, PlatformIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { textureResize } from "@gltf-transform/functions";

import { KHRAudioExtension } from "./extensions/KHRAudioExtension";
import { MXBackgroundExtension } from "./extensions/MXBackgroundExtension";
import { MXLightmapExtension } from "./extensions/MXLightmapExtension";
import { MXPortalExtension } from "./extensions/MXPortalExtension";
import { MXReflectionProbesExtension } from "./extensions/MXReflectionProbesExtension";
import { MXSpawnPointExtension } from "./extensions/MXSpawnPointExtension";
import { OMIColliderExtension } from "./extensions/OMIColliderExtension";
import { compressTextures } from "./functions/compressTextures";
import { dedupeProperties } from "./functions/dedupeProperties";
import { extensionAwareInstance } from "./functions/extensionAwareInstance";
import { GLTFTransformProgressCallback } from "./web";

export function registerExtensions(io: PlatformIO) {
  io.registerExtensions([
    ...ALL_EXTENSIONS,
    KHRAudioExtension,
    MXLightmapExtension,
    MXReflectionProbesExtension,
    MXBackgroundExtension,
    MXSpawnPointExtension,
    MXPortalExtension,
    OMIColliderExtension,
  ]);
}

export async function transformGLTF(doc: Document, onProgress?: GLTFTransformProgressCallback) {
  if (onProgress) {
    onProgress({
      step: "Deduplicating Properties...",
    });
  }

  await doc.transform(dedupeProperties());

  if (onProgress) {
    onProgress({
      step: "Instancing meshes...",
    });
  }

  await doc.transform(extensionAwareInstance());

  if (onProgress) {
    onProgress({
      step: "Resizing base color textures and emissive textures to 2048x2048...",
    });
  }

  await doc.transform(
    textureResize({
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
      slots: /(metallicRoughnessTexture)|(occlusionTexture)|(normalTexture)/,
      size: [1024, 1024],
    })
  );

  await doc.transform(compressTextures(onProgress));
}
