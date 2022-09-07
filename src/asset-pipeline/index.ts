import { Document, WebIO, Logger, Verbosity, JSONDocument, Extension, PlatformIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { textureResize } from "@gltf-transform/functions";

import { downloadFile } from "../engine/utils/downloadFile";
import { KHRAudioExtension } from "./extensions/KHRAudioExtension";
import { MXBackgroundExtension } from "./extensions/MXBackgroundExtension";
import { MXLightmapExtension } from "./extensions/MXLightmapExtension";
import { MXReflectionProbesExtension } from "./extensions/MXReflectionProbesExtension";
import { MXSpawnPointExtension } from "./extensions/MXSpawnPointExtension";
import { OMIColliderExtension } from "./extensions/OMIColliderExtension";
import { dedupeProperties } from "./functions/dedupeProperties";
import { extensionAwareInstance } from "./functions/extensionAwareInstance";

export class ObjectURLWebIO extends WebIO {
  fileMap: Map<string, string> = new Map();

  private beforeReadDocumentHooks: ((io: PlatformIO, jsonDoc: JSONDocument) => Promise<void>)[] = [];

  readGLTF(uri: string, fileMap: Map<string, string>): Promise<Document> {
    this.fileMap = fileMap;
    return this.read(uri);
  }

  registerExtensions(extensions: typeof Extension[]): this {
    super.registerExtensions(extensions);

    for (const extension of extensions) {
      if ((extension as any).beforeReadDocument) {
        this.beforeReadDocumentHooks.push((extension as any).beforeReadDocument);
      }
    }

    return this;
  }

  async readAsJSON(uri: string): Promise<JSONDocument> {
    const jsonDoc = await super.readAsJSON(uri);

    await Promise.all(this.beforeReadDocumentHooks.map((hook) => hook(this, jsonDoc)));

    return jsonDoc;
  }

  public resolve(base: string, path: string): string {
    const uri = super.resolve(base, path);
    return this.fileMap.get(path) || uri;
  }

  public declare readURI: {
    (uri: string, type: "view"): Promise<Uint8Array>;
    (uri: string, type: "text"): Promise<string>;
  };

  public declare dirname: (uri: string) => string;
}

export async function transformGLTF(url: string, fileMap: Map<string, string>) {
  const logger = new Logger(Verbosity.DEBUG);

  const io = new ObjectURLWebIO()
    .setLogger(logger)
    .registerExtensions([
      ...ALL_EXTENSIONS,
      KHRAudioExtension,
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
