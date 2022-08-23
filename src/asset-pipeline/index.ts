import { Document, WebIO, Logger, Verbosity } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { textureResize } from "@gltf-transform/functions";

import { downloadFile } from "../engine/utils/downloadFile";
import { MXBackgroundExtension } from "./extensions/MXBackgroundExtension";
import { MXLightmapExtension } from "./extensions/MXLightmapExtension";
import { MXReflectionProbesExtension } from "./extensions/MXReflectionProbesExtension";
import { MXSpawnPointExtension } from "./extensions/MXSpawnPointExtension";
import { OMIColliderExtension } from "./extensions/OMIColliderExtension";
import { dedupeProperties } from "./functions/dedupeProperties";
import { extensionAwareInstance } from "./functions/extensionAwareInstance";

class ObjectURLWebIO extends WebIO {
  fileMap: Map<string, string> = new Map();

  readGLTF(uri: string, fileMap: Map<string, string>): Promise<Document> {
    this.fileMap = fileMap;
    return this.read(uri);
  }

  resolve(base: string, path: string): string {
    const uri = super.resolve(base, path);
    return this.fileMap.get(path) || uri;
  }
}

export async function transformGLTF(url: string, fileMap: Map<string, string>) {
  const logger = new Logger(Verbosity.DEBUG);

  const io = new ObjectURLWebIO()
    .setLogger(logger)
    .registerExtensions([
      ...ALL_EXTENSIONS,
      MXLightmapExtension,
      MXReflectionProbesExtension,
      MXBackgroundExtension,
      MXSpawnPointExtension,
      OMIColliderExtension,
    ]);

  const doc = await io.readGLTF(url, fileMap);

  doc.setLogger(logger);

  await doc.transform(dedupeProperties(), extensionAwareInstance(), textureResize());

  const glbBuffer = await io.writeBinary(doc);

  downloadFile(glbBuffer, `${doc.getRoot().getName() || "scene"}.glb`, "model/gltf-binary");
}
