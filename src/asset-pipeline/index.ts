import { Document, WebIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";

import { downloadFile } from "../engine/utils/downloadFile";
import { MXLightmapExtension } from "./extensions/MXLightmapExtension";
import { OMIColliderExtension } from "./extensions/OMIColliderExtension";

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
  const io = new ObjectURLWebIO().registerExtensions([...ALL_EXTENSIONS, MXLightmapExtension, OMIColliderExtension]);
  const doc = await io.readGLTF(url, fileMap);
  const glbBuffer = await io.writeBinary(doc);

  downloadFile(glbBuffer, `${doc.getRoot().getName() || "scene"}.glb`, "model/gltf-binary");
}
