import { Document, PlatformIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { textureResize } from "@gltf-transform/functions";

import { KHRAudioExtension } from "./extensions/KHRAudioExtension";
import { MXBackgroundExtension } from "./extensions/MXBackgroundExtension";
import { MXLightmapExtension } from "./extensions/MXLightmapExtension";
import { MXReflectionProbesExtension } from "./extensions/MXReflectionProbesExtension";
import { MXSpawnPointExtension } from "./extensions/MXSpawnPointExtension";
import { OMIColliderExtension } from "./extensions/OMIColliderExtension";
import { compressTextures } from "./functions/compressTextures";
import { dedupeProperties } from "./functions/dedupeProperties";
import { extensionAwareInstance } from "./functions/extensionAwareInstance";

export function registerExtensions(io: PlatformIO) {
  io.registerExtensions([
    ...ALL_EXTENSIONS,
    KHRAudioExtension,
    MXLightmapExtension,
    MXReflectionProbesExtension,
    MXBackgroundExtension,
    MXSpawnPointExtension,
    OMIColliderExtension,
  ]);
}

export async function transformGLTF(doc: Document) {
  await doc.transform(
    dedupeProperties(),
    extensionAwareInstance(),
    textureResize({
      slots: /(metallicRoughnessTexture)|(occlusionTexture)|(normalTexture)/,
      size: [1024, 1024],
    }),
    compressTextures()
  );
}
