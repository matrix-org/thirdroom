import { Document, WebIO, Logger, Verbosity, JSONDocument, Extension, PlatformIO } from "@gltf-transform/core";

import { downloadFile } from "../engine/utils/downloadFile";
import { registerExtensions, transformGLTF } from "./pipeline";

export class CustomWebIO extends WebIO {
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
    return this.fileMap.get(decodeURIComponent(path)) || uri;
  }

  public declare readURI: {
    (uri: string, type: "view"): Promise<Uint8Array>;
    (uri: string, type: "text"): Promise<string>;
  };

  public declare dirname: (uri: string) => string;
}

export interface GLTFTransformProgressMessage {
  step: string;
  status?: string;
}

export type GLTFTransformProgressCallback = (message: GLTFTransformProgressMessage) => void;

export async function transformGLTFWeb(
  url: string,
  fileMap: Map<string, string>,
  onProgress?: GLTFTransformProgressCallback
) {
  const logger = new Logger(Verbosity.DEBUG);

  const io = new CustomWebIO().setLogger(logger);

  registerExtensions(io);

  if (onProgress) {
    onProgress({
      step: "Reading glTF...",
    });
  }

  const doc = await io.readGLTF(url, fileMap);

  doc.setLogger(logger);

  if (onProgress) {
    onProgress({
      step: "Transforming glTF...",
    });
  }

  await transformGLTF(doc, onProgress);

  if (onProgress) {
    onProgress({
      step: "Writing glTF...",
    });
  }

  const glbBuffer = await io.writeBinary(doc);

  const fileName = `${doc.getRoot().getName() || "scene"}.glb`;

  if (onProgress) {
    onProgress({
      step: `glTF successfully transformed, downloading "${fileName}"...`,
    });
  }

  downloadFile(glbBuffer, fileName, "model/gltf-binary");
}
