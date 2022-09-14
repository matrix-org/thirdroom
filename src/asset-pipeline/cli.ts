import { NodeIO, Logger, Verbosity, JSONDocument, Extension, PlatformIO } from "@gltf-transform/core";
import path from "path";
import process from "process";

import { registerExtensions, transformGLTF } from "./pipeline";

class CustomNodeIO extends NodeIO {
  private beforeReadDocumentHooks: ((io: PlatformIO, jsonDoc: JSONDocument) => Promise<void>)[] = [];

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
}

async function main() {
  const logger = new Logger(Verbosity.DEBUG);

  const io = new CustomNodeIO().setLogger(logger);

  registerExtensions(io);

  const filePath = path.resolve(process.cwd(), process.argv[2]);

  const doc = await io.read(filePath);

  doc.setLogger(logger);

  await transformGLTF(doc);

  const outPath = path.resolve(path.dirname(filePath), "out2.glb");

  await io.write(outPath, doc);
}

main().catch(console.error);
