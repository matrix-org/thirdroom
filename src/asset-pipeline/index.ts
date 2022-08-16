import { Document, WebIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";

import { MXLightmapExtension } from "./extensions/MXLightmapExtension";

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
  const io = new ObjectURLWebIO().registerExtensions([...ALL_EXTENSIONS, MXLightmapExtension]);
  const document = await io.readGLTF(url, fileMap);
  console.log(document);
}
